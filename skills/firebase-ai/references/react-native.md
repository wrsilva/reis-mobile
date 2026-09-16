# Firebase AI Logic — React Native

Use this reference instead of the Dart code in `SKILL.md` when the project is a React Native or Expo app. The product concepts in `SKILL.md` — security rules, data modeling, error handling, testing with the Local Emulator Suite — still apply.

## Setup

- Use React Native Firebase: `@react-native-firebase/app` plus one package per product (below). Add `google-services.json` and `GoogleService-Info.plist` to the native projects, or reference them in the config plugins with Expo.
- Expo: React Native Firebase needs a development build with config plugins (`npx expo prebuild`); it does not run in Expo Go.
- iOS: on React Native 0.75+, React Native Firebase resolves the Firebase Apple SDK with Swift Package Manager by default, which requires dynamic frameworks (`use_frameworks! :linkage => :dynamic`). Static frameworks require opting out of SPM. Follow the installation page for the version in `package.json`.
- Prefer the modular API (`getAuth()`, `onAuthStateChanged(getAuth(), ...)`) over the deprecated namespaced API (`auth().onAuthStateChanged(...)`), and match what the installed version documents.
- The Firebase JS SDK (the `firebase` npm package) is a different library. Do not mix it with React Native Firebase for the same product.

## Package

`@react-native-firebase/ai`

## Generate content

```ts
import { getApp } from '@react-native-firebase/app';
import { getAI, getGenerativeModel, GoogleAIBackend } from '@react-native-firebase/ai';

const ai = getAI(getApp(), { backend: new GoogleAIBackend() });
const model = getGenerativeModel(ai, { model: '<model name>' });

export async function summarize(text: string) {
  const result = await model.generateContent(`Summarize in two sentences:\n${text}`);
  return result.response.text();
}
```

- The API mirrors the Firebase JS SDK's `firebase/ai`; confirm the exported names and backends against the installed version's documentation.
- Model names change and older ones are retired: take the name from the current Firebase AI Logic documentation and keep it in Remote Config.
- There is no API key in the app: requests go through Firebase. Enable App Check to keep others from calling the model at your cost.
- The older `@react-native-firebase/vertexai` package is the predecessor; do not add both.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Keep Firebase security rules and App Check as the real protection: anything in the app binary can be read or modified.
