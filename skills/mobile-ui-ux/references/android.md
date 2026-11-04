# Android interface design

Start with the app's existing Compose or Views components and theme. Use [Android UI guides](../../mobile-android/references/ui.md) and current [Android mobile design guidance](https://developer.android.com/design/ui/mobile).

- Use the app's Material theme roles and component defaults as the baseline. Document brand overrides and check semantic colors in both appearances.
- Select navigation and pane structure from available window space and the user's task. Preserve back behavior and navigation state when the window changes.
- Include system bars, display cutouts and keyboard insets in the layout contract. Test resizing and long content rather than assuming a fixed phone canvas.
- Specify form focus, keyboard actions, validation recovery and state restoration. Keep transient messages distinct from persistent errors that need action.
- Check text scaling, effective touch regions and TalkBack semantics using the actual rendered components; load the [Android accessibility reference](../../mobile-accessibility/references/android.md).

Use preview variants for fast visual feedback, then verify the journey on the supported device/window sizes. Apple references may inform a comparison, but do not make iOS bars or gestures Android requirements.
