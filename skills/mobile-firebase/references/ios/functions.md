# Cloud Functions for Firebase (callable functions) — native iOS (Swift)

Project setup shared by every Firebase product is in [../ios.md](../ios.md). The concepts in `SKILL.md` — security rules, App Check, environments, the Local Emulator Suite — apply here too.

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
- Security rules and App Check are the real protection: anything in the app binary can be read or modified.
