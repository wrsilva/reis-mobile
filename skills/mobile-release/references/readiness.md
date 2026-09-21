# Evidence-backed readiness audit

Use this contract for `/reis-mobile:release` and any readiness request. Other release tasks (store copy, pipeline implementation, deployment) retain their requested scope.

## Release identity and target coverage

For every intended artifact, record **app/package or bundle ID → flavor/scheme/environment → version/build → source revision → store/track → built artifact** with evidence. Inspect build overrides, CI parameters and artifact metadata; distinguish configured values from values verified in the binary. A directory or configured KMP target does not prove a shippable host exists. A shared framework is not an iOS app archive.

Use detection as an inventory, then confirm actual Android/iOS hosts and requested destinations. Flutter, React Native/Expo and KMP shipping to both stores need separate gate rows for both artifacts. A prompt focusing on Android does not silently approve the iOS artifact. If the user explicitly limits the audit to one store, state the exclusion and do not issue a combined verdict. Expo can generate native folders: inspect app configuration and EAS profiles without running prebuild. Unknown targets or missing binaries stay unknown.

Read the stack reference plus [android.md](android.md) and/or [ios.md](ios.md) for the actual destinations. KMP also needs [kotlin-multiplatform.md](kotlin-multiplatform.md). Do not substitute a shared-code test for a native host test.

## Required gates

Each target has these gate IDs. Every gate is **pass**, **fail**, or **unknown**, with a source reference and an exact next action/owner when unresolved. A failed check needs observed failure evidence; unavailable evidence is unknown. A local config file proves configuration only, not an executed check, successful upload, current console state or store approval.

| ID | Evidence required |
|---|---|
| `identity` | All identity fields above, including artifact provenance and agreement with the intended source revision. Record dirty/untracked source and unknown CI overrides. |
| `build` | Successful release build log/CI job for this revision and artifact, with the actual variant and production environment. A workflow YAML or debug build is insufficient. |
| `tests` | Actual results for applicable unit/integration/device checks on this revision, with counts and skipped/failed checks. Resolve required suites from project policy and the changed behavior. |
| `analysis` | Actual lint/static-analysis results for the release revision and applicable targets. Missing tools or logs are unknown, not pass. |
| `version` | Artifact version/build matched to source/CI inputs and store upload history, applying the platform's numbering scope. Verify the previous release using the project's convention, not merely the closest tag. See [Android versioning](https://developer.android.com/studio/publish/versioning) and [Apple's build identification](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information). |
| `signing` | Signed artifact verification, intended distribution identity, and applicable entitlements/profile or upload-key setup. Never read or print private keys, passwords or tokens. |
| `symbols` | Matching R8/native symbols, dSYMs, Dart debug info and/or JS source maps, with archive/upload evidence as required by the app. Verify build IDs/UUIDs or provenance. |
| `store` | Current official requirement URL and access date, target SDK/toolchain evidence, and any account/track eligibility or review state needed for the intended action. Unavailable portal confirmation stays unknown. |
| `privacy` | Permissions/data collection and third-party SDK inventory reconciled with manifests, usage descriptions, privacy policy and store disclosures. Local declarations alone do not prove console forms agree. |
| `listing` | Required locales, release notes/screenshots/metadata, and reviewer access where applicable. Account secrets never enter the report. |
| `rollout` | Owner, stages, monitoring signals and halt thresholds, plus a verified halt/kill-switch/higher-build hotfix path. Mark proposed thresholds as proposals until accepted. A halt does not revert installed binaries. See [Play staged rollouts](https://support.google.com/googleplay/android-developer/answer/6346149) and [Apple phased releases](https://developer.apple.com/help/app-store-connect/update-your-app/release-a-version-update-in-phases); confirm their current behavior before planning recovery. |

If a requirement within a gate does not apply (for example no R8 mapping when R8 is disabled), cite evidence and the reason; do not omit the gate. A gate can pass with a justified non-applicability statement only after verifying all of its applicable requirements. No gate is waived simply to obtain GO.

Current store rules must be checked against official sources, such as [Google Play target API requirements](https://support.google.com/googleplay/android-developer/answer/11926878) and [Apple's upcoming requirements](https://developer.apple.com/news/upcoming-requirements/). State the exact unresolved confirmation if browsing or store access is unavailable. Do not reuse a date or minimum SDK from memory.

## Decision rule

- **NO-GO:** any required gate fails, is unknown, is missing, or has no supporting evidence. Missing targets also block. Distinguish observed failures from missing verification.
- **GO WITH RISKS:** every required gate passes and explicitly documented non-blocking risks remain. A risk cannot waive an unresolved required gate.
- **GO:** every required gate passes and there are no outstanding risks.

The combined verdict covers every included target; one platform passing cannot approve another.

Use [the verdict helper](../scripts/verdict.mjs) to check the report's decision. It validates completeness and consistency, **not the truth of the evidence or whether a risk is truly non-blocking**. Supply JSON on stdin using a quoted heredoc delimiter (no shell expansion):

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/mobile-release/scripts/verdict.mjs" <<'REIS_RELEASE_EVIDENCE'
{"targets":[{"target":"android:production","gates":[{"id":"build","status":"unknown","evidence":[],"nextAction":"Release owner: provide the release CI job and artifact for the requested revision."}]}],"risks":[]}
REIS_RELEASE_EVIDENCE
```

This intentionally incomplete example returns NO-GO. Replace it with the actual targets and all 11 gates; use one target name per artifact/store/track combination. `evidence` is an array of non-empty references (`file:line`, command plus result/log, artifact metadata, CI URL or dated portal confirmation). `nextAction` explains what resolves each fail/unknown. `risks` is an optional array of objects with `id`, `description`, evidence references, `mitigation` and `owner`; include only evidenced issues whose impact truly does not block the release. The auditor is responsible for that classification. Do not place secrets in JSON. Choose a heredoc delimiter absent from the payload. The helper writes only stdout; exit 0 means evaluation succeeded, **not** GO. Malformed input exits 1 and must be corrected before reporting a verdict. Preserve returned unknowns and blockers; do not manually upgrade the result.

## Report

Write in the requested language; keep gate IDs and verdict identifiers stable.

```markdown
## Release readiness — <app> <version/build>
Verdict: GO | GO WITH RISKS | NO-GO
Scope: <included artifacts/stores/tracks and explicit exclusions>

### Release identity
| Target | App ID | Variant/environment | Version/build | Revision | Store/track | Artifact | Evidence |
|---|---|---|---|---|---|---|---|

### Gates
| Target | Gate | Status | Evidence / missing confirmation | Next action / owner |
|---|---|---|---|---|

### Blockers
Observed failures and unverified required gates, separately identified.

### Risks
Non-blocking risks, mitigation and owner.

### Unknowns
Missing evidence and the exact external confirmation needed.

### Next actions
Ordered resolution steps; commands prepared versus commands actually executed.

### Rollout and rollback
Stages, signals, thresholds, owner and recovery for users already updated.
```

## Read-only boundary

A readiness audit inspects files, existing artifacts/logs and accessible CI/store records. Do not build, run tests, install dependencies, execute Fastlane lanes, prebuild, bump versions, tag, upload, change signing or store settings by default. Inspect scripts before considering execution. Prepare exact commands for missing checks and label them **not executed**. An explicit request to execute a release authorizes only that requested scope; reuse existing authorization, and complete reviewable preparation before any additional approval that is actually needed. Never change an app merely to make the audit green.
