# Kotlin Multiplatform debugging

Find the first failing module, Gradle task, compilation and target in the log. Read `settings.gradle.kts`, the affected `build.gradle.kts`, version catalog and source-set directories before suggesting a fix.

1. For an unresolved symbol, check whether its dependency and declaration belong to `commonMain`, an intermediate source set or a target source set. Confirm that the failing target actually depends on that set.
2. For `expect`/`actual` errors, compare declarations and implementations for every configured target; follow the installed Kotlin compiler's message rather than assuming a missing iOS file.
3. For an iOS framework or Xcode failure, separate Kotlin framework compilation/linking from the Swift host build, then inspect the project's integration method and selected architecture. Use the [Apple integration guide](../../mobile-kmp/references/apple-interop.md).
4. For an Android failure, apply the [Android debugging reference](android.md) to the host/module. For a native iOS failure, apply the [iOS reference](ios.md) to the host. A shared-source error remains a KMP issue.

Report the first error line, affected source set/target, configuration evidence and the exact project task that reproduces it. Discover task names from the wrapper instead of guessing them. Kotlin's [source-set reference](https://kotlinlang.org/docs/multiplatform/multiplatform-dsl-reference.html) defines the hierarchy.
