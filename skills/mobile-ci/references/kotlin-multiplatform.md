# Kotlin Multiplatform CI

Read the [KMP release reference](../../mobile-release/references/kotlin-multiplatform.md).

- Identify the shared module and each shipping host app. Resolve the Gradle, Kotlin, JDK and Xcode versions from the repository; do not assume module or task names.
- Run the configured shared tests and platform checks, then build Android and iOS host artifacts from the same source revision. Account for the shared framework's actual CocoaPods, direct integration or other configured delivery method.
- Follow [Android](android.md) for the Android app and [iOS](ios.md) for the iOS host. Match and TestFlight apply to the iOS app, not to the shared Kotlin library.
- Retain each host's version, artifact, symbols and upload result independently. A successful shared-library build does not prove that either host is ready to distribute.
