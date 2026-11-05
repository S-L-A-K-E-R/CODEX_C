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
  return out;
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
