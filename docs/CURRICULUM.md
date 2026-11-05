# Curriculum and exercise design

This document defines the content direction for CODEX C. The initial content bank is in src/data/content.json. The examples below distinguish current content from proposed expansions.

## Initial content structure

The prototype was built around 15 chapters, each with a short lesson, two core exercises, one gold extension and one optional task: 60 exercises in total. This establishes a complete technical and pedagogical format, but four exercises are not the final practice volume for a major chapter.

| Stage             | Chapters                                                         | Teaching emphasis                                                                 |
| ----------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Foundations       | First programs, variables/calculations, decisions, loops, arrays | Start confidently, follow state, handle boundaries, build small complete programs |
| Data and memory   | Functions, pointers, strings, structures, dynamic memory         | Decompose work, represent data, understand indirection and ownership              |
| Build and explore | Modular projects, randomness, files, recursion, data structures  | Combine concepts, define contracts, investigate tradeoffs and build larger work   |

All chapters remain open for teacher-led sessions. The path recommends an order. Gold tasks require their original core task; optional work does not gate the core path.

## A progression ladder within a chapter

Begin with recognition and prediction, then trace execution, complete a scaffold, repair a plausible mistake, write a solution and transfer the idea. Avoid requiring a student to make a large algorithmic leap at the same time as introducing unfamiliar syntax.

| Practice mode | Example of the learning purpose                                     |
| ------------- | ------------------------------------------------------------------- |
| Predict       | Determine whether integer division retains the fractional part      |
| Trace         | Record an accumulator and loop index after each iteration           |
| Complete      | Add the missing update while the input/output structure is provided |
| Repair        | Correct an off-by-one condition and explain the boundary            |
| Construct     | Implement a small task from its input/output contract               |
| Transfer      | Extend the task to a new representation or constraint               |

The full edition should use this balance rather than treating more input/output puzzles as the only form of progress. Prediction and reflection interfaces still need implementation beyond the prototype's executable tasks.

## Representative first steps

The prototype's first chapter uses “Hello, world.”, a three-line boarding pass, a gold extension that inserts a passenger number and an optional text banner. Its calculation chapter includes duration conversion and a weather conversion scenario.

These are short, concrete starting points. Subsequent additions should reduce repetitive fixed-output work and introduce meaningful variation. Candidate additions include boundary-sensitive ticket fares, a sensor summary, a menu that repeats until exit, a search with a missing result and a collection with repeated values.

The duration example illustrates the intended gold relationship:

- **Core:** convert nonnegative seconds into hours, minutes and seconds. Hours may exceed 23 because this is a duration.
- **Gold:** add complete days, then bound the remaining hour field.
- **Optional:** use a different duration formatting requirement while practising the same arithmetic.

A harder version should add reasoning, not just change a constant.

## Chapter expansion targets

| Chapter          | Useful additional practice                                    | Common mistake to address                                         |
| ---------------- | ------------------------------------------------------------- | ----------------------------------------------------------------- |
| First programs   | Escape sequences, formatted input, output order               | Missing semicolon, unmatched quotes, confusing source with output |
| Variables        | Units, integer/floating division, rounding contracts          | Using integer division when a fractional result is required       |
| Decisions        | Inclusive boundaries, combined conditions, validation         | Using assignment as a comparison or overlapping ranges            |
| Loops            | Sentinels, totals, nesting, invariants                        | Missing update, wrong termination condition, off-by-one           |
| Arrays           | Empty/one-element cases where allowed, search, rotations      | Reading outside bounds or mixing an index with a value            |
| Functions        | Several callers, parameters, return contracts                 | Confusing a local copy with the caller's variable                 |
| Pointers         | Indirection, swap, output parameters, pointer/array relations | Dereferencing an uninitialised pointer                            |
| Strings          | Terminators, bounded reads, transformations, parsing          | Forgetting the terminator or assuming unlimited input             |
| Structures       | Record collections, comparison, sorting keys                  | Treating related fields as unrelated parallel variables           |
| Dynamic memory   | Failure paths, resizing, ownership, freeing                   | Lost allocation after realloc or unclear ownership                |
| Modular programs | Headers, guards, declarations/definitions, linking            | Defining the same object in several translation units             |
| Randomness       | Repeatability, seeds, ranges, experimental summaries          | Assuming rand is portable or cryptographically secure             |
| Files            | Missing file, EOF, append, round-trip format                  | Using feof as a read condition or ignoring errors                 |
| Recursion        | Base cases, stack trace, iterative comparison                 | A recursive call that does not approach the base case             |
| Data structures  | Push/pop, enqueue/dequeue, wraparound, cleanup                | Confusing empty/full state or leaking removed nodes               |

Aim initially for approximately 8–12 reviewed tasks in each major chapter, adjusted to classroom need. This is a content-development target, not an implemented count or a completion-time estimate.

## Projects

### The clock tower

Combine durations, decisions, loops and functions.

1. Convert a duration into days, hours, minutes and seconds.
2. Add seconds to a clock and wrap correctly after midnight.
3. Add a menu that repeats until the learner chooses to quit.
4. Document input/output examples including a midnight transition.

### The student register

Combine strings, records, dynamic memory and files.

1. Model a student with a name and score.
2. Maintain a collection with checked allocation.
3. Search records and report class statistics.
4. Save/reload a documented text format and handle missing files.

### A little chess engine

Combine arrays, decomposition, records and modular design.

1. Represent and print an 8×8 board with a documented encoding.
2. Convert board coordinates safely into array indexes.
3. Validate a stated subset of movements before extending the rules.
4. Separate board, rules and display modules; document unsupported rules.

These are open projects with self-assessed milestones. A checkbox does not certify full correctness. Teacher review should consider the implemented subset, tests, explanation, clarity and handling of invalid states.

## Content schema

The prototype's authoritative lesson/exercise file is intended to be `src/data/content.json`. Projects and typed selectors are in `src/data/curriculum.ts`. Reference solutions are in `tests/fixtures/solutions.json`, separate from client imports.

An exercise record needs stable ID, chapter, kind, title, brief, exact input and output contracts, test cases, starter files including main.c, three hints, an optional gold base and source reference. Do not change an ID just because its title changes.

Every gold base must identify a core task in the same chapter. Every exercise must have a maintenance solution. Every lesson example must compile and run in the browser toolchain.

## Test design

Include normal cases and boundaries that distinguish the intended behaviour from plausible mistakes. Specify permitted input instead of testing undocumented invalid values. Use deterministic expected output and avoid raw addresses, unseeded randomness, undefined behaviour and platform-specific assumptions.

The initial comparison permits CRLF/LF differences and one optional trailing newline. It preserves meaningful spaces and case. Add explicitly named numeric or structural comparators only when a task needs them.

Behaviour tests cannot prove algorithm choice, use of pointers, ownership, complexity or understanding. State those goals and review source. Keep reference solutions public for maintainability if desired, but do not claim they are hidden from students.

## Author review checklist

1. Is the next action obvious without teacher translation?
2. Are all required concepts introduced or linked?
3. Are input bounds, output format and rounding clear?
4. Do the tests agree with the contract and reference solution?
5. Is the task distinct from nearby exercises?
6. Does its gold extension preserve and deepen the original idea?
7. Do hints help without dumping a full answer?
8. Are allocation, bounds and failure cases handled where relevant?
9. Is source attribution accurate?
10. Does the task invite the student to explain an important decision?

For the implementation release, run structural validation, native reference tests, actual browser-engine tests and the production build after a content change. Then review representative tasks with students before expanding the bank further.
