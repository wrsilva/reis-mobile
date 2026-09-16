# Firebase AI Logic — native iOS (Swift)

Use this reference instead of the Dart code in `SKILL.md` when the project is a native iOS app. The product concepts in `SKILL.md` — security rules, data modeling, error handling, testing with the Local Emulator Suite — still apply.

## Setup

- Register the iOS app in the Firebase console and add `GoogleService-Info.plist` to the app target.
- Add `https://github.com/firebase/firebase-ios-sdk` with Swift Package Manager and link only the products you use (listed below), or the matching pods if the project already uses CocoaPods.
- Call `FirebaseApp.configure()` once at launch: in `application(_:didFinishLaunchingWithOptions:)`, or in a SwiftUI `App` through `@UIApplicationDelegateAdaptor`.
- Check the Firebase version in `Package.resolved` or `Podfile.lock`, and the minimum iOS version it requires, before writing code against newer APIs.

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
- Keep Firebase security rules and App Check as the real protection: anything in the app binary can be read or modified.
