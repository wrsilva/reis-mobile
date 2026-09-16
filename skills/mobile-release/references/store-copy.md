# Release notes and store listing copy

## Limits

Check the console when a field is rejected; these are the long-standing limits.

| Field | Google Play | App Store |
|---|---|---|
| App name | 30 characters | 30 characters |
| Short text | Short description: 80 | Subtitle: 30 |
| Editable without a new version | — | Promotional text: 170 |
| Description | 4,000 | 4,000 |
| Keywords | — (indexed from the listing text) | 100 bytes, comma-separated |
| Release notes | 500 per language | What's New: 4,000 |

The App Store description, keywords and What's New change only with a new version; promotional text changes at any time. Google Play listing text changes independently of releases.

## Release notes from the git history

1. **Collect the range.** `git log <last-release-tag>..HEAD --no-merges --pretty='%h %s'`. In a monorepo, limit it to the app folder (`-- apps/mobile`). When commits reference issues or pull requests, read their titles for context.
2. **Drop the noise.** Merges, version bumps, CI and tooling changes, formatting, typo fixes in code, dependency bumps without user impact, and reverted pairs.
3. **Classify what is left.** New or changed features, fixes the user could notice, performance improvements the user could feel, and internal changes (refactors, infrastructure, removed APIs).
4. **Write per audience:**
   - **Store notes (users):** only what users can see or feel, in plain language and benefit first. No ticket numbers, class names, library names or "various bug fixes" as the only line. Within the limit, in every listed language — flag missing translations instead of inventing them.
   - **Changelog (developers):** technical and complete, with commit hashes or issue references, grouped by type.
   - **QA notes (internal):** the risky areas — new features, refactored core flows, data migrations, removed code, SDK upgrades — each with what to test and on which OS versions or devices.
5. **Do not invent.** A change is described only when a commit or issue supports it. When a commit message is unclear, read the diff (`git show <hash> --stat`, then the relevant hunk) or list it as "needs description" for the team.

Template:

```markdown
## Store — <version>
<3–6 short lines, most valuable first>

## Changelog — <version> (<date>)
### Added
### Changed
### Fixed
### Performance
### Internal

## QA focus — <version>
- <area>: <what changed> → <what to test, where>
```

## Store listing

- **First 80–170 characters matter most:** the short description (Play) and subtitle or promotional text (App Store) are what users read before tapping. Lead with what the app does for the user, not the company.
- **Description structure:** one-sentence value proposition, three to six feature bullets written as benefits, then details (plans, requirements, support contact). No claims the app does not deliver and no competitor names.
- **Keywords (App Store):** no repeated words already in the app name or subtitle, no spaces after commas, no competitor or trademarked names.
- **Policy traps:** Google Play rejects keyword stuffing, misleading claims ("#1", "best") without attribution, and emojis or capitals used to attract attention in the title; Apple rejects references to other platforms and pricing claims that do not match the in-app purchases.
- **Localization:** translate the listing for each market the app is sold in, and keep screenshots consistent with the localized UI.
