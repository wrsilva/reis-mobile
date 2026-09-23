# Localization and internationalization

Applies to every stack. Localization sits next to accessibility because it breaks the same things: a layout that assumed one text length, a string that assumed one grammar, and a date that assumed one calendar. An app that survives the largest accessibility font size usually survives German; one that does not, does not.

## The rules that hold on every platform

**No user-visible string in code.** Every string lives in the platform's resource system, keyed, with the source language as the base. A hard-coded string is not translatable and will not be found by review; grep for string literals inside UI code as the first pass of an audit.

**Never build a sentence by concatenation.** `"You have " + n + " messages"` cannot be translated: word order, pluralization and grammatical gender all differ. Use a parameterized string with named placeholders, so the translator can reorder them:

```
"order_shipped_on": "Your order {orderId} ships on {date}"
```

**Plurals are a category, not a number.** English has two forms; Polish has four; Arabic has six; Japanese has one. `if (n == 1)` is wrong in most languages. Every platform implements the CLDR plural categories (`zero`, `one`, `two`, `few`, `many`, `other`) — use them:

| Stack | Mechanism |
|---|---|
| Android | `<plurals>` resources and `getQuantityString` |
| iOS | A stringsdict / the `String Catalog`'s plural variations, with `NSLocalizedString` |
| Flutter | ICU message syntax in ARB files (`{count, plural, =0{...} one{...} other{...}}`) with `flutter_localizations` and `gen_l10n` |
| React Native | `i18next` with the ICU or plural suffix conventions, `react-intl`, or `Intl.PluralRules` directly |
| Kotlin Multiplatform | Compose Multiplatform resources, or host resources through `expect`/`actual` — check the plural support of the version in use |

**Never format data by hand.** Dates, times, numbers, currencies, percentages, lists and relative times all have locale rules, and `"$" + amount` is wrong in most of the world. Use the platform formatter (`NumberFormat`/`DateTimeFormatter`, `Intl.*`, `NumberFormat`/`DateFormat` in Dart's `intl`, `FormatStyle` in Swift). Currency in particular: the symbol, its position, the decimal separator and the number of decimal places are all per-locale, and the currency itself is a property of the *price*, not of the user.

**Device locale, app language, and region are three things.** A user can read Portuguese, live in Japan and want metric units. Recent platforms support a per-app language setting (Android's per-app language preferences, iOS's app language in Settings) — support it rather than reading only the device's first locale, and never infer language from the country or from a SIM.

## Right-to-left

Arabic, Hebrew, Persian and Urdu mirror the interface. Getting this right is mostly a matter of never expressing a direction as "left" or "right":

- Use **start/end** everywhere: `paddingStart`, `layoutDirection`-aware `EdgeInsets.directional`, `marginStart`, SwiftUI's automatic leading/trailing. A `paddingLeft` is a bug in RTL.
- **Icons that imply direction mirror; icons that depict objects do not.** A back arrow and a progress chevron mirror; a play button, a clock and a logo do not. Both platforms have a flag for automatic mirroring (`autoMirrored` in Android vector drawables and Material icons, `flipsForRightToLeftLayoutDirection` on iOS images, `matchTextDirection` in Flutter); set it deliberately per icon.
- **Numbers and embedded Latin text inside RTL** follow the bidirectional algorithm and can render in a surprising order. Test with real strings containing a phone number, a price and a URL.
- Test it without waiting for a translation: Android's "Force RTL layout direction" developer option, Xcode's right-to-left pseudolanguage, and Flutter's `Directionality` widget in a test all show the layout before any Arabic exists.

## Layout that survives translation

- **Assume text grows.** German, Finnish and Russian commonly run 30–50% longer than English, and short strings grow proportionally more. Buttons and tabs with fixed widths, and single-line labels with `maxLines: 1` and no ellipsis, are where this shows.
- **No fixed heights on text containers**, for the same reason as text scaling in [the accessibility checklist](../SKILL.md).
- **Do not put text into images.** It cannot be translated, it does not scale with the font size setting, and screen readers cannot read it.
- **Pseudolocalization** finds these before translation exists: both platforms can render the app in an accented, expanded pseudo-language that makes truncation and hard-coded strings obvious at a glance. Run it in the normal review pass.

## Giving translators what they need

A translator sees a key and a string, not the screen. Ambiguous strings become wrong translations:

- **Comments on every non-obvious string.** "Open" as a verb on a button and "Open" as a status adjective are different words in most languages, and the resource comment is the only way the translator knows which.
- **Character limits** where the UI constrains the text, declared with the string.
- **Stable keys** that describe the role (`checkout_confirm_button`), not the English text — renaming the English copy should not orphan the translation.
- **Keep the placeholders documented**: what `{count}` counts, what `{name}` names.

## Reviewing

- [ ] No user-visible string literals in UI code.
- [ ] No sentence assembled by concatenation or string interpolation of fragments.
- [ ] Plurals use the platform's plural resources, not `if (n == 1)`.
- [ ] Dates, numbers and currencies use a locale-aware formatter; no manual symbol or separator.
- [ ] Layout uses start/end, not left/right; directional icons are marked as mirrorable.
- [ ] No fixed widths or heights on text containers; no text baked into images.
- [ ] The per-app language setting is supported, and the app does not infer language from the region.
- [ ] Strings carry comments and, where relevant, length limits.
- [ ] The app has been seen in pseudolocale and in forced RTL, at the largest font size.
- [ ] Anything untranslated falls back to the base language rather than showing a key.

The last three are the ones that catch real defects. Everything else can pass review and still produce a broken screen in Arabic at 200% font size, which is why the check is visual.

## Official documentation

- Android localization: https://developer.android.com/guide/topics/resources/localization
- Android per-app language preferences: https://developer.android.com/guide/topics/resources/app-languages
- Android bidirectional text support: https://developer.android.com/training/basics/supporting-devices/languages
- Apple localization: https://developer.apple.com/documentation/xcode/localization
- Flutter internationalization: https://docs.flutter.dev/ui/accessibility-and-internationalization/internationalization
- React Native right-to-left and localization: https://reactnative.dev/blog/2016/08/19/right-to-left-support-for-react-native-apps
- Unicode CLDR plural rules: https://cldr.unicode.org/index/cldr-spec/plural-rules
