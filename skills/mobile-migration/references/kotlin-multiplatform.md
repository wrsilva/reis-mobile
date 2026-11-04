# Migrations in Kotlin Multiplatform

- The Kotlin version constrains Compose Multiplatform, coroutines, serialization, Ktor and SQLDelight. Upgrade Kotlin with their compatibility tables and check which Xcode versions the Kotlin/Native release supports.
- SQLDelight: add a numbered `.sqm` migration for each schema change and run the migration verification task the plugin generates, with schema databases from each released version.
- The exported iOS framework is a public contract for Swift callers. A rename, a moved type or a changed nullability breaks the iOS app even when Android compiles, so migrate the Swift callers in the same step.
- Move code into `commonMain` behind the interface its callers already use, one feature at a time, and keep host APIs in the host source sets.
- Verify both hosts after each step, including an upgrade install on each; an Android pass does not prove the iOS framework.

Official references: [Kotlin Multiplatform compatibility guide](https://kotlinlang.org/docs/multiplatform/multiplatform-compatibility-guide.html), [SQLDelight migrations](https://sqldelight.github.io/sqldelight/latest/multiplatform_sqlite/migrations/). Apply the [Android](android.md) and [iOS](ios.md) references to host data.
