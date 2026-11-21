import { useState } from "react";
import {
  Award,
  BookOpen,
  Clock3,
  Download,
  Pencil,
  ShieldCheck,
  Star,
  Check,
  Upload,
  HardDrive,
  Code2,
  Leaf,
} from "lucide-react";
import {
  useProgress,
  updateProgress,
  importProgress,
  useStorageIssue,
} from "../state/store.ts";
import {
  now,
  parseBackup,
  localDay,
  STORAGE_KEY,
  type Progress,
} from "../state/progress.ts";
import { useLanguage } from "../i18n/Language.tsx";
import {
  Modal,
  download,
  ProgressBar,
  External,
} from "../components/shared.tsx";

export const timeLabel = (seconds: number) =>
  seconds < 3600
    ? `${Math.floor(seconds / 60)}m`
    : `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
export function Profile() {
  const {
    t,
    course: { chapters, exercises, byChapter, goldTotal, coreTotal },
  } = useLanguage();
  const p = useProgress(),
    [edit, setEdit] = useState(false),
    [name, setName] = useState(p.profile.name),
    [accent, setAccent] = useState(p.profile.accent);
  const core = exercises.filter(
      (e) => e.kind === "core" && p.completed[e.id],
    ).length,
    gold = exercises.filter(
      (e) => e.kind === "gold" && p.completed[e.id],
    ).length;
  const complete = exercises.filter((e) => p.completed[e.id]).length,
    minutes = Object.values(p.activity).reduce((a, b) => a + b, 0);
  const days = Array.from({ length: 91 }, (_, i) => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - 90 + i);
    return localDay(d);
  });
  const badges = [
    {
      name: "First small win",
      description: "Complete your first challenge",
      earned: complete >= 1,
      icon: Leaf,
    },
    {
      name: "Solid foundations",
      description: "Finish the first five core chapters",
      earned: exercises
        .filter(
          (e) =>
            e.kind === "core" &&
            chapters.find((c) => c.id === e.chapter)?.stage === 0,
        )
        .every((e) => p.completed[e.id]),
      icon: BookOpen,
    },
    {
      name: "Golden thinking",
      description: "Complete a gold challenge",
      earned: gold > 0,
      icon: Star,
    },
    {
      name: "Curious by nature",
      description: "Complete three side quests",
      earned:
        exercises.filter((e) => e.kind === "optional" && p.completed[e.id])
          .length >= 3,
      icon: Award,
    },
  ];
  return (
    <div className="page profile-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">{t("YOUR OWN LEARNING STORY")}</div>
          <h1>{t("Your progress, made visible.")}</h1>
          <p>
            {t("Every small success belongs here. Come back at your own pace.")}
          </p>
        </div>
        <button
          className="btn"
          onClick={() =>
            download(
              "codex-c-profile.json",
              JSON.stringify(
                {
                  name: p.profile.name,
                  exportedAt: now(),
                  coreChallenges: core,
                  goldChallenges: gold,
                  completedChallenges: complete,
                  focusedSeconds: Math.round(minutes),
                  chapters: chapters.map((c) => ({
                    title: c.title,
                    coreCompleted: byChapter(c.id).filter(
                      (e) => e.kind === "core" && p.completed[e.id],
                    ).length,
                  })),
                  note: t(
                    "Self-reported local learning summary, not a verified academic record.",
                  ),
                },
                null,
                2,
              ),
            )
          }
        >
          <Download size={16} />
          {t("Export summary")}
        </button>
      </div>
      <section className="profile-identity">
        <div className="avatar large" style={{ background: p.profile.accent }}>
          {p.profile.name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="eyebrow">{t("C EXPLORER")}</div>
          <h2>{p.profile.name}</h2>
          <p>{t("Building understanding, one program at a time.")}</p>
        </div>
        <button
          className="btn"
          onClick={() => {
            setName(p.profile.name);
            setAccent(p.profile.accent);
            setEdit(true);
          }}
        >
          <Pencil size={15} />
          {t("Edit profile")}
        </button>
      </section>
      <div className="stats-grid four">
        {[
          {
            icon: Check,
            value: `${core} / ${coreTotal}`,
            label: "Core challenges",
          },
          {
            icon: Star,
            value: `${gold} / ${goldTotal}`,
            label: "Gold challenges",
          },
          {
            icon: Clock3,
            value: timeLabel(minutes),
            label: "Focused learning",
          },
          {
            icon: BookOpen,
            value: `${Object.keys(p.lessons).filter((id) => chapters.some((c) => c.id === id)).length} / ${chapters.length}`,
            label: "Lessons read",
          },
        ].map((s) => (
          <div className="stat-card" key={t(s.label)}>
            <s.icon size={19} />
            <strong>{s.value}</strong>
            <span>{t(s.label)}</span>
          </div>
        ))}
      </div>
      <section className="panel heatmap-panel">
        <div className="section-top">
          <div>
            <h2>{t("A little history of your learning")}</h2>
            <p>
              {t("The last 13 weeks. No streaks to keep. No days to make up.")}
            </p>
          </div>
          <span className="pill">
            {t("{n} active days", {
              n: days.filter((day) => (p.activity[day] || 0) >= 60).length,
            })}
          </span>
        </div>
        <div
          className="heatmap"
          role="img"
          aria-label={t(
            "Activity in the last 91 days: {n} days with at least one minute of focused learning.",
            { n: days.filter((d) => (p.activity[d] || 0) >= 60).length },
          )}
        >
          <div className="heatmap-days">
            <span>{t("13 weeks ago")}</span>
            <span>{t("Today")}</span>
          </div>
          <div className="heatmap-cells">
            {days.map((day) => {
              const n = p.activity[day] || 0;
              return (
                <div
                  key={day}
                  tabIndex={0}
                  aria-label={`${day}: ${timeLabel(n)}`}
                  title={t("{day} · {time} focused", {
                    day,
                    time: timeLabel(n),
                  })}
                  className={
                    "heat-cell level-" +
                    (n >= 1800 ? 4 : n >= 600 ? 3 : n >= 60 ? 2 : n > 0 ? 1 : 0)
                  }
                />
              );
            })}
          </div>
          <div className="heatmap-legend">
            <small>{t("Less")}</small>
            {[0, 1, 2, 3, 4].map((n) => (
              <span key={n} className={"heat-cell level-" + n} />
            ))}
            <small>{t("More")}</small>
          </div>
        </div>
        <p className="small muted">
          {t(
            "Time counts while this tab is visible, focused, and you have interacted in the last minute. It is an estimate, not a measure of ability.",
          )}
        </p>
      </section>
      <div className="profile-columns">
        <section className="panel">
          <h2>{t("Skills taking shape")}</h2>
          <p>{t("Core challenges completed in each chapter.")}</p>
          <div className="skill-bars">
            {chapters.map((c) => {
              const done = byChapter(c.id).filter(
                (e) => e.kind === "core" && p.completed[e.id],
              ).length;
              return (
                <div key={c.id}>
                  <span>
                    {c.title}
                    <b>{done}/2</b>
                  </span>
                  <ProgressBar value={(done / 2) * 100} label={c.title} />
                </div>
              );
            })}
          </div>
        </section>
        <section className="panel">
          <h2>{t("Small milestones")}</h2>
          <p>{t("Recognition for exploring, not for showing up every day.")}</p>
          <div className="badge-grid">
            {badges.map((b) => (
              <div
                className={"achievement " + (b.earned ? "earned" : "")}
                key={t(b.name)}
              >
                <b.icon size={25} />
                <b>{t(b.name)}</b>
                <small>{t(b.description)}</small>
                <span>{b.earned ? t("Earned") : t("To discover")}</span>
              </div>
            ))}
          </div>
          <div className="privacy-note">
            <ShieldCheck size={20} />
            <p>
              {t(
                "This profile lives in your browser. Share your exported summary yourself if you want to compare experiences with a classmate.",
              )}
            </p>
          </div>
        </section>
      </div>
      {edit && (
        <Modal
          title={t("Make this space yours")}
          onClose={() => setEdit(false)}
        >
          <label htmlFor="profile-name">{t("Your display name")}</label>
          <input
            id="profile-name"
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
          />
          <p className="small muted">
            {t("A nickname is enough. You do not need an account or an email.")}
          </p>
          <div className="swatches">
            {["#b8ec7d", "#a9d9ed", "#dec1ee", "#f6c898", "#f2b9c4"].map(
              (color) => (
                <button
                  key={color}
                  aria-label={t("Profile colour {color}", { color })}
                  aria-pressed={accent === color}
                  style={{ background: color }}
                  onClick={() => setAccent(color)}
                >
                  {accent === color ? <Check size={20} /> : null}
                </button>
              ),
            )}
          </div>
          <button
            className="btn primary"
            disabled={!name.trim()}
            onClick={() => {
              updateProgress((s) => ({
                ...s,
                profile: { name: name.trim(), accent, updatedAt: now() },
              }));
              setEdit(false);
            }}
          >
            {t("Save profile")}
          </button>
        </Modal>
      )}
    </div>
  );
}
export function Settings() {
  const { t } = useLanguage();
  const p = useProgress(),
    storageIssue = useStorageIssue(),
    [incoming, setIncoming] = useState<Progress | null>(null),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  async function choose(file: File | undefined) {
    setError("");
    setMessage("");
    if (!file) return;
    if (file.size > 2_000_000) {
      setError("Choose a CODEX C JSON backup smaller than 2 MB.");
      return;
    }
    try {
      setIncoming(parseBackup(await file.text()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read backup.");
    }
  }
  return (
    <div className="page settings-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">{t("YOUR WORK. YOUR CHOICE.")}</div>
          <h1>{t("A space that works for you.")}</h1>
          <p>
            {t("Keep a copy of your progress and make the editor comfortable.")}
          </p>
        </div>
      </div>
      <section className="panel">
        <div className="settings-icon">
          <HardDrive size={22} />
        </div>
        <h2>{t("Keep your learning safe")}</h2>
        <p>
          {t(
            "Your code, completed challenges, profile, and activity are saved in this browser. Clearing site data or using a different browser will not carry them over.",
          )}
        </p>
        <div className="backup-actions">
          <button
            className="btn dark"
            onClick={() => {
              download(
                "codex-c-backup-" + localDay() + ".json",
                JSON.stringify(p, null, 2),
              );
              setMessage(
                "Backup downloaded. Store it somewhere you can find again.",
              );
            }}
          >
            <Download size={17} />
            {t("Export full backup")}
          </button>
          <label className="btn upload-button">
            <Upload size={17} />
            {t("Import a backup")}
            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) => {
                void choose(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        {message && (
          <p role="status" className="success-text">
            {t(message)}
          </p>
        )}
        {error && (
          <p role="alert" className="error-text">
            {t(error)}
          </p>
        )}
        {storageIssue && (
          <>
            <p className="error-text">{t(storageIssue)}</p>
            <button
              className="btn"
              onClick={() => {
                try {
                  download(
                    "codex-c-recovery.txt",
                    localStorage.getItem(STORAGE_KEY) ||
                      t("(No readable storage found)"),
                    "text/plain",
                  );
                } catch {
                  setError(
                    "The browser blocks access to stored data. Export the current full backup instead.",
                  );
                }
              }}
            >
              {t("Export raw recovery data")}
            </button>
          </>
        )}
        <div className="info-note">
          <ShieldCheck size={20} />
          <p>
            {t(
              "Save this JSON file in Google Drive, OneDrive, or any folder you trust. Import it on another device. Automatic cloud sync is not connected in this version.",
            )}
          </p>
        </div>
      </section>
      <section className="panel">
        <div className="settings-icon">
          <Code2 size={22} />
        </div>
        <h2>{t("Your editor")}</h2>
        <label className="range-label" htmlFor="font-size">
          {t("Font size")} <b>{p.settings.fontSize}px</b>
        </label>
        <input
          id="font-size"
          type="range"
          min="12"
          max="24"
          value={p.settings.fontSize}
          onChange={(e) =>
            updateProgress((s) => ({
              ...s,
              settings: { fontSize: Number(e.target.value), updatedAt: now() },
            }))
          }
        />
        <pre className="font-preview" style={{ fontSize: p.settings.fontSize }}>
          int small_steps = 1;{`\n`}printf("Keep going.\\n");
        </pre>
        <p className="small muted">
          {t(
            "Ctrl / ⌘ + Enter: run · Ctrl / ⌘ + F: find · Tab: indent · Escape then Tab: leave the editor. Panels can collapse or resize with mouse or arrow keys.",
          )}
        </p>
      </section>
      <section className="panel">
        <h2>{t("About this classroom edition")}</h2>
        <p>
          {t(
            "CODEX C 0.1 uses a real C17 compiler in your browser. The first run downloads about 53 MB of compiler assets. Programs have a 3-second execution limit per case, bounded output, and a virtual filesystem.",
          )}
        </p>
        <p>
          {t(
            "No accounts, analytics, remote code execution, or competitive leaderboard. Progress is a personal learning record; it can be edited locally and is not suitable as tamper-proof exam grading.",
          )}
        </p>
        <p>
          {t(
            "Networking, operating-system APIs, native graphics, C23-only syntax, and an arbitrary-program visual debugger are outside this edition.",
          )}
        </p>
        <External href="https://github.com/S-L-A-K-E-R/CODEX_C">
          {t("Project, documentation & source")}
        </External>
      </section>
      {incoming && (
        <Modal
          title={t("Merge this learning backup?")}
          onClose={() => setIncoming(null)}
        >
          <p>
            {t(
              "Backup for {name}, with {completed} completed challenges and {drafts} saved workspaces.",
              {
                name: incoming.profile.name,
                completed: Object.keys(incoming.completed).length,
                drafts: Object.keys(incoming.drafts).length,
              },
            )}
          </p>
          <p>
            {t(
              "Completed work is combined. For code and profile settings, the more recently saved version wins. Activity totals use the larger daily value, avoiding double counting the same backup.",
            )}
          </p>
          <p className="small muted">
            {t(
              "A copy of your current progress will download before the merge.",
            )}
          </p>
          <div className="button-row">
            <button className="btn" onClick={() => setIncoming(null)}>
              {t("Cancel")}
            </button>
            <button
              className="btn primary"
              onClick={() => {
                download(
                  "codex-c-before-import.json",
                  JSON.stringify(p, null, 2),
                );
                const merged = importProgress(incoming);
                setIncoming(null);
                if (merged)
                  setMessage(
                    "Backup merged. Your completed work is ready to continue.",
                  );
                else
                  setError(
                    "The combined backup exceeds storage limits. Your previous saved work is unchanged.",
                  );
              }}
            >
              {t("Back up & merge")}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
