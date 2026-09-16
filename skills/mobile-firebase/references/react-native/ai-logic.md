# Firebase AI Logic — React Native

Project setup shared by every Firebase product is in [../react-native.md](../react-native.md). The concepts in `SKILL.md` — security rules, App Check, environments, the Local Emulator Suite — apply here too.

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
- Security rules and App Check are the real protection: anything in the app binary can be read or modified.
