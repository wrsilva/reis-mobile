# Flutter Widget Review

Apply to Dart files with widgets (`StatelessWidget`, `StatefulWidget`, `ConsumerWidget`, `HookWidget`...). Items are ordered by impact: the first ones cause crashes or visible bugs.

## 1. Lifecycle and async (crash / bug)

- [ ] **`BuildContext` after `await`.** Using `context` (`Navigator.of`, `ScaffoldMessenger.of`, `Theme.of`) after an `await` without checking `if (!context.mounted) return;` (or `mounted` in a `State`). The `use_build_context_synchronously` lint covers some of the cases.
- [ ] **`setState` after `dispose`.** `Future`, `Stream` or `Timer` callbacks that call `setState` without checking `mounted`.
- [ ] **Resources without `dispose`.** `TextEditingController`, `AnimationController`, `ScrollController`, `PageController`, `FocusNode`, `StreamSubscription`, `Timer` and `ChangeNotifier` created in the `State` must be released in `dispose()`.
- [ ] **Controller created inside `build`.** Recreates the controller on every rebuild and loses state (typed text, scroll position).
- [ ] **`Future` created inside `build`.** `FutureBuilder(future: api.fetch())` repeats the request on every rebuild. The `Future` should be created in `initState`, in the state management layer or memoized.
- [ ] **Side effects in `build`.** Navigation, `showDialog`, analytics or network calls inside `build`. They belong in listeners (`BlocListener`, `ref.listen`) or in `addPostFrameCallback`.

## 2. State and identity

- [ ] Reorderable or removable list items without a stable `Key` (`ValueKey(item.id)`): state ends up on the wrong item.
- [ ] `GlobalKey` created inside `build`.
- [ ] Business state kept in a `StatefulWidget` when the project already uses a state manager.

## 3. Rendering performance

- [ ] Missing `const` constructors in static subtrees (only report in widgets that rebuild often).
- [ ] Long lists with `ListView(children: [...])` / `Column` inside `SingleChildScrollView`: use `ListView.builder` or `SliverList`.
- [ ] `shrinkWrap: true` on a large list inside another scroll view: forces layout of every item.
- [ ] Rebuild scope too large: `setState`, `BlocBuilder` or `Consumer` at the top of the screen when only one part changes. Use `buildWhen`, `select` or extract the widget.
- [ ] `MediaQuery.of(context)` used only for the size: `MediaQuery.sizeOf(context)` rebuilds less. Confirm the project's Flutter SDK pin or installed toolchain before suggesting it.
- [ ] Network images without `cacheWidth`/`cacheHeight` or without caching, decoded at full resolution to display thumbnails.
- [ ] Animated `Opacity` or `ClipRRect`/`BackdropFilter` in list items: prefer `FadeTransition`/`AnimatedOpacity` and avoid unnecessary clipping.
- [ ] Heavy work (parsing large JSON, cryptography, image processing) on the UI thread: use `compute`/`Isolate.run`.

## 4. Layout

- [ ] `Row` with `Text` without `Expanded`/`Flexible`: overflow with long text or a larger system font.
- [ ] Fixed height or width for text content: breaks with a high `textScaler`.
- [ ] Missing `SafeArea` on screens without `Scaffold`/`AppBar`.
- [ ] Keyboard covering fields: form outside a scroll view.

## 5. Accessibility and i18n

- [ ] `IconButton` and `GestureDetector` without `tooltip` or `Semantics(label: ...)`.
- [ ] Touch target smaller than 48x48 dp.
- [ ] Hardcoded visible strings when the project already uses `intl`/`AppLocalizations`.
- [ ] Information conveyed by color alone.

## Output

Report in the appropriate section of the report (Bugs for section 1, Performance for section 3...), always with `file:line` and the corrected snippet when the fix is short.
