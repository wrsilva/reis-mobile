# Validation — evidence-backed mobile release readiness

## Validation

**Result: PASS**

Validated on 2026-09-21 at `27d44ec` before this validation record was added. The root worktree was clean. `npm run check` passed validation for 5 stacks, 21 agents and 14 skills, followed by 222 tests: 222 passed, 0 failed, 0 skipped.

| Acceptance criterion | Result | Evidence |
|---|---|---|
| AC1: CLI routing, app-root config, language, redacted context and no side effects | PASS | `tests/release-command.test.mjs:22` checks forced release intent, specialist, resolved root and language; `tests/release-command.test.mjs:43` checks monorepo resolution, redaction and unchanged git state; `tests/release-command.test.mjs:79` verifies no release script executes. |
| AC2: stack references, all detected native targets and explicit unknown state | PASS | `tests/release-command.test.mjs:15` covers Flutter, native Android/iOS, Expo and KMP; `tests/release-command.test.mjs:35` asserts both native targets where applicable; `tests/release-command.test.mjs:67` confirms a prompt cannot invent a missing project. |
| AC3: exact release identity and configured-versus-artifact evidence | PASS | `tests/commands.test.mjs:177` asserts app ID, flavor/scheme/environment, version/build, source revision, store/track and built artifact, plus the distinction between configuration and binary verification. A scratch-worktree mutation removing `store/track` caused this focused test to fail as expected; the scratch worktree was removed. |
| AC4: eleven evidence-backed gates and next actions | PASS | `skills/mobile-release/references/readiness.md:13` defines required gates and evidence; `commands/release.md:38` directs the workflow to the shared contract. |
| AC5: deterministic verdicts, missing-evidence blockers, cross-target behavior and malformed-input handling | PASS | `tests/release-readiness.test.mjs:17` verifies GO and GO WITH RISKS; `tests/release-readiness.test.mjs:32` blocks a failed or unknown iOS gate in a combined release; `tests/release-readiness.test.mjs:47` blocks missing gates; `tests/release-readiness.test.mjs:55` blocks evidence-free pass; `tests/release-readiness.test.mjs:70` and `tests/release-readiness.test.mjs:83` reject invalid data and distinguish malformed input. |
| AC6: read-only default, no configuration-only claims and language-aware report | PASS | `tests/release-command.test.mjs:79` verifies no script execution or verdict claim; `tests/commands.test.mjs:166` checks artifact evidence, unknown handling and read-only boundaries; `commands/release.md:44` states the execution boundary. |
| AC7: discoverability, roadmap, package, checks and representative public audit | PASS | `README.md:233` and `README.md:271` document discovery and behavior; `README.md:483` marks the roadmap item complete; `package.json:15` includes runtime directories and `tests/distribution.test.mjs:164` checks package coverage; the packed-package smoke run selected the release agent and returned NO-GO for an empty target set; `docs/examples/release-readiness.md:1` records the 22-gate Flutter sample audit and `docs/examples/release-readiness.md:78` cites pinned upstream evidence and official store sources. |

The readiness evaluator checks completeness and consistency of supplied evidence, not whether external evidence is true; the skill says so at `skills/mobile-release/references/readiness.md:43`. The public sample audit is source-based, deliberately returns NO-GO and does not claim builds, tests, uploads or store checks were run.

## Final checks

- `npm run check`: PASS, 222/222 tests, zero skips.
- `git diff --check`: PASS before recording this report.
- Packed npm artifact smoke check: PASS; release command and evaluator were present and usable from the unpacked archive.
- Targeted test mutation: PASS; removing a required identity field was detected by its contract test.
- Scratch worktree cleanup: PASS; only the main worktree remained and its status was unchanged.
