# Cloud Storage for Firebase — React Native

Project setup shared by every Firebase product is in [../react-native.md](../react-native.md). The concepts in `SKILL.md` — security rules, App Check, environments, the Local Emulator Suite — apply here too.

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
- Security rules and App Check are the real protection: anything in the app binary can be read or modified.
