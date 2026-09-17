# Contributing

Thanks for your interest in reis-mobile.

## Environment

- Node.js 22 or later
- Git

```bash
git clone https://github.com/wrsilva/reis-mobile.git
cd reis-mobile
npm run check
```

There is no `npm install`: the project has no dependencies.

To test the plugin in Claude Code from the clone:

```text
/plugin marketplace add /path/to/reis-mobile
/plugin install reis-mobile@reis-mobile
```

After editing agents, skills or commands, restart the Claude Code session to reload the plugin.

## Where to start

- Issues labeled [`good first issue`](https://github.com/wrsilva/reis-mobile/labels/good%20first%20issue) are small and well scoped.
- [`help wanted`](https://github.com/wrsilva/reis-mobile/labels/help%20wanted) shows where the project needs help the most, such as Android, iOS and React Native skills.
- Questions and not-yet-formed ideas go to [Discussions](https://github.com/wrsilva/reis-mobile/discussions).
- Read the [Code of Conduct](CODE_OF_CONDUCT.md). It applies to issues, PRs and discussions.

## Workflow

1. Open an issue using the appropriate template (bug, feature or new skill/agent), describing the mobile problem the change solves. For small, obvious changes such as typos, you can go straight to a PR.
2. Create a branch from `main`.
3. Follow the rules in [AGENTS.md](AGENTS.md).
4. Run `npm run check`.
5. Fork, create the branch and open the PR against `main`. The template asks for verification and a checklist, preferably with the output of `reis-mobile route` or `reis-mobile review` on a real project.
6. CI must pass and the maintainer must approve. PRs are squash merged and the title becomes the commit message, so use Conventional Commits in the title.

## License of contributions

By contributing, you agree that your contribution is distributed under the project's [MIT license](LICENSE). Third-party content is only accepted with a compatible license, declaring `source` and `license` and with the notice in `THIRD_PARTY_NOTICES.md`.

## Language

Write everything in English: agents, skills, commands, documentation, code comments and commit messages. See [AGENTS.md](AGENTS.md) for the exceptions.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`.

## Skill quality

A good reis-mobile skill:

- lives in the right place: a topic that exists on several stacks gets a reference per platform in a `mobile-<topic>` skill (see `skills/mobile-test`), and something that exists on one stack goes into that platform skill (`mobile-flutter`, `mobile-android`, `mobile-ios`, `mobile-rn`);

- has a description that says **what it does and when to use it**, since that is what Claude Code uses to activate it;
- is a verifiable checklist, ordered by impact (crashes and data loss first);
- does not state versions, lints or store requirements from memory. When the value changes over time, it says to verify it;
- states which report section each finding goes into.

## Releasing a version

1. Change only the `version` field in `package.json` and move the release notes from `[Unreleased]` to a dated section in `CHANGELOG.md`.
2. Run `npm run version:sync` to update the Claude Code plugin and marketplace manifests locally, then `npm run check` and `npm pack --dry-run` to verify the release. The CI and Release workflows also run the synchronization, so a direct edit to `package.json` is enough.
3. Merge or push to `main`. The **Release** workflow verifies the version is newer than existing tags, validates and tests the package, commits synchronized manifests if needed, creates `vX.Y.Z`, publishes to npm, and creates the GitHub release. It skips publication when that tag already exists.

`NPM_TOKEN` must be configured for the Release workflow, and GitHub Actions needs permission to push the generated manifest commit and tag to `main`. If a release stops after creating its tag, rerun the workflow manually with the existing tag in the `workflow_dispatch` input. A manually pushed `vX.Y.Z` tag also runs the same idempotent publication steps.

The Claude Code and Codex plugins update from the repository itself: there is nothing else to publish.
