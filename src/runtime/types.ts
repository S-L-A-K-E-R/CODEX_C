export type OutputComparison = "exact" | "line-padding";

export interface TestCase {
  label: string;
  input: string;
  output: string;
  /** Opt in only when horizontal padding is not part of the task. */
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
    return comparison === "line-padding"
      ? text
          .split("\n")
          .map((line) => line.replace(/^[ \t]+|[ \t]+$/g, ""))
          .join("\n")
      : text;
  };
  return normalise(actual) === normalise(expected);
};
