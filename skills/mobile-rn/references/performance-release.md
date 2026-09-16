# React Native performance and release

## Measure before optimizing

- The React profiler in React Native DevTools (or the DevTools version for the project's React Native release) to find components that re-render.
- The performance monitor for JavaScript and UI frame rates; native profilers (Instruments, Android Studio) for native modules and startup.
- Test performance in release builds on real devices: development builds are much slower.

## Common fixes

- **Re-renders:** narrow context values, memoize expensive children with stable props, select store slices, keep fast-changing state local.
- **Lists:** virtualized lists with stable keys and memoized rows (see `ui-navigation.md`).
- **JavaScript thread:** move animations to Reanimated worklets; defer heavy work until after interactions; avoid large synchronous JSON parsing during navigation.
- **Startup:** keep Hermes enabled, avoid importing heavy modules at the entry point, show the first screen before loading optional data.
- **Bundle and size:** remove unused dependencies, check which libraries pull large native SDKs, and remove `console.log` in release builds.

## Versioning

- User-facing version: `version` in the Expo app config, or the native version fields in bare projects (`versionName` on Android, `MARKETING_VERSION` on iOS).
- Build numbers: iOS `buildNumber` and Android `versionCode` must increase for every store upload. EAS can manage them with `appVersionSource: "remote"` and `autoIncrement` in `eas.json`.

## Building

**Expo / EAS:**

```bash
eas build --platform ios --profile production
eas build --platform android --profile production
eas submit --platform ios --latest
```

- Build profiles live in `eas.json` (development, preview, production); credentials are managed by EAS or provided by the team.
- Environment variables per environment are configured in EAS; values available to the app code are public.

**Bare React Native:** `./gradlew bundleRelease` in `android/` for an AAB, and an Xcode archive for iOS; store requirements and signing follow `mobile-android` and `mobile-ios`.

## Over-the-air updates

- EAS Update (or the update service the project uses) ships JavaScript and asset changes only. Anything that changes native code, native config or config plugins needs a new store build.
- `runtimeVersion` must change whenever the native layer changes, so an update never reaches a binary it is incompatible with; prefer a policy such as `fingerprint` or `appVersion` over manual values when possible.
- Publish to a preview channel first, then roll out to production; keep a way to roll back.
- Store rules restrict what updates may change (for example, no new features that bypass review on iOS); check the current guidelines.

## Crash reporting

Upload source maps for release bundles (and dSYMs and R8 mappings for native code) to the crash reporter, so JavaScript and native stack traces are readable.
