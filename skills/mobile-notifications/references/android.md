# Notifications on Android

- Check target/runtime SDK behavior for notification permission and channels. Treat channel importance/settings as user-controlled; do not recreate channels to bypass a user's choice.
- For FCM, inspect [Android messaging](../../mobile-firebase/references/android/messaging.md) and distinguish notification versus data payload handling in each app state.
- Keep service callbacks short. Hand longer deferrable work to the appropriate scheduler; delivery priority is not permission for unlimited background work.
- Validate `PendingIntent` identity, target and mutability for the intended action. Handle both a newly created activity and delivery to an existing activity without repeating navigation.
- Use unique logical schedule identifiers and verify alarm/reboot behavior when local scheduling requires it. Do not request exact-alarm capabilities for ordinary deferrable notifications.
- Test denied permission, disabled channel, token refresh, repeated taps, force-stop/relaunch behavior and account changes. Distinguish provider send success from on-device receipt and display.

Official references: [notifications](https://developer.android.com/develop/ui/views/notifications), [notification permission](https://developer.android.com/develop/ui/views/notifications/notification-permission).
