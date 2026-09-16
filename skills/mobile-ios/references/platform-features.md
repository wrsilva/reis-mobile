# iOS platform features

## Permissions

- Every protected API needs its usage description in `Info.plist` (`NSCameraUsageDescription`, `NSLocationWhenInUseUsageDescription`, `NSPhotoLibraryUsageDescription`...) with text that explains the benefit; a missing key crashes the app when the API is used.
- Ask in context, when the user starts the feature, and handle denied and restricted states with a path to Settings (`UIApplication.openSettingsURLString`).
- Photo picking with `PhotosPicker` (SwiftUI) or `PHPickerViewController` needs no library permission.

## Push notifications

- Enable the Push Notifications capability; request authorization with `UNUserNotificationCenter.current().requestAuthorization(options:)`; register with `UIApplication.shared.registerForRemoteNotifications()`.
- Implement `UNUserNotificationCenterDelegate` to show notifications in the foreground and handle taps.
- Rich media needs a Notification Service Extension; silent pushes need the Background Modes → Remote notifications capability and are throttled by the system.
- With Firebase Cloud Messaging, follow `mobile-firebase`.

## Universal links and URL schemes

- Universal links: add the Associated Domains capability (`applinks:example.com`) and host `apple-app-site-association` on the domain over HTTPS.
- Handle incoming URLs with `.onOpenURL` (SwiftUI) or the scene delegate, route through the navigation model, and validate parameters before acting.
- Custom URL schemes can be claimed by other apps; do not use them for authentication callbacks or privileged actions.

## Background work

- `BGTaskScheduler` with `BGAppRefreshTask` for short refreshes and `BGProcessingTask` for longer maintenance; register identifiers in `Info.plist` (`BGTaskSchedulerPermittedIdentifiers`) and schedule again after each run. The system decides when tasks run.
- Finishing a short task after the app goes to background: `beginBackgroundTask(withName:)` with the matching `endBackgroundTask`.

## Widgets, Live Activities and App Intents

- Widgets use WidgetKit in an extension target with a `TimelineProvider`; share data with the app through an App Group container, and reload timelines from the app when data changes.
- Live Activities use ActivityKit and need `NSSupportsLiveActivities` in the app's `Info.plist`.
- App Intents expose actions to Shortcuts, Siri, Spotlight, widgets and controls; define `AppIntent` types and `AppShortcutsProvider` for discoverable shortcuts.

## In-app purchases with StoreKit 2

```swift
let products = try await Product.products(for: ["com.example.pro.monthly"])
let result = try await products[0].purchase()
if case .success(let verification) = result, case .verified(let transaction) = verification {
    // unlock content, then:
    await transaction.finish()
}
```

- Start listening to `Transaction.updates` at launch to catch renewals, refunds and purchases made on other devices.
- Only unlock content for `.verified` transactions; validate entitlements on your server for anything valuable.
- Test with a StoreKit configuration file in Xcode, then in the sandbox and TestFlight.
- Check the App Store Review Guidelines on digital goods before choosing a payment method.

## Privacy

- Keep the app's privacy manifest (`PrivacyInfo.xcprivacy`) accurate: data collected, tracking domains and required-reason APIs. Third-party SDKs must ship their own.
- Request App Tracking Transparency (`ATTrackingManager`) before tracking across apps, with `NSUserTrackingUsageDescription`.
