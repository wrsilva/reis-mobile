# Analytics on Android

- Read the SDK from the version catalog or Gradle files and inspect what it collects automatically at startup; a consent switch in the UI cannot stop an initializer that already ran. When collection must wait for consent, disable automatic collection in the manifest as the [data collection guide](https://firebase.google.com/docs/analytics/configure-data-collection?platform=android) describes for Firebase, and enable it after consent.
- In Compose, do not log from a composable body: recomposition repeats it. Log screen views from navigation callbacks such as `NavController.addOnDestinationChangedListener`, and one-time events from the ViewModel after the outcome is confirmed.
- Firebase consent, screen views and DebugView setup are in the [Firebase Analytics reference](../../mobile-firebase/references/android/analytics.md).
- Reset the analytics identity in the sign-out flow, before the next account's events start.
- Test the ViewModel or use case with a fake analytics interface, and confirm delivery in the destination's debug view with a debug build.

Official reference: [Firebase Analytics events](https://firebase.google.com/docs/analytics/events?platform=android).
