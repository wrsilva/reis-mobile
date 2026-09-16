# Firebase SQL Connect (formerly Data Connect) — native Android (Kotlin)

Use this reference instead of the Dart code in `SKILL.md` when the project is a native Android app or the Android side of a Kotlin Multiplatform app. The product concepts in `SKILL.md` — security rules, data modeling, error handling, testing with the Local Emulator Suite — still apply.

## Setup

- Register the Android app in the Firebase console and put `google-services.json` in the app module (`app/`). Apply the Google services Gradle plugin (`com.google.gms.google-services`) there.
- Declare Firebase through the Firebase Android BoM — `implementation(platform("com.google.firebase:firebase-bom:<version>"))` — and omit versions on Firebase artifacts. Reuse the BoM version already in the version catalog or build files; check the current one in the Firebase release notes before adding it.
- Use the main modules, not `-ktx` artifacts. The Kotlin extensions moved into the main modules in BoM 32.5.0, and the KTX modules were removed from the BoM in 34.0.0. Imports look like `com.google.firebase.Firebase` and `com.google.firebase.<product>.<product>`.
- Firebase initializes from `google-services.json` automatically; call `FirebaseApp.initializeApp` only for manual or multiple-app setups.
- `.await()` on Firebase `Task`s comes from `org.jetbrains.kotlinx:kotlinx-coroutines-play-services`.
- The Android emulator reaches the Firebase Local Emulator Suite on the host at `10.0.2.2`, not `localhost`.

Firebase Data Connect is now called **Firebase SQL Connect**; the APIs did not change.

## Generated Kotlin SDK

- In the connector's `connector.yaml`, add a `kotlinSdk` entry under `generate` with the output directory inside the Android module and the package name, then run `firebase dataconnect:sdk:generate` (or let the VS Code extension generate it).
- App module: `implementation("com.google.firebase:firebase-dataconnect")`, plus the Kotlin serialization plugin and runtime the generated code uses.
- Regenerate the SDK whenever the schema or the operations change; commit either the generated code or the generation step, and be consistent.

## Usage

```kotlin
val connector = MoviesConnector.instance          // name generated from your connector

suspend fun loadMovies() = connector.listMovies.execute().data.movies
```

The class and operation names above come from a sample connector; use the ones generated for your project.

## Notes

- Operations are defined and authorized on the server (`@auth` directives); the app cannot run arbitrary SQL.
- Emulator: `connector.dataConnect.useEmulator("10.0.2.2", 9399)` before executing operations.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Keep Firebase security rules and App Check as the real protection: anything in the app binary can be read or modified.
