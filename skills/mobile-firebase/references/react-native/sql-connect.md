# Firebase SQL Connect (formerly Data Connect) — React Native

Firebase Data Connect is now called **Firebase SQL Connect**; the APIs did not change.

## Support status

- React Native Firebase has **no** SQL Connect / Data Connect module, and Firebase generates SDKs for Web, Android (Kotlin), iOS (Swift) and Flutter.
- The generated Web SDK (`javascriptSdk` in `connector.yaml`) targets the Firebase JS SDK (`firebase` npm package). Using it in React Native means mixing the JS SDK with React Native Firebase: verify in a spike that it works in the app's JavaScript engine, including authentication with the same user, before recommending it.
- Alternative that works today: expose the needed operations through callable Cloud Functions or your backend, and call them with `@react-native-firebase/functions`.

State this limitation to the user instead of writing code for an SDK that the project cannot use.
