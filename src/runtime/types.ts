export interface TestCase {
  label: string;
  input: string;
  output: string;
}
export interface ProgramResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  files: Record<string, string>;
}
export interface CheckResult extends ProgramResult {
  label: string;
  input: string;
  expected: string;
  passed: boolean;
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
export const matchesOutput = (actual: string, expected: string) =>
  normaliseOutput(actual) === normaliseOutput(expected);
