# Firebase SQL Connect (formerly Data Connect) — native Android (Kotlin)

Project setup shared by every Firebase product is in [../android.md](../android.md). The concepts in `SKILL.md` — security rules, App Check, environments, the Local Emulator Suite — apply here too.

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
- Security rules and App Check are the real protection: anything in the app binary can be read or modified.
