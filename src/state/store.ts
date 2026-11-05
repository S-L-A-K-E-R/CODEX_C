import { useSyncExternalStore } from "react";
import {
  freshProgress,
  parseBackup,
  mergeProgress,
  validateProgress,
  now,
  STORAGE_KEY,
  localDay,
  type Progress,
  type Draft,
} from "./progress.ts";
let state = freshProgress();
let issue = "";
let storageBlocked = false;
let capacityIssue = false;
let persistenceFailed = false;
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) state = parseBackup(saved);
} catch {
  issue =
    "Your saved data could not be read. It has been preserved. Export recovery data in Settings before replacing it.";
  storageBlocked = true;
}
const subscribers = new Set<() => void>();
const emit = () => subscribers.forEach((fn) => fn());
export function readProgress() {
  return state;
}
export function readStorageIssue() {
  return issue;
}
export function updateProgress(fn: (state: Progress) => Progress) {
  let current = state;
  if (!storageBlocked)
    try {
      const disk = localStorage.getItem(STORAGE_KEY);
      if (disk) current = mergeProgress(current, parseBackup(disk));
    } catch {
      storageBlocked = true;
      issue =
        "Saved data changed unexpectedly. Your work is kept in this tab; export a backup from Settings.";
    }
  const candidate = { ...fn(current), updatedAt: now() };
  try {
    validateProgress(candidate);
    if (
      new TextEncoder().encode(JSON.stringify(candidate, null, 2)).byteLength >
      2_000_000
    )
      throw new Error("Backup is too large.");
  } catch {
    issue =
      "This workspace or backup exceeds the local storage limits. Download your current source files before closing; the previous saved version is preserved.";
    capacityIssue = true;
    emit();
    return false;
  }
  state = candidate;
  if (!storageBlocked)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      persistenceFailed = false;
      if (!capacityIssue) issue = "";
    } catch {
      persistenceFailed = true;
      issue =
        "Browser storage is unavailable or full. Your changes are only in this tab. Export a backup before closing it.";
    }
  emit();
  return true;
}
export function saveDraft(id: string, draft: Omit<Draft, "updatedAt">) {
  const saved = updateProgress((s) => ({
    ...s,
    lastChallenge: id,
    drafts: { ...s.drafts, [id]: { ...draft, updatedAt: now() } },
  }));
  if (saved && capacityIssue) {
    capacityIssue = false;
    if (!storageBlocked && !persistenceFailed) issue = "";
    emit();
  }
  return saved;
}
export function importProgress(incoming: Progress) {
  return updateProgress((s) => mergeProgress(s, incoming));
}
export function subscribe(fn: () => void) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}
export function useProgress() {
  return useSyncExternalStore(subscribe, readProgress);
}
export function useStorageIssue() {
  return useSyncExternalStore(subscribe, readStorageIssue);
}
window.addEventListener("storage", (event) => {
  if (event.key !== STORAGE_KEY) return;
  if (!event.newValue) {
    issue =
      "Saved data was removed in another tab. Export this tab’s progress before continuing.";
    storageBlocked = true;
    emit();
    return;
  }
  try {
    state = mergeProgress(state, parseBackup(event.newValue));
    emit();
  } catch {
    issue =
      "Another tab wrote unreadable progress. Export your current work from Settings.";
    storageBlocked = true;
    emit();
  }
});
let lastActive = Date.now(),
  lastTick = Date.now();
for (const event of ["pointerdown", "keydown", "scroll", "input"])
  window.addEventListener(
    event,
    () => {
      lastActive = Date.now();
    },
    { passive: true, capture: true },
  );
function tick() {
  const time = Date.now(),
    elapsed = Math.min(15, (time - lastTick) / 1000);
  lastTick = time;
  if (
    !document.hidden &&
    document.hasFocus() &&
    time - lastActive < 60_000 &&
    elapsed > 0
  )
    updateProgress((s) => ({
      ...s,
      activity: {
        ...s.activity,
        [localDay()]: Math.min(86400, (s.activity[localDay()] || 0) + elapsed),
      },
    }));
}
setInterval(tick, 15_000);
window.addEventListener("pagehide", tick);
