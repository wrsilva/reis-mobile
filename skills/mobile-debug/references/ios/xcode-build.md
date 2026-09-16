# iOS Xcode Build Debug

Xcode shows the last error loudly and the first one quietly. Work in this order: find the first real error, collect the versions, then match the error to a section below. Confirm every cause in the project files before proposing a fix.

## 1. Find the first real error

- In Xcode, open the Report navigator, select the failed build and expand the first red entry; the full compiler or script output is behind the details button.
- From the command line, keep the log: `xcodebuild -workspace App.xcworkspace -scheme App -destination 'generic/platform=iOS Simulator' build 2>&1 | tee build.log`, then search for the first `error:`.
- `Command PhaseScriptExecution failed with a nonzero exit code` is never the cause: the script's own output right above it is.
- In Flutter projects, `flutter build ios` prints the Xcode output; the Dart error and the native error are different sections.

## 2. Versions

| What | Where |
|---|---|
| Xcode and SDK | `xcodebuild -version`, `xcode-select -p` (a machine can have several Xcodes) |
| Deployment target | `IPHONEOS_DEPLOYMENT_TARGET` in the project and each target, `platform :ios` in the `Podfile`, `platforms` in `Package.swift` |
| Swift language version | `SWIFT_VERSION` per target |
| Dependencies | `Podfile.lock`, `Package.resolved` |

Check App Store Connect's current minimum Xcode/SDK requirement before telling the user an upgrade is needed; do not state it from memory.

## 3. Signing and provisioning

- [ ] `Signing for "App" requires a development team` → no team selected for that target. Every target that is signed (app, extensions, widgets) needs one.
- [ ] `No profiles for 'com.example.app' were found` / `doesn't include signing certificate` → the bundle identifier, team, certificate and profile do not match. With automatic signing, the account in Xcode must have access to the team; on CI, `xcodebuild -allowProvisioningUpdates` needs an authenticated account or an App Store Connect API key.
- [ ] `Provisioning profile ... doesn't support the X capability` / entitlements errors → a capability enabled in the target (Push Notifications, App Groups, Associated Domains, Sign in with Apple) is missing from the App ID. It must be enabled on the Apple Developer account too.
- [ ] Extensions with a different team or a bundle id that is not prefixed by the app's → the archive or upload fails even if the app target is correct.
- Never ask the user to paste certificates, `.p12` files or passwords; point at the Keychain or the CI secret store.

## 4. Modules and linking

- [ ] `No such module 'X'` → with CocoaPods, the project was opened or built as `.xcodeproj` instead of `.xcworkspace`; otherwise the dependency is not linked to that target, or its scheme did not build. Stale derived data is the last suspect, not the first.
- [ ] `Undefined symbols for architecture arm64` → a library is not linked to the target, or it was built for another platform or architecture. Read which symbol and which object file.
- [ ] `building for iOS Simulator, but linking in object file built for iOS` → a prebuilt binary without a simulator slice for Apple Silicon. The durable fix is an XCFramework build of the dependency; `EXCLUDED_ARCHS = arm64` for the simulator only hides it and breaks on Apple Silicon Macs.
- [ ] `Compiling for iOS A, but module 'X' has a minimum deployment target of iOS B` → raise the app's deployment target to B (dropping older iOS versions, say so) or use a dependency version that supports A.

## 5. Script phases and outputs

- [ ] `Sandbox: rsync(...) deny(1) file-write-create` or scripts failing on file access after moving to Xcode 15 or later → `ENABLE_USER_SCRIPT_SANDBOXING` is on and a script phase (often CocoaPods' framework embedding) writes outside its declared outputs. Prefer updating the tool that generates the script; setting the build setting to `NO` for that target is the workaround.
- [ ] `Multiple commands produce '.../Info.plist'` (or another file) → the same file is both in *Copy Bundle Resources* and generated, or two targets write it. Remove the duplicate from the build phase.
- [ ] Run script phases that call `flutter`, `node` or `ruby` fail only in Xcode → Xcode does not load the shell profile, so the tool is missing from `PATH`. Check the script's shebang and the path it uses.

## 6. Swift Package Manager

- [ ] Resolution failures or `Package.resolved` conflicts after a merge → `xcodebuild -resolvePackageDependencies` shows the conflict. Resolve versions in the project instead of deleting `Package.resolved` blindly.
- [ ] A package that resolved before now fails to fetch → authentication for a private repository, or a tag that moved. Check the package URL and the version rule.
- [ ] Clearing `~/Library/Caches/org.swift.swiftpm` or the package cache in derived data fixes corrupted checkouts but re-downloads everything; propose it, do not run it without confirmation.

## 7. After upgrading Xcode or Swift

- [ ] New concurrency errors (`Sending 'x' risks causing data races`, main actor isolation) → the target moved to the Swift 6 language mode or stricter concurrency checking. Check `SWIFT_VERSION` and `SWIFT_STRICT_CONCURRENCY`; fixing the isolation is the real fix, lowering the setting is a documented stopgap.
- [ ] Deprecated APIs becoming errors, or warnings treated as errors (`SWIFT_TREAT_WARNINGS_AS_ERRORS`, `GCC_TREAT_WARNINGS_AS_ERRORS`).
- [ ] Stale build products → *Product ▸ Clean Build Folder* first. Deleting `~/Library/Developer/Xcode/DerivedData` is safe but slow; propose it, do not run it without confirmation.

## Output

Report the first real error, the Xcode and deployment target versions involved, the cause with evidence (build setting, `file:line` or log line) and the minimal fix. State side effects, such as a higher minimum iOS version or a capability that must also change on the Apple Developer account.
