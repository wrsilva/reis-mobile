# Investigating Android memory leaks

A leak is an object that should have been garbage collected — usually an Activity, Fragment view, View or Context — kept alive by a reference from something that lives longer. Symptoms: memory growing each time a screen opens, `OutOfMemoryError` after long sessions, and slow GC pauses.

## 1. Get the evidence

- **LeakCanary** (`debugImplementation("com.squareup.leakcanary:leakcanary-android:<version>")`, no code needed) detects retained Activities, Fragments, Fragment views, ViewModels and Services in debug builds and prints the **leak trace**: the chain of references from a GC root to the leaked object. Check the version in the project before adding it.
- **Android Studio Memory Profiler:** capture a heap dump after opening and closing the screen a few times and forcing GC; filter by the Activity class and look for more instances than screens on the back stack. *Show activity/fragment leaks* highlights destroyed ones.
- **`OutOfMemoryError` reports** show where the last allocation failed, which is rarely the leak itself; use them to know which flow to profile.

## 2. Read the leak trace

LeakCanary marks each reference as leaking, not leaking or unknown. The bug is in the references between the last **not leaking** object and the first **leaking** one. Typical shape:

```text
GC Root: static field
↓ SessionManager.INSTANCE
↓ SessionManager.listeners        ← likely cause: never unregistered
↓ ProfileActivity$1 (anonymous listener)
↓ ProfileActivity                 ← destroyed but retained
```

## 3. Common causes and fixes

| Cause | Fix |
|---|---|
| Singleton, `object` or static field holding an Activity, View or Context | Hold `applicationContext`, or do not store it; pass it per call |
| Listener or callback registered in `onStart`/`onCreate` and never removed | Unregister in the symmetric callback, or use lifecycle-aware APIs (`repeatOnLifecycle`, `LifecycleObserver`) |
| Fragment keeping a binding or views after `onDestroyView` | Clear the binding in `onDestroyView`, or use `viewLifecycleOwner` for observers |
| Coroutine launched in `GlobalScope` or a custom scope that captures the Activity | Use `lifecycleScope`/`viewModelScope`; never capture views in long-running work |
| ViewModel holding an Activity, Fragment, View or its Context | Keep only data; use `AndroidViewModel` or an injected application context when a Context is needed |
| Inner or anonymous classes (Handler, Runnable, AsyncTask) outliving the Activity | Static nested class with a weak reference, or cancel pending work in `onDestroy` |
| `Handler.postDelayed` pending when the screen closes | `removeCallbacksAndMessages(null)` in the teardown |
| Third-party SDK holding the Activity passed at init | Pass the application context, or report it upstream and add it to LeakCanary's known library leaks |
| Compose: objects captured in `remember` that hold an Activity, or `DisposableEffect` without cleanup in `onDispose` | Use `LocalContext` at call time; release in `onDispose` |

Not every growth is a leak: image caches and pools are bounded by design. Check whether memory stabilizes after several repetitions before calling it a leak.

## 4. Verify

- Run the flow again with LeakCanary: no retained instance reported.
- Heap dump after repeating the flow and forcing GC: one or zero instances of the Activity.
- For large bitmaps and caches, compare the Java and native heap in the profiler before and after.
