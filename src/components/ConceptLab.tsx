import { useState } from "react";
import { ArrowRight, RotateCcw, StepForward } from "lucide-react";
export function ConceptLab({ kind }: { kind: string }) {
  const [value, setValue] = useState(125),
    [step, setStep] = useState(0),
    [target, setTarget] = useState<"a" | "b">("a");
  return (
    <section className="concept-lab">
      <div className="eyebrow">A SMALL EXPERIMENT</div>
      {kind === "loop" ? (
        <>
          <h3>Watch a loop accumulate.</h3>
          <p>
            Step through a fixed example. Observe the value of <code>sum</code>{" "}
            after each iteration.
          </p>
          <pre>{`int sum = 0;\nfor (int i = 1; i <= 4; i++) {\n    sum += i;\n}`}</pre>
          <div className="memory-row">
            <div>
              <span>ITERATIONS DONE</span>
              <b>{step}</b>
            </div>
            <ArrowRight />
            <div>
              <span>SUM</span>
              <b>{(step * (step + 1)) / 2}</b>
            </div>
          </div>
          <div className="button-row">
            <button
              className="btn dark"
              disabled={step === 4}
              onClick={() => setStep(step + 1)}
            >
              <StepForward size={16} />
              Next iteration
            </button>
            <button className="btn quiet" onClick={() => setStep(0)}>
              <RotateCcw size={16} />
              Reset
            </button>
          </div>
          {step === 4 && (
            <p className="success-text">
              The next condition is false. The loop ends with sum = 10.
            </p>
          )}
        </>
      ) : kind === "pointer" ? (
        <>
          <h3>One address. A different destination.</h3>
          <p>
            Select which variable <code>p</code> points to. The expression{" "}
            <code>*p</code> reads the value at that destination.
          </p>
          <div className="memory-row">
            <button
              className={"memory-cell " + (target === "a" ? "chosen" : "")}
              onClick={() => setTarget("a")}
              aria-pressed={target === "a"}
            >
              <span>int a</span>
              <b>10</b>
              <small>symbolic address: &a</small>
            </button>
            <button
              className={"memory-cell " + (target === "b" ? "chosen" : "")}
              onClick={() => setTarget("b")}
              aria-pressed={target === "b"}
            >
              <span>int b</span>
              <b>25</b>
              <small>symbolic address: &b</small>
            </button>
          </div>
          <pre>{`int *p = &${target};\nprintf("%d", *p);  // prints ${target === "a" ? 10 : 25}`}</pre>
          <small>
            This illustrates a fixed memory relationship, not a debugger for
            arbitrary code.
          </small>
        </>
      ) : (
        <>
          <h3>Change the value. Follow the result.</h3>
          <p>
            Integer division finds complete minutes. Remainder finds the seconds
            left over.
          </p>
          <label htmlFor="seconds-slider">
            Seconds <strong>{value}</strong>
          </label>
          <input
            id="seconds-slider"
            type="range"
            min="0"
            max="600"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
          />
          <pre>{`int seconds = ${value};\nint minutes = seconds / 60;\nint remaining = seconds % 60;`}</pre>
          <div className="memory-row">
            <div>
              <span>MINUTES</span>
              <b>{Math.floor(value / 60)}</b>
            </div>
            <ArrowRight />
            <div>
              <span>SECONDS LEFT</span>
              <b>{value % 60}</b>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
