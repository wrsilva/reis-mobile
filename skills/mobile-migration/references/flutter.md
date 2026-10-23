# Migrations in Flutter

- Record the Flutter and Dart versions from `flutter --version`, the pin the project uses (`.fvmrc`, `.tool-versions` or the CI image), the `environment` constraint in `pubspec.yaml` and `pubspec.lock`. Read the [breaking changes](https://docs.flutter.dev/release/breaking-changes) for every release crossed.
- Run `dart fix --dry-run`, review it, then `dart fix --apply`. Use `flutter pub outdated` to see which versions resolve. `flutter pub upgrade --major-versions` rewrites constraints, so run it deliberately and per group.
- The `android/` and `ios/` folders carry their own migrations (Gradle, AGP, Kotlin, CocoaPods, deployment target). Apply the [Android](android.md) and [iOS](ios.md) references to them.
- For a state library swap such as BLoC to Riverpod, migrate one feature behind its existing repository or use-case boundary, and do not let both libraries own the same state.
- Local data: bump `version` and handle `onUpgrade` in `sqflite`, or `schemaVersion` with a `MigrationStrategy` in drift; check the installed drift version for its schema export and step-by-step migration tooling. Rename `shared_preferences` keys by reading the old key, writing the new one and then removing the old.
- Test migrations with fixture databases from each supported schema, then an upgrade install on a device.

Official reference: [dart fix](https://dart.dev/tools/dart-fix).
