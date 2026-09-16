---
name: mobile-accessibility
description: Audits and fixes accessibility in mobile apps on every stack — screen reader labels, roles, states and reading order for TalkBack and VoiceOver, decorative elements, grouping, touch target size, text scaling and Dynamic Type, color contrast, focus in dialogs and announcements for dynamic content — with the exact APIs for Flutter (Semantics), native Android (Jetpack Compose semantics and Views), native iOS (SwiftUI and UIKit) and React Native, plus automated checks in tests. Use when building or reviewing UI for accessibility, preparing an accessibility audit, fixing TalkBack or VoiceOver issues, or when the user mentions a11y, WCAG, screen readers, font scaling or contrast, even if they only point at one screen.
intents: [accessibility]
stacks: ["*"]
---

# Mobile Accessibility

One accessibility process for every mobile stack. This file holds what is true everywhere; each platform's APIs, tools and pitfalls live in its reference.

## 1. Pick the reference

| Project | Read |
|---|---|
| Flutter | [references/flutter.md](references/flutter.md) |
| Native Android: Jetpack Compose or Views | [references/android.md](references/android.md) |
| Native iOS: SwiftUI or UIKit | [references/ios.md](references/ios.md) |
| React Native or Expo | [references/react-native.md](references/react-native.md) |

In Flutter and React Native apps, the native reference applies only to screens or components written natively (platform views, native modules with UI).

## 2. What a screen reader user needs

Every interactive element exposes four things to the accessibility tree. Check them in this order:

1. **Name.** What it is or does, in words: "Delete task", not "trash icon" or nothing. Text children usually provide it; icon-only controls, images that carry meaning and custom-drawn controls need an explicit label.
2. **Role.** Button, checkbox, switch, slider, link, header, image. A tappable container without a role is read as plain text, and the user does not know it can be activated.
3. **State and value.** Checked, selected, expanded, disabled, the slider's value. When the state changes, the new state is read.
4. **Order and grouping.** Reading order follows the visual order. Related pieces (an avatar, a name and a timestamp in a list row) are one element, not three swipes.

And the tree must not contain noise: decorative images, dividers and duplicated text are hidden from assistive technology.

## 3. Checks (all stacks)

**Perceivable**
- [ ] Icon-only buttons, image buttons and meaningful images have a label that describes the action or content.
- [ ] Decorative images and icons next to text that already says the same are excluded from the accessibility tree.
- [ ] Text contrast is at least 4.5:1, or 3:1 for large text; icons and control borders that carry meaning reach 3:1 (WCAG 1.4.3 and 1.4.11). Contrast cannot be proven from code alone when colors come from themes or images: say so and name the tool that measures it.
- [ ] Information is not conveyed by color only (an error shown only as a red border).

**Operable**
- [ ] Touch targets are at least 48×48 dp on Android and 44×44 pt on iOS, even when the visible icon is smaller. The layout extends the tappable area instead of the icon.
- [ ] Gestures (swipe to delete, long press, drag) have an alternative: a visible button or a custom accessibility action.
- [ ] Modal dialogs and bottom sheets move focus inside when they open and return it when they close; content behind them is not reachable.
- [ ] Timeouts, auto-advancing carousels and animations can be paused or respect the system's reduce motion setting.

**Understandable**
- [ ] Form fields have a persistent label, not only a placeholder; errors are announced and say how to fix the input.
- [ ] Screen titles and section headers are marked as headers, so users can jump between them.
- [ ] Dynamic changes the user did not trigger by moving focus — a snackbar, a validation error, "3 results", loading finished — are announced.

**Robust**
- [ ] Text scales with the system font size setting up to the largest accessibility sizes without truncation, overlap or clipped containers. Fixed heights on text containers are the usual cause.
- [ ] Custom-drawn controls (canvas, custom painters, gesture detectors) expose name, role, state and actions explicitly.
- [ ] The layout works in landscape and with the display size (screen zoom) setting increased.

## 4. Evidence and severity

Point to `file:line` for every finding and give the fix in the platform's own API, not pseudocode.

- **Critical:** a screen reader user cannot complete the flow — an unlabeled primary action, a control that cannot be activated with the screen reader, focus trapped or lost, a custom control invisible to the tree.
- **High:** the flow is possible but misleading or very hard — wrong role, missing state, targets far below the minimum, text that clips at larger sizes, unannounced errors.
- **Medium:** noise and friction — decorative elements read aloud, rows split into many swipes, missing headers.
- **Low:** polish — hints, custom action names, reading order inside a well-labeled group.

## 5. Verify on a device

Code review finds most problems; only assistive technology confirms the experience. Recommend the automated checks listed in the reference for the test suite, then a manual pass: TalkBack on Android and VoiceOver on iOS through the flow, the largest font size, and the platform's scanner (Accessibility Scanner on Android, Accessibility Inspector in Xcode). Say which findings came from code only.
