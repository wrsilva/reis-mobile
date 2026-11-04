---
name: mobile-ui-ux
description: Designs and reviews mobile interfaces across Flutter, Android, iOS, React Native and Kotlin Multiplatform. Use for UI/UX, wireframes, screen redesigns, design systems, visual hierarchy, typography, adaptive layouts, navigation flows, component states and usability reviews of screenshots, Figma artifacts or UI code. Includes an Apple HIG reference workflow for Apple targets while preserving Android conventions.
intents: [design]
stacks: ["*"]
---

# Mobile UI/UX

Turn a product task into a coherent mobile journey and a design that can be implemented and checked. Reuse the app's visual language unless the requested scope calls for a new one.

## Choose references

| Target or task | Read |
|---|---|
| Flutter | [Flutter](references/flutter.md) |
| Native Android | [Android](references/android.md) |
| Native iOS | [iOS](references/ios.md) |
| React Native / Expo | [React Native](references/react-native.md) |
| Kotlin Multiplatform | [Kotlin Multiplatform](references/kotlin-multiplatform.md) |
| Apple HIG review, Apple-target design, materials or platform-specific behavior | [Apple design](references/apple-design.md) |

Also use [mobile-accessibility](../mobile-accessibility/SKILL.md) for accessibility verification. Open only the references needed for the current target and interaction.

## Ground the work

Read the product brief and real routes, screen components, themes and supported OS/toolkit versions. Identify the task, audience, primary action, constraints and success condition. For a new feature, state assumptions and distinguish proposed components from existing ones. Respect supplied brand assets and designs. Do not invent customer research or conversion results.

Choose the requested mode: review, design or implementation. A review needs evidence and actionable fixes; a design needs a flow, layout and interaction contract; an implementation needs working code and verification. Do not stop at advice when the user asks for changes.

## Specify the flow and visual system

- Map entry, decisions, completion, back and cancel. Name the destination of each action and what happens to unsaved input.
- Inventory relevant states: initial, loading, populated, empty, validation error, network error, retry, disabled and success. Explain how focus and feedback change between them.
- Establish hierarchy with real content. Identify the main action, secondary actions and information groups before choosing decoration.
- Reuse or propose semantic tokens for surfaces, text, actions, status, type roles, spacing, shape and motion. Show where each token is consumed, its light/dark behavior and how it scales. Avoid creating a parallel theme for one screen.
- Describe what makes the design appropriate to this product. Preserve familiar navigation and input behavior while giving content and brand a deliberate visual treatment.
- Specify compact and expanded layouts using available space, safe areas and keyboard constraints. Include long content, localization/RTL, large text and reduced motion. Select actual test dimensions from supported targets.
- Write labels in the product's vocabulary; errors should explain recovery and preserve useful input. Pair gestures with discoverable alternatives.

## Review with evidence

Trace shared components and resolved theme values before claiming a defect. Cite source locations or annotate the supplied artifact. A static image can reveal visual hierarchy but cannot prove hit area, reading order, back behavior or screen-reader output. Measure rendered colors and effective sizes when available; otherwise record what must be checked.

Read the relevant official platform guidance before calling something a platform requirement. Cite the page and section consulted. Check API availability against the project's deployment target and dependency versions. When browsing is unavailable, label current requirements unverified and continue with the evidence available.

Rank issues by blocked tasks and recovery cost, then recurring friction and visual polish. Separate platform guidance, confirmed defects and aesthetic judgment. Do not treat every stylistic preference as a violation or apply iOS conventions to Android-only UI.

## Deliver and verify

Provide a compact journey/wireframe and a table of component, state, action, destination/feedback and implementation owner. For changes, list reused/new tokens and the affected files. Verify the primary journey plus failure/retry, back/cancel and keyboard input on supported targets. Inspect light/dark, large text and the relevant assistive technology. Use existing screenshot or UI tests when they cover the change; add regression tests for behavior rather than mirroring token constants.

State exactly what ran, what was observed and which device checks remain. A source-only review is not a usability study or accessibility certification.
