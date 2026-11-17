# Launching the app on an emulator, simulator or device

A command that starts an app usually keeps running after the app opens: `flutter run` stays attached for hot reload, an emulator runs until it is closed, Metro serves bundles until it is stopped. Run in the foreground, it holds the call until the tool times out and the user sees nothing. Start it so the session gets control back with an answer: **ready**, **failed** (with the first error) or **still starting** (with the last output).

## With `reis-mobile run --background`

```bash
reis-mobile run --background -- flutter run -d emulator-5554 --pid-file /tmp/app.pid
```

It starts the command detached, prints the compact output and a progress line after every 30 quiet seconds, and returns:

| Exit | Meaning | Next step |
|---|---|---|
| 0 | Ready (or running, for a tool without a readiness signal); the app keeps running | Report the device and what is available (hot reload, logs) |
| The command's code | It ended: a build error, a missing device, a crash at launch | Quote the first error line, then diagnose with the stack's reference |
| 124 | The wait (default 100 s) ran out before it was ready; it is still running | Report the last output and run `reis-mobile run --follow <log>` |

The final line prints the PID, the full log, the follow command and the stop command. `--follow <log> --wait 15` shows what the app printed since, such as the result of a hot reload; `--stop <log>` sends SIGTERM to the whole process group and SIGKILL after 10 seconds. Give `--ready <regex>` or `--ready-url <url>` for a tool without a built-in signal.

In Claude Code, the plugin's guard (on unless `reis-mobile hook guard off`) rewrites a foreground Bash call to one of these commands into this form, unless the call already uses `run_in_background`.

## Ready and failure signals

The ready lines come from the tools' own sources; match failures by process exit as well as by text, because not every failure prints a known line.

| Command | Ready | Progress | Failure |
|---|---|---|---|
| `flutter run -d <id>` (also `flutter attach`) | `Flutter run key commands.`, printed once the app runs, with or without a terminal | `Launching lib/main.dart on …`, `Running Gradle task 'assembleDebug'...`, `Running pod install...`, `Running Xcode build...`, `Syncing files to device …`, `A Dart VM Service on … is available at:` | The process exits; `Error launching application on …`, `Lost connection to device.`, `FAILURE: Build failed with an exception.`, `Could not build the precompiled application for the device.` |
| `emulator -avd <name>` | `Boot completed in <n> ms` | Snapshot loading, adb connection | The process exits |
| `react-native start` | `GET http://localhost:8081/status` answers `packager-status:running` (port from `--port`) | `Starting dev server on …` | The process exits; the port is already in use |
| `npx expo start` | No ready line verified here; wait for the port: `--ready-url http://localhost:8081` | Metro bundling progress | The process exits |
| `adb logcat`, `xcrun simctl spawn booted log stream`, `flutter logs` | Running is the goal; there is no ready state | — | The process exits |

`flutter run --no-resident` launches the app and exits, so it needs no background start.

## Per stack

**Flutter.** `flutter devices` lists the device ids; `flutter emulators` lists emulators and `flutter emulators --launch <id>` starts one. Start the app with `--pid-file <file>` so the session can reload it without a keyboard: `kill -USR1 $(cat <file>)` triggers a hot reload and `kill -USR2 $(cat <file>)` a hot restart. The result appears in the log as `Reloaded N of M libraries in …`, `Hot reload was rejected:` or `Restarted application in …`; read it with `--follow <log> --wait 15`. Without a terminal, the `q` key is not available; stop with `--stop <log>`.

**Android emulator.** `emulator -list-avds` lists the AVDs. Start one with `reis-mobile run --background -- emulator -avd <name>`. Without the CLI, `adb wait-for-device` followed by a loop on `adb shell getprop sys.boot_completed` until it prints `1` waits for the boot, and both end on their own. `adb devices` shows `emulator-5554  device` once it is usable.

**Native Android app.** `./gradlew :app:installDebug` builds and installs, and ends. `adb shell am start -n <package>/<activity>` launches it and ends. Logs for the app only: `adb logcat --pid=$(adb shell pidof -s <package>)`, which never ends, so start it with `--background`.

**iOS simulator.** `xcrun simctl list devices available` lists simulators. `xcrun simctl bootstatus <udid> -b` boots the simulator if needed and returns once it has finished booting, so it needs no background start; `open -a Simulator` shows its window. A native app: build with `xcodebuild … -destination 'platform=iOS Simulator,id=<udid>' build`, then `xcrun simctl install booted <path/App.app>` and `xcrun simctl launch booted <bundle id>`, which all end. App logs: `xcrun simctl spawn booted log stream --predicate 'subsystem == "<bundle id>"'`, which never ends.

**React Native.** Start Metro with `reis-mobile run --background -- npx react-native start`: readiness is checked on `/status` automatically. `npx react-native run-android` and `run-ios` build, install and end once Metro is up.

**Expo.** `reis-mobile run --background --ready-url http://localhost:8081 -- npx expo start` returns once the dev server accepts requests. `npx expo run:android` and `run:ios` build, install and end.

**Kotlin Multiplatform.** The Android host app follows the native Android steps and the iOS host app follows the iOS steps; build the shared framework first through the host's Gradle or Xcode build.

## Without the CLI

Use the host's background execution (in Claude Code, Bash with `run_in_background`), send the output to a log, and wait with a command that ends on its own and covers every outcome:

```bash
# Ends on the ready line, on a failure line, or when the process is gone.
until grep -q -e 'Flutter run key commands.' -e 'Error launching application' \
              -e 'Lost connection to device' -e 'FAILURE: Build failed' "$LOG" \
      || ! kill -0 "$PID" 2>/dev/null; do
  sleep 2
done
tail -n 20 "$LOG"
```

Report what the last lines show. A loop that checks only the success line waits forever when the build fails.
