# Android Code Review

Apply to Kotlin and Java sources under `src/main` (and `androidMain` in KMP). Items are ordered by impact: the first sections cause crashes, leaks or lost user data. Before flagging an API as missing or deprecated, check the library versions in the version catalog or build files.

## 1. Lifecycle and leaks (crash / leak)

- [ ] **Activity or View held beyond its lifecycle.** An `Activity`, `Fragment`, `View` or Activity `Context` stored in a singleton, companion object, `ViewModel`, static field or long-lived callback. `ViewModel`s must not reference Views or Activity contexts; use `applicationContext` only where a Context is truly needed.
- [ ] **Fragment view binding not cleared.** A binding stored in a property must be set to `null` in `onDestroyView`, since the Fragment outlives its view.
- [ ] **Flow collected without lifecycle awareness.** `lifecycleScope.launch { flow.collect {} }` keeps collecting in the background. Use `repeatOnLifecycle(Lifecycle.State.STARTED)`, and in Fragments use `viewLifecycleOwner.lifecycleScope`. In Compose, `collectAsStateWithLifecycle()` (from `lifecycle-runtime-compose`) instead of `collectAsState()`.
- [ ] **Listeners and receivers not unregistered.** `registerReceiver`, location or sensor listeners, and callbacks added in `onStart`/`onResume` without the matching removal.

## 2. Coroutines

- [ ] **`GlobalScope` or a hand-made `CoroutineScope` never cancelled.** Work should live in `viewModelScope`, `lifecycleScope` or an injected application scope.
- [ ] **Blocking work on the main thread.** File or database I/O, JSON parsing of large payloads or `runBlocking` on the main thread. Room throws on main-thread queries unless explicitly allowed; network libraries may not. Blocking calls belong in `withContext(Dispatchers.IO)` (or `Default` for CPU work).
- [ ] **Swallowed cancellation.** `catch (e: Exception)` around suspending calls also catches `CancellationException`; rethrow it, or catch narrower exceptions.
- [ ] **Unhandled exceptions in `launch`.** An exception in `launch` crashes the app unless handled; errors should become UI state, not silent failures.
- [ ] **Hardcoded dispatchers** in classes that need tests: inject them.

## 3. State

- [ ] **State lost on configuration change or process death.** UI state kept in Activity fields, or user input not saved. Use a `ViewModel`, and `SavedStateHandle` (or `rememberSaveable` in Compose) for what must survive process death.
- [ ] **Impossible states representable.** Separate `isLoading`, `error` and `data` fields that can contradict each other; prefer a sealed UI state.
- [ ] **Mutable state exposed.** `MutableStateFlow`/`MutableLiveData` public from a `ViewModel` instead of a read-only `StateFlow`/`LiveData`.
- [ ] **One-off events as state** (navigation, snackbars) replayed after rotation.

## 4. Jetpack Compose

- [ ] **Side effects in composition.** Network calls, analytics, navigation or `viewModel.load()` called directly in a composable body run on every recomposition. Use `LaunchedEffect` with the right keys, or trigger from the `ViewModel`.
- [ ] **`remember` without keys** for values derived from parameters, so they go stale when the parameter changes.
- [ ] **Unstable parameters** (plain `List`, lambdas recreated each time, classes from modules without Compose compiler stability) causing avoidable recompositions in frequently updated screens. Only report where it shows up in a hot path.
- [ ] **`LazyColumn`/`LazyRow` items without `key`** when items can move or be removed.
- [ ] **State read too high.** Reading a fast-changing state (scroll offset, animation) at the top of a screen recomposes all of it; read it in a lambda or lower in the tree.

## 5. Platform

- [ ] **Exported components.** `android:exported="true"` on activities, services, receivers or providers without a permission, that act on the incoming `Intent` without validating it. Details in `mobile-security`.
- [ ] **Runtime permissions.** Features used without checking the permission, or denial ("don't ask again") not handled.
- [ ] **Background work.** Long work started from an Activity or a plain `Service` that the system will stop; persistent or deferrable work belongs in `WorkManager`. Starting foreground services and exact alarms have restrictions that depend on `targetSdk`; check it before reviewing.
- [ ] **`PendingIntent` mutability.** Flags must include `FLAG_IMMUTABLE` or `FLAG_MUTABLE` explicitly on apps targeting Android 12 or higher.

## 6. Maintainability and UI quality

- [ ] Hardcoded user-visible strings instead of `strings.xml`.
- [ ] Missing `contentDescription` on meaningful images and icon buttons; touch targets smaller than 48dp.
- [ ] Business logic in Activities, Fragments or Composables instead of the `ViewModel` or domain layer.
- [ ] New logic without tests when the module already has a test suite.

## Output

Report in the matching section of the `mobile-code-reviewer` report (Bugs for sections 1–3, Performance for Compose recomposition, Security for exported components), always with `file:line` and the corrected snippet when the fix is short.
