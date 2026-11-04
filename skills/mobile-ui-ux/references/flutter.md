# Flutter interface design

Inspect the existing widget tree, routing package, ThemeData/CupertinoTheme and supported targets. Reuse [Flutter UI guides](../../mobile-flutter/references/ui.md) for implementation.

- Resolve colors and text roles through the app theme, including custom theme extensions already present. Do not replace scalable text with fixed-height containers.
- Design from layout constraints; inspect SafeArea, scroll ownership and keyboard insets. Check narrow widths, large text and long translated labels together.
- Choose Material or Cupertino controls to match the target and app contract. An adaptive constructor does not guarantee every gesture, sheet or navigation convention is native.
- Specify selected, pressed, disabled, loading and validation states in shared widgets. Keep action labels and semantic roles available when icons or motion carry visual meaning.
- On iOS, consult [Apple design](apple-design.md); on Android, use [Android design guidance](android.md). Verify each target rather than copying Apple's styling into both.

Use existing widget/golden coverage for changed components, then exercise the complete flow on the intended target. A golden screenshot does not prove focus or gesture behavior.
