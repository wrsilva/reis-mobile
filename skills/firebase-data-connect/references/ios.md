# Firebase SQL Connect (formerly Data Connect) — native iOS (Swift)

Use this reference instead of the Dart code in `SKILL.md` when the project is a native iOS app. The product concepts in `SKILL.md` — security rules, data modeling, error handling, testing with the Local Emulator Suite — still apply.

## Setup

- Register the iOS app in the Firebase console and add `GoogleService-Info.plist` to the app target.
- Add `https://github.com/firebase/firebase-ios-sdk` with Swift Package Manager and link only the products you use (listed below), or the matching pods if the project already uses CocoaPods.
- Call `FirebaseApp.configure()` once at launch: in `application(_:didFinishLaunchingWithOptions:)`, or in a SwiftUI `App` through `@UIApplicationDelegateAdaptor`.
- Check the Firebase version in `Package.resolved` or `Podfile.lock`, and the minimum iOS version it requires, before writing code against newer APIs.

Firebase Data Connect is now called **Firebase SQL Connect**; the APIs did not change.

## Generated Swift SDK

- The Swift SDK is a separate package: `https://github.com/firebase/data-connect-ios-sdk`.
- In the connector's `connector.yaml`, add a `swiftSdk` entry under `generate` with the output directory, then run `firebase dataconnect:sdk:generate`. Add the generated package to the Xcode project as a local package.
- Regenerate the SDK whenever the schema or the operations change.

## Usage

```swift
let connector = DataConnect.moviesConnector       // name generated from your connector

func loadMovies() async throws -> [ListMoviesQuery.Data.Movie] {
    try await connector.listMoviesQuery.execute().data.movies
}
```

The names above come from a sample connector; use the ones generated for your project. Generated query refs also expose observable results for SwiftUI.

## Notes

- Operations are defined and authorized on the server (`@auth` directives); the app cannot run arbitrary SQL.
- Point the connector at the emulator (default port 9399) in debug builds, as the generated SDK documentation shows.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Keep Firebase security rules and App Check as the real protection: anything in the app binary can be read or modified.
