# Authoring and reviewing teaching content

The preview contains 15 chapters and 60 exercises, plus three open project briefs. Its purpose is to establish the teaching format and complete technical path. Four exercises per chapter are a starting set, not the eventual practice volume for a full course.

## Files to change

- Edit `src/data/content.json` for chapters and exercises.
- Edit `src/data/curriculum.ts` for projects and typed selectors.
- Add a reference program for every exercise in `tests/fixtures/solutions.json`.
- Update source acknowledgements in `ATTRIBUTION.md` when introducing material.

The student bundle intentionally contains test cases. Maintenance solutions are separate from the application imports but remain visible in this public repository.

## Chapter contract

Each chapter has a stable `id`, title, subtitle, learning stage, concepts, three short teaching sections, complete runnable C example, source reference and optional teaching widget. Introduce unfamiliar syntax before requiring it. Use explicit input/output examples and explain one new source of difficulty at a time.

Illustrations must say what they model. A pointer illustration with fixed symbolic addresses is a conceptual model, not a claim to inspect the student's actual WASM memory. Correctness comes before animation. Respect reduced-motion preferences.

The course sequence is a recommendation. Students can open later chapters directly for teacher-led sessions. Gold tasks alone require their original core task.

## Exercise contract

| Field            | Rule                                                                      |
| ---------------- | ------------------------------------------------------------------------- |
| `id`             | Stable lowercase identifier; changing it breaks progress continuity       |
| `chapter`        | Existing chapter ID                                                       |
| `kind`           | `core`, `gold` or `optional`                                              |
| `title`, `brief` | A concrete scenario and unambiguous task                                  |
| `input`          | Exact format, valid ranges and assumptions                                |
| `output`         | Exact required format and important rounding/whitespace rules             |
| `tests`          | Labelled input/output cases, including relevant boundaries                |
| `starter`        | File map including `main.c`; scaffolding without the answer               |
| `hints`          | Three escalating hints: approach, mechanism, diagnostic guidance          |
| `base`           | For gold, the original core challenge in the same chapter; otherwise null |
| `reference`      | Relevant original source or explanation                                   |
| `minutes`        | Legacy authoring metadata; not displayed or used for progression          |

Do not award gold for repeating the same task with a larger constant. Extend the original reasoning: handle a boundary, add an operation, generalise an algorithm or revise a representation. Optional tasks must remain optional for core progress.

Avoid arithmetic worksheets made only of isolated `a + b` operations. Prefer unit conversion, duration formatting, fare calculation, reports, validation, state changes and small useful programs. Keep the story short enough that it does not obscure the C objective.

## Test design

Use the declared valid domain. Include a typical case, important edges and at least one case that distinguishes the intended behaviour from a plausible mistake. Examples include zero and one, first/last element, empty/full collection, midnight rollover, missing match, negative values when allowed, and repeated values.

`matchesOutput` accepts CRLF or LF and one optional trailing newline. It preserves all other whitespace and case. If arbitrary whitespace or approximate numeric comparison is genuinely required, add a named comparator with independent tests instead of silently relaxing every exercise.

Never expect a raw pointer address, an unseeded random result, undefined behaviour, implementation-dependent evaluation order or unbounded integer arithmetic. Use deterministic custom pseudo-random sequences for portable expected output; `rand()` algorithms differ across C libraries. Define overflow and rounding assumptions.

Behavioural tests cannot establish that a learner used pointers, a loop, recursion, dynamic allocation, a queue or a particular complexity. State such goals explicitly and review source. Do not add brittle regex checks pretending to prove semantic properties.

## Review checklist

1. Can a beginner describe what they receive, produce and change without guessing?
2. Does every required concept appear in the lesson or an identified prerequisite?
3. Does the starter compile or intentionally contain a clearly labelled repair task?
4. Do all declared test cases match the specification and the reference solution?
5. Does the task have a distinct purpose within its chapter's progression?
6. Are bounds safe and all allocations/return values addressed where relevant?
7. Does the gold extension build on its original task rather than replace it?
8. Are hints helpful without dumping a complete solution?
9. Is source attribution accurate and compatible with republication?
10. Has the teacher reviewed wording, prerequisites and expected student explanation?

Run `npm test`, `npm run test:curriculum`, `npm run test:runtime`, and `npm run build`. GCC checks the whole reference corpus; the WASM verifier uses the same compiler engine as the site. Native success alone is insufficient for browser compatibility.

## Growth target

For the full classroom edition, grow each major chapter toward a balanced set of prediction, tracing, completion, repair, independent construction and transfer tasks. Prioritise conditionals and loops, where beginners commonly lose confidence. Aim for roughly 8–12 carefully reviewed tasks per major chapter before adding large advanced topic counts. This is a curriculum target, not an implemented count or a time estimate.

Future material includes searching/sorting, linked lists, robust strings, ownership, queues/stacks, testing, debugging, file formats and larger modular projects. Native-only extensions should clearly tell students when to move into their desktop IDE.
