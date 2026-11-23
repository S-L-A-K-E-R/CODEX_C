import { useId, useState, type ReactNode } from "react";
import { ArrowRight, ChevronLeft, RotateCcw, StepForward } from "lucide-react";
import { useLanguage } from "../i18n/Language.tsx";
import "./InteractiveLesson.css";

type Pair = [string, string];
type Spec = {
  title: Pair;
  summary: Pair;
  label: Pair;
  min: number;
  max: number;
  initial: number;
};
type Scene = {
  lines: string[];
  focus: number;
  visual: ReactNode;
  observation: Pair;
};
const specs: Record<string, Spec> = {
  "first-programs": {
    title: ["Follow the input", "Suivre une saisie"],
    summary: ["Move from input to a variable, then to printed output.", "Suis la saisie, la variable, puis l'affichage."],
    label: ["Input age", "Âge saisi"], min: 0, max: 100, initial: 18,
  },
  variables: {
    title: ["Split a duration", "Découper une durée"],
    summary: ["Slide the seconds and watch division and remainder change.", "Déplace le curseur pour observer le quotient et le reste."],
    label: ["Seconds", "Secondes"], min: 0, max: 600, initial: 125,
  },
  decisions: {
    title: ["Which branch runs?", "Quelle branche s'exécute ?"],
    summary: ["Test a score around the threshold, including exactly 10.", "Teste les scores autour du seuil, y compris 10."],
    label: ["Score", "Note"], min: 0, max: 20, initial: 9,
  },
  loops: {
    title: ["Watch the accumulator", "Observer l'accumulateur"],
    summary: ["Execute the loop one iteration at a time.", "Exécute la boucle, itération par itération."],
    label: ["Number of iterations", "Nombre d'itérations"], min: 1, max: 8, initial: 5,
  },
  arrays: {
    title: ["Explore an array", "Explorer un tableau"],
    summary: ["Choose a cell, edit it, then step through the sum of the array.", "Sélectionne une case, modifie-la et parcours le tableau pour calculer sa somme."],
    label: ["Array length", "Taille du tableau"], min: 3, max: 8, initial: 5,
  },
  functions: {
    title: ["Into a function", "Entrer dans une fonction"],
    summary: ["Trace a parameter, the return value and the caller.", "Suis le paramètre, le retour et le programme appelant."],
    label: ["Argument", "Argument"], min: 0, max: 12, initial: 6,
  },
  pointers: {
    title: ["Follow an address", "Suivre une adresse"],
    summary: ["Redirect a pointer and see which variable changes.", "Redirige un pointeur et observe quelle variable change."],
    label: ["Value of a", "Valeur de a"], min: 0, max: 50, initial: 10,
  },
  strings: {
    title: ["See the terminator", "Voir le caractère final"],
    summary: ["Walk through a char array until the null terminator.", "Parcours les caractères jusqu'au zéro final."],
    label: ["Text length", "Longueur du texte"], min: 1, max: 7, initial: 5,
  },
  structures: {
    title: ["Inspect a record", "Inspecter un enregistrement"],
    summary: ["Switch records and update one field without touching the others.", "Change de fiche et modifie un champ sans toucher aux autres."],
    label: ["New grade", "Nouvelle note"], min: 0, max: 20, initial: 16,
  },
  "dynamic-memory": {
    title: ["A block's lifetime", "La durée de vie d'un bloc"],
    summary: ["Allocate, use and free simulated heap memory.", "Alloue, utilise et libère une mémoire simulée."],
    label: ["Number of integers", "Nombre d'entiers"], min: 1, max: 8, initial: 4,
  },
  modular: {
    title: ["From header to result", "Du fichier .h au résultat"],
    summary: ["Trace a declaration, its implementation and a call.", "Suis une déclaration, sa définition et son appel."],
    label: ["Function argument", "Argument de la fonction"], min: 0, max: 20, initial: 7,
  },
  randomness: {
    title: ["A repeatable sequence", "Une suite reproductible"],
    summary: ["Change the seed of a small teaching generator.", "Change la graine d'un petit générateur pédagogique."],
    label: ["Seed", "Graine"], min: 1, max: 96, initial: 12,
  },
  files: {
    title: ["Follow a file operation", "Suivre une opération fichier"],
    summary: ["Watch a value go to a file and come back.", "Observe une valeur écrite dans un fichier puis relue."],
    label: ["Value to save", "Valeur à sauvegarder"], min: 0, max: 99, initial: 42,
  },
  recursion: {
    title: ["The call stack grows", "La pile d'appels grandit"],
    summary: ["Descend into factorial calls, then unwind them.", "Descends dans les appels de factorielle, puis remonte."],
    label: ["Factorial of", "Factorielle de"], min: 1, max: 6, initial: 4,
  },
  "data-structures": {
    title: ["Stack or queue?", "Pile ou file ?"],
    summary: ["Insert one element and compare which one leaves first.", "Ajoute un élément et compare lequel sort en premier."],
    label: ["New element", "Nouvel élément"], min: 0, max: 20, initial: 12,
  },
};
const defaultArray = [4, 7, 2, 9, 5, 1, 8, 3];

function Tile({
  label, value, active = false, faded = false, onClick,
}: {
  label: string; value: string | number; active?: boolean; faded?: boolean; onClick?: () => void;
}) {
  const body = <><small>{label}</small><strong>{value}</strong></>;
  const cls = "il-tile" + (active ? " is-active" : "") + (faded ? " is-faded" : "");
  return onClick
    ? <button type="button" className={cls} onClick={onClick} aria-pressed={active}>{body}</button>
    : <div className={cls}>{body}</div>;
}

const keyword = /^(?:int|char|void|double|unsigned|return|if|else|for|while|NULL|FILE|sizeof|struct|typedef)$/;
const numeric = /^\d+(?:u)?$/;
function colorize(line: string) {
  const pieces = line.split(/(\/\/.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:int|char|void|double|unsigned|return|if|else|for|while|NULL|FILE|sizeof|struct|typedef)\b|\b\d+u?\b)/g);
  return pieces.map((part, i) => {
    const cls = part.startsWith("//") ? "il-comment"
      : part.startsWith('"') || part.startsWith("'") ? "il-string"
      : keyword.test(part) ? "il-keyword"
      : numeric.test(part) ? "il-number" : "";
    return <span key={i} className={cls}>{part}</span>;
  });
}

function stepLimit(id: string, n: number) {
  if (id === "loops" || id === "arrays" || id === "strings") return n;
  if (id === "recursion") return n * 2;
  if (id === "dynamic-memory" || id === "files" || id === "randomness") return id === "randomness" ? 5 : 4;
  if (id === "functions" || id === "modular" || id === "data-structures") return 3;
  return 2;
}
function factorial(n: number): number {
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}
function randomItems(seed: number, count: number): number[] {
  let state = seed;
  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    state = (state * 17 + 43) % 97;
    result.push(state);
  }
  return result;
}

function buildScene(
  id: string, n: number, step: number, selected: number, values: number[], alternate: boolean,
  selectCell: (index: number) => void,
): Scene {
  const tiles = (items: Array<string | number>, active: number, prefix: string) => (
    <div className="il-tiles">{items.map((item, i) => <Tile key={i} label={prefix + i} value={item} active={active === i} />)}</div>
  );
  switch (id) {
    case "first-programs":
      return {
        lines: ["int age;", "scanf(\"%d\", &age);  // input: " + n, "printf(\"Age: %d\\n\", age);"],
        focus: step,
        visual: <div className="il-flow">
          <Tile label="stdin" value={n} active={step === 0} />
          <ArrowRight aria-hidden="true" />
          <Tile label="age" value={step >= 1 ? n : "?"} active={step === 1} />
          <ArrowRight aria-hidden="true" />
          <Tile label="stdout" value={step >= 2 ? "Age: " + n : "…"} active={step === 2} />
        </div>,
        observation: ["scanf writes to age; printf reads it.", "scanf écrit dans age ; printf lit cette variable."],
      };
    case "variables":
      return {
        lines: ["int seconds = " + n + ";", "int minutes = seconds / 60;", "int left = seconds % 60;", "printf(\"%d:%02d\", minutes, left);"],
        focus: Math.min(step, 3),
        visual: <><div className="il-flow">
          <Tile label="seconds" value={n} active={step === 0} />
          <ArrowRight aria-hidden="true" />
          <Tile label="seconds / 60" value={step >= 1 ? Math.floor(n / 60) : "?"} active={step === 1} />
          <Tile label="seconds % 60" value={step >= 2 ? n % 60 : "?"} active={step >= 2} />
        </div><div className="il-bar" aria-hidden="true"><span style={{ width: (n % 60 / 60 * 100) + "%" }} /></div></>,
        observation: ["The bar shows the remainder of the current minute.", "La barre représente les secondes restantes dans la minute."],
      };
    case "decisions": {
      const passed = n >= 10;
      return {
        lines: ["int score = " + n + ";", "if (score >= 10) {", "    printf(\"Pass\\n\");", "} else {", "    printf(\"Try again\\n\");", "}"],
        focus: step === 0 ? 0 : step === 1 ? 1 : passed ? 2 : 4,
        visual: <><div className="il-flow"><Tile label="score" value={n} active />
          <ArrowRight aria-hidden="true" /><Tile label="score >= 10" value={passed ? "true" : "false"} active={step >= 1} /></div>
          <div className="il-branches"><div className={step === 2 && passed ? "picked" : ""}>✓ Pass</div><div className={step === 2 && !passed ? "picked" : ""}>↩ Try again</div></div></>,
        observation: ["A comparison at the exact threshold is true.", "Au seuil exact, la comparaison est vraie."],
      };
    }
    case "loops":
      return {
        lines: ["int sum = 0;", "for (int i = 1; i <= " + n + "; i++) {", "    sum += i;", "}"],
        focus: step === 0 ? 0 : 2,
        visual: <>{tiles(Array.from({ length: n }, (_, i) => i + 1), step - 1, "i=")}
          <div className="il-progress"><span style={{ width: (step / n * 100) + "%" }} /></div>
          <div className="il-kpis"><Tile label="iterations" value={step} /><Tile label="sum" value={step * (step + 1) / 2} active /></div></>,
        observation: ["Each iteration adds the current i to sum.", "Chaque itération ajoute i à sum."],
      };
    case "arrays": {
      const data = values.slice(0, n);
      const idx = Math.min(selected, n - 1);
      const total = data.slice(0, step).reduce((a, b) => a + b, 0);
      return {
        lines: ["int numbers[" + n + "] = {" + data.join(", ") + "};", "int total = 0;", "for (int i = 0; i < " + n + "; i++) {", "    total += numbers[i];", "}", "int picked = numbers[" + idx + "];  // " + data[idx]],
        focus: step === 0 ? 0 : step === n ? 4 : 3,
        visual: <><div className="il-tiles il-array">
          {data.map((value, i) => <Tile key={i} label={"[" + i + "]"} value={value}
            active={i === idx} faded={i >= step && step > 0} onClick={() => selectCell(i)} />)}
        </div><div className="il-kpis"><Tile label="numbers[index]" value={data[idx]} active />
          <Tile label="i" value={step === n ? "end" : step} /><Tile label="total" value={total} /></div></>,
        observation: ["Indices start at 0. Click any cell to inspect or edit it; stepping traverses left to right.", "Les indices commencent à 0. Clique sur une case pour l'inspecter ou la modifier. Le parcours va de gauche à droite."],
      };
    }
    case "functions":
      return {
        lines: ["int square(int x) {", "    return x * x;", "}", "int result = square(" + n + ");", "printf(\"%d\", result);"],
        focus: [3, 0, 1, 4][step],
        visual: <div className="il-flow"><Tile label="main: argument" value={n} active={step === 0} />
          <ArrowRight aria-hidden="true" /><Tile label="square: x" value={step >= 1 ? n : "?"} active={step === 1 || step === 2} />
          <ArrowRight aria-hidden="true" /><Tile label="result" value={step >= 3 ? n * n : "?"} active={step === 3} /></div>,
        observation: ["The parameter x is local to square; the return value goes back to main.", "Le paramètre x est local à square ; la valeur retournée revient dans main."],
      };
    case "pointers": {
      const target = alternate ? "b" : "a";
      const a = n + (step === 2 && !alternate ? 5 : 0);
      const b = 25 + (step === 2 && alternate ? 5 : 0);
      return {
        lines: ["int a = " + n + ", b = 25;", "int *p = &" + target + ";", "*p += 5;  // change " + target],
        focus: step,
        visual: <><div className="il-flow"><Tile label="p points to" value={"&" + target} active />
          <ArrowRight aria-hidden="true" />
          <Tile label="a · symbolic &a" value={a} active={!alternate} />
          <Tile label="b · symbolic &b" value={b} active={alternate} /></div></>,
        observation: ["The address is symbolic: this is an aliasing model, not actual browser memory.", "L'adresse est symbolique : c'est un modèle de pointeur, pas la mémoire réelle du navigateur."],
      };
    }
    case "strings": {
      const str = "CODEX C".slice(0, n);
      const chars = [...str, "\\0"];
      return {
        lines: ["char word[] = \"" + str + "\";", "int i = 0;", "while (word[i] != '\\0') {", "    i++;", "}", "// length = " + n],
        focus: step === 0 ? 0 : step === n ? 2 : 3,
        visual: <><div className="il-tiles il-string-cells">{chars.map((c, i) =>
          <Tile key={i} label={"[" + i + "]"} value={c === " " ? "␣" : c} active={i === step} />)}</div>
          <div className="il-kpis"><Tile label="i" value={step} active /><Tile label="characters counted" value={step} /></div></>,
        observation: ["The last cell contains \\0, not a printable letter. It marks the end.", "La dernière case contient \\0, pas une lettre imprimable. Elle marque la fin."],
      };
    }
    case "structures": {
      const name = alternate ? "Bob" : "Ada";
      return {
        lines: ["typedef struct { char name[16]; int grade; } Student;", "Student s = {\"" + name + "\", 10};", "s.grade = " + n + ";", "printf(\"%s: %d\", s.name, s.grade);"],
        focus: step === 0 ? 1 : step === 1 ? 2 : 3,
        visual: <div className="il-record"><div className="il-record-header">Student s</div>
          <Tile label="s.name" value={name} /><Tile label="s.grade" value={step >= 1 ? n : 10} active={step >= 1} /></div>,
        observation: ["A struct groups fields; updating s.grade does not change s.name.", "Une structure regroupe des champs ; modifier s.grade ne change pas s.name."],
      };
    }
    case "dynamic-memory":
      return {
        lines: ["int *items = malloc(" + n + " * sizeof *items);", "if (items == NULL) return 1;", "items[0] = 7;", "free(items);", "items = NULL;"],
        focus: step === 0 ? 0 : step === 1 ? 1 : step === 2 ? 2 : step === 3 ? 3 : 4,
        visual: <><div className="il-tiles">{Array.from({ length: n }, (_, i) =>
          <Tile key={i} label={"heap[" + i + "]"} value={step === 0 ? "—" : step >= 3 ? "×" : i === 0 && step >= 2 ? 7 : "?"}
            active={step >= 1 && step < 3 && i === 0} faded={step === 0 || step >= 3} />)}</div>
          <div className="il-kpis"><Tile label="pointer" value={step === 0 ? "not set" : step === 4 ? "NULL" : step === 3 ? "dangling" : "allocated"} active={step === 4} /></div></>,
        observation: ["Illustration only: malloc can fail; after free, the pointer must not be dereferenced.", "Schéma uniquement : malloc peut échouer ; après free, le pointeur ne doit plus être déréférencé."],
      };
    case "modular":
      return {
        lines: ["// math.h", "int twice(int x);", "// math.c", "int twice(int x) { return x * 2; }", "// main.c", "printf(\"%d\", twice(" + n + "));"],
        focus: [1, 3, 5, 5][step],
        visual: <div className="il-files"><Tile label="math.h" value="declaration" active={step === 0} />
          <ArrowRight aria-hidden="true" /><Tile label="math.c" value="definition" active={step === 1} />
          <ArrowRight aria-hidden="true" /><Tile label="main.c" value={step >= 3 ? n * 2 : "call"} active={step >= 2} /></div>,
        observation: ["The header declares; one source file defines; the linker combines compiled units.", "Le .h déclare, un .c définit et l'éditeur de liens rassemble les unités compilées."],
      };
    case "randomness": {
      const seq = randomItems(n, step);
      return {
        lines: ["unsigned state = " + n + "u;", "for (int i = 0; i < 5; i++) {", "    state = (state * 17u + 43u) % 97u;", "    printf(\"%u \", state);", "}"],
        focus: step === 0 ? 0 : 2,
        visual: <>{tiles(seq, seq.length - 1, "#")}
          <div className="il-kpis"><Tile label="seed" value={n} /><Tile label="values generated" value={step} active /></div></>,
        observation: ["This is a tiny deterministic teaching generator, NOT the library rand() sequence.", "C'est un petit générateur pédagogique déterministe, PAS la suite de rand() de la bibliothèque."],
      };
    }
    case "files":
      return {
        lines: ["FILE *f = fopen(\"score.txt\", \"w\");", "if (f != NULL) fprintf(f, \"%d\\n\", " + n + ");", "if (f != NULL) fclose(f);", "f = fopen(\"score.txt\", \"r\");", "if (f != NULL) { /* read, then fclose */ }"],
        focus: step,
        visual: <div className="il-flow"><Tile label="program" value={n} active={step === 0} />
          <ArrowRight aria-hidden="true" /><Tile label="score.txt" value={step >= 1 ? n : "empty"} active={step >= 1 && step < 4} />
          <ArrowRight aria-hidden="true" /><Tile label="read back" value={step === 4 ? n : "…"} active={step === 4} /></div>,
        observation: ["A file remains after a successful close; real C must check every open/read/write.", "Un fichier persiste après sa fermeture ; en C, il faut vérifier les ouvertures, lectures et écritures."],
      };
    case "recursion": {
      const descending = Math.min(step, n);
      const returned = Math.max(0, step - n);
      const stack = Array.from({ length: descending - returned }, (_, i) => n - i);
      return {
        lines: ["int factorial(int n) {", "    if (n <= 1) return 1;", "    return n * factorial(n - 1);", "}", "int answer = factorial(" + n + ");"],
        focus: step === 0 ? 4 : step < n ? 2 : step === n ? 1 : 2,
        visual: <><div className="il-stack">{stack.map((call, i) =>
          <Tile key={i} label={"call " + (i + 1)} value={"f(" + call + ")"} active={i === stack.length - 1} />)}</div>
          <div className="il-kpis"><Tile label="call depth" value={stack.length} />
            <Tile label="returns completed" value={returned} active={step > n} />
            <Tile label="final answer" value={step === n * 2 ? factorial(n) : "…"} /></div></>,
        observation: ["Each call has its own n. The base case stops growth; returns unwind the stack.", "Chaque appel possède son n. Le cas de base arrête la descente, puis les retours dépilent les appels."],
      };
    }
    case "data-structures": {
      const data = step >= 1 && step < 3 ? [3, 8, n] : [3, 8];
      const queue = alternate;
      return {
        lines: queue
          ? ["int queue[3] = {3, 8};", "queue[2] = " + n + ";  // enqueue", "int front = queue[0];  // peek", "// dequeue removes 3"]
          : ["int stack[3] = {3, 8};", "stack[2] = " + n + ";  // push", "int top = stack[2];  // peek", "// pop removes " + n],
        focus: step,
        visual: <>{tiles(data, queue ? 0 : data.length - 1, queue ? "front+" : "index ")}
          <div className="il-kpis"><Tile label={queue ? "front" : "top"} value={step === 3 ? (queue ? 8 : 8) : queue ? 3 : data[data.length - 1]} active />
            <Tile label="removed" value={step === 3 ? (queue ? 3 : n) : "—"} /></div></>,
        observation: ["LIFO: a stack removes the newest element. FIFO: a queue removes the oldest.", "LIFO : la pile retire le dernier arrivé. FIFO : la file retire le premier arrivé."],
      };
    }
    default:
      return { lines: [], focus: 0, visual: null, observation: ["", ""] };
  }
}

export function InteractiveLesson({ chapterId }: { chapterId: string }) {
  const { language } = useLanguage();
  const spec = specs[chapterId];
  const sliderId = useId();
  const cellId = useId();
  const [n, setN] = useState(spec?.initial ?? 1);
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(0);
  const [values, setValues] = useState(defaultArray);
  const [alternate, setAlternate] = useState(false);
  if (!spec) return null;
  const tr = (pair: Pair) => pair[language === "fr" ? 1 : 0];
  const limit = stepLimit(chapterId, n);
  const scene = buildScene(chapterId, n, step, selected, values, alternate, setSelected);
  const secondary = chapterId === "pointers" || chapterId === "structures" || chapterId === "data-structures";
  function reset() {
    setStep(0);
    setN(spec.initial);
    setSelected(0);
    setValues(defaultArray);
    setAlternate(false);
  }
  return <section className="interactive-lesson" aria-label={tr(["Interactive C illustration", "Illustration C interactive"])}>
    <div className="il-heading">
      <div><div className="eyebrow">{tr(["INTERACTIVE CONCEPT LAB", "LABORATOIRE INTERACTIF"])}</div>
        <h2>{tr(spec.title)}</h2><p>{tr(spec.summary)}</p></div>
      <span className="il-step-count">{step}/{limit}</span>
    </div>
    <div className="il-controls">
      <label htmlFor={sliderId}>{tr(spec.label)} <strong>{n}</strong></label>
      <input id={sliderId} type="range" min={spec.min} max={spec.max} value={n}
        onChange={e => { setN(Number(e.target.value)); setStep(0); setSelected(0); }} />
      {chapterId === "arrays" && <div className="il-edit">
        <label htmlFor={cellId}>{tr(["Selected cell [" + Math.min(selected, n - 1) + "]", "Case sélectionnée [" + Math.min(selected, n - 1) + "]"])} <strong>{values[Math.min(selected, n - 1)]}</strong></label>
        <input id={cellId} type="range" min={0} max={20} value={values[Math.min(selected, n - 1)]}
          onChange={e => { const copy = [...values]; copy[Math.min(selected, n - 1)] = Number(e.target.value); setValues(copy); setStep(0); }} />
      </div>}
      {secondary && <div className="il-modes" role="group" aria-label={tr(["Experiment mode", "Mode de l'expérience"])}>
        <button type="button" aria-pressed={!alternate} className={!alternate ? "on" : ""}
          onClick={() => { setAlternate(false); setStep(0); }}>
          {chapterId === "pointers" ? "p → a" : chapterId === "structures" ? "Ada" : "Stack / Pile"}
        </button>
        <button type="button" aria-pressed={alternate} className={alternate ? "on" : ""}
          onClick={() => { setAlternate(true); setStep(0); }}>
          {chapterId === "pointers" ? "p → b" : chapterId === "structures" ? "Bob" : "Queue / File"}
        </button>
      </div>}
    </div>
    <div className="il-stage">
      <div className="il-visual"><div className="il-panel-label">{tr(["LIVE MODEL", "MODÈLE DYNAMIQUE"])}</div>
        {scene.visual}
        <p className="il-observation">{tr(scene.observation)}</p>
      </div>
      <div className="il-code"><div className="il-panel-label">{tr(["C CODE · HIGHLIGHTED STEP", "CODE C · ÉTAPE SURLIGNÉE"])}</div>
        <pre aria-label={tr(["Illustrated C source code", "Code C illustré"])}><code>
          {scene.lines.map((line, i) => <span className={"il-code-line" + (i === scene.focus ? " current" : "")} key={i}>
            <span className="il-line-number" aria-hidden="true">{i + 1}</span><span>{colorize(line)}</span>
          </span>)}
        </code></pre></div>
    </div>
    <div className="il-footer">
      <div className="il-actions">
        <button type="button" className="btn quiet" disabled={step === 0} onClick={() => setStep(s => Math.max(0, s - 1))}>
          <ChevronLeft size={15} /> {tr(["Previous", "Précédent"])}
        </button>
        <button type="button" className="btn dark" disabled={step === limit} onClick={() => setStep(s => Math.min(limit, s + 1))}>
          <StepForward size={15} /> {tr(["Next step", "Étape suivante"])}
        </button>
        <button type="button" className="btn quiet" onClick={reset}>
          <RotateCcw size={15} /> {tr(["Reset", "Réinitialiser"])}
        </button>
      </div>
      <p>{tr(["A teaching model, not an execution trace of your program. Use the editable example below to run real C.", "Un modèle pédagogique, pas une trace d'exécution de ton programme. Exécute du vrai C dans l'exemple modifiable ci-dessous."])}</p>
    </div>
  </section>;
}

export const interactiveChapterIds = Object.keys(specs);
