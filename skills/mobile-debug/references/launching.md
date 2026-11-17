# Launching the app on an emulator, simulator or device

Some launch commands end once the app is installed and opened; others keep running: an app session with hot reload, an emulator, a dev server, a log tail. Run in the foreground, the second kind holds the call until the tool times out and the user sees nothing. Start it so the session gets control back with an answer: **ready**, **failed** (with the first error) or **still starting** (with the last output).

## Which commands end

| Stack | Never ends: `reis-mobile run --background -- …` | Ends on its own: run directly |
|---|---|---|
| Flutter | `flutter run -d <id>`, `flutter attach`, `flutter logs` | `flutter run --no-resident -d <id>`, `flutter build apk --debug`, `flutter build ios --simulator`, `flutter install -d <id>`, `flutter test integration_test -d <id>` |
| Native Android | `emulator -avd <name>`, `adb logcat`, `adb logcat --pid=<pid>` | `./gradlew :app:installDebug`, `adb shell am start -n <package>/<activity>`, `adb wait-for-device`, `adb logcat -d` |
| Native iOS | `xcrun simctl spawn booted log stream …`, `xcrun simctl launch --console booted <bundle id>` | `xcrun simctl bootstatus <udid> -b`, `xcodebuild … build`, `xcrun simctl install booted <App.app>`, `xcrun simctl launch booted <bundle id>` |
| React Native | `npx react-native start`, `npx react-native log-android`, `npx react-native log-ios` | `npx react-native run-android`, `npx react-native run-ios`: they open Metro in a separate window (skip it with `--no-packager`) and do not serve it themselves |
| Expo | `npx expo start`; `npx expo run:android` and `npx expo run:ios`, which start the dev server after the build | `npx expo run:android --no-bundler`, `npx expo run:ios --no-bundler`, `npx expo prebuild` |
| Kotlin Multiplatform | The Android and iOS host commands above: `emulator -avd`, `adb logcat`, `xcrun simctl spawn booted log stream` | `./gradlew :<android app module>:installDebug` (`:composeApp` or `:androidApp` in the KMP templates; read `settings.gradle.kts`), `xcodebuild -project <iosApp>/<iosApp>.xcodeproj -scheme <iosApp> -destination 'platform=iOS Simulator,id=<udid>' build` |

`npm start`, `yarn start` and `npm run dev` run whatever the `package.json` script says: read the script before deciding.

## With `reis-mobile run --background`

```bash
# Flutter
reis-mobile run --background -- flutter run -d emulator-5554 --pid-file /tmp/app.pid
# Native Android
reis-mobile run --background -- emulator -avd Pixel_9_API_36
reis-mobile run --background -- adb logcat --pid=$(adb shell pidof -s com.example.app)
# Native iOS
reis-mobile run --background -- xcrun simctl spawn booted log stream --predicate 'subsystem == "com.example.app"'
# React Native
reis-mobile run --background -- npx react-native start
# Expo
reis-mobile run --background --ready-url http://localhost:8081 -- npx expo start
reis-mobile run --background --wait 540 -- npx expo run:android
```

It starts the command detached, prints the compact output and a progress line after every 30 quiet seconds, and returns:

| Exit | Meaning | Next step |
|---|---|---|
| 0 | Ready (or running, for a log tail or a server without a readiness signal); the command keeps running | Report the device and what is available: hot reload, Metro, logs |
| The command's code | It ended: a build error, a missing device or AVD, a crash at launch, a port in use | Quote the first error line, then diagnose with the stack's reference |
| 124 | The wait (default 100 s) ran out before it was ready; it is still running | Report the last output and run `reis-mobile run --follow <log>` |

The final line prints the PID, the full log, the follow command and the stop command. `--follow <log> --wait 15` shows what the command printed since; `--stop <log>` sends SIGTERM to its whole process group and SIGKILL after 10 seconds. `--ready <regex>` or `--ready-url <url>` gives a readiness signal to a command without a built-in one. A first native build (Gradle, Xcode, `expo run:*`) can take several minutes: raise `--wait` together with the tool's own timeout, or follow it in rounds.

In Claude Code, the plugin's guard (on unless `reis-mobile hook guard off`) rewrites a foreground Bash call to any command in the first column into this form, unless the call already uses `run_in_background`.

## Ready and failure signals

The ready signals come from the tools' own sources or documentation. Match failures by process exit as well as by text, because not every failure prints a known line.

| Stack | Command | Ready | Progress | Failure |
|---|---|---|---|---|
| Flutter | `flutter run -d <id>`, `flutter attach` | `Flutter run key commands.`, printed once the app runs, with or without a terminal | `Launching lib/main.dart on …`, `Running Gradle task 'assembleDebug'...`, `Running pod install...`, `Running Xcode build...`, `Syncing files to device …`, `A Dart VM Service on … is available at:` | The process exits; `Error launching application on …`, `Lost connection to device.`, `FAILURE: Build failed with an exception.`, `Could not build the precompiled application for the device.` |
| Native Android | `emulator -avd <name>` | `Boot completed in <n> ms` | Snapshot loading, adb connection | The process exits |
| Native Android | `adb logcat` | Running is the goal; there is no ready state | — | The process exits (device disconnected) |
| Native iOS | `xcrun simctl spawn booted log stream` | Running is the goal; there is no ready state | — | The process exits (no booted simulator) |
| React Native | `npx react-native start` | `GET http://localhost:8081/status` answers `packager-status:running` (port from `--port`, default 8081) | `Starting dev server on …` | The process exits; the port is already in use |
| Expo | `npx expo start` | No ready line verified; wait for the dev server port: `--ready-url http://localhost:8081` (`--port` changes it) | Metro bundling progress | The process exits |
| Expo | `npx expo run:android`, `npx expo run:ios` | No ready line verified; `--background` waits for the exit or `--wait`, never a 10-second "running" | Gradle or Xcode build output, then Metro | The process exits with the build error |

## Per stack

**Flutter.** `flutter devices` lists the device ids; `flutter emulators` lists emulators and `flutter emulators --launch <id>` starts one. Start the app with `--pid-file <file>` so the session can reload it without a keyboard: `kill -USR1 $(cat <file>)` triggers a hot reload and `kill -USR2 $(cat <file>)` a hot restart. The result appears in the log as `Reloaded N of M libraries in …`, `Hot reload was rejected:` or `Restarted application in …`; read it with `--follow <log> --wait 15`. Without a terminal, the `q` key is not available: stop with `--stop <log>`.

**Native Android.** `emulator -list-avds` lists the AVDs; start one with `reis-mobile run --background -- emulator -avd <name>`. Without the CLI, `adb wait-for-device` followed by a loop on `adb shell getprop sys.boot_completed` until it prints `1` waits for the boot, and both end on their own. `adb devices` shows `emulator-5554  device` once it is usable. `./gradlew :app:installDebug` builds and installs, `adb shell am start -n <package>/<activity>` launches, and both end. App-only logs: `adb logcat --pid=$(adb shell pidof -s <package>)`, which never ends.

**Native iOS.** `xcrun simctl list devices available` lists simulators. `xcrun simctl bootstatus <udid> -b` boots the simulator if needed and returns once it has finished booting; `open -a Simulator` shows its window. Build with `xcodebuild -scheme <App> -destination 'platform=iOS Simulator,id=<udid>' -derivedDataPath build build`, then `xcrun simctl install booted build/Build/Products/Debug-iphonesimulator/<App>.app` and `xcrun simctl launch booted <bundle id>`; all of them end. App logs: `xcrun simctl spawn booted log stream --predicate 'subsystem == "<bundle id>"'`, or `xcrun simctl launch --console booted <bundle id>` for the app's stdout and stderr; both never end.

**React Native.** Start Metro with `reis-mobile run --background -- npx react-native start`; readiness is checked on `/status` automatically. Then `npx react-native run-android` or `npx react-native run-ios` builds, installs and launches; pass `--no-packager` when Metro already runs in the background, so a second one does not open in another window. `npx react-native log-android` and `log-ios` never end.

**Expo.** `reis-mobile run --background --ready-url http://localhost:8081 -- npx expo start` returns once the dev server accepts requests. `npx expo run:android` and `npx expo run:ios` build, install, then start the dev server and keep running: start them with `--background` and a `--wait` that covers the native build, or run `npx expo start` in the background first and the build with `--no-bundler`, which ends.

**Kotlin Multiplatform.** The Android host app follows the native Android steps with its own module (`./gradlew :<android app module>:installDebug`), and the iOS host app follows the native iOS steps with its Xcode project in `iosApp/` (or the folder `settings.gradle.kts` and the README name); its build runs the shared framework's Gradle task, such as `embedAndSignAppleFrameworkForXcode`, from an Xcode build phase.

## Without the CLI

Use the host's background execution (in Claude Code, Bash with `run_in_background`), send the output to a log, and wait with a command that ends on its own and covers every outcome. Fill `READY` and `FAILED` from the signals table for the stack:

```bash
# Flutter (flutter run):      READY='Flutter run key commands\.'
#                             FAILED='Error launching application|Lost connection to device|FAILURE: Build failed'
# Native Android (emulator):  READY='Boot completed in'   FAILED='$^'  (no failure line verified: the exit check covers it)
until grep -q -E "$READY|$FAILED" "$LOG" || ! kill -0 "$PID" 2>/dev/null; do
  sleep 2
done
tail -n 20 "$LOG"
```

Native iOS needs no loop for the simulator: `xcrun simctl bootstatus <udid> -b` returns once it has booted, and `xcodebuild`, `simctl install` and `simctl launch` end on their own.

For a server without a ready line (`npx react-native start`, `npx expo start`), poll the port instead: `until curl -s http://localhost:8081/status | grep -q packager-status:running || ! kill -0 "$PID"; do sleep 2; done` for React Native, or `until curl -s -o /dev/null http://localhost:8081 || ! kill -0 "$PID"; do sleep 2; done` for Expo. Report what the last lines show. A loop that checks only the success signal waits forever when the build fails.
