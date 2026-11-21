import type { ChallengeComparison, MetricSample } from "../analysis/metrics.ts";
export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = "codex-c:progress:v1";
export interface Draft {
  files: Record<string, string>;
  input: string;
  updatedAt: string;
}
export interface Progress {
  schemaVersion: 1;
  profile: { name: string; accent: string; updatedAt: string };
  completed: Record<string, string>;
  lessons: Record<string, string>;
  attempts: Record<string, number>;
  comparisons: Record<string, ChallengeComparison>;
  drafts: Record<string, Draft>;
  activity: Record<string, number>;
  milestones: Record<string, string>;
  settings: { fontSize: number; updatedAt: string };
  lastChallenge: string;
  updatedAt: string;
}
export const now = () => new Date().toISOString();
export function freshProgress(): Progress {
  return {
    schemaVersion: 1,
    profile: { name: "Learner", accent: "#b8ec7d", updatedAt: now() },
    completed: {},
    lessons: {},
    attempts: {},
    comparisons: {},
    drafts: {},
    activity: {},
    milestones: {},
    settings: { fontSize: 15, updatedAt: now() },
    lastChallenge: "",
    updatedAt: now(),
  };
}
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const sampleIsSafe = (s: unknown): s is MetricSample =>
  record(s) &&
  typeof s.timeMs === "number" && Number.isFinite(s.timeMs) && s.timeMs >= 0 && s.timeMs <= 180000 &&
  Number.isInteger(s.workUnits) && (s.workUnits as number) >= 0 && (s.workUnits as number) <= 100000000 &&
  Number.isInteger(s.sourceInstructions) && (s.sourceInstructions as number) >= 0 && (s.sourceInstructions as number) <= 100000 &&
  dateIsSafe(s.recordedAt);
const keyIsSafe = (key: string) =>
  /^[a-z0-9][a-z0-9:-]{0,99}$/.test(key) &&
  !["constructor", "prototype"].includes(key);
const dateIsSafe = (date: unknown): date is string =>
  typeof date === "string" &&
  /^\d{4}-\d{2}-\d{2}T/.test(date) &&
  Number.isFinite(Date.parse(date));
export function validateProgress(value: unknown): Progress {
  if (!record(value) || value.schemaVersion !== 1)
    throw new Error("This is not a supported CODEX C backup (version 1).");
  if (
    !record(value.profile) ||
    typeof value.profile.name !== "string" ||
    value.profile.name.length > 60 ||
    !dateIsSafe(value.profile.updatedAt) ||
    typeof value.profile.accent !== "string" ||
    !/^#[a-f0-9]{6}$/i.test(value.profile.accent)
  )
    throw new Error("Invalid profile in backup.");
  const result = freshProgress();
  result.profile = {
    name: value.profile.name,
    accent: value.profile.accent,
    updatedAt: value.profile.updatedAt,
  };
  for (const field of ["completed", "lessons", "milestones"] as const) {
    const items = value[field];
    if (!record(items) || Object.keys(items).length > 2000)
      throw new Error(`Invalid ${field} in backup.`);
    for (const [id, date] of Object.entries(items)) {
      if (!keyIsSafe(id) || !dateIsSafe(date))
        throw new Error(`Invalid ${field} entry.`);
      result[field][id] = date;
    }
  }
  for (const field of ["activity", "attempts"] as const) {
    const items = value[field];
    if (!record(items) || Object.keys(items).length > 10000)
      throw new Error(`Invalid ${field} in backup.`);
    for (const [id, n] of Object.entries(items)) {
      const goodKey =
        field === "activity"
          ? /^\d{4}-\d{2}-\d{2}$/.test(id) && Number.isFinite(Date.parse(id))
          : keyIsSafe(id);
      if (
        !goodKey ||
        typeof n !== "number" ||
        !Number.isFinite(n) ||
        n < 0 ||
        n > (field === "activity" ? 86400 : 1e6)
      )
        throw new Error(`Invalid ${field} entry.`);
      result[field][id] = n;
    }
  }
  if (!record(value.drafts) || Object.keys(value.drafts).length > 500)
    throw new Error("Invalid drafts in backup.");
  let total = 0;
  for (const [id, draft] of Object.entries(value.drafts)) {
    if (
      !keyIsSafe(id) ||
      !record(draft) ||
      !record(draft.files) ||
      !dateIsSafe(draft.updatedAt) ||
      typeof draft.input !== "string" ||
      draft.input.length > 50_000 ||
      Object.keys(draft.files).length > 20 ||
      !Object.hasOwn(draft.files, "main.c")
    )
      throw new Error("Invalid workspace in backup.");
    const files: Record<string, string> = {};
    for (const [name, text] of Object.entries(draft.files)) {
      if (
        !/^[a-zA-Z0-9_-][a-zA-Z0-9_.-]{0,79}$/.test(name) ||
        name.includes("..") ||
        ["__proto__", "constructor", "prototype"].includes(name) ||
        typeof text !== "string" ||
        text.length > 50_000
      )
        throw new Error("Invalid source file in backup.");
      total += text.length;
      files[name] = text;
    }
    total += draft.input.length;
    result.drafts[id] = {
      files,
      input: draft.input,
      updatedAt: draft.updatedAt,
    };
  }
  // Version 1 backups predating this feature did not contain comparisons.
  if (value.comparisons !== undefined) {
    if (!record(value.comparisons) || Object.keys(value.comparisons).length > 500)
      throw new Error("Invalid challenge comparisons in backup.");
    for (const [id, item] of Object.entries(value.comparisons)) {
      if (!keyIsSafe(id) || !record(item) || !sampleIsSafe(item.first) || !sampleIsSafe(item.latest) ||
          !Number.isInteger(item.checks) || (item.checks as number) < 1 || (item.checks as number) > 1000000 ||
          typeof item.fastest !== "number" || !Number.isFinite(item.fastest) || item.fastest < 0 || item.fastest > 180000 ||
          !Number.isInteger(item.leastWork) || (item.leastWork as number) < 0 || (item.leastWork as number) > 100000000 ||
          !Number.isInteger(item.shortest) || (item.shortest as number) < 0 || (item.shortest as number) > 100000)
        throw new Error("Invalid challenge comparison entry.");
      result.comparisons[id] = {
        first: { timeMs: item.first.timeMs, workUnits: item.first.workUnits, sourceInstructions: item.first.sourceInstructions, recordedAt: item.first.recordedAt },
        latest: { timeMs: item.latest.timeMs, workUnits: item.latest.workUnits, sourceInstructions: item.latest.sourceInstructions, recordedAt: item.latest.recordedAt },
        fastest: item.fastest as number, leastWork: item.leastWork as number,
        shortest: item.shortest as number, checks: item.checks as number,
      };
    }
  }
  if (total > 1_500_000)
    throw new Error("Backup contains too much source text (limit 1.5 MB).");
  if (
    !record(value.settings) ||
    !Number.isInteger(value.settings.fontSize) ||
    (value.settings.fontSize as number) < 12 ||
    (value.settings.fontSize as number) > 24 ||
    !dateIsSafe(value.settings.updatedAt)
  )
    throw new Error("Invalid settings in backup.");
  result.settings = {
    fontSize: value.settings.fontSize as number,
    updatedAt: value.settings.updatedAt,
  };
  if (
    typeof value.lastChallenge !== "string" ||
    (value.lastChallenge && !keyIsSafe(value.lastChallenge)) ||
    !dateIsSafe(value.updatedAt)
  )
    throw new Error("Invalid backup metadata.");
  result.lastChallenge = value.lastChallenge;
  result.updatedAt = value.updatedAt;
  return result;
}
export function parseBackup(text: string): Progress {
  if (
    text.length > 2_000_000 ||
    new TextEncoder().encode(text).byteLength > 2_000_000
  )
    throw new Error("Choose a CODEX C JSON backup smaller than 2 MB.");
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      "This file is not valid JSON. Your current progress is unchanged.",
    );
  }
  return validateProgress(data);
}
export function mergeProgress(a: Progress, b: Progress): Progress {
  const newer = a.updatedAt > b.updatedAt ? a : b;
  const out: Progress = {
    ...newer,
    completed: { ...a.completed },
    lessons: { ...a.lessons },
    milestones: { ...a.milestones },
    attempts: { ...a.attempts },
    comparisons: { ...a.comparisons },
    activity: { ...a.activity },
    drafts: { ...a.drafts },
    profile: a.profile.updatedAt > b.profile.updatedAt ? a.profile : b.profile,
    settings:
      a.settings.updatedAt > b.settings.updatedAt ? a.settings : b.settings,
  };
  for (const field of ["completed", "lessons", "milestones"] as const)
    for (const [id, at] of Object.entries(b[field]))
      out[field][id] =
        out[field][id] && out[field][id] < at ? out[field][id] : at;
  for (const field of ["attempts", "activity"] as const)
    for (const [id, n] of Object.entries(b[field]))
      out[field][id] = Math.max(out[field][id] || 0, n);
  for (const [id, draft] of Object.entries(b.drafts))
    if (!out.drafts[id] || draft.updatedAt > out.drafts[id].updatedAt)
      out.drafts[id] = draft;
  for (const [id, stats] of Object.entries(b.comparisons)) {
    const previous = out.comparisons[id];
    out.comparisons[id] = previous ? {
      first: previous.first.recordedAt <= stats.first.recordedAt ? previous.first : stats.first,
      latest: previous.latest.recordedAt >= stats.latest.recordedAt ? previous.latest : stats.latest,
      fastest: Math.min(previous.fastest, stats.fastest),
      leastWork: Math.min(previous.leastWork, stats.leastWork),
      shortest: Math.min(previous.shortest, stats.shortest),
      checks: Math.max(previous.checks, stats.checks),
    } : stats;
  }
  return out;
}
export function recordComparison(state: Progress, id: string, sample: MetricSample): Progress {
  const previous = state.comparisons[id];
  const stats: ChallengeComparison = previous ? {
    ...previous,
    latest: sample,
    fastest: Math.min(previous.fastest, sample.timeMs),
    leastWork: Math.min(previous.leastWork, sample.workUnits),
    shortest: Math.min(previous.shortest, sample.sourceInstructions),
    checks: Math.min(1000000, previous.checks + 1),
  } : {
    first: sample, latest: sample, fastest: sample.timeMs,
    leastWork: sample.workUnits, shortest: sample.sourceInstructions, checks: 1,
  };
  return { ...state, comparisons: { ...state.comparisons, [id]: stats }, updatedAt: now() };
}
export function markComplete(state: Progress, id: string): Progress {
  return state.completed[id]
    ? state
    : {
        ...state,
        completed: { ...state.completed, [id]: now() },
        updatedAt: now(),
      };
}
export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
