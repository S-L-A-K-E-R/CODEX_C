# Architecture and technical decisions

This document describes the classroom preview implementation included in this repository. See IMPLEMENTATION_STATUS.md for deployment status.

## Static application

GitHub Pages serves HTML, JavaScript, CSS, compiler assets and notices. React and TypeScript manage the interface, Vite builds it, and CodeMirror supplies the editor. The application has no backend, account database, telemetry endpoint or remote compiler.

Hash routes and relative asset URLs are used so direct challenge links work below a repository subpath. Load the editor and compiler on demand. System fonts and bundled UI dependencies avoid runtime CDN requirements.

## Module responsibilities

| File                           | Responsibility                                          |
| ------------------------------ | ------------------------------------------------------- |
| src/App.tsx                    | Navigation, path, lessons, search and projects          |
| src/pages/Workspace.tsx        | Files, panels, run/check lifecycle and feedback         |
| src/components/CodeEditor.tsx  | CodeMirror setup and compiler markers                   |
| src/components/ConceptLab.tsx  | Explicit teaching illustrations                         |
| src/pages/Profile.tsx          | Profile statistics, preferences and backups             |
| src/data/content.json          | Lessons, exercises and visible test cases               |
| src/data/curriculum.ts         | Types, selectors and project definitions                |
| src/state/progress.ts          | Schema validation, merge rules and completion           |
| src/state/store.ts             | Persistence, cross-tab events and focused-time tracking |
| src/runtime/client.ts          | Worker lifecycle, stop and deadlines                    |
| src/runtime/compiler.worker.ts | Asset loading and worker messages                       |
| src/runtime/core.ts            | Sysroot, compile/link sequence and WASI I/O             |
| src/runtime/limits.ts          | Virtual-file growth/write/allocation budgets            |

## Compiler pipeline

Snapshot the source and input before a run. A new dedicated module worker loads the pinned tools and sysroot. Every .c file compiles separately using C17, warnings and no optimisation. Local headers are visible at the virtual root. The linker combines objects with startup code, libc and libm into a WASM executable.

Every test starts with a fresh copy of user files, without the compiler filesystem or output from another case. The worker returns exit status, stdout, stderr and generated text files. The UI verifies that the source has not changed before awarding completion.

Prepared stdin avoids a requirement for SharedArrayBuffer and special cross-origin-isolation response headers. It also means the initial terminal is not a live prompt/reply session.

## Pinned toolchain

The prototype downloaded assets from Runno revision:

`af05728f02d907210d28587b4c32a306e79e312e`

| Asset           | SHA-256                                                          |
| --------------- | ---------------------------------------------------------------- |
| clang.wasm      | 2a466f0e990329d3230b869d04fc20803eae96a7feb3a3f6c93e25a77b8aed1d |
| wasm-ld.wasm    | 36419ed202011765222098d7701218378b67f634d50f0a4625059ae2c9860f48 |
| clang-fs.tar.gz | 7ed12063619882e4dfa710ab371fc91848b256f85a4075747e8bd5c167902b50 |

Together the assets are approximately 53 MB before HTTP compression. Build-time retrieval verifies the digests. They should be ignored by Git and included in the static build with appropriate licence notices. Do not substitute mutable latest URLs.

The JavaScript runtime used in the prototype is @runno/wasi 0.10.3. This is an older C17-oriented compiler setup, not a declaration of C23 support or comprehensive modern Clang compatibility.

## Compatibility fixes established during prototyping

- Accept gzip sysroot bytes and tar bytes already decompressed by HTTP Content-Encoding. Reject malformed paths and require the expected C headers.
- Expose the same virtual root under / and . so the bundled older wasi-libc can open relative filenames.
- Read stdin as bytes across I/O vectors rather than truncating long input or splitting UTF-8.
- Use a streaming decoder per output stream so separate C writes can split a multi-byte character safely.
- Bound file writes, sparse writes, resizing and allocation before Runno grows a JavaScript buffer.
- Give each test a fresh virtual filesystem.

These behaviours are covered by focused tests in the local work and must be retained when its source is recovered.

## Limits

Program execution has a three-second deadline per case; initial download has 120 seconds; compile/link phases have 30 seconds each. Stop and deadlines terminate the worker, so an infinite C loop cannot block the UI thread.

Linking caps program linear memory at 64 MiB with a 1 MiB stack reservation. Output is bounded at 64 KiB. Workspace input, saved text, backups, virtual-file allocation, file entries, open handles and open operations have separate bounds detailed in the specification.

Compiler memory and JavaScript allocations remain outside the program's linear-memory cap. This is a classroom runtime with conservative limits, not an audited hostile-code service.

## State model

The prototype uses schema version 1 and the key `codex-c:progress:v1`.

Records include profile, completed tasks, read lessons, attempts, drafts, daily activity, project milestones, settings, last workspace and update timestamps. Validation constructs a fresh safe object and rejects invalid identifiers, unsafe filenames, non-finite numbers, unsupported versions and excessive sizes.

Drafts debounce at 350 ms and flush on navigation/page hide. Persistence failures display a warning. Unreadable storage remains intact for recovery export rather than being silently replaced.

Completion, lesson and milestone records merge by union; newer drafts/profile/settings win; activity and attempts use per-key maxima. This avoids double counting repeated backups but can undercount independent device use. Clock differences affect last-write-wins. Milestone unchecks can be restored by an older imported completion; deletion tombstones are required in the next schema.

Cross-tab notifications are not collaborative editing. A full release should preserve conflicts rather than discard the losing draft. IndexedDB becomes useful as workspace volumes grow.

## Deployment design

The workflows:

1. Install from a committed dependency lockfile.
2. Download and verify runtime assets.
3. Run schema/content tests, native solutions and actual WASM solutions.
4. Type-check and build the static site, including third-party notices.
5. Upload a Pages artifact and deploy only after validation.

Pull-request checks use read-only repository permissions and never deploy. The deployment job needs Pages and OIDC permissions. Do not use privileged pull_request_target workflows for untrusted code.

Pages must be enabled in repository settings. Its successful job URL, not a guessed URL or local build, is the proof of publication. The workflow files are in .github/workflows/.

## Future decisions

Evaluate a newer compiler, IndexedDB migrations, offline caching, provider-specific cloud consent, richer terminal input and instrumentation as separate changes. Each has compatibility and recovery requirements. Do not introduce a fake C interpreter or remote compiler as an unannounced substitute for the selected execution model.
