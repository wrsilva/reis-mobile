# Firebase Authentication — native iOS (Swift)

Use this reference instead of the Dart code in `SKILL.md` when the project is a native iOS app. The product concepts in `SKILL.md` — security rules, data modeling, error handling, testing with the Local Emulator Suite — still apply.

## Setup

- Register the iOS app in the Firebase console and add `GoogleService-Info.plist` to the app target.
- Add `https://github.com/firebase/firebase-ios-sdk` with Swift Package Manager and link only the products you use (listed below), or the matching pods if the project already uses CocoaPods.
- Call `FirebaseApp.configure()` once at launch: in `application(_:didFinishLaunchingWithOptions:)`, or in a SwiftUI `App` through `@UIApplicationDelegateAdaptor`.
- Check the Firebase version in `Package.resolved` or `Podfile.lock`, and the minimum iOS version it requires, before writing code against newer APIs.

## Package product

`FirebaseAuth` — `import FirebaseAuth`

## Auth state

```swift
private var handle: AuthStateDidChangeListenerHandle?

func start() {
    handle = Auth.auth().addStateDidChangeListener { _, user in
        self.user = user
    }
}

func stop() {
    if let handle { Auth.auth().removeStateDidChangeListener(handle) }
}
```

Keep the listener in an observable model that outlives individual views; update UI state on the main actor.

## Email and password

```swift
let result = try await Auth.auth().createUser(withEmail: email, password: password)
let session = try await Auth.auth().signIn(withEmail: email, password: password)
```

Map errors through `AuthErrorCode` (for example `.emailAlreadyInUse`, `.weakPassword`, `.requiresRecentLogin`, `.invalidCredential`). With email enumeration protection enabled, wrong email and wrong password both surface as invalid credentials; do not tell the user which one was wrong.

## Sign in with Apple and Google

- Apple: generate a random nonce, send its SHA-256 hash in the Apple request, then sign in with `OAuthProvider.appleCredential(withIDToken:rawNonce:fullName:)`. Apple only returns the full name on the first authorization; store it then. Apps offering third-party sign-in must follow App Store Review Guideline 4.8 on offering Sign in with Apple or an equivalent option; check the current guideline.
- Google: use the GoogleSignIn SDK, add the `REVERSED_CLIENT_ID` URL scheme from `GoogleService-Info.plist`, and sign in with `GoogleAuthProvider.credential(withIDToken:accessToken:)`.

## Emulator

`Auth.auth().useEmulator(withHost: "localhost", port: 9099)` right after `FirebaseApp.configure()`, in debug builds only.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Keep Firebase security rules and App Check as the real protection: anything in the app binary can be read or modified.
