# Debugging Android

## Build failures

Gradle, AGP, JDK and Kotlin mismatches, dependency resolution and duplicate classes, compileSdk and minSdk errors, manifest merger, namespace, kapt/KSP, R8 and signing: [android/gradle-build.md](android/gradle-build.md).

In Flutter and React Native apps, run Gradle from `android/` to see the full output.

## Crashes at runtime

1. **Get the stack trace.** `adb logcat -b crash` shows the crash buffer; `adb logcat *:E` all errors. Start from the first `FATAL EXCEPTION` and follow every `Caused by:` to the root.
2. **Deobfuscate release traces.** Stack traces from R8-minified builds show short names; retrace them with the `retrace` tool from the Android SDK command-line tools and the `mapping.txt` of that exact build (`app/build/outputs/mapping/<variant>/`). Crashlytics and Play Console do it automatically when the mapping file was uploaded.
3. **Match the signature:**
   - `NullPointerException` / `lateinit property has not been initialized` → an object used before its lifecycle creates it, or after it is destroyed (a Fragment view after `onDestroyView`).
   - `IllegalStateException: Fragment not attached to a context`, `Can not perform this action after onSaveInstanceState` → work finishing after the screen stopped; tie it to the lifecycle.
   - `NetworkOnMainThreadException`, `Cannot access database on the main thread` → I/O on the main thread; move it to `Dispatchers.IO`.
   - `ClassNotFoundException` / `NoSuchMethodError` only in release → R8 removed or renamed something used through reflection; add the library's keep rules.
   - `SecurityException: Permission Denial` → a missing runtime permission, or an exported component contract mismatch.
   - `ForegroundServiceStartNotAllowedException`, `SecurityException` for exact alarms → restrictions that depend on `targetSdk`; check the behavior changes for that API level.
4. **Native (C/C++) crashes** (`signal 11 (SIGSEGV)`, tombstones) need symbols: symbolize with `ndk-stack` and the unstripped libraries of that build.

## ANRs

- An ANR means the main thread was blocked for about five seconds (input) or a broadcast receiver or service ran too long.
- Get the main thread's stack from Play Console vitals, or from `adb bugreport` (the ANR traces are included), and look at what the main thread was waiting on: disk, network, a lock, `runBlocking`, a binder call.
- `StrictMode` in debug builds flags disk and network access on the main thread before it becomes an ANR.
