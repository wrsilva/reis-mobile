# Firebase Realtime Database — React Native

Use this reference instead of the Dart code in `SKILL.md` when the project is a React Native or Expo app. The product concepts in `SKILL.md` — security rules, data modeling, error handling, testing with the Local Emulator Suite — still apply.

## Setup

- Use React Native Firebase: `@react-native-firebase/app` plus one package per product (below). Add `google-services.json` and `GoogleService-Info.plist` to the native projects, or reference them in the config plugins with Expo.
- Expo: React Native Firebase needs a development build with config plugins (`npx expo prebuild`); it does not run in Expo Go.
- iOS: on React Native 0.75+, React Native Firebase resolves the Firebase Apple SDK with Swift Package Manager by default, which requires dynamic frameworks (`use_frameworks! :linkage => :dynamic`). Static frameworks require opting out of SPM. Follow the installation page for the version in `package.json`.
- Prefer the modular API (`getAuth()`, `onAuthStateChanged(getAuth(), ...)`) over the deprecated namespaced API (`auth().onAuthStateChanged(...)`), and match what the installed version documents.
- The Firebase JS SDK (the `firebase` npm package) is a different library. Do not mix it with React Native Firebase for the same product.

## Package

`@react-native-firebase/database`

## Read and listen

```tsx
import { getDatabase, ref, query, limitToLast, onValue } from '@react-native-firebase/database';

useEffect(() => {
  const messagesQuery = query(ref(getDatabase(), `rooms/${roomId}/messages`), limitToLast(50));
  const unsubscribe = onValue(messagesQuery, (snapshot) => {
    const next: Message[] = [];
    snapshot.forEach((child) => {
      next.push({ id: child.key, ...child.val() });
      return undefined;
    });
    setMessages(next);
  });
  return unsubscribe;
}, [roomId]);
```

Listen to the narrowest path the screen needs; a listener on a parent node downloads every child.

## Write

```ts
import { getDatabase, ref, push, set, update, serverTimestamp } from '@react-native-firebase/database';

await set(push(ref(getDatabase(), `rooms/${roomId}/messages`)), { text, author: uid, sentAt: serverTimestamp() });
```

## Notes

- Disk persistence must be enabled before the first database call; see the persistence section of the installed version's documentation for the exact API.
- A database outside the default region needs its URL when getting the instance.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Keep Firebase security rules and App Check as the real protection: anything in the app binary can be read or modified.
