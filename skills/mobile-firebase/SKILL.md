---
name: mobile-firebase
description: Integrates and reviews Firebase across Flutter, native Android, native iOS, React Native and Kotlin Multiplatform. Covers Auth, databases, Storage, Functions, FCM, Analytics, Crashlytics, Remote Config, App Check and KMP shared-to-platform SDK boundaries. Use for any Firebase setup, bug, security rule, emulator, configuration file or product integration.
routing: manual
stacks: ["*"]
---

# Mobile Firebase

One skill for Firebase on every mobile stack. This file holds what is true for every platform and product; setup, APIs and pitfalls live in the references.

## 1. Pick the references

Detect the stack first, then read the platform guide (shared setup and the product list) and only the product guides the task needs:

| Project | Read |
|---|---|
| Flutter | [references/flutter.md](references/flutter.md) |
| Native Android (Kotlin), or the Android side of Kotlin Multiplatform | [references/android.md](references/android.md) |
| Native iOS (Swift) | [references/ios.md](references/ios.md) |
| React Native or Expo | [references/react-native.md](references/react-native.md) |
| Kotlin Multiplatform shared API and Android/iOS Firebase boundaries | [references/kotlin-multiplatform.md](references/kotlin-multiplatform.md) |

In a Flutter or React Native app, native code in `android/` and `ios/` (a notification service, an app extension) follows the native guides.

## 2. Configuration files are not secrets, but they are not protection either

`google-services.json`, `GoogleService-Info.plist` and the Firebase web config identify the project; they ship inside every app and anyone can extract them. What protects data is:

- **Security rules** for Firestore, Realtime Database and Storage. Rules that allow reads or writes to everyone (`allow read, write: if true`, or test-mode rules left in production) are a critical finding.
- **App Check**, so only the genuine app calls Firebase backends and AI Logic.
- **Server-side authorization** in Cloud Functions: check `auth` and inputs; never trust the app.
- **API key restrictions** in Google Cloud for the keys in those files.

## 3. Environments

Use separate Firebase projects for development and production, selected by build flavor, scheme or configuration — not by editing the config file before a release. Keep production data out of debug builds and out of tests.

## 4. Local Emulator Suite

Develop and test against the Firebase Local Emulator Suite (Auth, Firestore, Realtime Database, Storage, Functions) instead of production. Connect each product to the emulator before its first call, only in debug builds. The Android emulator reaches the host at `10.0.2.2`.

## 5. Cost and performance

- Real-time listeners bill reads on every change: listen to narrow queries, paginate, and remove listeners when screens go away.
- Offline persistence is on by default for Firestore on mobile; design UI for pending writes instead of waiting for the server.
- Keep Remote Config fetches and SDK initialization off the launch path when possible.

## 6. Privacy

Analytics, Crashlytics and Messaging collect data covered by store privacy disclosures (App Store privacy details and privacy manifests, Google Play Data safety). Never send personal data (emails, names, phone numbers) as analytics parameters, crash keys or user properties, and honor consent before enabling collection where the law requires it.

## Output

When integrating, list the files changed, the console steps the user must do (enable a provider, upload an APNs key, create an index) and how to verify it works. When reviewing, report rules, App Check and privacy issues first, with `file:line`.
