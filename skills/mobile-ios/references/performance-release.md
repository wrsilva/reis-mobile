# iOS performance and release

## Measure before optimizing

- **Instruments:** Time Profiler for CPU, Allocations and Leaks for memory, Hangs for main-thread blocks, the SwiftUI template for view updates. Profile a Release build on a device, not the simulator.
- **In the field:** Xcode Organizer (launch time, hangs, memory, energy, disk writes) and MetricKit (`MXMetricManager`) for diagnostics from users' devices.

## Common fixes

- **Launch:** defer SDK initialization and data loading that the first screen does not need; avoid synchronous work in the `App` initializer or `application(_:didFinishLaunchingWithOptions:)`.
- **Hangs:** move disk, network, JSON decoding and image decoding off the main actor.
- **Scrolling:** stable identity in lists, no heavy work in `body` or `cellForItemAt`, downsampled images.
- **Memory:** break retain cycles (`[weak self]`, weak delegates), bound in-memory caches and clear them on memory warnings.
- **Size:** check the App Thinning size report from an archive export; keep images in asset catalogs, remove unused resources and dependencies.

## Versioning and signing

- `CFBundleShortVersionString` (Marketing Version) is the user-facing version; `CFBundleVersion` (build number) must increase for every upload of the same version.
- Automatic signing is simplest for teams; CI usually uses manual signing or an App Store Connect API key with `xcodebuild -allowProvisioningUpdates`. Keep certificates and keys in the CI secret store, never in the repository.
- Each extension (widgets, notification services) needs its own bundle identifier, prefixed by the app's, and a matching profile.

## Build and upload

```bash
xcodebuild -scheme App -configuration Release -archivePath build/App.xcarchive archive
xcodebuild -exportArchive -archivePath build/App.xcarchive -exportOptionsPlist ExportOptions.plist -exportPath build/export
```

- Upload with Xcode Organizer, Transporter, fastlane, or a tool based on the App Store Connect API; check which command-line upload method Apple currently supports before scripting it.
- Keep dSYMs for crash symbolication (upload them to the crash reporter).

## TestFlight and App Store

- Internal testers (members of the App Store Connect team) get builds without review; external testers need a Beta App Review for the first build of a version.
- Before submitting: screenshots and metadata, privacy details (the App Privacy section must match the privacy manifest and SDKs), export compliance (`ITSAppUsesNonExemptEncryption` in `Info.plist` avoids the question on each upload), sign-in credentials for the reviewer when the app requires an account, and account deletion in the app if it allows creating accounts.
- Check the current App Store Review Guidelines and the minimum Xcode/SDK required for uploads; both change regularly.
- Use phased release for updates to limit the impact of a bad build.
