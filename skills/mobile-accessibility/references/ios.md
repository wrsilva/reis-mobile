# Accessibility on native iOS

VoiceOver reads accessibility elements built from SwiftUI modifiers or UIKit properties. Standard controls come with traits and values; custom views, gesture recognizers and drawn content need them explicitly. For the broader iOS UI guide, see `mobile-ios` → `references/ui-navigation.md`.

## SwiftUI

| Need | API |
|---|---|
| Label an icon-only button | `Button { } label: { Image(systemName: "trash") }.accessibilityLabel("Delete task")`, or `Label("Delete task", systemImage: "trash").labelStyle(.iconOnly)` |
| Hide a decorative image | `Image(decorative: "divider")` or `.accessibilityHidden(true)` |
| Trait for a custom tappable view | Use `Button` instead of `.onTapGesture`; otherwise `.accessibilityAddTraits(.isButton)` |
| Header | `.accessibilityAddTraits(.isHeader)` |
| Group a row | `.accessibilityElement(children: .combine)` |
| Replace children | `.accessibilityElement(children: .ignore).accessibilityLabel("...")` |
| Value | `.accessibilityValue("3 of 5")` |
| Hint | `.accessibilityHint("Opens the order details")` — only when the label is not enough |
| Gesture alternative | `.accessibilityAction(named: "Archive") { archive() }` |
| Adjustable control | `.accessibilityAdjustableAction { direction in ... }` |
| Reading order | `.accessibilitySortPriority(_:)` inside a container |
| Announcement | `AccessibilityNotification.Announcement("Saved").post()` (iOS 17+) or `UIAccessibility.post(notification: .announcement, argument: "Saved")` |

Pitfalls:

- `.onTapGesture` on an `HStack` does not add the button trait, so VoiceOver does not say the row can be activated; `Button` with a custom style keeps the look and the trait.
- `.font(.system(size: 17))` does not scale with Dynamic Type. Use text styles (`.font(.body)`) and `@ScaledMetric` for custom sizes and spacing.
- `.frame(height:)` on text containers clips at accessibility sizes; use `minHeight`, and switch `HStack` to `VStack` with `@Environment(\.dynamicTypeSize)` when `dynamicTypeSize.isAccessibilitySize`.
- Respect `@Environment(\.accessibilityReduceMotion)` for animations.

## UIKit

| Need | API |
|---|---|
| Element and label | `isAccessibilityElement = true`, `accessibilityLabel` |
| Hide decorative | `isAccessibilityElement = false` or `accessibilityElementsHidden = true` on a container |
| Traits | `accessibilityTraits = [.button]`, `.header`, `.selected`, `.notEnabled` |
| Group a cell | set `isAccessibilityElement = true` and a combined label on the cell |
| Custom actions | `accessibilityCustomActions = [UIAccessibilityCustomAction(name: "Archive") { _ in ... }]` |
| Modal | `accessibilityViewIsModal = true` on the presented view |
| Screen or layout change | `UIAccessibility.post(notification: .screenChanged, argument: firstElement)` / `.layoutChanged` |
| Dynamic Type | `UIFont.preferredFont(forTextStyle:)`, `UIFontMetrics`, `adjustsFontForContentSizeCategory = true` |

## Touch targets

Apple's Human Interface Guidelines recommend at least 44×44 points. In SwiftUI, extend the hit area with `.frame(minWidth: 44, minHeight: 44)` and `.contentShape(Rectangle())`; in UIKit, override `point(inside:with:)` or enlarge the button's frame, not the image.

## Automated checks

- XCUITest: `try app.performAccessibilityAudit()` (Xcode 15, iOS 17 and later) checks contrast, hit regions, element descriptions, Dynamic Type clipping and traits; pass a set of audit types or a handler to ignore known issues.
- Query by label in UI tests (`app.buttons["Delete task"]`): a test that finds elements by label breaks when a label disappears.
- Manual: VoiceOver on a device, Accessibility Inspector in Xcode (audit and inspection), and Environment Overrides in the debug bar for Dynamic Type, contrast and reduce motion.
