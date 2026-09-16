# Firebase Crashlytics — native iOS (Swift)

Use this reference instead of the Dart code in `SKILL.md` when the project is a native iOS app. The product concepts in `SKILL.md` — security rules, data modeling, error handling, testing with the Local Emulator Suite — still apply.

## Setup

- Register the iOS app in the Firebase console and add `GoogleService-Info.plist` to the app target.
- Add `https://github.com/firebase/firebase-ios-sdk` with Swift Package Manager and link only the products you use (listed below), or the matching pods if the project already uses CocoaPods.
- Call `FirebaseApp.configure()` once at launch: in `application(_:didFinishLaunchingWithOptions:)`, or in a SwiftUI `App` through `@UIApplicationDelegateAdaptor`.
- Check the Firebase version in `Package.resolved` or `Podfile.lock`, and the minimum iOS version it requires, before writing code against newer APIs.

## Package product

`FirebaseCrashlytics` — `import FirebaseCrashlytics`

## dSYM upload (required for readable stack traces)

1. Build setting **Debug Information Format** = `DWARF with dSYM File` for the configurations that ship.
2. Add a Run Script build phase after compilation that runs the Crashlytics upload script: with Swift Package Manager, `"${BUILD_DIR%/Build/*}/SourcePackages/checkouts/firebase-ios-sdk/Crashlytics/run"`; with CocoaPods, `"${PODS_ROOT}/FirebaseCrashlytics/run"`.
3. Declare the script's input files as the Crashlytics setup guide lists (the dSYM, the app's Info.plist and `GoogleService-Info.plist`). With user script sandboxing enabled, undeclared inputs make the script fail.
4. For builds uploaded to App Store Connect, dSYMs can also be uploaded afterwards with the `upload-symbols` tool.

## Usage

```swift
let crashlytics = Crashlytics.crashlytics()
crashlytics.setUserID(opaqueUserId)          // an internal id, never an email
crashlytics.setCustomValue("checkout", forKey: "screen")
crashlytics.log("payment started")
crashlytics.record(error: error)             // non-fatal
```

## Notes

- Opt-in collection: set `FirebaseCrashlyticsCollectionEnabled` to `NO` in `Info.plist` and call `setCrashlyticsCollectionEnabled(true)` after consent.
- To test, crash the app **without the debugger attached** (the debugger intercepts crashes), then relaunch: reports are sent on the next launch.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Keep Firebase security rules and App Check as the real protection: anything in the app binary can be read or modified.
