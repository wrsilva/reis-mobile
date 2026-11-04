# Billing in React Native and Expo

- Confirm the library in `package.json` and the lockfile (`react-native-iap`, a vendor SDK such as RevenueCat's, or native modules). Check its support for the installed React Native version and the New Architecture.
- In-app purchases need native code: Expo Go cannot run them, so use a development build. Add store capabilities and permissions through the library's config plugin or the native project files.
- Open the store connection and register purchase listeners in an app-root owner, not in the paywall screen, and remove them only when that owner unmounts. Keep listener callbacks idempotent: React Strict Mode runs effects twice in development.
- Send the purchase token or signed transaction to the backend. Call the library's finish or acknowledge function only after the backend records it, marking consumables as such.
- Ignore late results for an account generation that is no longer active, and let the backend reconcile them.
- Test the purchase state machine in Jest with the native module mocked. Store behavior needs native builds against the [Android](android.md) and [iOS](ios.md) sandboxes.

Official reference: [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/). Store rules for digital goods are in the [platform guide](../../mobile-rn/references/platform-features.md).
