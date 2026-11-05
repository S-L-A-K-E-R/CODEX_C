import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Play,
  Square,
  CheckCheck,
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
import { Badge, Modal, go, External, download } from "../components/shared.tsx";
import { getExercise, getChapter, projects } from "../data/curriculum.ts";
import {
  readProgress,
  saveDraft,
  updateProgress,
  useProgress,
  useStorageIssue,
} from "../state/store.ts";
import { markComplete } from "../state/progress.ts";
import { runProgram, stopProgram } from "../runtime/client.ts";
import {
  matchesOutput,
  type RunResponse,
  type CheckResult,
} from "../runtime/types.ts";

export function Workspace({ id }: { id: string }) {
  const exercise = getExercise(id),
    chapter = getChapter(exercise?.chapter || id.replace("example:", ""));
  const project = projects.find((p) => id === "project:" + p.id);
  const progress = useProgress(),
    storageIssue = useStorageIssue();
  const title =
    exercise?.title ||
    project?.title ||
    (chapter ? chapter.title + " · example" : "Your C playground");
  const starter = exercise?.starter || {
    "main.c":
      project?.starter ||
      chapter?.example ||
      '#include <stdio.h>\n\nint main(void) {\n    printf("Make something small.\\n");\n    return 0;\n}\n',
  };
  const [files, setFiles] = useState<Record<string, string>>(() => ({
    ...(readProgress().drafts[id]?.files || starter),
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
  const locked = !!exercise?.base && !progress.completed[exercise.base];
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
        <LockKeyhole size={40} />
        <Badge kind="gold" />
        <h1>{title}</h1>
        <p>
          Complete <strong>{getExercise(exercise!.base!)?.title}</strong> to
          unlock this harder second part.
        </p>
        <button
          className="btn primary"
          onClick={() => go("workspace/" + exercise!.base)}
        >
          Open the original challenge
        </button>
        <button className="btn quiet" onClick={() => go("path")}>
          Back to learning path
        </button>
      </main>
    );
  return (
    <div className="workspace">
      <header className="workspace-header">
        <button
          className="icon-btn"
          aria-label="Back to learning path"
          onClick={() => go("path")}
        >
          <ArrowLeft size={20} />
        </button>
        <a className="workspace-brand" href="#path">
          CODEX <b>C</b>
        </a>
        <span className="header-divider" />
        <div className="workspace-title">
          <small>
            {chapter?.title || (project ? "PROJECT WORKSPACE" : "PLAYGROUND")}
          </small>
          <strong>{title}</strong>
        </div>
        {exercise && <Badge kind={exercise.kind} />}
        <div className="workspace-actions">
          <button
            className="btn icon-mobile"
            title="Run code (Ctrl or Command + Enter)"
            disabled={busy}
            onClick={() => void run()}
          >
            <Play size={16} />
            <span>Run code</span>
          </button>
          {busy ? (
            <button className="btn danger" onClick={stopProgram}>
              <Square size={15} />
              Stop
            </button>
          ) : exercise ? (
            <button className="btn primary" onClick={() => void run(true)}>
              <CheckCheck size={17} />
              <span>Check solution</span>
            </button>
          ) : null}
        </div>
      </header>
      <div className="workspace-body">
        <nav className="activity-bar" aria-label="Workspace panels">
          <button
            className={"icon-btn " + (panel ? "selected" : "")}
            aria-label={panel ? "Hide instructions" : "Show instructions"}
            aria-expanded={panel}
            onClick={() => setPanel(!panel)}
          >
            <BookOpen size={21} />
          </button>
          <button
            className="icon-btn"
            aria-label="Show hints"
            onClick={() => {
              setPanel(true);
              setBriefTab("hints");
            }}
          >
            <Lightbulb size={21} />
          </button>
          <button
            className="icon-btn"
            aria-label="Focus editor"
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
            aria-label="Show console"
            onClick={() => setConsoleOpen(!consoleOpen)}
          >
            <Terminal size={20} />
          </button>
        </nav>
        {panel && (
          <>
            <aside className="brief-panel" style={{ width }}>
              <div className="brief-tabs">
                {["brief", "lesson", "hints"].map((t) => (
                  <button
                    key={t}
                    className={briefTab === t ? "active" : ""}
                    onClick={() => setBriefTab(t)}
                  >
                    {t === "brief"
                      ? "Your challenge"
                      : t === "lesson"
                        ? "Quick lesson"
                        : "Hints"}
                  </button>
                ))}
                <button
                  className="icon-btn"
                  aria-label="Collapse instructions"
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
                        ? "THE GOAL"
                        : project
                          ? "PROJECT BRIEF"
                          : "ROOM TO EXPERIMENT"}
                    </div>
                    <h1>{title}</h1>
                    <p>
                      {exercise?.brief ||
                        project?.description ||
                        "Try an idea, run a small program, and see what happens. Your work stays in this browser."}
                    </p>
                    {exercise ? (
                      <>
                        <section>
                          <h3>What your program receives</h3>
                          <p>{exercise.input}</p>
                        </section>
                        <section>
                          <h3>What it should produce</h3>
                          <p>{exercise.output}</p>
                        </section>
                        <div className="example">
                          <div>EXAMPLE INPUT</div>
                          <pre>{exercise.tests[0].input || "(no input)"}</pre>
                          <div>EXPECTED OUTPUT</div>
                          <pre>{exercise.tests[0].output || "(no output)"}</pre>
                        </div>
                        {exercise.tests.length > 1 && (
                          <details>
                            <summary>
                              See all {exercise.tests.length} cases
                            </summary>
                            {exercise.tests.slice(1).map((t, i) => (
                              <div className="example" key={i}>
                                <div>{t.label} · INPUT</div>
                                <pre>{t.input || "(no input)"}</pre>
                                <div>OUTPUT</div>
                                <pre>{t.output || "(no output)"}</pre>
                              </div>
                            ))}
                          </details>
                        )}
                        <p className="small muted">
                          Print only the requested output. One final newline is
                          optional. Other spaces and letter case matter.
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
                        Add .c, .h, and .txt files with the + button. All .c
                        files are compiled together. Enter program input in the
                        console before running.
                      </p>
                    )}
                    {(exercise || chapter) && (
                      <External
                        href={exercise?.reference || chapter!.reference}
                      >
                        Related course material
                      </External>
                    )}
                  </>
                ) : briefTab === "lesson" ? (
                  <>
                    {chapter ? (
                      <>
                        <div className="eyebrow">KEEP THIS NEARBY</div>
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
                        <h3>A few essentials</h3>
                        <p>
                          Execution starts in main. Include stdio.h for printf
                          and scanf. A semicolon ends most statements. Try a
                          small change, then run again.
                        </p>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <div className="eyebrow">A NUDGE, WHEN YOU NEED IT</div>
                    <h2>You can work this out.</h2>
                    <p>
                      Reveal one hint at a time. Using a hint never costs
                      progress.
                    </p>
                    {(
                      exercise?.hints || [
                        "Break the problem into one small step.",
                        "Print intermediate values to understand what changes.",
                        "Check each boundary and each return value.",
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
                      {hintCount >= 3 ? "All hints revealed" : "Reveal a hint"}
                    </button>
                  </>
                )}
              </div>
            </aside>
            <div
              className="splitter vertical"
              role="separator"
              aria-label="Resize instructions"
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
        <main className="editor-pane" aria-label="Coding workspace">
          <div className="file-tabs">
            {!panel && (
              <button
                className="icon-btn"
                aria-label="Show instructions"
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
              aria-label="Add file"
              onClick={() => setNewFile(true)}
            >
              <Plus size={16} />
            </button>
            <div className="file-tools">
              <button
                className="icon-btn"
                aria-label="Download current file"
                onClick={() =>
                  download(filename, files[filename], "text/plain")
                }
              >
                <Download size={16} />
              </button>
              <button
                className="icon-btn"
                aria-label="Reset this workspace"
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
            aria-label="Resize console"
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
            aria-label="Program output and input"
          >
            <div className="console-tabs">
              {[
                "output",
                "input",
                ...(exercise ? ["checks"] : []),
                "files",
              ].map((t) => (
                <button
                  key={t}
                  className={outputTab === t ? "active" : ""}
                  onClick={() => {
                    setOutputTab(t);
                    setConsoleOpen(true);
                  }}
                >
                  {t === "output" ? (
                    <Terminal size={14} />
                  ) : t === "files" ? (
                    <Files size={14} />
                  ) : null}
                  {t === "input"
                    ? "Input (stdin)"
                    : t === "checks"
                      ? "Test results"
                      : t === "files"
                        ? "Generated files"
                        : "Console"}
                  {t === "checks" && checks.length > 0 && (
                    <b>
                      {checks.filter((c) => c.passed).length}/{checks.length}
                    </b>
                  )}
                </button>
              ))}
              <button
                className="icon-btn"
                aria-label={consoleOpen ? "Collapse console" : "Expand console"}
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
                      Provide all input before running. Whitespace separates
                      numbers; newlines separate lines.
                    </label>
                    <textarea
                      id="stdin"
                      spellCheck={false}
                      value={input}
                      onChange={(e) => {
                        edited.current = true;
                        setInput(e.target.value.slice(0, 50000));
                      }}
                      placeholder="Type the input for your program here…"
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
                              Download
                            </button>
                          </summary>
                          <pre>{text}</pre>
                        </details>
                      ))
                    ) : (
                      <p className="console-placeholder">
                        Files written by your program will appear here after it
                        finishes. Each run starts fresh.
                      </p>
                    )}
                  </>
                ) : outputTab === "checks" ? (
                  <>
                    {busy ? (
                      <div className="running">
                        <LoaderCircle size={16} className="spin" />
                        {phase}
                      </div>
                    ) : null}
                    {response?.error && (
                      <p className="error-text">{response.error}</p>
                    )}
                    {response?.diagnostics && (
                      <pre className="diagnostics">{response.diagnostics}</pre>
                    )}
                    {!busy && !checks.length && (
                      <p className="console-placeholder">
                        Ready to try? “Check solution” runs your program against
                        every case.
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
                          {c.passed ? <Check size={15} /> : <X size={15} />}Case{" "}
                          {i + 1}
                          <span>
                            {c.passed ? "Passed" : "Needs another look"}
                          </span>
                        </summary>
                        <div className="comparison">
                          <div>
                            <small>INPUT</small>
                            <pre>{c.input || "(none)"}</pre>
                          </div>
                          <div>
                            <small>EXPECTED</small>
                            <pre>{c.expected || "(empty)"}</pre>
                          </div>
                          <div>
                            <small>YOUR OUTPUT</small>
                            <pre>{c.stdout || "(empty)"}</pre>
                          </div>
                        </div>
                        {c.stderr && <pre>{c.stderr}</pre>}
                      </details>
                    ))}
                    {verified && (
                      <div className="completion-banner">
                        <CheckCheck size={18} />
                        <div>
                          <b>One more thing you can do.</b>
                          <span>
                            {exercise?.kind === "core"
                              ? "Core challenge complete. Your progress is saved."
                              : "Challenge complete. Your progress is saved."}
                          </span>
                        </div>
                        <button onClick={() => go("path")}>
                          Back to path →
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {busy ? (
                      <div className="running">
                        <LoaderCircle size={16} className="spin" />
                        {phase}
                      </div>
                    ) : null}
                    {response?.error && (
                      <p className="error-text">{response.error}</p>
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
                        <span className="prompt-symbol">❯</span>Your next small
                        win starts with Run.
                        <small>
                          Ctrl / ⌘ + Enter to run · No installation needed
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
            ? "Not saved to browser"
            : saved
              ? "Saved in this browser"
              : "Saving…"}
        </span>
        <span className="runtime-status">
          {busy ? phase : "C17 · WebAssembly · Local execution"}
        </span>
        <span>Esc then Tab to leave editor</span>
      </footer>
      {reset && (
        <Modal
          title="Start this workspace again?"
          onClose={() => setReset(false)}
        >
          <p>
            This replaces the current code and input with the starter. Your
            completed challenges stay completed.
          </p>
          <div className="button-row">
            <button className="btn" onClick={() => setReset(false)}>
              Keep my code
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
              Reset workspace
            </button>
          </div>
        </Modal>
      )}
      {newFile && (
        <Modal title="Add a file" onClose={() => setNewFile(false)}>
          <label htmlFor="new-file">Filename</label>
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
            .c files compile together. .h files hold declarations. .txt files
            become program data.
          </p>
          {fileError && <p className="error-text">{fileError}</p>}
          <button className="btn primary" onClick={addFile}>
            Create file
          </button>
        </Modal>
      )}
    </div>
  );
}
