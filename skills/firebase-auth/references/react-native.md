# Firebase Authentication — React Native

Use this reference instead of the Dart code in `SKILL.md` when the project is a React Native or Expo app. The product concepts in `SKILL.md` — security rules, data modeling, error handling, testing with the Local Emulator Suite — still apply.

## Setup

- Use React Native Firebase: `@react-native-firebase/app` plus one package per product (below). Add `google-services.json` and `GoogleService-Info.plist` to the native projects, or reference them in the config plugins with Expo.
- Expo: React Native Firebase needs a development build with config plugins (`npx expo prebuild`); it does not run in Expo Go.
- iOS: on React Native 0.75+, React Native Firebase resolves the Firebase Apple SDK with Swift Package Manager by default, which requires dynamic frameworks (`use_frameworks! :linkage => :dynamic`). Static frameworks require opting out of SPM. Follow the installation page for the version in `package.json`.
- Prefer the modular API (`getAuth()`, `onAuthStateChanged(getAuth(), ...)`) over the deprecated namespaced API (`auth().onAuthStateChanged(...)`), and match what the installed version documents.
- The Firebase JS SDK (the `firebase` npm package) is a different library. Do not mix it with React Native Firebase for the same product.

## Package

`@react-native-firebase/auth`

## Auth state

```tsx
import { getAuth, onAuthStateChanged, FirebaseAuthTypes } from '@react-native-firebase/auth';

function useCurrentUser() {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (next) => {
      setUser(next);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  return { user, initializing };
}
```

The listener fires once with the persisted state at startup; render a splash or loading state until then instead of flashing the login screen.

## Email and password

```ts
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '@react-native-firebase/auth';

await createUserWithEmailAndPassword(getAuth(), email, password);
await signInWithEmailAndPassword(getAuth(), email, password);
```

Errors carry a `code` such as `auth/email-already-in-use`, `auth/weak-password` or `auth/invalid-credential`. With email enumeration protection enabled, do not tell the user whether the email or the password was wrong.

## Google and Apple

Get the ID token with a native sign-in library (for Google, `@react-native-google-signin/google-signin`; for Apple, a library such as `@invertase/react-native-apple-authentication`), then sign in with `GoogleAuthProvider.credential(idToken)` or `AppleAuthProvider.credential(identityToken, nonce)` and `signInWithCredential`. The native requirements of each platform still apply: SHA fingerprints on Android, URL schemes and the Sign in with Apple capability on iOS.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Keep Firebase security rules and App Check as the real protection: anything in the app binary can be read or modified.
