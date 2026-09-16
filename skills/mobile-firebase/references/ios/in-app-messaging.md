# Firebase In-App Messaging — native iOS (Swift)

Project setup shared by every Firebase product is in [../ios.md](../ios.md). The concepts in `SKILL.md` — security rules, App Check, environments, the Local Emulator Suite — apply here too.

## Package product

`FirebaseInAppMessaging-Beta` (the Swift package still labels the product beta) — `import FirebaseInAppMessaging`. Add `FirebaseAnalytics` too: campaigns are triggered by Analytics events.

## Usage

```swift
InAppMessaging.inAppMessaging().messageDisplaySuppressed = true   // during flows that must not be interrupted
InAppMessaging.inAppMessaging().messageDisplaySuppressed = false
InAppMessaging.inAppMessaging().triggerEvent("checkout_completed")
```

## Notes

- Messages display on the next foreground after they are fetched, not immediately after publishing a campaign.
- To preview a campaign, use **Test on device** in the console with the Firebase Installation ID (`try await Installations.installations().installationID()`).
- A custom look requires implementing `InAppMessagingDisplay` and setting it as the display component.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Security rules and App Check are the real protection: anything in the app binary can be read or modified.
