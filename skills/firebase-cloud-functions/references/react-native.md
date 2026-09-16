# Cloud Functions for Firebase (callable functions) — React Native

Use this reference instead of the Dart code in `SKILL.md` when the project is a React Native or Expo app. The product concepts in `SKILL.md` — security rules, data modeling, error handling, testing with the Local Emulator Suite — still apply.

## Setup

- Use React Native Firebase: `@react-native-firebase/app` plus one package per product (below). Add `google-services.json` and `GoogleService-Info.plist` to the native projects, or reference them in the config plugins with Expo.
- Expo: React Native Firebase needs a development build with config plugins (`npx expo prebuild`); it does not run in Expo Go.
- iOS: on React Native 0.75+, React Native Firebase resolves the Firebase Apple SDK with Swift Package Manager by default, which requires dynamic frameworks (`use_frameworks! :linkage => :dynamic`). Static frameworks require opting out of SPM. Follow the installation page for the version in `package.json`.
- Prefer the modular API (`getAuth()`, `onAuthStateChanged(getAuth(), ...)`) over the deprecated namespaced API (`auth().onAuthStateChanged(...)`), and match what the installed version documents.
- The Firebase JS SDK (the `firebase` npm package) is a different library. Do not mix it with React Native Firebase for the same product.

## Package

`@react-native-firebase/functions`

## Call a function

```ts
import { getApp } from '@react-native-firebase/app';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';

const functions = getFunctions(getApp(), 'europe-west1'); // must match the deployed region
const addMessage = httpsCallable<{ text: string }, { id: string }>(functions, 'addMessage');

const { data } = await addMessage({ text });
```

- A region mismatch fails as not found; without a region the client targets `us-central1`.
- Errors carry `code` (for example `functions/unauthenticated`) and `details` from the function's `HttpsError`.
- The signed-in user's ID token and the App Check token are sent automatically; authorize in the function, never only in the app.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Keep Firebase security rules and App Check as the real protection: anything in the app binary can be read or modified.
