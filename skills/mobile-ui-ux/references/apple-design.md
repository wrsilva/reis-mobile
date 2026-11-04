# Apple design reference workflow

## External material and provenance

The user-requested [apple-design-skill by dickwu](https://github.com/dickwu/apple-design-skill) is an optional external reading source for Apple-oriented interface reviews. Inspected revision: `ff4ebddf0488598723a82bfdce1afb04de0b1c44` (2026-11-04). Its [skill entry point at that revision](https://github.com/dickwu/apple-design-skill/blob/ff4ebddf0488598723a82bfdce1afb04de0b1c44/SKILL.md) links its topic references.

That revision has no LICENSE file or explicit redistribution license; its README attributes the reproduced HIG text to Apple. This plugin does not vendor its instructions, scripts or HIG snapshots, and does not assign them this repository's MIT license. The workflow here is original plugin guidance with external links. See [third-party notices](../../../THIRD_PARTY_NOTICES.md).

Read the external skill when the task calls for its Apple-focused perspective, then open only the topics relevant to the actual screen. Treat it as secondary reference material: check claims, numeric thresholds, hardware assumptions and API availability against current official documentation and the project's supported targets. Do not execute its download script or install its tool-specific configuration as part of a review.

## Choose official sources by decision

| Decision | Official starting point |
|---|---|
| Platform conventions and current topic index | [Apple HIG](https://developer.apple.com/design/human-interface-guidelines) |
| Adaptive organization, available space and positioning | [Layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| Text roles and scaling | [Typography](https://developer.apple.com/design/human-interface-guidelines/typography) |
| Semantic palette and appearance | [Color](https://developer.apple.com/design/human-interface-guidelines/color), [Dark mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode) |
| Assistive interactions and accessibility settings | [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| Navigation destinations and modal tasks | [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars), [Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets) |
| Translucency and system materials | [Materials](https://developer.apple.com/design/human-interface-guidelines/materials) |
| Form behavior | [Entering data](https://developer.apple.com/design/human-interface-guidelines/entering-data) |

Read the page before citing a requirement; record the heading and URL. If a page has moved, find it through the official index. If unavailable, mark the claim unverified rather than treating a cached third-party statement as current Apple policy.

## Apply to this app

Identify the Apple target and actual renderer before choosing components. In Flutter, React Native and shared Compose, separate the desired behavior from the framework implementation and verify both. Keep Android-specific decisions in the Android reference.

For each proposed change, connect the user task to a real screen/control, the consulted guidance, the intended behavior and a concrete verification step. Preserve brand identity where it does not interfere with comprehension and task completion. For materials, check readability with actual content behind the surface and relevant accessibility settings, and specify a fallback supported by the deployment target.

When reviewing a static artifact, report visual observations separately from runtime questions. When reviewing source, follow wrappers and resolved tokens. Never present estimated sizes, unmeasured contrast or untested assistive interactions as verified failures.
