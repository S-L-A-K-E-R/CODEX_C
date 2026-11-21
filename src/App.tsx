import { lazy, Suspense, useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Code2,
  Compass,
  FolderCode,
  GitBranch,
  GraduationCap,
  Leaf,
  LockKeyhole,
  Map,
  Menu,
  Play,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  Star,
  Terminal,
  Trophy,
  UserRound,
  X,
} from "lucide-react";
import type { Chapter } from "./data/curriculum.ts";
import { ChapterTrail } from "./components/ChapterTrail.tsx";
import { lockedBy } from "./state/path.ts";
import { useLanguage, LanguageSwitch } from "./i18n/Language.tsx";
import { ThemeSwitch } from "./theme/Theme.tsx";
import { useProgress, updateProgress, useStorageIssue } from "./state/store.ts";
import { now } from "./state/progress.ts";
import { Profile, Settings, timeLabel } from "./pages/Profile.tsx";
import {
  Brand,
  Badge,
  ProgressBar,
  go,
  External,
  Done,
} from "./components/shared.tsx";
import { ConceptLab } from "./components/ConceptLab.tsx";

const nav = [
  { route: "path", label: "Learning path", icon: GitBranch },
  { route: "practice", label: "Practice library", icon: Code2 },
  { route: "projects", label: "Projects", icon: FolderCode },
  { route: "profile", label: "Your profile", icon: UserRound },
];
const Workspace = lazy(() =>
  import("./pages/Workspace.tsx").then((module) => ({
    default: module.Workspace,
  })),
);
function useRoute() {
  const [route, setRoute] = useState(location.hash.slice(1) || "path");
  useEffect(() => {
    const change = () => {
      setRoute(location.hash.slice(1) || "path");
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  return route;
}
export default function App() {
  const {
    t,
    course: { getExercise, getChapter, projects, exercises, coreTotal },
  } = useLanguage();
  const route = useRoute(),
    page = route.startsWith("path/") ? "path" : route,
    p = useProgress(),
    issue = useStorageIssue(),
    [mobileNav, setMobileNav] = useState(false);
  useEffect(() => {
    setMobileNav(false);
  }, [route]);
  useEffect(() => {
    document.title =
      "CODEX C · " +
      t(
        nav.find((n) => n.route === page)?.label ||
          (route.startsWith("workspace")
            ? "Workspace"
            : route.startsWith("lesson")
              ? "Quick lesson"
              : "Your learning space"),
      );
  }, [route, page, t]);
  if (route.startsWith("workspace/")) {
    const id = route.slice(10);
    if (
      getExercise(id) ||
      id === "playground" ||
      (id.startsWith("example:") && getChapter(id.slice(8))) ||
      projects.some((p) => "project:" + p.id === id)
    )
      return (
        <Suspense
          fallback={
            <div className="locked-page">
              <Code2 size={40} />
              <p>{t("Opening your workspace…")}</p>
            </div>
          }
        >
          <Workspace key={id} id={id} />
        </Suspense>
      );
  }
  const core = exercises.filter(
    (e) => e.kind === "core" && p.completed[e.id],
  ).length;
  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        {t("Skip to content")}
      </a>
      <aside className={"sidebar " + (mobileNav ? "mobile-open" : "")}>
        <div className="sidebar-brand">
          <Brand />
          <button
            className="icon-btn mobile-only"
            aria-label={t("Close navigation")}
            onClick={() => setMobileNav(false)}
          >
            <X size={19} />
          </button>
        </div>
        <div className="course-label">
          {t("THE C LEARNING SPACE")} <span>01</span>
        </div>
        <nav aria-label={t("Main navigation")}>
          {nav.map((n) => (
            <a
              key={n.route}
              href={"#" + n.route}
              className={
                page === n.route ||
                (route.startsWith("lesson/") && n.route === "path")
                  ? "active"
                  : ""
              }
              aria-current={page === n.route ? "page" : undefined}
            >
              <n.icon size={19} />
              {t(n.label)}
              {n.route === "path" && <span className="nav-dot" />}
            </a>
          ))}
        </nav>
        <div className="sidebar-lab">
          <span className="eyebrow">{t("GOT AN IDEA?")}</span>
          <Terminal size={25} />
          <b>{t("Make a little mess.")}</b>
          <p>{t("A blank canvas for your next “what if?”.")}</p>
          <a href="#workspace/playground">
            {t("Open playground")} <ArrowUpRight size={15} />
          </a>
        </div>
        <div className="sidebar-bottom">
          <div className="sidebar-progress">
            <div>
              <span>{t("Your core path")}</span>
              <b>{Math.round((core / coreTotal) * 100)}%</b>
            </div>
            <ProgressBar
              value={(core / coreTotal) * 100}
              label={t("Core learning path")}
            />
          </div>
          <a
            className={
              route === "settings" ? "settings-link active" : "settings-link"
            }
            href="#settings"
          >
            <SettingsIcon size={18} />
            {t("Settings & backups")}
          </a>
          <a className="sidebar-profile" href="#profile">
            <div className="avatar" style={{ background: p.profile.accent }}>
              {p.profile.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <b>{p.profile.name}</b>
              <small>{t("C explorer")}</small>
            </div>
            <ChevronRight size={16} />
          </a>
        </div>
      </aside>
      {mobileNav && (
        <button
          className="nav-backdrop"
          aria-label={t("Close navigation")}
          onClick={() => setMobileNav(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-btn mobile-only"
              aria-label={t("Open navigation")}
              onClick={() => setMobileNav(true)}
            >
              <Menu size={20} />
            </button>
            <span>{t("Workspace")}</span>
            <ChevronRight size={14} />
            <b>
              {t(
                nav.find((n) => n.route === page)?.label ||
                  (route.startsWith("lesson/")
                    ? "Quick lesson"
                    : route === "settings"
                      ? "Settings"
                      : "Explore"),
              )}
            </b>
          </div>
          <div className="topbar-right">
            <ThemeSwitch />
            <LanguageSwitch />
            <span className="local-pill">
              <span />
              {t("Your progress stays with you")}
            </span>
            <a
              className="repository-link"
              href="https://github.com/S-L-A-K-E-R/CODEX_C"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
              <ArrowUpRight size={14} />
            </a>
            <a
              className="topbar-profile"
              href="#profile"
              aria-label={t("Open your profile")}
            >
              <span className="avatar" style={{ background: p.profile.accent }}>
                {p.profile.name.slice(0, 2).toUpperCase()}
              </span>
            </a>
          </div>
        </header>
        {issue && (
          <div role="alert" className="storage-warning">
            {t(issue)} <a href="#settings">{t("Open backups →")}</a>
          </div>
        )}
        <main id="main-content" tabIndex={-1}>
          {page === "path" ? (
            <LearningPath key={route} chapterId={route.slice(5)} />
          ) : route === "practice" ? (
            <Practice />
          ) : route === "projects" ? (
            <Projects />
          ) : route === "profile" ? (
            <Profile />
          ) : route === "settings" ? (
            <Settings />
          ) : route.startsWith("lesson/") && getChapter(route.slice(7)) ? (
            <Lesson chapter={getChapter(route.slice(7))!} />
          ) : (
            <div className="page">
              <h1>{t("Let’s get you back on the path.")}</h1>
              <p>{t("This page could not be found. Your progress is safe.")}</p>
              <a href="#path" className="btn primary">
                {t("Learning path")}
              </a>
            </div>
          )}
        </main>
        <footer className="site-footer">
          <span>
            CODEX C <b>·</b> {t("A little practice. A lot of possibility.")}
          </span>
          <a
            href="https://github.com/S-L-A-K-E-R/C_courses"
            target="_blank"
            rel="noreferrer"
          >
            {t("Course materials by SLAKER")} <ArrowUpRight size={13} />
          </a>
        </footer>
      </div>
    </div>
  );
}
function LearningPath({ chapterId }: { chapterId: string }) {
  const {
    t,
    course: {
      chapters,
      exercises,
      stages,
      getChapter,
      getExercise,
      byChapter,
      coreTotal,
      goldTotal,
    },
  } = useLanguage();
  const p = useProgress(),
    next =
      exercises.find((e) => e.kind === "core" && !p.completed[e.id]) ||
      exercises.find(
        (e) => !p.completed[e.id] && !lockedBy(e, byChapter(e.chapter), p),
      ) ||
      exercises[0];
  const initialChapter = getChapter(chapterId) || getChapter(next.chapter)!;
  const [stage, setStage] = useState(initialChapter.stage),
    [expanded, setExpanded] = useState(initialChapter.id);
  const done = exercises.filter(
      (e) => e.kind === "core" && p.completed[e.id],
    ).length,
    gold = exercises.filter(
      (e) => e.kind === "gold" && p.completed[e.id],
    ).length,
    time = Object.values(p.activity).reduce((a, b) => a + b, 0);
  const resume = getExercise(p.lastChallenge);
  return (
    <div className="page path-page">
      <section className="journey-hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="tiny-dot" />
            {t("YOUR JOURNEY INTO C")}
          </div>
          <h1>
            {t("Small steps.")}
            <br />
            {t("Real programs.")}
          </h1>
          <p>
            {t("Understand a concept. Try an idea. Make it work.")}
            <br />
            {t("A path from your first line to your own projects.")}
          </p>
          <button
            className="btn dark"
            onClick={() =>
              go(
                p.lessons[next.chapter]
                  ? "workspace/" +
                      (resume &&
                      !p.completed[resume.id] &&
                      !lockedBy(resume, byChapter(resume.chapter), p)
                        ? resume.id
                        : next.id)
                  : "lesson/" + next.chapter,
              )
            }
          >
            {done || Object.keys(p.drafts).length
              ? t("Continue your journey")
              : t("Let’s write your first line")}
            <ArrowRight size={17} />
          </button>
          <span className="hero-footnote">
            {t("Your pace. No streaks. Just progress.")}
          </span>
        </div>
        <div className="hero-accents" aria-hidden="true">
          <span style={{ left: "6%", top: "48%" }}>+</span>
          <span style={{ left: "23%", top: "20%" }}>+</span>
          <span style={{ left: "30%", top: "80%" }}>*</span>
          <span style={{ left: "43%", top: "47%" }}>+</span>
          <span style={{ left: "57%", top: "5%" }}>*</span>
          <span style={{ left: "63%", top: "68%" }}>+</span>
          <span style={{ left: "83%", top: "32%" }}>+</span>
          <span style={{ left: "92%", top: "84%" }}>+</span>
        </div>
        <div className="hero-illustration" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span className="floating-symbol symbol-one">{"{ }"}</span>
          <span className="floating-symbol symbol-two">{"*"}</span>
          <div className="code-token">
            <Code2 size={64} strokeWidth={1.35} />
            <small>{t("HELLO, POSSIBILITY.")}</small>
          </div>
          <div className="floating-chip">
            <span />
            {t("Build. Run. Understand.")}
          </div>
          <div className="hero-spark">+</div>
        </div>
      </section>
      <div className="stats-strip">
        <div>
          <div className="stat-icon">
            <GitBranch size={20} />
          </div>
          <p>
            <strong>
              {done}
              <em> / {coreTotal}</em>
            </strong>
            <span>{t("Core challenges")}</span>
          </p>
          <ProgressBar
            value={(done / coreTotal) * 100}
            label={t("Completed core challenges")}
          />
        </div>
        <div>
          <div className="stat-icon gold-icon">
            <Star size={20} />
          </div>
          <p>
            <strong>
              {gold}
              <em> / {goldTotal}</em>
            </strong>
            <span>{t("Gold challenges")}</span>
          </p>
        </div>
        <div>
          <div className="stat-icon">
            <Clock3 size={20} />
          </div>
          <p>
            <strong>{timeLabel(time)}</strong>
            <span>{t("Focused learning")}</span>
          </p>
          <a href="#profile" aria-label={t("View your learning profile")}>
            <ArrowUpRight size={20} />
          </a>
        </div>
      </div>
      <div className="path-layout">
        <section className="path-main">
          <div className="section-top">
            <div>
              <div className="eyebrow">{t("ONE CHAPTER AT A TIME")}</div>
              <h2>{t("Your learning path")}</h2>
            </div>
            <span className="small muted">
              {t("{chapters} chapters · {exercises} challenges", {
                chapters: chapters.length,
                exercises: exercises.length,
              })}
            </span>
          </div>
          <div className="stage-tabs" aria-label={t("Learning stages")}>
            {stages.map((s, i) => (
              <button
                key={s}
                className={stage === i ? "active" : ""}
                onClick={() => {
                  setStage(i);
                  setExpanded(chapters.find((c) => c.stage === i)!.id);
                }}
              >
                <span>0{i + 1}</span>
                {i === 0
                  ? t("Foundations")
                  : i === 1
                    ? t("Data & memory")
                    : t("Build & explore")}
              </button>
            ))}
          </div>
          <div className="chapters-list">
            {chapters
              .filter((c) => c.stage === stage)
              .map((c) => (
                <ChapterCard
                  key={c.id}
                  chapter={c}
                  expanded={expanded === c.id}
                  onExpand={() => setExpanded(expanded === c.id ? "" : c.id)}
                />
              ))}
          </div>
          <div className="path-next">
            <Compass size={20} />
            <p>
              {t(
                "Start in any chapter. Its first core challenge opens the next challenge and the side quest.",
              )}
            </p>
          </div>
        </section>
        <aside className="path-rail">
          <section className="next-card">
            <div className="eyebrow">
              <Leaf size={14} />
              {t("A GOOD PLACE TO START")}
            </div>
            <div className="next-card-icon">
              <Terminal size={30} />
              <span>01</span>
            </div>
            <Badge kind={next.kind} />
            <h3>{next.title}</h3>
            <p>{next.brief}</p>
            <button
              className="btn primary"
              onClick={() => go("workspace/" + next.id)}
            >
              {p.completed[next.id]
                ? t("Revisit challenge")
                : done
                  ? t("Next small win")
                  : t("Try your first challenge")}
              <ArrowRight size={16} />
            </button>
          </section>
          <section className="path-guide">
            <h3>{t("A path with room to wander.")}</h3>
            <div>
              <span className="legend-icon core">
                <Check size={13} />
              </span>
              <p>
                <b>{t("Core path")}</b>
                <small>{t("The essentials, one step at a time.")}</small>
              </p>
            </div>
            <div>
              <span className="legend-icon gold">
                <Star size={13} />
              </span>
              <p>
                <b>{t("Go for gold")}</b>
                <small>
                  {t(
                    "Select a green circle for its harder second part. Pass it to turn the circle gold.",
                  )}
                </small>
              </p>
            </div>
            <div>
              <span className="legend-icon optional">
                <Compass size={13} />
              </span>
              <p>
                <b>{t("Take a side quest")}</b>
                <small>{t("Extra practice when you want it.")}</small>
              </p>
            </div>
          </section>
          <div className="local-note">
            <ShieldCheck size={20} />
            <p>
              {t("Yours to keep.")}
              <small>
                {t("Your work saves in this browser.")}{" "}
                <a href="#settings">{t("Back it up anytime.")}</a>
              </small>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
function ChapterCard({
  chapter: c,
  expanded,
  onExpand,
}: {
  chapter: Chapter;
  expanded: boolean;
  onExpand: () => void;
}) {
  const {
    t,
    course: { chapters, byChapter },
  } = useLanguage();
  const p = useProgress(),
    items = byChapter(c.id),
    done = items.filter((e) => e.kind === "core" && p.completed[e.id]).length,
    coreCount = items.filter((e) => e.kind === "core").length,
    index = chapters.indexOf(c) + 1;
  return (
    <article
      className={
        "chapter-card " +
        (expanded ? "expanded" : "") +
        " " +
        (done === coreCount ? "chapter-done" : "")
      }
    >
      <button
        className="chapter-header"
        aria-expanded={expanded}
        onClick={onExpand}
      >
        <span className="chapter-number">
          {done === coreCount ? <Check size={20} /> : String(index).padStart(2, "0")}
        </span>
        <span className="chapter-heading">
          <b>{c.title}</b>
          <small>{c.subtitle}</small>
        </span>
        <span className="chapter-count">{t("{n}/{total} core", { n: done, total: coreCount })}</span>
        <ChevronDown size={18} />
      </button>
      {expanded && (
        <div className="chapter-body">
          <div className="concept-tags">
            {c.concepts.map((x) => (
              <span key={x}>{x}</span>
            ))}
          </div>
          <ChapterTrail chapter={c} items={items} />
        </div>
      )}
    </article>
  );
}
function Lesson({ chapter: c }: { chapter: Chapter }) {
  const {
    t,
    course: { chapters, byChapter },
  } = useLanguage();
  const p = useProgress(),
    first = byChapter(c.id)[0];
  return (
    <div className="page lesson-page">
      <a className="back-link" href={"#path/" + c.id}>
        {t("← Back to your path")}
      </a>
      <div className="eyebrow">
        {t("CHAPTER {n} · THE QUICK INTRODUCTION", {
          n: String(chapters.indexOf(c) + 1).padStart(2, "0"),
        })}
      </div>
      <div className="page-heading">
        <div>
          <h1>{c.title}</h1>
          <p>{c.subtitle}</p>
        </div>
      </div>
      <div className="lesson-layout">
        <article className="lesson-article">
          <div className="learning-objectives">
            <GraduationCap size={23} />
            <div>
              <b>{t("By the end, you’ll be able to work with…")}</b>
              <div className="concept-tags">
                {c.concepts.map((x) => (
                  <span key={x}>{x}</span>
                ))}
              </div>
            </div>
          </div>
          {c.lesson.map(([heading, body], i) => (
            <section className="lesson-section" key={heading}>
              <span className="lesson-section-num">0{i + 1}</span>
              <div>
                <h2>{heading}</h2>
                <p>{body}</p>
              </div>
            </section>
          ))}
          <section className="runnable-example">
            <div>
              <span>
                <FileIcon />
                {t("A complete example")}
              </span>
              <button
                className="btn"
                onClick={() => go("workspace/example:" + c.id)}
              >
                <Play size={14} />
                {t("Try this code")}
              </button>
            </div>
            <pre>{c.example}</pre>
          </section>
          <div className="lesson-ref">
            <External href={c.reference}>
              {t("Explore the related course sheet")}
            </External>
            <small>
              {t(
                "Original course materials by SLAKER. This lesson is an adaptation with new examples.",
              )}
            </small>
          </div>
          <div className="lesson-complete">
            <div>
              <b>{t("Ready to make something?")}</b>
              <p>
                {t("You can always keep the lesson open beside your code.")}
              </p>
            </div>
            <button
              className="btn primary"
              onClick={() => {
                updateProgress((s) => ({
                  ...s,
                  lessons: { ...s.lessons, [c.id]: now() },
                }));
                go("workspace/" + first.id);
              }}
            >
              {p.lessons[c.id]
                ? t("Continue to practice")
                : t("Mark as read & practise")}
              <ArrowRight size={16} />
            </button>
          </div>
        </article>
        <aside>
          {["variables", "loops", "pointers", "dynamic-memory"].includes(
            c.id,
          ) ? (
            <ConceptLab kind={c.widget} />
          ) : (
            <section className="concept-lab">
              <div className="eyebrow">{t("PREDICT. RUN. EXPLAIN.")}</div>
              <h3>{t("Make the example yours.")}</h3>
              <ol>
                <li>{t("Predict its output before running it.")}</li>
                <li>{t("Open the example in the workspace.")}</li>
                <li>{t("Change one value or one instruction.")}</li>
                <li>{t("Explain what changed in the result.")}</li>
              </ol>
              <button
                className="btn dark"
                onClick={() => go("workspace/example:" + c.id)}
              >
                {t("Open the experiment")}
                <ArrowRight size={16} />
              </button>
            </section>
          )}
          <div className="local-note">
            <LightBulbIcon />
            <p>
              {t("Small is a good start.")}
              <small>
                {t("You do not need to memorise everything before trying it.")}
              </small>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
function FileIcon() {
  return <Code2 size={16} />;
}
function LightBulbIcon() {
  return <Sparkles size={20} />;
}
function Practice() {
  const {
    t,
    course: { exercises, chapters, getChapter, byChapter },
  } = useLanguage();
  const [search, setSearch] = useState(""),
    [chapter, setChapter] = useState("all"),
    [kind, setKind] = useState("all"),
    [status, setStatus] = useState("all");
  const p = useProgress();
  const results = exercises.filter(
    (e) =>
      (chapter === "all" || e.chapter === chapter) &&
      (kind === "all" || e.kind === kind) &&
      (status === "all" ||
        (status === "completed" ? !!p.completed[e.id] : !p.completed[e.id])) &&
      `${e.title} ${e.brief} ${getChapter(e.chapter)?.title}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">{t("ROOM TO GET BETTER")}</div>
          <h1>{t("Find your next small challenge.")}</h1>
          <p>
            {t(
              "A focused exercise, a gold challenge, or a little detour. Take your pick.",
            )}
          </p>
        </div>
        <span className="pill">
          {t("{n} challenges to explore", { n: exercises.length })}
        </span>
      </div>
      <div className="practice-filters">
        <label className="search-box">
          <Search size={18} />
          <input
            aria-label={t("Search challenges")}
            placeholder={t("Search challenges, skills, ideas…")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          aria-label={t("Filter by chapter")}
          value={chapter}
          onChange={(e) => setChapter(e.target.value)}
        >
          <option value="all">{t("All chapters")}</option>
          {chapters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <select
          aria-label={t("Filter by status")}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">{t("Any progress")}</option>
          <option value="open">{t("To explore")}</option>
          <option value="completed">{t("Completed")}</option>
        </select>
      </div>
      <div className="filter-tabs">
        {[
          ["all", t("All challenges")],
          ["core", t("Core path")],
          ["gold", t("Gold challenges")],
          ["optional", t("Side quests")],
        ].map(([value, label]) => (
          <button
            className={kind === value ? "active" : ""}
            key={value}
            onClick={() => setKind(value)}
          >
            {label}
          </button>
        ))}
        <span>{t("{n} results", { n: results.length })}</span>
      </div>
      <div className="exercise-grid">
        {results.map((e) => {
          const prerequisite = lockedBy(e, byChapter(e.chapter), p);
          return (
            <a
              href={"#workspace/" + e.id}
              key={e.id}
              className={"exercise-card " + e.kind}
            >
              <div>
                <Badge kind={e.kind} />
                {p.completed[e.id] ? (
                  <Done text={t("Done")} />
                ) : prerequisite ? (
                  <LockKeyhole size={16} />
                ) : (
                  <ArrowUpRight size={18} />
                )}
              </div>
              <small className="eyebrow">{getChapter(e.chapter)?.title}</small>
              <h2>{e.title}</h2>
              <p>{e.brief}</p>
              <footer>
                {prerequisite
                  ? t("Unlock after {title}", { title: prerequisite.title })
                  : e.base
                    ? t("Part II · A new twist")
                    : t("Open challenge")}
                <ArrowRight size={14} />
              </footer>
            </a>
          );
        })}
      </div>
      {!results.length && (
        <div className="empty-state">
          <Search size={32} />
          <h2>{t("No challenges match just yet.")}</h2>
          <p>{t("Try a broader search or clear your filters.")}</p>
          <button
            className="btn"
            onClick={() => {
              setSearch("");
              setChapter("all");
              setKind("all");
              setStatus("all");
            }}
          >
            {t("Clear filters")}
          </button>
        </div>
      )}
    </div>
  );
}
function Projects() {
  const {
    t,
    course: { projects, getChapter },
  } = useLanguage();
  const p = useProgress();
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">{t("PUT THE PIECES TOGETHER")}</div>
          <h1>{t("Build something that feels yours.")}</h1>
          <p>
            {t(
              "Open projects with clear milestones. Take them one feature at a time.",
            )}
          </p>
        </div>
        <FolderCode size={35} />
      </div>
      <div className="projects-list">
        {projects.map((project, i) => (
          <article className="project-card" key={project.id}>
            <div className={"project-art project-art-" + i} aria-hidden="true">
              {i === 0 ? (
                <Clock3 size={76} strokeWidth={1} />
              ) : i === 1 ? (
                <GraduationCap size={76} strokeWidth={1} />
              ) : (
                <Trophy size={76} strokeWidth={1} />
              )}
              <span>
                {t("PROJECT 0")}
                {i + 1}
              </span>
            </div>
            <div className="project-detail">
              <div className="eyebrow">{project.tag}</div>
              <h2>{project.title}</h2>
              <p>{project.description}</p>
              <div className="concept-tags">
                {project.chapters.map((id) => (
                  <a key={id} href={"#lesson/" + id}>
                    {getChapter(id)?.title}
                  </a>
                ))}
              </div>
              <details>
                <summary>{t("View the four milestones")}</summary>
                <p className="small muted">
                  {t(
                    "Self-assessment: mark a milestone after you can demonstrate and explain it. Project milestones do not award challenge completion.",
                  )}
                </p>
                {project.deliverables.map((d, n) => {
                  const key = project.id + ":" + n;
                  return (
                    <label className="milestone" key={key}>
                      <input
                        type="checkbox"
                        checked={!!p.milestones[key]}
                        onChange={(e) =>
                          updateProgress((s) => {
                            const milestones = { ...s.milestones };
                            if (e.target.checked) milestones[key] = now();
                            else delete milestones[key];
                            return { ...s, milestones };
                          })
                        }
                      />
                      {d}
                    </label>
                  );
                })}
                <External href={project.source}>
                  {t("Original inspiration in the course repository")}
                </External>
              </details>
              <div className="project-bottom">
                <button
                  className="btn dark"
                  onClick={() => go("workspace/project:" + project.id)}
                >
                  {t("Open project")}
                  <ArrowRight size={16} />
                </button>
                <span>
                  {
                    project.deliverables.filter(
                      (_, n) => p.milestones[project.id + ":" + n],
                    ).length
                  }
                  {t("/4 milestones")}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="info-note">
        <Compass size={22} />
        <p>
          {t(
            "Next horizons: sorting visualisations, circular queues, a text adventure, and native C projects with SDL or sockets. These need their own lessons and review before joining the path.",
          )}
        </p>
      </div>
    </div>
  );
}
