# Delivery roadmap

Milestones are defined by working behaviour and review, not completion-time estimates.

| Milestone | Deliverable | Exit condition |
|---|---|---|
| Specification | Product, curriculum, architecture, quality and status documents | Available in this repository for review |
| Prototype recovery | Transfer source, content, tests, lockfile, notices and workflows | A clean checkout installs, tests and builds |
| 0.1 — owner review | 15 lessons, 60 challenges, 3 projects, full workspace, browser C, local profile/backups | Verified Pages deployment and clear remaining limitations |
| 0.2 — classroom pilot | Teacher-reviewed foundations, deeper practice, full light/dark support, EN/FR structure, browser/accessibility checks | Students can complete the core learning flow without setup help |
| 0.3 — persistence and authoring | IndexedDB, migrations, conflict copies, milestone tombstones, assignment manifests | Interrupted saves and cross-device imports preserve work |
| 0.4 — deeper C | Expanded strings/ownership, search/sort, linked lists, queues/stacks and modular projects | Each task has reviewed pedagogy and portable tests |
| 0.5 — optional portability | Offline strategy, selected-file backup and optional provider connection | Explicit consent, recovery and conflict handling work |
| 1.0 — classroom release | Cohesive curriculum, documented browser matrix and maintained release process | Teacher acceptance and the release checklist pass |

## Next review priorities

1. Does the full-page workspace give enough room to code?
2. Are the first five chapters inviting and appropriately gradual?
3. Should the first classroom edition be English, French or parallel EN/FR?
4. Which exercises are core for each class?
5. Where is more practice useful, and where is repetition unnecessary?
6. What licence should cover original application code and teaching text?

These decisions can be reviewed progressively. They do not prevent the technical source recovery and initial deployment work.

## Separate design efforts

A complete debugger, arbitrary execution animation, modern C23 toolchain migration, verified examinations and institution-wide analytics require separate designs. They are not minor UI toggles.

Automatic Drive sync also needs provider setup, limited permissions, expiring-token behaviour, visible status, conflict handling and recovery. The initial JSON export/import should remain available even when a cloud provider is added.

## Definition of completion

The project is complete for a milestone only when its source and content are committed, its checks are recorded, its limitations are stated and its intended deployed behaviour is verified. Documentation alone completes the specification milestone; it does not complete the website milestone.
