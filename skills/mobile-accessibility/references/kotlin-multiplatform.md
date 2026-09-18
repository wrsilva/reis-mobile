# Kotlin Multiplatform accessibility

Determine whether the changed screen is shared Compose Multiplatform UI, native Android UI, native SwiftUI/UIKit, or a mix. KMP shared domain code has no accessibility tree by itself.

- For shared Compose UI, inspect semantics and state on the actual component, then verify the Android and iOS host experience with TalkBack and VoiceOver. Check the installed Compose version's iOS accessibility behavior against [JetBrains' iOS accessibility guide](https://kotlinlang.org/docs/multiplatform/compose-ios-accessibility.html).
- For native host UI, use the [Android](android.md) or [iOS](ios.md) reference and inspect the adapter that turns a shared state/error into labels, announcements and focus transitions.
- Test the same critical journey on both targets at large text sizes. A shared composable test does not prove native screen-reader behavior on either device.

Give **screen path:symbol → rendered target UI → missing name/role/state/order or focus behavior → target-specific fix → verification**. If a target UI is absent, report that fact instead of claiming parity.
