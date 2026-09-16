# React Native Code Review

Apply to TypeScript and JavaScript sources of a React Native or Expo app, and to its native modules with the native checklists. Items are ordered by impact: the first sections cause crashes, leaks or wrong data. Check the React Native or Expo SDK version and the library versions in `package.json` before recommending an API.

## 1. Hooks and effects (bug / leak)

- [ ] **Missing effect cleanup.** Listeners (`AppState`, `Keyboard`, `Linking`, `Dimensions`), subscriptions, intervals and timeouts added in `useEffect` without returning a cleanup function.
- [ ] **Stale closures.** Effects, callbacks or memoized values that read props or state not listed in the dependency array. `react-hooks/exhaustive-deps` warnings silenced without a reason are findings.
- [ ] **State updates after unmount.** Requests started in an effect and never cancelled (no `AbortController`, no ignore flag) updating state of a screen the user left.
- [ ] **Hooks called conditionally** or inside loops.
- [ ] **Effects used for derived data.** State computed from props in an effect instead of during render causes an extra render and flicker.

## 2. State and data

- [ ] **Server data copied into global state** (Redux, Zustand, context) and synchronized by hand, instead of a server-state cache such as TanStack Query or RTK Query.
- [ ] **Impossible states.** Separate `loading`, `error` and `data` flags that can contradict each other; missing error and empty states.
- [ ] **Unvalidated responses.** API data used with `as` casts and no runtime validation at the boundary, so a contract change crashes deep in the UI.
- [ ] **Navigation params** carrying large objects, functions or data that should be fetched by id; params not typed.

## 3. Rendering performance

- [ ] **Long lists in `ScrollView` + `.map()`** instead of `FlatList`/`SectionList` (or FlashList, if the project uses it); missing or index-based `keyExtractor` for lists that change.
- [ ] **Context values recreated every render**, re-rendering every consumer; one large context for unrelated state.
- [ ] **Inline objects and callbacks** passed to memoized components, defeating `React.memo`. Only report on hot paths.
- [ ] **Animations driven by JavaScript state** per frame instead of Reanimated or `useNativeDriver: true`.
- [ ] **Remote images** without caching or sized far larger than displayed.

## 4. Platform and native code

- [ ] **Platform branches** (`Platform.OS`) scattered through screens instead of `.ios.tsx`/`.android.tsx` files or a small platform module.
- [ ] **Permissions** requested without handling denial or "don't ask again"; Android 13+ notification permission missing when push is used.
- [ ] **Deep links** (`Linking`, navigation linking config) acting on parameters without validating them.
- [ ] **Native modules** called directly from many components instead of one typed wrapper; changes to native code without the matching iOS and Android updates.
- [ ] **Safe areas and keyboard:** screens without safe area handling; forms hidden by the keyboard.

## 5. Security

- [ ] Tokens or credentials in `AsyncStorage` instead of the Keychain/Keystore (`react-native-keychain`, `expo-secure-store`).
- [ ] Secrets in `.env` files read through `react-native-config` or `EXPO_PUBLIC_*` variables: they are bundled into the app and readable.
- [ ] `react-native-webview` with `originWhitelist={['*']}` and an `onMessage` handler that acts on messages.
- [ ] Sensitive data in `console.log`, which stays in release builds unless removed. Details in `mobile-security`.

## 6. Expo and release

- [ ] Config plugins or `app.json`/`app.config.*` changes that require a new native build, shipped as an over-the-air update. Check that `runtimeVersion` changes when native code or config changes.
- [ ] Secrets placed in `app.json` `extra` fields, which are bundled into the app.
- [ ] Hermes disabled, or debug-only code (`__DEV__` branches missing) reachable in production.

## 7. Maintainability, accessibility and tests

- [ ] `any` types and `@ts-ignore` added without a reason; `strict` mode relaxed.
- [ ] Touchable elements without `accessibilityRole` and `accessibilityLabel`; touch targets smaller than about 44–48 points; text that ignores font scaling.
- [ ] User-visible strings hardcoded when the project uses i18n.
- [ ] New logic, hooks or screens without tests when the project has a Jest suite.

## Output

Report in the matching section of the review (Bugs for sections 1–2, Performance for section 3, Security for section 5), always with `file:line` and the corrected snippet when the fix is short.
