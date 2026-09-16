# Debugging deep links

Deep links fail in three places: the **domain verification** (the link opens the browser), the **app's registration** (the system does not know the app handles the URL) and the **in-app routing** (the app opens on the wrong screen or crashes). Find which one before changing anything. Security checks for deep links (validating parameters, not acting without confirmation) are in `mobile-security`.

## 1. Classify the symptom

| Symptom | Layer to check first |
|---|---|
| Opens the browser instead of the app | Verification: `assetlinks.json` / `apple-app-site-association`, entitlement, fingerprint |
| Works in debug, not from the store build | Verification with the release signing key (Android) or the distribution Team ID (iOS) |
| Shows a chooser dialog on Android | App Links not verified; the link is treated as a plain intent filter |
| Opens the app on the home screen | In-app routing: the URL reaches the app but no route matches, or it is lost during cold start |
| Crashes on open | In-app routing: navigation before the navigator or the auth state is ready |
| Custom scheme (`myapp://`) does nothing | The scheme is not registered, or the test tool is quoting the URL wrong |

## 2. Android App Links

**Checklist**
- [ ] `<intent-filter android:autoVerify="true">` with `ACTION_VIEW`, categories `DEFAULT` and `BROWSABLE`, `android:scheme="https"` and the exact `android:host`.
- [ ] `https://<host>/.well-known/assetlinks.json` returns 200 over HTTPS without redirects, with `Content-Type: application/json`, for **every host** in the filters (including `www` and subdomains).
- [ ] The file lists the package name and the SHA-256 fingerprint of the certificate that signs the installed build. For Play builds that is the **app signing key** from the Play Console (App integrity), not the upload key; debug builds use the debug keystore fingerprint (`keytool -list -v -keystore ~/.android/debug.keystore`).

**Commands**

```bash
# Verification state per domain (Android 12+)
adb shell pm get-app-links com.example.app
# Re-run verification after fixing the server file
adb shell pm verify-app-links --re-verify com.example.app
# Open a link as the system would
adb shell am start -W -a android.intent.action.VIEW -d "https://example.com/product/42" com.example.app
```

`verified` means the domain passed; `legacy_failure` or other states mean the server file or the fingerprint is wrong. Google's Statement List Generator and Tester checks a published `assetlinks.json`.

## 3. iOS Universal Links

**Checklist**
- [ ] The **Associated Domains** capability is on for the App ID and the target, with `applinks:example.com` (and each subdomain) in the entitlements of the build being tested.
- [ ] `https://<domain>/.well-known/apple-app-site-association` (no file extension) returns 200 over HTTPS without redirects, as JSON.
- [ ] The file's `applinks.details` contains `<TeamID>.<BundleID>` of that build and `components` (or legacy `paths`) that match the URL's path, query and fragment.
- [ ] Apple fetches the file through its CDN, not from the device: after changing it, check what the CDN serves at `https://app-site-association.cdn-apple.com/a/v1/<domain>`. To test against your server directly during development, use `applinks:example.com?mode=developer` with Developer Mode enabled on the device.

**Behavior that looks like a bug but is not**
- Typing or pasting a Universal Link in Safari's address bar opens the website. Test by tapping the link in Notes, Messages or a page on **another** domain.
- If the user chose to open the site in Safari from the banner, iOS remembers it for that domain; long-press the link and choose *Open in "App"* to reset.

**Tools:** Settings → Developer → Universal Links → Diagnostics on a device with Developer Mode checks a URL against the installed app. For custom schemes on the simulator: `xcrun simctl openurl booted "myapp://product/42"`.

## 4. In-app routing

- **Cold start vs warm start.** The URL arrives through different paths: Android `onCreate` intent vs `onNewIntent`; iOS `scene(_:willConnectTo:options:)` (`connectionOptions.userActivities`/`urlContexts`) vs `scene(_:continue:)`/`scene(_:openURLContexts:)`, or `.onOpenURL` in SwiftUI. A handler implemented only for the warm path loses links that launch the app.
- **Timing.** Links handled before the navigator, the auth state or remote config is ready either crash or are dropped. Store the pending link and route after initialization; send users to login first and resume the link afterward.
- **Route matching.** Log the received URL at the entry point and compare with the route patterns: trailing slashes, case, encoded characters and query parameters are frequent mismatches.
- **Flutter:** with `go_router`, the Flutter deep linking flag (`flutter_deeplinking_enabled` meta-data in `AndroidManifest.xml`, `FlutterDeepLinkingEnabled` in `Info.plist`) lets the router receive links; when a plugin such as `app_links` handles them instead, follow the plugin's instructions for that flag. Check the Flutter version's default before changing it.
- **React Native:** the `linking` config of React Navigation (`prefixes` and `config.screens`) or Expo Router's file routes decide the screen; test with `npx uri-scheme open "myapp://product/42" --android` (or `--ios`). Expo Go uses its own scheme; test real links in a development build.

## 5. Verify

Test on a device with the build type that will ship, for each link type and host, from cold start and from background, logged in and logged out.
