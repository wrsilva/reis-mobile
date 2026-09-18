# Kotlin Multiplatform release

A shared module revision can affect two separate app artifacts. Inventory the Android application, iOS host project and framework integration that this repository actually ships.

| Boundary | Verify |
|---|---|
| Shared module | Exact commit/version consumed by both hosts, configured target builds and common/target tests. |
| Android app | Version/build number, signing, release variant, R8 mapping and Play rollout using the [Android guide](android.md). |
| iOS app | Host version/build number, framework architecture, archive/signing, dSYM and App Store rollout using the [iOS guide](ios.md). |
| CI | Both artifacts built from the intended shared revision; host tests and upload jobs are distinguished from framework compilation. |

Record **artifact → shared revision → build/test evidence → signing/symbol evidence → rollout owner**. One target passing does not make the other ready. Use the [Apple integration guide](../../mobile-kmp/references/apple-interop.md) to identify the framework path, and confirm current store requirements in each store's official portal.
