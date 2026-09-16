# Cloud Storage for Firebase — React Native

Use this reference instead of the Dart code in `SKILL.md` when the project is a React Native or Expo app. The product concepts in `SKILL.md` — security rules, data modeling, error handling, testing with the Local Emulator Suite — still apply.

## Setup

- Use React Native Firebase: `@react-native-firebase/app` plus one package per product (below). Add `google-services.json` and `GoogleService-Info.plist` to the native projects, or reference them in the config plugins with Expo.
- Expo: React Native Firebase needs a development build with config plugins (`npx expo prebuild`); it does not run in Expo Go.
- iOS: on React Native 0.75+, React Native Firebase resolves the Firebase Apple SDK with Swift Package Manager by default, which requires dynamic frameworks (`use_frameworks! :linkage => :dynamic`). Static frameworks require opting out of SPM. Follow the installation page for the version in `package.json`.
- Prefer the modular API (`getAuth()`, `onAuthStateChanged(getAuth(), ...)`) over the deprecated namespaced API (`auth().onAuthStateChanged(...)`), and match what the installed version documents.
- The Firebase JS SDK (the `firebase` npm package) is a different library. Do not mix it with React Native Firebase for the same product.

## Package

`@react-native-firebase/storage`

## Upload

```ts
import { getStorage, ref, putFile, getDownloadURL } from '@react-native-firebase/storage';

async function uploadAvatar(uid: string, localPath: string, onProgress: (ratio: number) => void) {
  const avatarRef = ref(getStorage(), `users/${uid}/avatar.jpg`);
  const task = putFile(avatarRef, localPath, { contentType: 'image/jpeg' });
  task.on('state_changed', (snapshot) => onProgress(snapshot.bytesTransferred / snapshot.totalBytes));
  await task;
  return getDownloadURL(avatarRef);
}
```

- `putFile` needs a local file path. Image pickers can return URIs that are not plain files (for example `ph://` assets on iOS or some `content://` URIs on Android); copy or export them to a file first, and check what the installed picker returns.
- Compress and resize images before uploading.
- Put user files under a path with the user id and enforce it in Storage security rules.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Keep Firebase security rules and App Check as the real protection: anything in the app binary can be read or modified.
