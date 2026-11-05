import type { WASI } from "@runno/wasi";

export const FILE_LIMIT = 256_000;

/** Bound virtual-file allocation before Runno grows a JavaScript backing buffer.
 * Only student programs use this budget; the compiler has a separate lifetime.
 * Growth and bytes written are cumulative, so truncation cannot reset the budget.
 */
export function limitVirtualFiles(wasi: WASI) {
  const drive = wasi.drive;
  let grown = 0,
    written = 0,
    opens = 0;
  const fail = () => {
    throw new Error(
      "Virtual file limit reached (256 KB growth/write budget). Use smaller files.",
    );
  };
  const reserve = (fd: number, end: number, bytes = 0) => {
    const stat = drive.stat(fd);
    if (stat[0] !== 0) return;
    const growth = Math.max(0, end - stat[1].byteLength);
    if (
      !Number.isSafeInteger(end) ||
      end < 0 ||
      end > FILE_LIMIT ||
      grown + growth > FILE_LIMIT ||
      written + bytes > FILE_LIMIT
    )
      fail();
    grown += growth;
    written += bytes;
  };
  const write = drive.write.bind(drive),
    pwrite = drive.pwrite.bind(drive),
    resize = drive.setSize.bind(drive);
  drive.write = (fd, data) => {
    const stat = drive.stat(fd),
      position = drive.tell(fd);
    if (stat[0] === 0 && position[0] === 0)
      reserve(
        fd,
        (drive.fileFdflags(fd) & 1 ? stat[1].byteLength : Number(position[1])) +
          data.byteLength,
        data.byteLength,
      );
    return write(fd, data);
  };
  drive.pwrite = (fd, data, offset) => {
    const stat = drive.stat(fd);
    if (stat[0] === 0)
      reserve(
        fd,
        (drive.fileFdflags(fd) & 1 ? stat[1].byteLength : offset) +
          data.byteLength,
        data.byteLength,
      );
    return pwrite(fd, data, offset);
  };
  drive.setSize = (fd, size) => {
    reserve(fd, Number(size));
    return resize(fd, size);
  };
  const allocate = wasi.fd_allocate.bind(wasi);
  wasi.fd_allocate = (fd, offset, length) => {
    // Upstream allocates the requested byte array before calling drive.pwrite.
    if (length < 0n || offset < 0n || length + offset > BigInt(FILE_LIMIT))
      fail();
    return allocate(fd, offset, length);
  };
  const open = drive.open.bind(drive),
    mkdir = drive.pathCreateDir.bind(drive);
  const checkPath = (path: string) => {
    if (
      ++opens > 256 ||
      path.length > 240 ||
      path.split("/").includes("..") ||
      Object.keys(drive.fs).length >= 128 ||
      drive.openMap.size >= 64
    ) {
      throw new Error(
        "Virtual filesystem limit reached (128 files, 64 open handles, 256 opens).",
      );
    }
  };
  drive.open = (fd, path, flags, fdflags) => {
    checkPath(path);
    return open(fd, path, flags, fdflags);
  };
  drive.pathCreateDir = (fd, path) => {
    checkPath(path);
    return mkdir(fd, path);
  };
}
