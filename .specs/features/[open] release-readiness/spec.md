# Evidence-backed mobile release readiness

## Problem Statement

Issue #4 requests a discoverable release command that connects the existing release specialist and platform references to an actual app, binary and store destination. Configuration alone cannot prove that CI passed or a store accepted a build.

## Out of Scope

Publishing the plugin or an app, changing versions, tags or store settings, automatic builds, adding dependencies, and implementing the skill-coverage backlog in issue #5.

## Assumptions & Open Questions

| Assumption | Chosen default | Rationale |
|---|---|---|
| CLI responsibility | Prepare routing, redacted git context, diagnostics and release reference paths | Preserve the existing context-only CLI architecture |
| Audit scope | Inspect existing evidence; no build, test, upload or project mutation by default | Readiness requests do not authorize release execution |
| Unknown required gates | NO-GO pending verification | Missing evidence cannot establish readiness |
| GO WITH RISKS | All required gates pass, with explicit non-blocking risks | Risks cannot override a failed or unknown required gate |
| Verdict helper | Evaluate structured per-target gates through a packaged Node script | Test decisions deterministically without pretending to verify external evidence |
| Representative audit | Public mobile sample at a pinned source revision | Reproducible evidence without exposing private app information |

Open questions: none.

## User Stories

As a mobile engineer, I want a read-only release audit with evidence and next actions for each target so that I can decide whether a specific build is ready for its intended store track.

Acceptance Criteria:
1. When `reis-mobile release` runs, it SHALL force release intent, select `mobile-release-engineer`, honor app-root configuration and language, and return redacted git context and diagnostics without running app scripts or changing project files.
2. When release context is prepared for any supported stack, it SHALL link the stack release reference and all detected Android/iOS release references, including both targets in Flutter, Expo and KMP; unknown detection SHALL remain explicitly unverified.
3. When `/reis-mobile:release [request]` or `/reis-mobile release [request]` runs, the instructions SHALL resolve each target's app ID, flavor/scheme/environment, version/build, revision, store/track and artifact and distinguish configured values from artifact evidence.
4. When evaluating readiness, the workflow SHALL record identity, build, tests, analysis, version, signing, symbols, store requirements, privacy, listing and rollout gates as pass/fail/unknown with evidence or the exact missing confirmation and next action.
5. When any required gate is missing, failed, unknown or lacks evidence, the verdict helper SHALL return NO-GO; when all gates pass it SHALL return GO, or GO WITH RISKS if explicit non-blocking risks remain. One target's failure SHALL block the combined release. Malformed input SHALL fail without returning GO.
6. When an audit runs, it SHALL remain read-only by default, not infer CI/store success from config, and report blockers, risks, unknowns and next actions using the requested language.
7. When delivered, the workflow SHALL be documented in README and entry help, replace the pending roadmap item, ship in the npm package, pass `npm run check`, and include an audit of a representative public mobile project with actual source evidence and honest execution limits.

## Requirement Traceability

| ID | Scope | Verification | Status |
|---|---|---|---|
| RELEASE-01 | Criteria 1–2 | CLI integration tests across stacks, monorepo, missing evidence and read-only behavior | verified |
| RELEASE-02 | Criteria 3–6 | Command contracts, verdict unit/CLI tests, independent workflow evaluation | verified |
| RELEASE-03 | Criterion 7 | Documentation/package checks, representative audit and full suite | verified |

## Execution Plan

1. Add release context preparation in `bin/reis-mobile.mjs` and `core/release/context.mjs`, with `tests/release-command.test.mjs`. Verify CLI integration tests; commit `feat(release): prepare project-specific release context`.
2. Add `commands/release.md`, entry forwarding, skill readiness reference and verdict script; align the release agent and skill. Verify command and verdict tests; commit `feat(release): enforce evidence-backed readiness verdicts`.
3. Document the workflow in README, ARCHITECTURE and CHANGELOG, verify package inclusion, and record a public sample audit. Run full checks; commit `docs(release): document and demonstrate readiness audits`.
4. Run the independent verifier and record its findings before closing this feature.

## Execution evidence

Step 1: `node --test tests/release-command.test.mjs tests/doctor-and-cli.test.mjs` passed 23 tests. RELEASE-01 maps to `tests/release-command.test.mjs:27` (`output.intent === release`), line 37 (exact platform list), line 38 (exact reference list), lines 66–67 (unchanged diff/status), and line 76 (unknown detection). All new tests map to criteria 1–2; no existing assertions were weakened.

Step 2: `node --test tests/release-readiness.test.mjs tests/commands.test.mjs tests/registry.test.mjs` passed 50 tests. RELEASE-02 decision cases map to the GO/GO WITH RISKS assertions at `tests/release-readiness.test.mjs:20` and `:29`, cross-target blockers at `:41`, missing gates at `:53`, evidence-free pass at `:63`, and invalid-input CLI behavior at `:89`. Command integration maps to `tests/commands.test.mjs` in `/release`. Tests enforce criteria 3–6 without treating evidence strings as proof of their truth.

Package verification found a symlink-path invocation defect in the verdict helper. A new regression test reproduced empty stdout; resolving the actual script path fixed it. `node --test tests/release-readiness.test.mjs` passed all 10 tests. The independent sample reader also identified unclear handling of absent app paths; the command now explicitly blocks unknown detection instead of trusting prompt hints. These corrections implement criteria 2, 5 and 7.


RELEASE-03 validation: `npm run check` passed 5 stacks, 21 agents, 14 skills and 221 tests. The package archive was unpacked in a temporary directory; its `release` CLI selected `mobile-release-engineer`, and its packaged verdict script returned NO-GO for an empty target set. No global package installation occurred. The sample audit completed the 22 gate records and cites immutable upstream source plus official store pages with access dates.

Independent workflow review found and resolved ambiguity between a missing artifact and an observed failure, the prior-release tag convention, and prompts pointing to a missing app path. Non-blocking risks now require an ID, description, evidence, mitigation and owner; their semantic impact still requires human verification. The release workflow remains read-only during the sample review.
