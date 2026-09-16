# Accessibility in React Native

React Native maps accessibility props to the native TalkBack and VoiceOver APIs. Core components such as `Button` and `Switch` fill in roles; `Pressable`, `TouchableOpacity` and `View` do not. Recent React Native versions also accept ARIA-style props (`role`, `aria-label`, `aria-checked`...) that map to the same native properties; follow whichever style the project already uses. For the broader guide, see `mobile-rn` → `references/ui-navigation.md`.

## Labels, roles and states

| Need | API |
|---|---|
| Label an icon-only control | `<Pressable accessibilityRole="button" accessibilityLabel="Delete task">` |
| Hide decorative content | `accessible={false}` on images; for subtrees `accessibilityElementsHidden` (iOS) **and** `importantForAccessibility="no-hide-descendants"` (Android) |
| Group a row | `accessible` on the container, with a combined `accessibilityLabel` when children's text is not enough |
| State | `accessibilityState={{ checked, selected, disabled, expanded, busy }}` |
| Value | `accessibilityValue={{ min: 0, max: 100, now: 40 }}` or `{{ text: '3 of 5' }}` |
| Header | `accessibilityRole="header"` |
| Hint | `accessibilityHint="Opens the order details"` |
| Gesture alternative | `accessibilityActions={[{ name: 'archive', label: 'Archive' }]}` with `onAccessibilityAction` |
| Live updates | `accessibilityLiveRegion="polite"` (Android); `AccessibilityInfo.announceForAccessibility('Saved')` for both |
| Modal | `<Modal>` handles focus; custom overlays need `accessibilityViewIsModal` (iOS) and `importantForAccessibility="no-hide-descendants"` on the content behind (Android) |
| Move focus | `AccessibilityInfo.setAccessibilityFocus(findNodeHandle(ref.current))` |

Pitfalls:

- A `Pressable` without `accessibilityRole` is read as plain text: the user does not know it is tappable.
- A checkbox built from `Pressable` and an icon needs `accessibilityRole="checkbox"` and `accessibilityState={{ checked }}`.
- The iOS-only and Android-only props are silently ignored on the other platform; hiding and modal behavior need both.
- `TextInput` without a visible label: add `accessibilityLabel`; placeholders are not labels.

## Touch targets and text scaling

- Keep interactive elements at 44×44 pt / 48×48 dp. Use `hitSlop` or padding to extend the area of small icons; `hitSlop` does not extend beyond the parent's bounds on Android.
- Text scales with the system font size by default. Flag `allowFontScaling={false}` on body text; prefer `maxFontSizeMultiplier` when a layout has a real limit. Avoid fixed `height` on text containers.
- Respect reduced motion with `AccessibilityInfo.isReduceMotionEnabled()` or Reanimated's `useReducedMotion()`.

## Automated checks

- React Native Testing Library queries by role and label (`screen.getByRole('button', { name: 'Delete task' })`), so tests fail when a role or label disappears. `toBeChecked`, `toBeDisabled` and `toBeExpanded` matchers read the accessibility state.
- ESLint: `eslint-plugin-react-native-a11y` flags missing roles and labels, when the project uses ESLint.
- Manual: TalkBack and VoiceOver on devices, the Accessibility Scanner app on Android and Accessibility Inspector in Xcode on the iOS build.
