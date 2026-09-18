# Shared UI versus native UI

First find where the screen is implemented. A KMP app may share only logic and render with Jetpack Compose on Android and SwiftUI/UIKit on iOS, or share UI with Compose Multiplatform. Do not apply Compose tests or semantics to a native Swift screen.

For shared Compose UI, trace the screen's state owner, Composable entry, navigation owner and the Android/iOS host that installs it. Keep platform services behind the project's existing boundary. Inspect resource generation and the source set holding each resource; Android `R` resources and Compose Multiplatform `Res` accessors are different APIs.

For accessibility, inspect Compose semantics and verify them on both targets with TalkBack/VoiceOver. For target-specific dialogs, text input, insets or navigation, inspect the native host as well. Verify API availability against the installed Compose Multiplatform version.

References: [Compose resources](https://kotlinlang.org/docs/multiplatform/compose-multiplatform-resources.html), [iOS accessibility](https://kotlinlang.org/docs/multiplatform/compose-ios-accessibility.html).
