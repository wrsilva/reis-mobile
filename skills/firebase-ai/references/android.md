# Firebase AI Logic — native Android (Kotlin)

Use this reference instead of the Dart code in `SKILL.md` when the project is a native Android app or the Android side of a Kotlin Multiplatform app. The product concepts in `SKILL.md` — security rules, data modeling, error handling, testing with the Local Emulator Suite — still apply.

## Setup

- Register the Android app in the Firebase console and put `google-services.json` in the app module (`app/`). Apply the Google services Gradle plugin (`com.google.gms.google-services`) there.
- Declare Firebase through the Firebase Android BoM — `implementation(platform("com.google.firebase:firebase-bom:<version>"))` — and omit versions on Firebase artifacts. Reuse the BoM version already in the version catalog or build files; check the current one in the Firebase release notes before adding it.
- Use the main modules, not `-ktx` artifacts. The Kotlin extensions moved into the main modules in BoM 32.5.0, and the KTX modules were removed from the BoM in 34.0.0. Imports look like `com.google.firebase.Firebase` and `com.google.firebase.<product>.<product>`.
- Firebase initializes from `google-services.json` automatically; call `FirebaseApp.initializeApp` only for manual or multiple-app setups.
- `.await()` on Firebase `Task`s comes from `org.jetbrains.kotlinx:kotlinx-coroutines-play-services`.
- The Android emulator reaches the Firebase Local Emulator Suite on the host at `10.0.2.2`, not `localhost`.

## Dependency

`implementation("com.google.firebase:firebase-ai")`

## Generate content

```kotlin
private val model = Firebase.ai(backend = GenerativeBackend.googleAI())
    .generativeModel("<model name>")

suspend fun summarize(text: String): String? =
    model.generateContent("Summarize in two sentences:\n$text").text

fun streamSummary(text: String): Flow<String> =
    model.generateContentStream(text).mapNotNull { it.text }
```

- Model names change and older ones are retired: take the model name from the current Firebase AI Logic documentation and keep it in Remote Config so it can change without an app release.
- `GenerativeBackend.googleAI()` uses the Gemini Developer API; `GenerativeBackend.vertexAI()` uses Vertex AI. The backend must be enabled in the Firebase console.
- There is no API key in the app: requests go through Firebase. Enable App Check, since anyone who extracts the app's config could otherwise call the model at your cost.
- Handle blocked responses and quota errors; show a fallback instead of an empty screen.
- For multi-turn chat, use `model.startChat()` and keep the chat in a `ViewModel`.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Keep Firebase security rules and App Check as the real protection: anything in the app binary can be read or modified.
