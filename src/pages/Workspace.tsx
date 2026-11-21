import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Play,
  Square,
  CheckCheck,
  Star,
  BookOpen,
  Lightbulb,
  FileCode2,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronUp,
  Download,
  RotateCcw,
  Check,
  X,
  LockKeyhole,
  Maximize2,
  Terminal,
  Files,
  LoaderCircle,
} from "lucide-react";
import { CodeEditor } from "../components/CodeEditor.tsx";
import { Badge, Modal, go, External, download, AsciiCMark } from "../components/shared.tsx";
import { useLanguage, LanguageSwitch } from "../i18n/Language.tsx";
import { ThemeSwitch } from "../theme/Theme.tsx";
import {
  readProgress,
  saveDraft,
  updateProgress,
  useProgress,
  useStorageIssue,
} from "../state/store.ts";
import { lockedBy } from "../state/path.ts";
import { markComplete } from "../state/progress.ts";
import { runProgram, stopProgram } from "../runtime/client.ts";
import {
  matchesOutput,
  type RunResponse,
  type CheckResult,
} from "../runtime/types.ts";

export function Workspace({ id }: { id: string }) {
  const {
    t,
    course: { getExercise, getChapter, projects, byChapter, goldFor },
  } = useLanguage();
  const exercise = getExercise(id),
    chapter = getChapter(exercise?.chapter || id.replace("example:", ""));
  const project = projects.find((p) => id === "project:" + p.id);
  const progress = useProgress(),
    storageIssue = useStorageIssue();
  const title =
    exercise?.title ||
    project?.title ||
    (chapter
      ? t("{title} · example", { title: chapter.title })
      : t("Your C playground"));
  const starter = exercise?.starter || {
    "main.c":
      project?.starter ||
      chapter?.example ||
      '#include <stdio.h>\n\nint main(void) {\n    printf("Make something small.\\n");\n    return 0;\n}\n',
  };
  const [files, setFiles] = useState<Record<string, string>>(() => ({
    ...(readProgress().drafts[id]?.files ??
      (exercise?.base
        ? { ...starter, ...readProgress().drafts[exercise.base]?.files }
        : starter)),
  }));
  const [input, setInput] = useState(
    () => readProgress().drafts[id]?.input ?? exercise?.tests[0]?.input ?? "",
  );
  const [filename, setFilename] = useState("main.c"),
    [briefTab, setBriefTab] = useState("brief"),
    [panel, setPanel] = useState(true),
    [consoleOpen, setConsoleOpen] = useState(true),
    [outputTab, setOutputTab] = useState("output");
  const [width, setWidth] = useState(350),
    [height, setHeight] = useState(240),
    [hintCount, setHintCount] = useState(0);
  const [busy, setBusy] = useState(false),
    [phase, setPhase] = useState("Ready when you are"),
    [response, setResponse] = useState<RunResponse | null>(null),
    [checks, setChecks] = useState<CheckResult[]>([]),
    [verified, setVerified] = useState(false);
  const [reset, setReset] = useState(false),
    [newFile, setNewFile] = useState(false),
    [newName, setNewName] = useState("helpers.h"),
    [fileError, setFileError] = useState(""),
    [saved, setSaved] = useState(true);
  const draftRef = useRef({ files, input }),
    alive = useRef(true),
    runRef = useRef(false),
    edited = useRef(false);
  draftRef.current = { files, input };
  useEffect(() => {
    alive.current = true;
    const flush = () => {
      if (edited.current) saveDraft(id, draftRef.current);
    };
    const hidden = () => {
      if (document.hidden) flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      alive.current = false;
      stopProgram();
      flush();
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [id]);
  useEffect(() => {
    if (!edited.current) return;
    setSaved(false);
    const timeout = setTimeout(() => {
      saveDraft(id, { files, input });
      setSaved(true);
    }, 350);
    return () => clearTimeout(timeout);
  }, [files, input, id]);
  function changeFile(value: string) {
    if (value.length > 50_000) return;
    edited.current = true;
    setFiles((old) => ({ ...old, [filename]: value }));
    setVerified(false);
    if (response?.diagnostics)
      setResponse((r) => (r ? { ...r, diagnostics: "" } : r));
  }
  const locked =
    exercise && lockedBy(exercise, byChapter(exercise.chapter), progress);
  const path = chapter ? "path/" + chapter.id : "path";
  async function run(check = false) {
    if (runRef.current || locked) return;
    runRef.current = true;
    setBusy(true);
    setConsoleOpen(true);
    setOutputTab(check ? "checks" : "output");
    setChecks([]);
    setResponse(null);
    setVerified(false);
    setPhase("Preparing your program");
    const snapshot = structuredClone(draftRef.current);
    saveDraft(id, snapshot);
    setSaved(true);
    if (exercise)
      updateProgress((s) => ({
        ...s,
        attempts: { ...s.attempts, [id]: (s.attempts[id] || 0) + 1 },
      }));
    const result = await runProgram(
      snapshot.files,
      check && exercise ? exercise.tests.map((t) => t.input) : [snapshot.input],
      (text) => {
        if (alive.current) setPhase(text);
      },
    );
    if (!alive.current) return;
    runRef.current = false;
    setBusy(false);
    setResponse(result);
    const unchanged =
      JSON.stringify(snapshot.files) === JSON.stringify(draftRef.current.files);
    if (check && exercise) {
      const checked = exercise.tests.map((test, i) => ({
        ...(result.results[i] || {
          stdout: "",
          stderr: "",
          exitCode: -1,
          files: {},
        }),
        label: test.label,
        input: test.input,
        expected: test.output,
        passed:
          !!result.results[i] &&
          result.results[i].exitCode === 0 &&
          matchesOutput(result.results[i].stdout, test.output),
      }));
      setChecks(checked);
      const passed = !result.error && checked.every((x) => x.passed);
      if (passed && unchanged) {
        updateProgress((s) => markComplete(s, id));
        setVerified(true);
        setPhase("All cases passed. Nicely done.");
      } else if (passed)
        setPhase(
          "The tested version passed. Check again to validate your latest edits.",
        );
      else
        setPhase(
          result.error || "Keep going. Compare the expected output with yours.",
        );
    } else
      setPhase(
        result.error ||
          (result.results[0]?.exitCode === 0
            ? "Program finished · exit code 0"
            : `Program stopped · exit code ${result.results[0]?.exitCode ?? "?"}`),
      );
  }
  const original = exercise?.base ? getExercise(exercise.base) : undefined;
  const gold = exercise && progress.completed[id] ? goldFor(id) : undefined;
  const currentResult = response?.results[0];
  const generated = Object.entries(currentResult?.files || {}).filter(
    ([name, content]) => files[name] !== content,
  );
  function addFile() {
    if (Object.keys(files).length >= 20) {
      setFileError("A workspace can contain up to 20 files.");
      return;
    }
    if (
      !/^[a-zA-Z0-9_-][a-zA-Z0-9_.-]{0,70}\.(c|h|txt)$/.test(newName) ||
      newName.includes("..")
    ) {
      setFileError("Use a simple filename ending in .c, .h, or .txt.");
      return;
    }
    if (Object.hasOwn(files, newName)) {
      setFileError("That file already exists.");
      return;
    }
    edited.current = true;
    setFiles((f) => ({
      ...f,
      [newName]: newName.endsWith(".h")
        ? "#ifndef " +
          newName.replace(/\W/g, "_").toUpperCase() +
          "\n#define " +
          newName.replace(/\W/g, "_").toUpperCase() +
          "\n\n#endif\n"
        : "",
    }));
    setFilename(newName);
    setNewFile(false);
    setFileError("");
  }
  if (locked)
    return (
      <main className="locked-page">
        <ThemeSwitch />
        <LanguageSwitch />
        <LockKeyhole size={40} />
        <Badge kind={exercise!.kind} />
        <h1>{title}</h1>
        <p>
          {t("Complete {title} to unlock this challenge.", {
            title: locked.title,
          })}
        </p>
        <button
          className="btn primary"
          onClick={() => go("workspace/" + locked.id)}
        >
          {t("Open {title}", { title: locked.title })}
        </button>
        <button className="btn quiet" onClick={() => go(path)}>
          {t("Back to learning path")}
        </button>
      </main>
    );
  return (
    <div className="workspace">
      <header className="workspace-header">
        <button
          className="icon-btn"
          aria-label={t("Back to learning path")}
          onClick={() => go(path)}
        >
          <ArrowLeft size={20} />
        </button>
        <a
          className="workspace-brand"
          href="#path"
          aria-label={t("CODEX C home")}
        >
          <AsciiCMark />
        </a>
        <span className="header-divider" />
        <div className="workspace-title">
          <small>
            {chapter?.title ||
              (project ? t("PROJECT WORKSPACE") : t("PLAYGROUND"))}
          </small>
          <strong>{title}</strong>
        </div>
        {exercise && <Badge kind={exercise.kind} />}
        <div className="workspace-actions">
          <ThemeSwitch />
          <LanguageSwitch />
          <button
            className="btn icon-mobile"
            title={t("Run code (Ctrl or Command + Enter)")}
            disabled={busy}
            onClick={() => void run()}
          >
            <Play size={16} />
            <span>{t("Run code")}</span>
          </button>
          {busy ? (
            <button className="btn danger" onClick={stopProgram}>
              <Square size={15} />
              {t("Stop")}
            </button>
          ) : exercise ? (
            <button className="btn primary" onClick={() => void run(true)}>
              <CheckCheck size={17} />
              <span>{t("Check solution")}</span>
            </button>
          ) : null}
        </div>
      </header>
      <div className="workspace-body">
        <nav className="activity-bar" aria-label={t("Workspace panels")}>
          <button
            className={"icon-btn " + (panel ? "selected" : "")}
            aria-label={panel ? t("Hide instructions") : t("Show instructions")}
            aria-expanded={panel}
            onClick={() => setPanel(!panel)}
          >
            <BookOpen size={21} />
          </button>
          <button
            className="icon-btn"
            aria-label={t("Show hints")}
            onClick={() => {
              setPanel(true);
              setBriefTab("hints");
            }}
          >
            <Lightbulb size={21} />
          </button>
          <button
            className="icon-btn"
            aria-label={t("Focus editor")}
            onClick={() => {
              setPanel(false);
              setConsoleOpen(false);
            }}
          >
            <Maximize2 size={20} />
          </button>
          <span />
          <button
            className="icon-btn"
            aria-label={t("Show console")}
            onClick={() => setConsoleOpen(!consoleOpen)}
          >
            <Terminal size={20} />
          </button>
        </nav>
        {panel && (
          <>
            <aside className="brief-panel" style={{ width }}>
              <div className="brief-tabs">
                {["brief", "lesson", "hints"].map((tab) => (
                  <button
                    key={tab}
                    className={briefTab === tab ? "active" : ""}
                    onClick={() => setBriefTab(tab)}
                  >
                    {tab === "brief"
                      ? t("Your challenge")
                      : tab === "lesson"
                        ? t("Quick lesson")
                        : t("Hints")}
                  </button>
                ))}
                <button
                  className="icon-btn"
                  aria-label={t("Collapse instructions")}
                  onClick={() => setPanel(false)}
                >
                  <PanelLeftClose size={16} />
                </button>
              </div>
              <div className="brief-content">
                {briefTab === "brief" ? (
                  <>
                    <div className="eyebrow">
                      {exercise
                        ? t("THE GOAL")
                        : project
                          ? t("PROJECT BRIEF")
                          : t("ROOM TO EXPERIMENT")}
                    </div>
                    <h1>{title}</h1>
                    {original && (
                      <a
                        className="tier-link"
                        href={"#workspace/" + original.id}
                      >
                        <BookOpen size={15} />
                        {t("Original: {title}", { title: original.title })}
                      </a>
                    )}
                    {gold && (
                      <a className="tier-link" href={"#workspace/" + gold.id}>
                        <Star size={15} />
                        {t("Gold: {title}", { title: gold.title })}
                      </a>
                    )}
                    <p>
                      {exercise?.brief ||
                        project?.description ||
                        t(
                          "Try an idea, run a small program, and see what happens. Your work stays in this browser.",
                        )}
                    </p>
                    {exercise ? (
                      <>
                        <section>
                          <h3>{t("What your program receives")}</h3>
                          <p>{exercise.input}</p>
                        </section>
                        <section>
                          <h3>{t("What it should produce")}</h3>
                          <p>{exercise.output}</p>
                        </section>
                        <div className="example">
                          <div>{t("EXAMPLE INPUT")}</div>
                          <pre>
                            {exercise.tests[0].input || t("(no input)")}
                          </pre>
                          <div>{t("EXPECTED OUTPUT")}</div>
                          <pre>
                            {exercise.tests[0].output || t("(no output)")}
                          </pre>
                        </div>
                        {exercise.tests.length > 1 && (
                          <details>
                            <summary>
                              {t("See all {n} cases", {
                                n: exercise.tests.length,
                              })}
                            </summary>
                            {exercise.tests.slice(1).map((test, i) => (
                              <div className="example" key={i}>
                                <div>
                                  {t(test.label)} · {t("INPUT")}
                                </div>
                                <pre>{test.input || t("(no input)")}</pre>
                                <div>{t("OUTPUT")}</div>
                                <pre>{test.output || t("(no output)")}</pre>
                              </div>
                            ))}
                          </details>
                        )}
                        <p className="small muted">
                          {t(
                            "Print only the requested output. One final newline is optional. Other spaces and letter case matter.",
                          )}
                        </p>
                      </>
                    ) : project ? (
                      <ol className="project-milestones">
                        {project.deliverables.map((d) => (
                          <li key={d}>{d}</li>
                        ))}
                      </ol>
                    ) : (
                      <p>
                        {t(
                          "Add .c, .h, and .txt files with the + button. All .c files are compiled together. Enter program input in the console before running.",
                        )}
                      </p>
                    )}
                    {(exercise || chapter) && (
                      <External
                        href={exercise?.reference || chapter!.reference}
                      >
                        {t("Related course material")}
                      </External>
                    )}
                  </>
                ) : briefTab === "lesson" ? (
                  <>
                    {chapter ? (
                      <>
                        <div className="eyebrow">{t("KEEP THIS NEARBY")}</div>
                        {chapter.lesson.map(([heading, body]) => (
                          <section key={heading}>
                            <h3>{heading}</h3>
                            <p>{body}</p>
                          </section>
                        ))}
                        <pre className="mini-code">{chapter.example}</pre>
                      </>
                    ) : (
                      <>
                        <h3>{t("A few essentials")}</h3>
                        <p>
                          {t(
                            "Execution starts in main. Include stdio.h for printf and scanf. A semicolon ends most statements. Try a small change, then run again.",
                          )}
                        </p>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <div className="eyebrow">
                      {t("A NUDGE, WHEN YOU NEED IT")}
                    </div>
                    <h2>{t("You can work this out.")}</h2>
                    <p>
                      {t(
                        "Reveal one hint at a time. Using a hint never costs progress.",
                      )}
                    </p>
                    {(
                      exercise?.hints || [
                        t("Break the problem into one small step."),
                        t(
                          "Print intermediate values to understand what changes.",
                        ),
                        t("Check each boundary and each return value."),
                      ]
                    )
                      .slice(0, hintCount)
                      .map((h, i) => (
                        <div className="hint" key={i}>
                          <span>0{i + 1}</span>
                          <p>{h}</p>
                        </div>
                      ))}
                    <button
                      className="btn"
                      disabled={hintCount >= 3}
                      onClick={() => setHintCount(hintCount + 1)}
                    >
                      <Lightbulb size={16} />
                      {hintCount >= 3
                        ? t("All hints revealed")
                        : t("Reveal a hint")}
                    </button>
                  </>
                )}
              </div>
            </aside>
            <div
              className="splitter vertical"
              role="separator"
              aria-label={t("Resize instructions")}
              aria-orientation="vertical"
              aria-valuemin={260}
              aria-valuemax={650}
              aria-valuenow={width}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                  e.preventDefault();
                  setWidth((w) =>
                    Math.min(
                      650,
                      Math.max(260, w + (e.key === "ArrowRight" ? 20 : -20)),
                    ),
                  );
                }
              }}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId))
                  setWidth(Math.min(650, Math.max(260, e.clientX - 52)));
              }}
            />
          </>
        )}
        <main className="editor-pane" aria-label={t("Coding workspace")}>
          <div className="file-tabs">
            {!panel && (
              <button
                className="icon-btn"
                aria-label={t("Show instructions")}
                onClick={() => setPanel(true)}
              >
                <PanelLeftOpen size={17} />
              </button>
            )}
            {Object.keys(files).map((name) => (
              <button
                key={name}
                className={filename === name ? "active" : ""}
                onClick={() => setFilename(name)}
              >
                <FileCode2 size={15} />
                {name}
              </button>
            ))}
            <button
              className="icon-btn"
              aria-label={t("Add file")}
              onClick={() => setNewFile(true)}
            >
              <Plus size={16} />
            </button>
            <div className="file-tools">
              <button
                className="icon-btn"
                aria-label={t("Download current file")}
                onClick={() =>
                  download(filename, files[filename], "text/plain")
                }
              >
                <Download size={16} />
              </button>
              <button
                className="icon-btn"
                aria-label={t("Reset this workspace")}
                onClick={() => setReset(true)}
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </div>
          <div className="editor-breadcrumb">
            <FileCode2 size={12} />
            {filename}
            <span>UTF-8</span>
          </div>
          <CodeEditor
            value={files[filename] ?? ""}
            filename={filename}
            onChange={changeFile}
            fontSize={progress.settings.fontSize}
            diagnostics={response?.diagnostics || ""}
            onRun={() => void run()}
          />
          <div
            className="splitter horizontal"
            role="separator"
            aria-label={t("Resize console")}
            aria-orientation="horizontal"
            aria-valuemin={150}
            aria-valuemax={500}
            aria-valuenow={height}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault();
                setHeight((h) =>
                  Math.min(
                    500,
                    Math.max(150, h + (e.key === "ArrowUp" ? 20 : -20)),
                  ),
                );
              }
            }}
            onPointerDown={(e) =>
              e.currentTarget.setPointerCapture(e.pointerId)
            }
            onPointerMove={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                setConsoleOpen(true);
                setHeight(
                  Math.min(
                    500,
                    Math.max(150, window.innerHeight - e.clientY - 28),
                  ),
                );
              }
            }}
          />
          <section
            className={"console " + (consoleOpen ? "open" : "")}
            style={{ height: consoleOpen ? height : 40 }}
            aria-label={t("Program output and input")}
          >
            <div className="console-tabs">
              {[
                "output",
                "input",
                ...(exercise ? ["checks"] : []),
                "files",
              ].map((tab) => (
                <button
                  key={tab}
                  className={outputTab === tab ? "active" : ""}
                  onClick={() => {
                    setOutputTab(tab);
                    setConsoleOpen(true);
                  }}
                >
                  {tab === "output" ? (
                    <Terminal size={14} />
                  ) : tab === "files" ? (
                    <Files size={14} />
                  ) : null}
                  {tab === "input"
                    ? t("Input (stdin)")
                    : tab === "checks"
                      ? t("Test results")
                      : tab === "files"
                        ? t("Generated files")
                        : t("Console")}
                  {tab === "checks" && checks.length > 0 && (
                    <b>
                      {checks.filter((c) => c.passed).length}/{checks.length}
                    </b>
                  )}
                </button>
              ))}
              <button
                className="icon-btn"
                aria-label={
                  consoleOpen ? t("Collapse console") : t("Expand console")
                }
                onClick={() => setConsoleOpen(!consoleOpen)}
              >
                {consoleOpen ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronUp size={16} />
                )}
              </button>
            </div>
            {consoleOpen && (
              <div className="console-content">
                {outputTab === "input" ? (
                  <>
                    <label className="small" htmlFor="stdin">
                      {t(
                        "Provide all input before running. Whitespace separates numbers; newlines separate lines.",
                      )}
                    </label>
                    <textarea
                      id="stdin"
                      spellCheck={false}
                      value={input}
                      onChange={(e) => {
                        edited.current = true;
                        setInput(e.target.value.slice(0, 50000));
                      }}
                      placeholder={t("Type the input for your program here…")}
                    />
                  </>
                ) : outputTab === "files" ? (
                  <>
                    {generated.length ? (
                      generated.map(([name, text]) => (
                        <details key={name}>
                          <summary>
                            {name}{" "}
                            <button
                              className="text-button"
                              onClick={(e) => {
                                e.preventDefault();
                                download(name, text, "text/plain");
                              }}
                            >
                              {t("Download")}
                            </button>
                          </summary>
                          <pre>{text}</pre>
                        </details>
                      ))
                    ) : (
                      <p className="console-placeholder">
                        {t(
                          "Files written by your program will appear here after it finishes. Each run starts fresh.",
                        )}
                      </p>
                    )}
                  </>
                ) : outputTab === "checks" ? (
                  <>
                    {busy ? (
                      <div className="running">
                        <LoaderCircle size={16} className="spin" />
                        {t(phase)}
                      </div>
                    ) : null}
                    {response?.error && (
                      <p className="error-text">{t(response.error)}</p>
                    )}
                    {response?.diagnostics && (
                      <pre className="diagnostics">{response.diagnostics}</pre>
                    )}
                    {!busy && !checks.length && (
                      <p className="console-placeholder">
                        {t(
                          "Ready to try? “Check solution” runs your program against every case.",
                        )}
                      </p>
                    )}
                    {checks.map((c, i) => (
                      <details
                        className={
                          "check-result " + (c.passed ? "pass" : "fail")
                        }
                        key={i}
                      >
                        <summary>
                          {c.passed ? <Check size={15} /> : <X size={15} />}
                          {t("Case {n}", { n: i + 1 })}
                          <span>
                            {c.passed ? t("Passed") : t("Needs another look")}
                          </span>
                        </summary>
                        <div className="comparison">
                          <div>
                            <small>{t("INPUT")}</small>
                            <pre>{c.input || t("(none)")}</pre>
                          </div>
                          <div>
                            <small>{t("EXPECTED")}</small>
                            <pre>{c.expected || t("(empty)")}</pre>
                          </div>
                          <div>
                            <small>{t("YOUR OUTPUT")}</small>
                            <pre>{c.stdout || t("(empty)")}</pre>
                          </div>
                        </div>
                        {c.stderr && <pre>{c.stderr}</pre>}
                      </details>
                    ))}
                    {verified && (
                      <div className="completion-banner">
                        <CheckCheck size={18} />
                        <div>
                          <b>
                            {t(
                              exercise?.kind === "gold"
                                ? "Gold earned"
                                : "One more thing you can do.",
                            )}
                          </b>
                          <span>
                            {exercise?.kind === "core"
                              ? t(
                                  "Core challenge complete. Your progress is saved.",
                                )
                              : t(
                                  "Challenge complete. Your progress is saved.",
                                )}
                          </span>
                        </div>
                        {gold && (
                          <button onClick={() => go("workspace/" + gold.id)}>
                            {t("Try gold")}
                          </button>
                        )}
                        <button onClick={() => go(path)}>
                          {t("Back to path →")}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {busy ? (
                      <div className="running">
                        <LoaderCircle size={16} className="spin" />
                        {t(phase)}
                      </div>
                    ) : null}
                    {response?.error && (
                      <p className="error-text">{t(response.error)}</p>
                    )}
                    {response?.diagnostics && (
                      <pre className="diagnostics">{response.diagnostics}</pre>
                    )}
                    {response?.results.map((r, i) => (
                      <pre className="program-output" key={i}>
                        {r.stdout}
                        {r.stderr && (
                          <span className="error-text">{r.stderr}</span>
                        )}
                      </pre>
                    ))}
                    {!busy && !response && (
                      <div className="console-placeholder">
                        <span className="prompt-symbol">❯</span>
                        {t("Your next small win starts with Run.")}
                        <small>
                          {t(
                            "Ctrl / ⌘ + Enter to run · No installation needed",
                          )}
                        </small>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </section>
        </main>
      </div>
      <footer className="workspace-status">
        <span className={storageIssue ? "error-text" : "save-indicator"}>
          <span />
          {storageIssue
            ? t("Not saved to browser")
            : saved
              ? t("Saved in this browser")
              : t("Saving…")}
        </span>
        <span className="runtime-status">
          {busy ? t(phase) : t("C17 · WebAssembly · Local execution")}
        </span>
        <span>{t("Esc then Tab to leave editor")}</span>
      </footer>
      {reset && (
        <Modal
          title={t("Start this workspace again?")}
          onClose={() => setReset(false)}
        >
          <p>
            {t(
              "This replaces the current code and input with the starter. Your completed challenges stay completed.",
            )}
          </p>
          <div className="button-row">
            <button className="btn" onClick={() => setReset(false)}>
              {t("Keep my code")}
            </button>
            <button
              className="btn danger"
              onClick={() => {
                edited.current = true;
                stopProgram();
                setFiles({ ...starter });
                setInput(exercise?.tests[0]?.input || "");
                setFilename("main.c");
                setResponse(null);
                setChecks([]);
                setVerified(false);
                setReset(false);
              }}
            >
              {t("Reset workspace")}
            </button>
          </div>
        </Modal>
      )}
      {newFile && (
        <Modal title={t("Add a file")} onClose={() => setNewFile(false)}>
          <label htmlFor="new-file">{t("Filename")}</label>
          <input
            id="new-file"
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addFile();
            }}
          />
          <p className="small muted">
            {t(
              ".c files compile together. .h files hold declarations. .txt files become program data.",
            )}
          </p>
          {fileError && <p className="error-text">{t(fileError)}</p>}
          <button className="btn primary" onClick={addFile}>
            {t("Create file")}
          </button>
        </Modal>
      )}
    </div>
  );
}
