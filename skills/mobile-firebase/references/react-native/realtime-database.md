# Firebase Realtime Database — React Native

Project setup shared by every Firebase product is in [../react-native.md](../react-native.md). The concepts in `SKILL.md` — security rules, App Check, environments, the Local Emulator Suite — apply here too.

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
- Security rules and App Check are the real protection: anything in the app binary can be read or modified.
