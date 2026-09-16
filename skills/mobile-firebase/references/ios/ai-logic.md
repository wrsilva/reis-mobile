# Firebase AI Logic — native iOS (Swift)

Project setup shared by every Firebase product is in [../ios.md](../ios.md). The concepts in `SKILL.md` — security rules, App Check, environments, the Local Emulator Suite — apply here too.

## Package product

`FirebaseAILogic` — `import FirebaseAILogic`

## Generate content

```swift
let model = FirebaseAI.firebaseAI(backend: .googleAI())
    .generativeModel(modelName: "<model name>")

func summarize(_ text: String) async throws -> String? {
    let response = try await model.generateContent("Summarize in two sentences:\n\(text)")
    return response.text
}
```

- Model names change and older ones are retired: take the name from the current Firebase AI Logic documentation and keep it in Remote Config.
- `.googleAI()` uses the Gemini Developer API; `.vertexAI()` (optionally with a location) uses Vertex AI. The backend must be enabled in the Firebase console.
- Streaming: `generateContentStream` returns an async sequence of partial responses; update UI state on the main actor.
- There is no API key in the app: requests go through Firebase. Enable App Check to keep others from calling the model at your cost.
- For multi-turn chat, use `model.startChat()`.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Security rules and App Check are the real protection: anything in the app binary can be read or modified.
