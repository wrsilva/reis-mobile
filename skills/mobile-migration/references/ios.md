# Migrations on iOS

- Record the Xcode version CI uses, the Swift language mode per target, the deployment target and `Package.resolved` or `Podfile.lock`.
- Swift 6: raise strict concurrency checking to complete one target or package at a time, fix the diagnostics, then switch that module to the Swift 6 language mode. Do not silence diagnostics with `@unchecked Sendable` or `nonisolated(unsafe)` without a written reason.
- UIKit to SwiftUI: embed SwiftUI with `UIHostingController` and wrap remaining UIKit with `UIViewRepresentable` or `UIViewControllerRepresentable`. Migrate leaf screens first and keep the existing navigation owner until the last screen moves.
- Core Data: lightweight migration handles additive changes; use staged migrations with `NSStagedMigrationManager` (iOS 17 and later) or a mapping model for the rest. SwiftData: declare each `VersionedSchema` and a `SchemaMigrationPlan` with lightweight or custom stages.
- Rename `UserDefaults` keys by reading the old key, writing the new one and removing the old in the same launch. Keychain items can survive app deletion, and a changed access group needs an explicit copy step.
- Test an upgrade by installing the previous archive or TestFlight build, creating data, then installing the new build over it.

Official references: [Swift 6 migration guide](https://www.swift.org/migration/documentation/migrationguide/), [Core Data automatic migration](https://developer.apple.com/documentation/coredata/migrating-your-data-model-automatically), [staged migrations](https://developer.apple.com/documentation/coredata/staged-migrations), [SchemaMigrationPlan](https://developer.apple.com/documentation/swiftdata/schemamigrationplan).
