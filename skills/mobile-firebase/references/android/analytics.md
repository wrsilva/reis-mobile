# Google Analytics for Firebase — native Android (Kotlin)

Project setup shared by every Firebase product is in [../android.md](../android.md). The concepts in `SKILL.md` — security rules, App Check, environments, the Local Emulator Suite — apply here too.

## Dependency

`implementation("com.google.firebase:firebase-analytics")`

## Events

```kotlin
private val analytics = Firebase.analytics

analytics.logEvent(FirebaseAnalytics.Event.SELECT_ITEM) {
    param(FirebaseAnalytics.Param.ITEM_ID, item.id)
    param(FirebaseAnalytics.Param.ITEM_NAME, item.name)
}
```

- Prefer the recommended events and parameters (`FirebaseAnalytics.Event.*`, `FirebaseAnalytics.Param.*`) before inventing custom ones; reports use them.
- Custom event and parameter names: letters, digits and underscores, starting with a letter; check the current length and count limits in the documentation before designing a schema.
- Never log personal data (emails, names, phone numbers) as parameters or user properties.
- Screen views are collected automatically for Activities. For Compose navigation or single-Activity apps, log `FirebaseAnalytics.Event.SCREEN_VIEW` with `SCREEN_NAME` from the navigation callback.

## Consent and debugging

- Consent: `analytics.setConsent { analyticsStorage(FirebaseAnalytics.ConsentStatus.GRANTED) }` after the user decides; default consent can be set in the manifest.
- DebugView: `adb shell setprop debug.firebase.analytics.app <application-id>`, then `adb shell setprop debug.firebase.analytics.app .none.` to disable.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Security rules and App Check are the real protection: anything in the app binary can be read or modified.
