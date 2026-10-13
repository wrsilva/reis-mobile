# Notifications in Flutter

- For FCM, reuse the installed plugin's [messaging guide](../../mobile-firebase/references/flutter/messaging.md). Distinguish foreground messages, background handling, opening from background and the initial message at terminated launch.
- Background callbacks may execute without the UI isolate/navigation tree. Respect plugin entrypoint and initialization requirements for the installed version; hand off a validated pending destination to the UI owner.
- Subscribe once to token changes at the app lifetime boundary. Reconcile server bindings against the current account so a late callback cannot associate a token with the logged-out user.
- A separate local-notification plugin can duplicate provider-displayed messages. Define which path owns display for each payload/app state.
- Persist and consume a pending tap only after authentication and router readiness; deduplicate against later open callbacks. Clear account-scoped local schedules when required.
- Test handlers with fake messages and run the lifecycle matrix on configured Android/iOS builds. Hot reload does not reproduce terminated launch.

Official reference: [Flutter FCM receive behavior](https://firebase.google.com/docs/cloud-messaging/flutter/receive).
