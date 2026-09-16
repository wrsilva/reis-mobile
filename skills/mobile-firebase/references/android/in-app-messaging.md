# Firebase In-App Messaging — native Android (Kotlin)

Project setup shared by every Firebase product is in [../android.md](../android.md). The concepts in `SKILL.md` — security rules, App Check, environments, the Local Emulator Suite — apply here too.

## Dependencies

`implementation("com.google.firebase:firebase-inappmessaging-display")`, plus `firebase-analytics`: campaigns are triggered by Analytics events.

## Usage

```kotlin
private val inAppMessaging = Firebase.inAppMessaging

inAppMessaging.setMessagesSuppressed(true)    // during onboarding, checkout or other flows that must not be interrupted
inAppMessaging.setMessagesSuppressed(false)
inAppMessaging.triggerEvent("checkout_completed")   // trigger a campaign without logging an Analytics event
```

## Notes

- Messages display on the next foreground after they are fetched, not immediately after publishing a campaign.
- To preview a campaign on a device, use **Test on device** in the console with the app instance's Firebase Installation ID (`Firebase.installations.id`).
- A custom look requires implementing `FirebaseInAppMessagingDisplay` and registering it.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Security rules and App Check are the real protection: anything in the app binary can be read or modified.
