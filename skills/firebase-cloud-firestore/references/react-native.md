# Cloud Firestore — React Native

Use this reference instead of the Dart code in `SKILL.md` when the project is a React Native or Expo app. The product concepts in `SKILL.md` — security rules, data modeling, error handling, testing with the Local Emulator Suite — still apply.

## Setup

- Use React Native Firebase: `@react-native-firebase/app` plus one package per product (below). Add `google-services.json` and `GoogleService-Info.plist` to the native projects, or reference them in the config plugins with Expo.
- Expo: React Native Firebase needs a development build with config plugins (`npx expo prebuild`); it does not run in Expo Go.
- iOS: on React Native 0.75+, React Native Firebase resolves the Firebase Apple SDK with Swift Package Manager by default, which requires dynamic frameworks (`use_frameworks! :linkage => :dynamic`). Static frameworks require opting out of SPM. Follow the installation page for the version in `package.json`.
- Prefer the modular API (`getAuth()`, `onAuthStateChanged(getAuth(), ...)`) over the deprecated namespaced API (`auth().onAuthStateChanged(...)`), and match what the installed version documents.
- The Firebase JS SDK (the `firebase` npm package) is a different library. Do not mix it with React Native Firebase for the same product.

## Package

`@react-native-firebase/firestore`

## Read and listen

```tsx
import { getFirestore, collection, query, where, orderBy, onSnapshot } from '@react-native-firebase/firestore';

useEffect(() => {
  const q = query(collection(getFirestore(), 'orders'), where('userId', '==', uid), orderBy('createdAt', 'desc'));
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => setOrders(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))),
    (error) => setError(error),
  );
  return unsubscribe;
}, [uid]);
```

Always return the unsubscribe function from the effect; a forgotten listener keeps reading documents and billing reads.

## Write

```ts
import { getFirestore, doc, setDoc, serverTimestamp, runTransaction, writeBatch } from '@react-native-firebase/firestore';

await setDoc(doc(getFirestore(), 'orders', id), { userId: uid, total, createdAt: serverTimestamp() });
```

Use `writeBatch` or `runTransaction` when several documents must change together.

## Notes

- Offline persistence is on by default on both platforms; design UI for pending writes.
- A query that needs a composite index fails with an error containing a link that creates it.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Keep Firebase security rules and App Check as the real protection: anything in the app binary can be read or modified.
