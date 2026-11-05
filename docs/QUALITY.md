# Quality standard and verification record

## Status of the evidence

The observations below came from the earlier local prototype. Its application source is **not yet committed here**, so these results do not validate the current documentation-only repository as a runnable product.

The last formatting/backup-limit changes were followed by a final test/build command, but the environment became unavailable before that command's result could be collected. A fresh complete validation is required after recovery.

## Previously observed results

| Check | Observed result |
|---|---|
| Curriculum IDs, gold dependencies and solution coverage | Passed |
| Backup round trip, malformed/unsafe/oversized input, merge idempotence | Passed |
| Completion idempotence and output comparison | Passed |
| Gzip / HTTP-decompressed tar and unsafe paths | Passed |
| Virtual-file write/growth and handle limits | Passed |
| Native GCC reference corpus | 60 programs, 179 cases passed |
| Actual Clang/WASI reference corpus | 60 programs, 179 cases passed |
| Runnable lesson examples | 15 examples compiled and exited successfully |
| Runtime edge/failure paths | Syntax diagnostics, long UTF-8 I/O, output flood, sparse file allocation and traps passed |
| TypeScript / production build before final edits | Passed |
| Production dependency audit when checked | No vulnerabilities reported; not a security guarantee |

A later test was added for UTF-8 backup byte limits and an additional allocation guard. Do not label the final combined suite passed until its output is recovered or it is rerun.

## Browser observations completed

- Learning path and full-page workspace rendered and were visually inspected.
- A real Hello, world program compiled, passed its challenge and displayed completion.
- A missing semicolon produced filename, line and column diagnostics.
- An infinite loop produced the three-second timeout message.
- A correct program ran successfully after the timeout.
- Code survived reload/navigation in the same browser.
- A gold task displayed its prerequisite and linked to the original task.
- Completion appeared in the learning path's core progress count.

A browser service URL-policy error interrupted subsequent checking. The screenshot captured before that interruption remains in the unavailable workspace and has not been added to this repository.

## Required remaining browser checks

| Area | Acceptance |
|---|---|
| Editor | Real typing verifies delimiter pairing, overtyping, indentation, find/replace, undo and keyboard escape |
| Gold progression | Complete the original, observe unlock, then pass the harder task |
| Stop | Cancel loading, compiling and running without awarding completion |
| Source changes | Editing during a check does not verify the newer untested source |
| Multiple files | Add/switch headers and sources, link them, inspect generated text files |
| Profile | Edit identity/preferences, inspect derived figures and reload |
| Backup | Download, preview import, merge twice and verify no duplicated totals |
| Invalid import | Reject malformed, oversized and unsupported files without losing existing work |
| Storage | Simulate refusal/quota/corruption; preserve/export the recoverable state |
| Multiple tabs | Check last-write-wins behaviour and communicate its limits |
| Navigation | Search, filters, lesson widgets, project controls and unknown routes |
| Accessibility | Keyboard-only use, focus, dialogs, 200% zoom, contrast and screen-reader labels |
| Responsive layout | Narrow screens, long code, large fonts and collapsible instructions |
| Hosting | Actual repository-subpath deployment and compiler assets |
| Browser support | Test the selected versions of Firefox, Edge and Safari as well as Chrome |
| Classroom conditions | Slow network, interrupted asset download and real student devices |

## Content quality gates

Every task requires an unambiguous contract, useful hints, a justified place in the progression, reliable reference tests and accurate source attribution. At least one teacher review is required before classroom release.

Native C success is insufficient: the actual WASM compiler and C library must also pass. A passing corpus is evidence for those inputs, not proof of universal compiler correctness or of the student's understanding.

The full curriculum must include reasoning and explanation, with source review where algorithm choice, complexity, recursion or ownership matters.

## Release process after source recovery

Use Node.js 24 and GCC, install from the lockfile and run the intended commands:

```sh
npm ci
npm run runtime:fetch
npm test
npm run test:curriculum
npm run test:runtime
npm run format:check
npm run build
```

These commands describe the prototype's package scripts; they will become usable only after its application files are transferred.

Then run the browser matrix, enable GitHub Pages, deploy and smoke-test the published site. Record the source commit, browser versions, test output and known limitations for the release. Do not describe a successful local build or committed workflow as a verified live deployment.

Before teaching, run an input-based exercise and a full backup round trip on the classroom network. Keep a plain-text assignment fallback and the source course links available.
