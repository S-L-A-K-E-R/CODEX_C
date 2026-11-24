export type OutputComparison = "exact" | "line-padding" | "line-fields";

export interface TestCase {
  label: string;
  input: string;
  output: string;
  /** Opt in only when horizontal whitespace is not part of the task. */
  comparison?: OutputComparison;
}
export interface ProgramResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs?: number;
  files: Record<string, string>;
}
export interface CheckResult extends ProgramResult {
  label: string;
  input: string;
  expected: string;
  passed: boolean;
}
export interface DownloadProgress {
  loadedBytes: number;
  // Total is only reported when every asset has a measurable size.
  totalBytes?: number;
}
export interface RunRequest {
  files: Record<string, string>;
  inputs: string[];
  assetBase: string;
}
export interface RunResponse {
  results: ProgramResult[];
  diagnostics: string;
  error?: string;
  phase?: string;
}
export const normaliseOutput = (value: string) =>
  value.replace(/\r\n/g, "\n").replace(/\n$/, "");
export const matchesOutput = (
  actual: string,
  expected: string,
  comparison: OutputComparison = "exact",
) => {
  const normalise = (value: string) => {
    const text = normaliseOutput(value);
    if (comparison === "exact") return text;
    return text
      .split("\n")
      .map((line) => {
        const unpadded = line.replace(/^[ \t]+|[ \t]+$/g, "");
        return comparison === "line-fields"
          ? unpadded.replace(/[ \t]+/g, " ")
          : unpadded;
      })
      .join("\n");
  };
  return normalise(actual) === normalise(expected);
};
