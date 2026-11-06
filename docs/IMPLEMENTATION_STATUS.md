# Implementation status

Updated 6 November 2026.

The coding workspace was reconnected and the complete prototype was recovered. The application source, 15 lessons, 60 challenges, three projects, tests, lockfile, third-party notices and GitHub Actions workflows are included in this delivery.

## Verification

- 10 unit/content/storage/runtime tests passed after recovery.
- 60 C reference programs passed 179 cases under GCC.
- The same 60 programs passed 179 cases in the actual browser Clang/WASI engine.
- All 15 lesson examples compiled and exited successfully.
- Syntax errors, long UTF-8 I/O, output floods, sparse-file allocation and traps passed their checks.
- TypeScript and the production build passed.

Browser testing confirmed real compilation, diagnostics, infinite-loop timeout recovery, saved drafts, editor auto-pairing/indentation, gold unlocking, profile persistence and backup export. The import picker timed out in the browser automation service; import UI acceptance remains outstanding despite passing automated data tests. See [TESTING.md](TESTING.md). These are preview results, not a completed classroom or accessibility certification.

## Deployment

The [classroom preview](https://s-l-a-k-e-r.github.io/CODEX_C/) is published. The [Deploy CODEX C workflow](https://github.com/S-L-A-K-E-R/CODEX_C/actions/runs/42075008371) passed on retry after Pages was enabled, including the application build, runtime checks and deployment. On the public site, Chrome loaded the learning path and editor, compiled the Hello World solution, passed its test and saved completion.

The repository also ran GitHub's default Jekyll publishing workflow. Keep **Settings → Pages → Source** set to **GitHub Actions** so future pushes publish the compiled application rather than repository source. The connected repository tools do not expose this administration setting, and the browser settings page requires owner sign-in.

## Remaining product scope

Automatic cloud sync, a full debugger, a modern C23 toolchain, complete light/dark preferences, EN/FR content and the expanded exercise bank remain later work. Browser-local backups, profiles and formative checking are implemented. See [PRODUCT_SPECIFICATION.md](PRODUCT_SPECIFICATION.md) and [ROADMAP.md](ROADMAP.md).

## Interruption history

An earlier environment interruption prevented source transfer, so documentation was committed first. That source-access blocker is resolved; those documentation commits are preserved in the repository history.
