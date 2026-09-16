# Firebase Crashlytics — React Native

Project setup shared by every Firebase product is in [../react-native.md](../react-native.md). The concepts in `SKILL.md` — security rules, App Check, environments, the Local Emulator Suite — apply here too.

## Package

`@react-native-firebase/crashlytics`

## Setup notes

- Android: apply the `com.google.firebase.crashlytics` Gradle plugin in the app module, as the installation page describes.
- iOS: follow the installation page for the dSYM upload build phase and `DWARF with dSYM File`.
- Behavior flags such as `crashlytics_debug_enabled` and `crashlytics_auto_collection_enabled` live in `firebase.json` at the project root.

## Usage

```ts
import { getCrashlytics, log, recordError, setUserId, setAttributes } from '@react-native-firebase/crashlytics';

const crashlytics = getCrashlytics();
await setUserId(crashlytics, opaqueUserId);          // an internal id, never an email
await setAttributes(crashlytics, { screen: 'checkout' });
log(crashlytics, 'payment started');
recordError(crashlytics, error);                      // non-fatal JavaScript error
```

## Notes

- Errors caught by an error boundary are not crashes; record them with `recordError` so they appear in the console.
- Keep development builds out of production reports (`crashlytics_debug_enabled` in `firebase.json`).
- Reports are sent on the next launch after a crash.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Security rules and App Check are the real protection: anything in the app binary can be read or modified.
