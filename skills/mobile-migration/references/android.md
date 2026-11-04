# Migrations on Android

- Read AGP, Gradle, Kotlin, `compileSdk`, `targetSdk` and `minSdk` from the version catalog, `gradle-wrapper.properties` and module build files. Raising `targetSdk` changes runtime behavior: do it as its own step after reading the behavior changes for each API level crossed.
- Use the AGP Upgrade Assistant and the [AGP 9 guide](../../mobile-android/references/build-and-performance.md). Views to Compose and Navigation 3 are in the [UI guides](../../mobile-android/references/ui.md), Leanback to Compose for TV in the [form factor guides](../../mobile-android/references/devices.md) and Play Billing Library upgrades in the [Play guides](../../mobile-android/references/play.md).
- Room: increase `version` in `@Database`, provide a `Migration(from, to)` or `@AutoMigration` for each step, export schemas and test with `MigrationTestHelper`. Reserve `fallbackToDestructiveMigration` for disposable caches.
- Move SharedPreferences to DataStore with `SharedPreferencesMigration`, which removes the migrated keys and deletes the file once it is empty.
- Test an upgrade install with `adb install -r` over the previous build, which keeps app data, including on the oldest supported OS version.

Official references: [Room migrations](https://developer.android.com/training/data-storage/room/migrating-db-versions), [app compatibility and behavior changes](https://developer.android.com/guide/app-compatibility).
