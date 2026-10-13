# Privacy on iOS

- Inventory app and extension targets, SDK startup and required-reason API use. Inspect the built app's privacy resources and the SDKs actually linked; a source file alone is not evidence of inclusion.
- Keep App Tracking Transparency authorization separate from app-purpose consent and camera/location permissions. Determine whether the actual data use falls under tracking before adding a prompt.
- Check purpose strings and privacy manifest declarations against current Apple guidance. Do not treat a manifest as a consent implementation.
- Provide the account deletion flow required for the app's account model. For Sign in with Apple, include the backend token-revocation handoff; keep server credentials off the device.
- Inventory Keychain, app-group containers, files and extension caches during local cleanup. Coordinate background work so it cannot recreate removed account data.
- Verify denied consent before SDK startup, withdrawal, restart and failed deletion. Record what cannot be verified without backend or App Store Connect access.

Official references: [privacy manifests](https://developer.apple.com/documentation/bundleresources/privacy_manifest_files), [account deletion](https://developer.apple.com/support/offering-account-deletion-in-your-app/).
