# Accessibility on native Android

TalkBack reads the accessibility tree built from Compose semantics or from View properties. Material components fill in roles and states; custom composables with `Modifier.clickable`, `pointerInput` or `Canvas`, and custom Views, need them explicitly.

## Jetpack Compose

| Need | API |
|---|---|
| Label an icon-only control | `Icon(Icons.Default.Delete, contentDescription = "Delete task")` inside `IconButton` |
| Hide a decorative icon or image | `contentDescription = null` |
| Role for a custom clickable | `Modifier.clickable(role = Role.Button, onClickLabel = "Open details") { }` |
| Toggle with role and state | `Modifier.toggleable(value = checked, role = Role.Checkbox, onValueChange = ...)` on the whole row |
| Merge a row into one element | `Modifier.semantics(mergeDescendants = true) {}` |
| Replace children's semantics | `Modifier.clearAndSetSemantics { contentDescription = "..." }` |
| Header | `Modifier.semantics { heading() }` |
| Custom state text | `Modifier.semantics { stateDescription = "Expanded" }` |
| Live updates | `Modifier.semantics { liveRegion = LiveRegionMode.Polite }` |
| Gesture alternative | `Modifier.semantics { customActions = listOf(CustomAccessibilityAction("Archive") { archive(); true }) }` |
| Dialog or pane title | `Modifier.semantics { paneTitle = "Filters" }` |
| Reading order | `Modifier.semantics { traversalIndex = 1f }` with `isTraversalGroup = true` on the container |

Pitfalls:

- A `Checkbox` or `Switch` next to a `Text` in a `Row` produces two elements and a checkbox without a name. Make the `Row` `toggleable` and pass `onCheckedChange = null` to the inner control.
- `Modifier.size(24.dp)` on an `IconButton` shrinks the touch target. Material components apply `Modifier.minimumInteractiveComponentSize()` (48 dp); keep the icon small, not the button.
- `Modifier.pointerInput` and `detectTapGestures` add no semantics at all; prefer `clickable`, or add `onClick` in `semantics`.
- Text sizes in `dp` instead of `sp` do not scale with the font size setting.

## Views

| Need | API |
|---|---|
| Label | `android:contentDescription`, or `android:labelFor` on the `TextView` that labels an input |
| Hide decorative | `android:importantForAccessibility="no"` (or `contentDescription="@null"` on `ImageView`) |
| Group | `android:focusable="true"` on the container with `android:screenReaderFocusable="true"` |
| Header | `android:accessibilityHeading="true"` / `ViewCompat.setAccessibilityHeading` |
| Live updates | `android:accessibilityLiveRegion="polite"` |
| Role, state, actions | `ViewCompat.setAccessibilityDelegate` with `onInitializeAccessibilityNodeInfo`, or `ViewCompat.addAccessibilityAction` |
| Text field hint and error | `TextInputLayout` with `hint` and `error` |

`View.announceForAccessibility` is discouraged in recent Android releases in favor of live regions and pane titles; check the `compileSdk` and the method's documentation before recommending it.

## Touch targets and text

- 48×48 dp minimum. For small icons use padding or `TouchDelegate` in Views.
- Text in `sp`; containers with `wrap_content` or minimum heights, not fixed heights.
- Test at the largest font size and display size in Settings, including the nonlinear font scaling of Android 14 and later.

## Automated checks

- Espresso: `AccessibilityChecks.enable()` from `androidx.test.espresso:espresso-accessibility` runs the Accessibility Test Framework on every view action.
- Compose UI tests can assert semantics: `onNodeWithContentDescription("Delete task").assertHasClickAction()`, `assert(hasStateDescription("Expanded"))`.
- Lint flags missing `contentDescription` on `ImageView` and `ImageButton` (`ContentDescription`) and small touch targets in some layouts.
- Manual: TalkBack, the Accessibility Scanner app, and Settings → Accessibility → font and display size.
