# Firebase in Kotlin Multiplatform

Start with the installed Gradle dependencies and source sets. Do not assume a Firebase SDK is available to `commonMain`, or that Android and iOS use the same API surface. Identify the actual Firebase wrapper and platform initialization in this repository.

1. Map each requested product operation to a shared interface or target implementation, the Android Firebase setup and the iOS Firebase setup. Record who owns listeners, token refresh and error conversion.
2. Verify target dependency availability against the installed library and version. If a third-party KMP wrapper is used, inspect its target support and native integration before moving a call into shared code.
3. Keep each host's configuration, push notification entitlement/permission and lifecycle handling in that host. Read the [Android](android.md) or [iOS](ios.md) product reference only for the affected target.
4. Test shared mapping against fakes, then test each real target's configuration or emulator setup separately. Do not treat a `commonTest` pass as proof of FCM delivery or native SDK setup.

Report **product → shared symbol → Android implementation/config → iOS implementation/config → verification**, marking unsupported or unverified targets explicitly. Check [Kotlin's platform API guidance](https://kotlinlang.org/docs/multiplatform/multiplatform-connect-to-apis.html) for the boundary options.
