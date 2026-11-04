# iOS interface design

Read [Apple design](apple-design.md) for the source workflow and [iOS UI and navigation](../../mobile-ios/references/ui-navigation.md) for implementation. Identify SwiftUI versus UIKit, deployment target, supported devices and existing component wrappers.

- Use semantic system text and color roles through the app's theme. Check Dynamic Type, dark appearance and content expansion before accepting a fixed frame.
- Specify navigation destinations, selection, back behavior and sheet dismissal using the existing navigation model. Preserve work when a modal is cancelled or a size change rearranges panes.
- Test safe areas, keyboard presentation, compact/expanded layouts and multiline controls. Distinguish a visual icon's dimensions from the interactive area.
- Prefer supported system controls for platform-specific behavior. Verify availability and fallback before proposing newer materials or APIs; a custom blur is not proof of native material behavior.
- Keep focus and spoken feedback in the interaction specification; consult [iOS accessibility](../../mobile-accessibility/references/ios.md).

Preview light/dark and large-text variants with realistic content. Confirm interactions on the supported runtime. Do not infer App Review acceptance from a visual inspection.
