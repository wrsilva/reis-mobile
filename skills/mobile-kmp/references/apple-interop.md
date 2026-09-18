# iOS host and framework integration

Locate the iOS app target, scheme and the shared framework declaration in the KMP build. Determine whether the app integrates it through an Xcode build phase, a local/remote Swift package, CocoaPods or another checked-in path. Trace the same Kotlin API to its Swift call and back through errors, callbacks or state observation.

For an iOS build failure, separate Kotlin/Native compilation, framework export/linking, Xcode signing and Swift source errors. Inspect the actual build phase and artifact path before changing Gradle or Pods. Match architecture, configuration and framework version to the failing simulator or device. For a release, verify the framework embedded in the signed app matches the shared module revision and preserve the app's existing symbol upload path.

An iOS simulator test of shared Kotlin does not exercise the Swift app's navigation, permissions or VoiceOver. Use the iOS topic reference when the changed behavior lives in the host.

Reference: [official iOS integration methods](https://kotlinlang.org/docs/multiplatform-ios-integration-overview.html).
