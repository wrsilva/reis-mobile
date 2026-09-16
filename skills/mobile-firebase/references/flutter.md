# Firebase in Flutter apps

## Setup

Configure the project with the FlutterFire CLI (`flutterfire configure`), which registers the apps and generates `lib/firebase_options.dart`; details in [flutter/setup-flutterfire.md](flutter/setup-flutterfire.md). Then initialize before `runApp`:

```dart
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  runApp(const App());
}
```

- Add products with `flutter pub add <package>` (`firebase_auth`, `cloud_firestore`...) and keep FlutterFire package versions compatible with each other; check `pubspec.lock` before adding one.
- Native requirements still apply per platform: the iOS deployment target and `pod install` in `ios/`, `minSdk` and the Google services plugin in `android/`, APNs setup for messaging.

## Products

| Product | Guide |
|---|---|
| Authentication | [flutter/auth.md](flutter/auth.md) |
| Cloud Firestore | [flutter/firestore.md](flutter/firestore.md) |
| Realtime Database | [flutter/realtime-database.md](flutter/realtime-database.md) |
| Cloud Storage | [flutter/storage.md](flutter/storage.md) |
| Cloud Functions (callable) | [flutter/functions.md](flutter/functions.md) |
| Cloud Messaging (push) | [flutter/messaging.md](flutter/messaging.md) |
| Analytics | [flutter/analytics.md](flutter/analytics.md) |
| Crashlytics | [flutter/crashlytics.md](flutter/crashlytics.md) |
| Remote Config | [flutter/remote-config.md](flutter/remote-config.md) |
| App Check | [flutter/app-check.md](flutter/app-check.md) |
| In-App Messaging | [flutter/in-app-messaging.md](flutter/in-app-messaging.md) |
| AI Logic | [flutter/ai-logic.md](flutter/ai-logic.md) |
| SQL Connect (formerly Data Connect) | [flutter/sql-connect.md](flutter/sql-connect.md) |

SQL Connect is the new name of Firebase Data Connect; the Flutter guide still uses the old name, and the APIs did not change.
