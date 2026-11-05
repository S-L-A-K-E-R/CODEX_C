import { useEffect, useRef } from "react";
import { Compartment, EditorState } from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLineGutter,
  highlightActiveLine,
  drawSelection,
  highlightSpecialChars,
  rectangularSelection,
} from "@codemirror/view";
import { cpp } from "@codemirror/lang-cpp";
import {
  bracketMatching,
  indentOnInput,
  foldGutter,
  foldKeymap,
  syntaxHighlighting,
  HighlightStyle,
} from "@codemirror/language";
import { tags } from "@lezer/highlight";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import {
  closeBrackets,
  closeBracketsKeymap,
  autocompletion,
  completionKeymap,
  snippetCompletion,
} from "@codemirror/autocomplete";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { lintGutter, setDiagnostics, type Diagnostic } from "@codemirror/lint";

const highlight = HighlightStyle.define([
  { tag: tags.keyword, color: "#c5a0ee" },
  { tag: tags.typeName, color: "#ebc27d" },
  { tag: tags.string, color: "#b8d58b" },
  { tag: tags.number, color: "#efa878" },
  { tag: tags.comment, color: "#8b989a", fontStyle: "italic" },
  { tag: tags.meta, color: "#86c4d2" },
  { tag: tags.function(tags.variableName), color: "#8acbdc" },
  { tag: tags.operator, color: "#d3dadb" },
]);
const theme = EditorView.theme(
  {
    "&": { height: "100%", backgroundColor: "#151c20", color: "#dce2e1" },
    ".cm-scroller": {
      overflow: "auto",
      fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
      lineHeight: "1.8",
    },
    ".cm-content": { padding: "22px 0", caretColor: "#b9f46a" },
    ".cm-line": { padding: "0 20px" },
    ".cm-gutters": {
      backgroundColor: "#151c20",
      color: "#657378",
      border: "none",
      paddingLeft: "8px",
    },
    ".cm-activeLineGutter, .cm-activeLine": { backgroundColor: "#202b2d" },
    ".cm-cursor": { borderLeftColor: "#b9f46a" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection":
      { backgroundColor: "#3e5354 !important" },
    ".cm-panels": { backgroundColor: "#20292e", color: "#dce2e1" },
    ".cm-tooltip": {
      backgroundColor: "#263238",
      border: "1px solid #52636b",
      color: "#e5eded",
    },
    ".cm-matchingBracket": {
      backgroundColor: "#3c5138",
      outline: "1px solid #769e5d",
    },
    ".cm-searchMatch": { backgroundColor: "#796224" },
    ".cm-tooltip-autocomplete > ul > li[aria-selected]": {
      backgroundColor: "#3e5541",
      color: "#eff8e5",
    },
  },
  { dark: true },
);

const completions = [
  ...[
    "int",
    "double",
    "char",
    "float",
    "long",
    "short",
    "unsigned",
    "void",
    "const",
    "return",
    "break",
    "continue",
    "typedef",
    "struct",
    "sizeof",
    "NULL",
  ].map((label) => ({ label, type: "keyword" })),
  snippetCompletion('printf("${text}\\n"${});', {
    label: "printf",
    detail: "formatted output",
    type: "function",
  }),
  snippetCompletion("if (${condition}) {\n    ${}\n}", {
    label: "if",
    type: "keyword",
  }),
  snippetCompletion("for (int ${i} = 0; ${i} < ${n}; ${i}++) {\n    ${}\n}", {
    label: "for",
    type: "keyword",
  }),
  snippetCompletion("while (${condition}) {\n    ${}\n}", {
    label: "while",
    type: "keyword",
  }),
];
export function compilerDiagnostics(
  text: string,
  filename: string,
  doc: EditorState["doc"],
): Diagnostic[] {
  const result: Diagnostic[] = [];
  for (const line of text.split("\n")) {
    const match = line.match(
      /^\/?([^:]+):(\d+):(\d+):\s+(warning|error|fatal error):\s+(.+)$/,
    );
    if (!match || match[1] !== filename) continue;
    const row = Number(match[2]);
    if (row < 1 || row > doc.lines) continue;
    const at = doc.line(row),
      from = Math.min(at.to, at.from + Number(match[3]) - 1);
    result.push({
      from,
      to: Math.min(at.to, from + 1),
      severity: match[4] === "warning" ? "warning" : "error",
      message: match[5],
    });
  }
  return result;
}
export function CodeEditor({
  value,
  filename,
  onChange,
  fontSize,
  diagnostics,
  onRun,
}: {
  value: string;
  filename: string;
  onChange: (value: string) => void;
  fontSize: number;
  diagnostics: string;
  onRun: () => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    view = useRef<EditorView | null>(null),
    callback = useRef(onChange),
    run = useRef(onRun);
  const size = useRef(new Compartment());
  callback.current = onChange;
  run.current = onRun;
  useEffect(() => {
    if (!host.current) return;
    const editor = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          theme,
          syntaxHighlighting(highlight),
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightActiveLine(),
          highlightSpecialChars(),
          drawSelection(),
          rectangularSelection(),
          history(),
          foldGutter(),
          indentOnInput(),
          bracketMatching(),
          closeBrackets(),
          cpp(),
          highlightSelectionMatches(),
          lintGutter(),
          autocompletion({
            override: [
              (context) => {
                const word = context.matchBefore(/\w*/);
                if (!word || (word.from === word.to && !context.explicit))
                  return null;
                return { from: word.from, options: completions };
              },
            ],
          }),
          keymap.of([
            {
              key: "Mod-Enter",
              run: () => {
                run.current();
                return true;
              },
            },
            ...closeBracketsKeymap,
            ...completionKeymap,
            ...defaultKeymap,
            ...historyKeymap,
            ...foldKeymap,
            ...searchKeymap,
            indentWithTab,
          ]),
          size.current.of(
            EditorView.theme({ "&": { fontSize: fontSize + "px" } }),
          ),
          EditorView.contentAttributes.of({
            "aria-label": `C code editor: ${filename}`,
            spellcheck: "false",
          }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged)
              callback.current(update.state.doc.toString());
          }),
        ],
      }),
    });
    view.current = editor;
    return () => {
      editor.destroy();
      view.current = null;
    };
  }, [filename]);
  useEffect(() => {
    const editor = view.current;
    if (editor && editor.state.doc.toString() !== value)
      editor.dispatch({
        changes: { from: 0, to: editor.state.doc.length, insert: value },
      });
  }, [value]);
  useEffect(() => {
    view.current?.dispatch({
      effects: size.current.reconfigure(
        EditorView.theme({ "&": { fontSize: fontSize + "px" } }),
      ),
    });
  }, [fontSize]);
  useEffect(() => {
    const editor = view.current;
    if (editor)
      editor.dispatch(
        setDiagnostics(
          editor.state,
          compilerDiagnostics(diagnostics, filename, editor.state.doc),
        ),
      );
  }, [diagnostics, filename]);
  return <div className="code-editor" ref={host} />;
}
