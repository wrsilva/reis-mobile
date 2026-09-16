# Releasing on iOS

App Store Connect, TestFlight and signing basics also appear in `mobile-ios` → `references/performance-release.md`; this guide focuses on getting a version out safely.

## Version

- **Version** (`CFBundleShortVersionString`, build setting `MARKETING_VERSION`) is what users see.
- **Build** (`CFBundleVersion`, build setting `CURRENT_PROJECT_VERSION`) identifies the upload. App Store Connect rejects a build number already used for the same version; incrementing it for every upload avoids the problem entirely.
- Keep both in build settings, not hard-coded in `Info.plist`, so every target (app, extensions, widgets) shares them. Extensions whose version differs from the app produce an upload warning or error.
- `agvtool new-version -all <n>` and `agvtool new-marketing-version <x.y.z>` update them when the project uses Apple Generic versioning; fastlane's `increment_build_number` wraps it.

## Archive, export and upload

```bash
xcodebuild -workspace App.xcworkspace -scheme App -configuration Release \
  -archivePath build/App.xcarchive archive
xcodebuild -exportArchive -archivePath build/App.xcarchive \
  -exportOptionsPlist ExportOptions.plist -exportPath build/export
```

- Use `-project App.xcodeproj` when there is no workspace (no CocoaPods).
- `ExportOptions.plist` sets the method (App Store Connect distribution), team and signing style.
- Upload with Xcode's Organizer, the Transporter app, or fastlane (`upload_to_testflight`, `upload_to_app_store`) using an App Store Connect API key.
- Automatic signing in CI needs the API key or an account with access; manual signing needs the distribution certificate and provisioning profile installed. fastlane `match` keeps them in an encrypted repository or bucket.

## Symbols

- Release builds need **Debug Information Format = DWARF with dSYM File**.
- The dSYMs are inside the archive (`App.xcarchive/dSYMs`). Upload them to the crash reporter (Crashlytics `upload-symbols`, Sentry, others) and keep the archive: Xcode Organizer symbolicates its own crash reports only when it has the matching dSYM.

## Before uploading

- [ ] The build uses the current minimum Xcode and iOS SDK Apple requires for uploads (confirm on Apple's upcoming requirements page).
- [ ] Every permission the app requests has its `NS...UsageDescription` string, written for the user.
- [ ] `PrivacyInfo.xcprivacy` declares required-reason APIs and collected data, and third-party SDKs ship their own manifests and signatures.
- [ ] `ITSAppUsesNonExemptEncryption` set in `Info.plist` when the app uses only exempt encryption (HTTPS), so each build does not ask for export compliance.
- [ ] Capabilities and entitlements (push, associated domains, App Groups, Sign in with Apple) enabled for the App ID and present in the distribution profile. Push needs `aps-environment` = `production` in distribution builds, which the profile sets.
- [ ] No `NSAllowsArbitraryLoads` without a justification Apple will accept.
- [ ] App Privacy details in App Store Connect match the data the app and its SDKs collect.
- [ ] Review notes and a demo account when features need login; release notes ready — see [store-copy.md](store-copy.md).

## TestFlight and rollout

- **Internal testers** (members of the App Store Connect team) get builds after processing, without review. **External testers** need the first build of a version to pass Beta App Review.
- TestFlight builds expire after 90 days.
- For updates, **phased release** distributes the version over seven days to users with automatic updates on; it can be paused (for a limited total time) or released to everyone. Anyone can still update manually from the App Store during the phase.
- Choose manual or scheduled release after approval when the launch must match a backend change or an announcement.
- A bad version cannot be withdrawn to the previous binary: remove it from sale only in extreme cases, and ship a fix with a new build (expedited review can be requested for critical bugs).
