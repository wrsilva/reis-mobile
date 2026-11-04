# React Native interface design

Inspect the installed React Native/Expo versions, navigator and component library. Use [React Native UI and navigation](../../mobile-rn/references/ui-navigation.md) for implementation.

- Reuse the theme and token layer; map system appearance into semantic surface, text and action roles. Keep font scaling enabled and test multiline content.
- Identify native-stack versus JavaScript-rendered headers, sheets and tabs before promising native behavior. Check back/swipe behavior and route state on each OS.
- Specify safe-area ownership, keyboard avoidance and scroll behavior together to prevent duplicate insets or hidden primary actions.
- Preserve accessible roles, labels, states and focus across custom Pressable wrappers. Verify disabled and loading behavior rather than relying on opacity alone.
- Consult [Apple design](apple-design.md) for iOS and [Android](android.md) for Android. Share semantic tokens while retaining target-specific interaction details.

Verify the complete flow on both intended runtimes, including large text, dark appearance and keyboard-visible forms. JavaScript component tests alone do not verify native transitions or screen-reader behavior.
