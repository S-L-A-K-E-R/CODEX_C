# Implementation status and recovery handoff

**Last updated: 5 November 2026**

## What is available in this repository

The repository contains a complete product specification, curriculum direction, architecture, acceptance standards, roadmap and attribution.

**It does not yet contain the application source or a deployable build. There is no verified live website.**

## Work completed in the earlier coding workspace

A React/TypeScript/Vite prototype was implemented with:

- A learning dashboard and selectable chapter path.
- 15 short lessons, 60 exercises and three project workspaces.
- Core/gold/optional task distinctions and gold prerequisites.
- A full-page CodeMirror workspace with collapsible/resizable panels.
- Real C17 compilation and execution with Clang, wasm-ld and WASI.
- Multiple source/header/data files, prepared stdin, compiler diagnostics and result checks.
- Worker stop/deadline handling and bounded output/virtual-file operations.
- Local progress, saved drafts, a profile, activity heatmap and backup import/export.
- A detailed specification, developer documentation and planned CI/Pages workflows.

The reference corpus passed 179 cases under both GCC and the actual browser engine. Fifteen lesson examples ran successfully. Browser testing confirmed actual compilation, diagnostics, timeout recovery, persistence and locked gold prerequisites.

See [QUALITY.md](QUALITY.md) for the precise evidence and incomplete checks. Some final edits were made after the last observed passing build; the final verification command's result was not collected.

## Blocker

The coding environment became unavailable before the source files were uploaded to GitHub. GitHub access remained available, allowing these documents to be committed independently.

The source files cannot currently be inspected, recovered, packaged or transferred through the available execution tools. It has not been established that they were deleted. Do not discard or overwrite a recovered workspace based on this status.

## Source inventory to recover

- package.json and package-lock.json
- tsconfig.json, vite.config.ts, index.html and .gitignore
- src/App.tsx, src/main.tsx and src/styles.css
- src/components/CodeEditor.tsx, ConceptLab.tsx and shared.tsx
- src/pages/Workspace.tsx and Profile.tsx
- src/data/content.json and curriculum.ts
- src/runtime/core.ts, limits.ts, types.ts, client.ts and compiler.worker.ts
- src/state/progress.ts and store.ts
- scripts/fetch-runtime.mjs and build-notices.mjs
- scripts/verify-curriculum.ts and verify-runtime.ts
- tests/curriculum.test.ts, progress.test.ts and runtime.test.ts
- tests/fixtures/solutions.json
- public/favicon.svg and public/licenses/
- .github/workflows/ci.yml and deploy.yml
- docs/images/workspace.jpg, if the screenshot transfer completed

Generated compiler assets and dependency/build directories should not be committed. Fetch the pinned runtime again through its checked script, and regenerate the production dependency notices during build.

## Important recent changes to retain

1. Sysroot loader accepts both gzip and HTTP-decompressed tar.
2. Relative file operations use the same virtual root under / and .
3. Stdin is byte-based; output uses independent streaming UTF-8 decoders.
4. Virtual-file write, sparse-write, resize and allocation guards run before buffer growth.
5. Storage quota errors are not cleared by an unrelated capacity-warning reset.
6. Backup limits account for UTF-8 bytes and readable export formatting.
7. Suggested exercise durations were removed from the interface.
8. Profile access was added to the top right.
9. Source was formatted for maintainability.
10. Documentation distinguishes the preview from later themes, cloud sync and debugging.

## Recovery sequence

1. Restore access to the original coding workspace and inspect its current files and final command logs.
2. Preserve any source or data that is not already backed up.
3. Fetch this repository's current main branch; keep the documentation commits made during the interruption.
4. Reconcile the recovered README/docs with the current status instead of overwriting them blindly.
5. Run clean-install, asset verification, unit/content/native/WASM checks, formatting check and production build.
6. Complete the remaining browser acceptance cases.
7. Commit the actual application, notices and deployment workflows.
8. Enable Pages with GitHub Actions as its source, deploy and verify the real public URL.
9. Update this status and the README to reflect the verified application commit and deployment.

If the original workspace cannot be restored, rebuilding is possible from the specification and recorded technical decisions, but that would be a new implementation requiring its own tests. Do not present reconstructed code as the previously tested prototype.
