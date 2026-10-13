# Notifications in React Native and Expo

- Identify `expo-notifications`, native Firebase messaging or another installed provider before changing setup. Keep Expo push tokens distinct from native APNs/FCM tokens and use the corresponding backend transport.
- In Expo, inspect app config/plugins and credentials. Use a development/native build when required by the installed SDK; Expo Go is not evidence of production push support.
- Register listeners at a stable lifetime and remove them on teardown. Handle both a last/initial response and later response events without duplicate navigation.
- Wait for session and navigation readiness before consuming a tap. Validate destination, resource ownership and account identity; invalidate pending taps on account switch.
- Token rotation must update the authenticated backend association. Provider tickets/receipts need server-side handling; JS registration success does not prove display.
- Test mapping/dedup logic with the existing JS runner and foreground/background/terminated behavior in both host builds. Verify local schedules after timezone/account changes when the product supports them.

Official reference: [Expo notifications](https://docs.expo.dev/versions/latest/sdk/notifications/). For native Firebase integration, use [React Native messaging](../../mobile-firebase/references/react-native/messaging.md).
