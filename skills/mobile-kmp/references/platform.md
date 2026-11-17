# KMP: platform boundaries

Source-set placement, `expect`/`actual` and shared-to-native seams, and Android deep links and App Links in KMP projects.

| Guide | What it covers |
|---|---|
| [kotlin-platform-kmp-bridges](platform/kotlin-platform-kmp-bridges/GUIDE.md) | Use when designing, implementing, or reviewing platform-specific integrations in KMP projects, including source-set placement, hierarchical sharing, expect/actual usage, platform API access, and shared-to-native abstraction boundaries. |
| [kotlin-platform-app-links-and-deep-links](platform/kotlin-platform-app-links-and-deep-links/GUIDE.md) | Use when designing, implementing, or reviewing Android deep links, web links, and App Links in KMP projects — intent-filter design, host verification, manifest scope, and assetlinks.json configuration. |

Each guide lives in its own folder. For the iOS side of a bridge, also read [apple-interop.md](apple-interop.md); for iOS universal links, use the `mobile-ios` platform features reference. Other guides named in the text are listed in the [theme tables of mobile-kmp](../SKILL.md).
