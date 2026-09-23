# Releasing a version

The single source for how a reis-mobile version is cut. Written so that a person **or an AI agent** can follow it without reverse-engineering the workflows.

Read this before touching `package.json`, `CHANGELOG.md` or anything under `.github/workflows/`.

## The one rule

**`package.json` is the only version you edit. Everything else is generated.**

`scripts/versions.mjs` owns the rest. Editing `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, the README's release block or the changelog's dated heading by hand creates a conflict with the automation, not a shortcut.

| File | Who writes it |
|---|---|
| `package.json` → `version` | **You** |
| `CHANGELOG.md` → notes under `## [Unreleased]` | **You** |
| `.claude-plugin/plugin.json` → `version` | `npm run version:sync` |
| `.claude-plugin/marketplace.json` → `metadata.version` and the plugin entry | `npm run version:sync` |
| `CHANGELOG.md` → the `## [X.Y.Z] - YYYY-MM-DD` heading | `npm run version:sync` |
| `README.md` → between the `latest-release` markers | `npm run version:sync` |
| The `vX.Y.Z` tag, the npm package, the GitHub release | The **Release** workflow |

## What you write

### 1. The version

`package.json` only, and it must be a **stable** `X.Y.Z` — no `-beta`, no `-rc`. `isStableVersion` in `scripts/version-format.mjs` rejects anything else, and the release fails before it starts.

It must also be **newer than every existing `v*` tag**. `scripts/release-plan.mjs` compares against the tag list and throws `package.json version X.Y.Z must be newer than vA.B.C`.

Semver, judged by what the change does to a *consumer of the plugin*:

| Bump | When |
|---|---|
| **patch** | A fix inside an existing skill, agent, command or the CLI; documentation |
| **minor** | New skill, agent, command, intent or stack; new references; anything additive |
| **major** | A removed or renamed skill/agent/command/intent, or a CLI flag that changes meaning |

### 2. The release notes

Under `## [Unreleased]` in `CHANGELOG.md`, using Keep a Changelog sections (`### Added`, `### Changed`, `### Fixed`, `### Removed`).

**This is not optional.** With a bumped version and an empty `[Unreleased]`, `planReleaseDocs()` throws:

```
CHANGELOG.md needs notes under [Unreleased] for 0.8.0
```

and CI fails on the pull request, before the release workflow ever runs. This is the single most common way a release is blocked.

Two more constraints the parser enforces:

- `## [Unreleased]` must stay **above** the release history.
- Every dated heading must match `## [X.Y.Z] - YYYY-MM-DD` exactly.

## Do you commit the synced files?

Both answers work. Pick one deliberately — the difference is how many pull requests the release takes.

**Option A — leave them (the repo's usual path).** Commit only `package.json` and the changelog notes. CI runs `npm run version:sync` itself before validating, so the pull request is green. After the merge, the Release workflow opens a second pull request, `automation/release-sync-v<X.Y.Z>`, carrying the generated files. Merging *that* is what triggers the tag and the publish. Two pull requests, and the generated files are never hand-edited.

**Option B — commit them.** Run `npm run version:sync` yourself and include the four generated files in the same pull request. The workflow then finds nothing to sync and goes straight to tagging on merge. One pull request, but a rebase or a changed date makes the generated content stale and you have to re-run the sync.

Recent history uses **Option A** (`chore: new version 0.7.3` touches `package.json` alone; `chore(release): synchronize files for v0.7.3` comes from the bot afterwards).

## Before you open the pull request

```bash
npm run version:sync    # generates the four files — see the section above on whether to commit them
npm run check           # validate + test; must be green
npm pack --dry-run      # confirms the published file list
```

`npm run check` **fails locally on a version bump until `version:sync` has run** — two tests in `tests/distribution.test.mjs` assert the manifests and the README match `package.json`. That failure is expected and is not a bug:

```
✖ keeps package.json and the plugin manifests on the same version
✖ keeps the current README release section aligned with the changelog
```

Run `npm run version:sync` first, then `npm run check`. If you chose Option A, restore the generated files before committing.

## What the automation does

### On the pull request — `.github/workflows/ci.yml`

Runs `npm run version:sync`, then `npm run validate`, then `npm test`, on Node 22 and 24 × Ubuntu and macOS. A separate job packs the tarball, installs it globally and runs the CLI on Ubuntu, macOS and Windows. Seven required checks in total.

### On merge to `main` — `.github/workflows/release.yml`

In order:

1. **Synchronize release files** — `node scripts/versions.mjs --sync`.
2. **Plan release** — `release-plan.mjs --main` compares `package.json` against the existing tags and emits `tag=vX.Y.Z` and `release=true|false`. `release=false` when the tag already exists, which makes a re-run harmless.
3. **Check versions match the tag**, then **validate and test** (`npm run check`).
4. **Require npm publishing credentials** — fails if the `NPM_TOKEN` secret is missing.
5. **Open pull request for synchronized release files** — only if step 1 produced a diff. It pushes `automation/release-sync-v<tag>` and opens the pull request, then sets `pending=true`.
6. **Create release tag** — skipped while `pending=true`. Otherwise creates and pushes the annotated `vX.Y.Z`.
7. **Publish to npm** — `npm publish --provenance --access public`, guarded by `npm view reis-mobile@X.Y.Z`, so it never double-publishes.
8. **Create GitHub release** — guarded by `gh release view`, with generated notes.

Two safety behaviours worth knowing: the job aborts if `main` advanced while it was running (a newer run handles it), and the whole workflow is serialized by a `release-${{ github.repository }}` concurrency group.

**So a release normally takes two merges:** the change itself, then the sync pull request. Steps 6 to 8 only run on the second one.

## Repository configuration this depends on

Verify these before blaming the workflow. All of them have bitten this repository at least once.

| Setting | Required value | Why |
|---|---|---|
| Settings → Secrets → `NPM_TOKEN` | present | Step 4 fails without it, before anything is tagged |
| Settings → Actions → General → Workflow permissions → **Allow GitHub Actions to create and approve pull requests** | enabled | Step 5 cannot open the sync pull request otherwise |
| Secret `RELEASE_PR_TOKEN` | optional | A fine-grained PAT with contents and pull-request write. Used in preference to `github.token` when present; an alternative to the toggle above |
| Ruleset on `main` | 1 approval + the 7 CI checks | Both pull requests are subject to it. Repository admins have `bypass_mode: always` |

`default_workflow_permissions` is deliberately left at `read`: `release.yml` declares its own `permissions:` block with `contents: write` and `pull-requests: write`, so the restrictive default costs nothing.

## When something fails

| Symptom | Cause | Fix |
|---|---|---|
| CI: `CHANGELOG.md needs notes under [Unreleased] for X.Y.Z` | Version bumped, no release notes | Write the notes |
| CI: `keeps package.json and the plugin manifests on the same version` **locally** | `version:sync` has not run in the working tree | Run `npm run version:sync` |
| `package.json version X.Y.Z must be newer than vA.B.C` | The bump is not ahead of the latest tag | Bump higher |
| `package.json must contain a stable version` | A prerelease suffix | Use plain `X.Y.Z` |
| `GitHub Actions is not permitted to create or approve pull requests (createPullRequest)` | The Actions toggle above is off | Enable it, then open the `automation/release-sync-v*` pull request by hand for this release — the branch was already pushed |
| `main advanced while the release was running` | Another merge landed mid-run | Nothing to do; the newer run handles it |
| The tag exists but npm does not have the version | The publish step failed after tagging | Re-run: **Actions → Release → Run workflow**, passing the existing `vX.Y.Z`. Publishing is idempotent |
| npm still shows the previous version right after a green publish | Registry propagation | `npm notice Your package is being processed and may take a few minutes to become available` — wait and re-check |

The `workflow_dispatch` retry accepts only an existing stable tag (`^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$`); it checks out that tag and re-runs the validate, publish and release steps.

## Checklist

- [ ] `package.json` has the new stable `X.Y.Z`, higher than the latest `v*` tag.
- [ ] `CHANGELOG.md` has notes under `## [Unreleased]`, in Keep a Changelog sections.
- [ ] Nothing else version-related was hand-edited.
- [ ] `npm run version:sync && npm run check && npm pack --dry-run` are green.
- [ ] The pull request targets `main`, with a Conventional Commits title.
- [ ] After merging: the `automation/release-sync-v*` pull request exists, is green, and gets merged.
- [ ] After that merge: the `vX.Y.Z` tag, the npm version and the GitHub release all exist.
