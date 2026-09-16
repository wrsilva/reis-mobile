# Firebase Authentication — React Native

Project setup shared by every Firebase product is in [../react-native.md](../react-native.md). The concepts in `SKILL.md` — security rules, App Check, environments, the Local Emulator Suite — apply here too.

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
- Security rules and App Check are the real protection: anything in the app binary can be read or modified.
