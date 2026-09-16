# Firebase Cloud Messaging — native Android (Kotlin)

Project setup shared by every Firebase product is in [../android.md](../android.md). The concepts in `SKILL.md` — security rules, App Check, environments, the Local Emulator Suite — apply here too.

## Dependency

`implementation("com.google.firebase:firebase-messaging")`

## Service

```kotlin
class AppMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        // send the token to your backend, associated with the signed-in user
    }

    override fun onMessageReceived(message: RemoteMessage) {
        // data messages: always delivered here
        // notification messages: delivered here only while the app is in the foreground
    }
}
```

```xml
<service android:name=".AppMessagingService" android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
</service>
```

- `onMessageReceived` must return quickly; hand long work to `WorkManager`.
- Android 13 (API 33) and higher: request the `POST_NOTIFICATIONS` runtime permission, with context, before expecting notifications to show.
- Android 8 and higher need a notification channel; set the default one with the `com.google.firebase.messaging.default_notification_channel_id` meta-data in the manifest.
- Current token: `Firebase.messaging.token.await()`. Tokens change: always handle `onNewToken`, and remove tokens the backend reports as unregistered.
- Tapping a notification message opens the launcher Activity with the data payload in the intent extras.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Security rules and App Check are the real protection: anything in the app binary can be read or modified.
