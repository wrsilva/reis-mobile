# Cloud Functions for Firebase (callable functions) — React Native

Project setup shared by every Firebase product is in [../react-native.md](../react-native.md). The concepts in `SKILL.md` — security rules, App Check, environments, the Local Emulator Suite — apply here too.

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
- Security rules and App Check are the real protection: anything in the app binary can be read or modified.
