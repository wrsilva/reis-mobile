# Cloud Functions for Firebase (callable functions) — native iOS (Swift)

Use this reference instead of the Dart code in `SKILL.md` when the project is a native iOS app. The product concepts in `SKILL.md` — security rules, data modeling, error handling, testing with the Local Emulator Suite — still apply.

## Setup

- Register the iOS app in the Firebase console and add `GoogleService-Info.plist` to the app target.
- Add `https://github.com/firebase/firebase-ios-sdk` with Swift Package Manager and link only the products you use (listed below), or the matching pods if the project already uses CocoaPods.
- Call `FirebaseApp.configure()` once at launch: in `application(_:didFinishLaunchingWithOptions:)`, or in a SwiftUI `App` through `@UIApplicationDelegateAdaptor`.
- Check the Firebase version in `Package.resolved` or `Podfile.lock`, and the minimum iOS version it requires, before writing code against newer APIs.

## Package product

`FirebaseFunctions` — `import FirebaseFunctions`

## Call a function

```swift
private lazy var functions = Functions.functions(region: "europe-west1")   // must match the deployed region

func addMessage(_ text: String) async throws -> String {
    let result = try await functions.httpsCallable("addMessage").call(["text": text])
    guard let data = result.data as? [String: Any], let id = data["id"] as? String else {
        throw AppError.unexpectedResponse
    }
    return id
}
```

- A region mismatch fails as not found; `Functions.functions()` without a region targets `us-central1`.
- Errors in the `FunctionsErrorDomain` carry a `FunctionsErrorCode` and the `details` sent by the function's `HttpsError`.
- The signed-in user's ID token and the App Check token are sent automatically; authorize in the function, never only in the app.
- `httpsCallable(_:requestAs:responseAs:)` decodes `Codable` types when both sides agree on the shape.

## Emulator

`functions.useEmulator(withHost: "localhost", port: 5001)` before calling.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Keep Firebase security rules and App Check as the real protection: anything in the app binary can be read or modified.
