# Accessibility in Flutter

Flutter builds its own semantics tree from widgets and hands it to TalkBack and VoiceOver. Material and Cupertino widgets already fill in most of it; custom widgets built from `GestureDetector`, `InkWell` without children text, `CustomPaint` and images do not. For the broader Flutter guide (including localization), see `mobile-flutter` → `references/accessibility-i18n.md`.

## Labels, roles and states

| Need | API |
|---|---|
| Label an icon button | `IconButton(tooltip: 'Delete task', ...)` — the tooltip becomes the label |
| Label a meaningful image | `Image.asset(..., semanticLabel: 'Profile photo of Ana')` |
| Hide a decorative image | `Image.asset(..., excludeFromSemantics: true)`, or wrap in `ExcludeSemantics` |
| Custom tappable widget | `Semantics(button: true, label: '...', onTap: ..., child: ...)` |
| Toggle state | `Semantics(toggled: value, ...)` or `checked:` for checkbox-like controls |
| Header | `Semantics(header: true, child: Text('Settings'))` |
| Replace children's semantics | `Semantics(label: '...', excludeSemantics: true, child: ...)` |
| Merge a row into one element | `MergeSemantics(child: ListTile(...))` |
| Extra actions for gestures | `Semantics(customSemanticsActions: {CustomSemanticsAction(label: 'Archive'): _archive})` |
| Text field label | `TextField(decoration: InputDecoration(labelText: 'Email', errorText: ...))` |

Pitfalls:

- `GestureDetector` and `InkWell` around an `Icon` expose a tap action but no label. Prefer `IconButton`, or add `Semantics`.
- `Icon(semanticLabel: ...)` labels the icon, but it is still not a button. Put the label on the tappable widget.
- `Semantics` without `container: true` may merge into an ancestor; set it when a widget must be its own node.
- `CustomPaint` is invisible to screen readers unless its painter implements `semanticsBuilder` or it is wrapped in `Semantics`.

## Announcements and focus

- Mark text that changes on its own (a counter, a status) with `Semantics(liveRegion: true, ...)`.
- For one-off messages, `SemanticsService.announce(message, textDirection)` exists in `package:flutter/semantics.dart`; check its status in the Flutter version in `pubspec.lock`'s SDK constraint before recommending it, since the announcement APIs have been evolving for multi-view support.
- `SnackBar`s shown through `ScaffoldMessenger` are announced by the framework.
- Dialogs opened with `showDialog` and routes block the semantics of what is behind them; custom overlays built with `Stack` and `Positioned` do not — use `BlockSemantics` or a route.
- Control reading order with `Semantics(sortKey: OrdinalSortKey(n))` only when the visual order and the widget order genuinely differ.

## Touch targets and text scaling

- Material's minimum is `kMinInteractiveDimension` (48). `ThemeData.materialTapTargetSize: MaterialTapTargetSize.shrinkWrap` shrinks it — flag it on interactive components.
- Small icons: keep the visual size and give the tappable widget `constraints: BoxConstraints(minWidth: 48, minHeight: 48)` or padding.
- Text scaling comes from `MediaQuery.textScalerOf(context)`. Flag code that overrides it for the whole app (`MediaQuery(data: ...copyWith(textScaler: TextScaler.noScaling))`) and fixed-height containers around text.
- Respect reduced motion with `MediaQuery.disableAnimationsOf(context)`.

## Automated checks

Widget tests can assert the guidelines that `flutter_test` ships:

```dart
testWidgets('login screen meets accessibility guidelines', (tester) async {
  final handle = tester.ensureSemantics();
  await tester.pumpWidget(const MaterialApp(home: LoginScreen()));

  await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
  await expectLater(tester, meetsGuideline(iOSTapTargetGuideline));
  await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
  await expectLater(tester, meetsGuideline(textContrastGuideline));
  handle.dispose();
});
```

Find semantics nodes in tests with `find.bySemanticsLabel('Delete task')`. On a device, use TalkBack and VoiceOver, and the `showSemanticsDebugger: true` flag of `MaterialApp` to see the tree.
