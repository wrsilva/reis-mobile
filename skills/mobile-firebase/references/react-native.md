# Firebase in React Native apps

## Setup

- Use React Native Firebase: `@react-native-firebase/app` plus one package per product (below). Add `google-services.json` and `GoogleService-Info.plist` to the native projects, or reference them in the config plugins with Expo.
- Expo: React Native Firebase needs a development build with config plugins (`npx expo prebuild`); it does not run in Expo Go.
- iOS: on React Native 0.75+, React Native Firebase resolves the Firebase Apple SDK with Swift Package Manager by default, which requires dynamic frameworks (`use_frameworks! :linkage => :dynamic`). Static frameworks require opting out of SPM. Follow the installation page for the version in `package.json`.
- Prefer the modular API (`getAuth()`, `onAuthStateChanged(getAuth(), ...)`) over the deprecated namespaced API (`auth().onAuthStateChanged(...)`), and match what the installed version documents.
- The Firebase JS SDK (the `firebase` npm package) is a different library. Do not mix it with React Native Firebase for the same product.

## Products

Each guide names the React Native Firebase package. SQL Connect has no React Native SDK; its guide explains the alternatives.

| Product | Guide |
|---|---|
| Authentication | [react-native/auth.md](react-native/auth.md) |
| Cloud Firestore | [react-native/firestore.md](react-native/firestore.md) |
| Realtime Database | [react-native/realtime-database.md](react-native/realtime-database.md) |
| Cloud Storage | [react-native/storage.md](react-native/storage.md) |
| Cloud Functions (callable) | [react-native/functions.md](react-native/functions.md) |
| Cloud Messaging (push) | [react-native/messaging.md](react-native/messaging.md) |
| Analytics | [react-native/analytics.md](react-native/analytics.md) |
| Crashlytics | [react-native/crashlytics.md](react-native/crashlytics.md) |
| Remote Config | [react-native/remote-config.md](react-native/remote-config.md) |
| App Check | [react-native/app-check.md](react-native/app-check.md) |
| In-App Messaging | [react-native/in-app-messaging.md](react-native/in-app-messaging.md) |
| AI Logic | [react-native/ai-logic.md](react-native/ai-logic.md) |
| SQL Connect (formerly Data Connect) | [react-native/sql-connect.md](react-native/sql-connect.md) |
