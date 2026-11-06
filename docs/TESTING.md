# Verification and release checks

Recorded for the initial 0.1 implementation on 5–6 November 2026. This is an owner-review preview. Automated success is not a completed classroom, accessibility or cross-browser certification.

## Reproduce

```sh
npm ci
npm run runtime:fetch
npm test
npm run test:curriculum
npm run test:runtime
npm run format:check
npm run build
npm run preview
```

Use Node.js 24 and GCC for native verification. The runtime verifier uses the same `CEngine` and pinned WebAssembly assets as the site. It runs outside the UI, so worker deadlines and editor behaviour still require browser checks.

## Automated checks

| Check                                                                   | Result in this implementation                                                                      |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Curriculum IDs, core/gold dependencies, starter/solution coverage       | Passed                                                                                             |
| Backup round trip, malformed/unsafe/oversized inputs, merge idempotence | Passed                                                                                             |
| UTF-8 backup byte limits                                                | Passed                                                                                             |
| Completion idempotence and exact output comparison rules                | Passed                                                                                             |
| Gzip and HTTP-decompressed tar, malformed sysroot paths                 | Passed                                                                                             |
| Virtual-file write/growth/allocation limits and handle limits           | Passed                                                                                             |
| GCC reference corpus                                                    | 60 programs, 179 input/output cases passed                                                         |
| Actual Clang/WASI reference corpus                                      | 60 programs, 179 cases passed                                                                      |
| Runnable lesson examples                                                | 15 examples compile and exit successfully in Clang/WASI                                            |
| Runtime failure/edge paths                                              | Syntax diagnostics, long UTF-8 stdin/stdout, output flood, sparse file allocation and traps passed |
| TypeScript and production build                                         | Passed                                                                                             |
| Production dependency audit                                             | No reported vulnerabilities at the time checked; not a security guarantee                          |

Reference tests exercise multi-file linking, local headers, pointers, strings, structures, allocation, relative text-file operations and the current data-structure tasks. They are not exhaustive proofs of compiler or libc behaviour.

## Browser observations

The managed Chrome preview was exercised at `http://terminal.local:4173/`.

- Learning path and full-page workspace rendered and were visually inspected.
- Real C compilation returned `Hello, world!`, then the challenge check passed 1/1 and displayed completion.
- Missing semicolon produced the expected Clang filename, line and column diagnostic.
- An empty infinite loop was terminated with a three-second limit message; the next correct program ran and passed.
- Code edits survived page reload/navigation in the same browser.
- A gold task remained locked and linked to its original core challenge.
- Successful completion appeared in the path progress count.
- Brackets and quotes closed automatically; typing the closing delimiters reused the inserted characters. A newline inside a function retained indentation.
- Completing the boarding-pass core task unlocked its harder gold extension.
- A changed display name survived page reload; focused activity appeared in the profile and heatmap.
- Full backup export downloaded valid schema-version-1 JSON containing the edited profile.
- A working workspace screenshot is included in `docs/images/workspace.jpg`; its small progress count is QA activity, not seeded student data.

Browser checks resumed after an earlier observation-policy interruption. The backup import picker later timed out in the automation service, and that UI flow remains unverified. The automated backup round-trip and merge tests are separate evidence, not a substitute for the remaining browser acceptance items below.

## Remaining browser acceptance before classroom rollout

- Exercise find/replace, undo/redo and keyboard escape from CodeMirror.
- Verify a gold completion after unlocking it.
- Test explicit Stop during loading, compiling and running; verify no completion is awarded.
- Add/switch multiple source/header files, verify generated-file downloads and inspect changed-code-during-check behaviour.
- Change font size and confirm reload persistence.
- Import the downloaded backup, inspect the preview, merge twice and verify no duplicated totals.
- Import malformed, oversized and unsupported-version files through the UI; verify the existing progress stays intact.
- Simulate storage refusal/quota, corrupted stored state and two tabs editing the same workspace. Confirm recovery messages and preserve/export work.
- Exercise search, all filter combinations, lesson widgets, project milestone controls and unknown routes.
- Keyboard-only navigation, modal focus, panel resizing, zoom at 200%, high contrast and screen-reader labels.
- Narrow viewport/phone layout, slow network, failed compiler download and non-root GitHub Pages path.
- Current Firefox, Edge and Safari on the teacher/student devices selected for support.

## Publishing acceptance

On 6 November 2026, the [Deploy CODEX C workflow](https://github.com/S-L-A-K-E-R/CODEX_C/actions/runs/42075008371) succeeded after retrying the deployment job. On the [public Pages site](https://s-l-a-k-e-r.github.io/CODEX_C/), Chrome loaded the learning path, lazy-loaded the full editor, downloaded the compiler, compiled the Hello World solution, passed its test and displayed 1/30 core challenges completed. This verifies the deployed relative asset URLs and worker execution for that flow.

CI validates pull requests without deploying. The deployment workflow validates again, creates `dist`, uploads the Pages artifact and deploys only after the build succeeds. Enable **Settings → Pages → GitHub Actions** first. A successful local build or a pushed workflow is not proof of a public deployment; check the actual Pages job and URL.

Before a class, open the deployed site on the classroom network, run an input-based exercise and export/import a backup. Do this on the actual devices in the intended browser support matrix. Record browser versions, significant failures and the reviewed content revision for each classroom release.
