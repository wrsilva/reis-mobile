# Kotlin Multiplatform interface design

Determine whether UI is shared Compose Multiplatform or separate Android/iOS hosts. Read [shared Compose UI](../../mobile-kmp/references/compose-ui.md) and inspect the actual renderer for each screen.

- Share the journey, content states and semantic token meanings where appropriate. Map them to each host's controls, navigation and accessibility behavior.
- For shared Compose, verify the installed version's target support; do not assume Material controls acquire UIKit behavior on iOS.
- For native hosts, use [Android](android.md) and [iOS](ios.md) independently. Maintain consistent task completion without forcing identical layouts.
- Specify how state survives pane changes, rotation, navigation and cancellation. Locate the shared state owner and the host responsible for focus, keyboard and safe areas.
- Check typography, localized text, appearance and assistive interaction on each target. An Android preview cannot validate the iOS host.

For Apple-target decisions consult [Apple design](apple-design.md). Deliver a table of shared decisions and target-specific components so implementation ownership is clear.
