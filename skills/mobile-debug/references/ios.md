# Debugging iOS

## Build failures

| Symptom | Guide |
|---|---|
| Xcode or `xcodebuild` errors: signing and provisioning, deployment target, `No such module`, `Undefined symbols`, script phases and sandboxing, Swift Package Manager, errors after upgrading Xcode or Swift | [ios/xcode-build.md](ios/xcode-build.md) |
| `pod install` / `pod update` failures, `Podfile.lock` conflicts, Ruby and CocoaPods installation, build errors inside the Pods project | [ios/cocoapods.md](ios/cocoapods.md) |

In Flutter and React Native apps, run pod commands and open the workspace from `ios/`.

## Crashes at runtime

1. **Get the crash report.** While debugging, Xcode stops at the crash; for devices and TestFlight, use Xcode's Organizer (Crashes) or the device logs in *Devices and Simulators*. Crash reports (`.ips`) need the build's dSYM to be symbolicated; unsymbolicated frames show only addresses.
2. **Read the exception type and the crashed thread**, not the first frame of the main thread only.
3. **Match the signature:**
   - `Fatal error: Unexpectedly found nil while unwrapping an Optional value` / `EXC_BREAKPOINT` in Swift code → a force unwrap, `try!`, `as!` or an out-of-range index on the crashed line.
   - `EXC_BAD_ACCESS` → use of freed memory or a data race; reproduce with **Address Sanitizer** or **Thread Sanitizer** enabled in the scheme's diagnostics.
   - `Main Thread Checker: UI API called on a background thread` → UI updated off the main actor; the Main Thread Checker diagnostic reports the exact call.
   - `This app has crashed because it attempted to access privacy-sensitive data without a usage description` → a missing `NS...UsageDescription` key in `Info.plist`.
   - `Terminating app due to uncaught exception 'NSInternalInconsistencyException'` in table or collection views → the data source changed without matching updates; use diffable data sources.
   - Watchdog terminations (`0x8badf00d`) → the main thread blocked too long, often at launch.
4. **Crashes only in release or TestFlight** → optimization-dependent races, missing entitlements or capabilities in the distribution profile, or code under `#if DEBUG`. Reproduce with the Release configuration.
