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

- has a description that says **what it does and when to use it**, since that is what Claude Code uses to activate it;
- is a verifiable checklist, ordered by impact (crashes and data loss first);
- does not state versions, lints or store requirements from memory. When the value changes over time, it says to verify it;
- states which report section each finding goes into.

## Releasing a version

1. Update the version in `package.json`, `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, and record the changes in `CHANGELOG.md`.
2. `node scripts/versions.mjs vX.Y.Z` confirms everything matches.
3. `npm pack --dry-run` lists what the npm package will contain.
4. Commit, `git tag -a vX.Y.Z` and `git push origin main vX.Y.Z`.
5. The **Release** workflow runs the tests, creates the GitHub release and publishes to npm with the `NPM_TOKEN` secret. Both steps skip what already exists, so re-running the workflow is safe.

The Claude Code and Codex plugins update from the repository itself: there is nothing else to publish.
