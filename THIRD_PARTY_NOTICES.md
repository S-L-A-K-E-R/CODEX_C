# Third-party software

Third-party software retains its own copyright and licence terms. The owner has not yet selected a repository-wide licence for newly written CODEX C code.

| Component                                | Purpose                         | Licence/source                                                                 |
| ---------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------ |
| React / React DOM                        | Interface                       | MIT; exact versions in `package-lock.json`                                     |
| CodeMirror / Lezer                       | Editor and C syntax parsing     | MIT; installed package notices                                                 |
| Lucide                                   | Interface icons                 | ISC, with MIT notices for Feather-derived icons                                |
| fflate                                   | Gzip sysroot decompression      | MIT                                                                            |
| `@runno/wasi`                            | WASI implementation             | MIT; Benjamin Taylor and contributors                                          |
| Clang / LLD                              | Browser compiler and linker     | LLVM licences, including applicable exceptions; see `public/licenses/LLVM.txt` |
| wasm-clang                               | Original browser toolchain work | Apache-2.0; `public/licenses/wasm-clang-Apache-2.0.txt`                        |
| wasi-libc / musl components              | C headers and libraries         | Upstream composite notices in `public/licenses/wasi-libc.txt`                  |
| Vite / TypeScript and build dependencies | Development tooling             | Their package licences; not claimed as CODEX C code                            |

`npm run build` generates `public/third-party-notices.txt` from the exact installed production dependency licence files. Vite copies it and `public/licenses/` into the static output, preserving notices alongside distributed code. Compiler notice source URLs are recorded in `public/licenses/SOURCES.md`.

Compiler assets are retrieved from Runno commit `af05728f02d907210d28587b4c32a306e79e312e` with immutable SHA-256 verification in `scripts/fetch-runtime.mjs`. The binaries originate from the older wasm-clang/LLVM ecosystem; using the package does not imply a modern Clang release. No vasm assembler is used or distributed.

When changing the compiler or dependency set, review and regenerate notices together with the binary hashes. Do not remove applicable notices when redistributing a build.
