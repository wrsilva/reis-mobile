# Cloud Firestore — React Native

Project setup shared by every Firebase product is in [../react-native.md](../react-native.md). The concepts in `SKILL.md` — security rules, App Check, environments, the Local Emulator Suite — apply here too.

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
- Security rules and App Check are the real protection: anything in the app binary can be read or modified.
