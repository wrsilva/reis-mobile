# Firebase AI Logic — native Android (Kotlin)

Project setup shared by every Firebase product is in [../android.md](../android.md). The concepts in `SKILL.md` — security rules, App Check, environments, the Local Emulator Suite — apply here too.

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
- Security rules and App Check are the real protection: anything in the app binary can be read or modified.
