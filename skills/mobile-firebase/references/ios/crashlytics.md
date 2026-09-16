# Firebase Crashlytics — native iOS (Swift)

Project setup shared by every Firebase product is in [../ios.md](../ios.md). The concepts in `SKILL.md` — security rules, App Check, environments, the Local Emulator Suite — apply here too.

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
- Security rules and App Check are the real protection: anything in the app binary can be read or modified.
