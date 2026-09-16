# Android Gradle Build Debug

A Gradle failure is usually one of a few causes wearing a long stack trace. Work in this order: find the first real error, check the toolchain versions, then match the error to a section below. Confirm every cause in the build files before proposing a fix.

## 1. Find the first real error

- The useful part is the `* What went wrong:` block and the first `e:` (Kotlin) or `error:` (Java) line. Later failures often cascade from it.
- Rerun the failing task with more detail when the log is too short: `./gradlew :app:assembleDebug --stacktrace`, then `--info`. Do not suggest `--scan` without telling the user it uploads the build data to a public Gradle service.
- In Flutter and React Native projects, run Gradle from the `android/` folder, or read the Gradle section of the `flutter build` / `react-native run-android` output.

## 2. Toolchain versions

Most failures after an upgrade are a version mismatch. Collect the versions before theorizing:

| What | Where |
|---|---|
| Gradle | `gradle/wrapper/gradle-wrapper.properties` (`distributionUrl`) |
| Android Gradle Plugin (AGP) | `plugins { id("com.android.application") version ... }`, the version catalog (`gradle/libs.versions.toml`) or `classpath` in the root build file |
| Kotlin | `org.jetbrains.kotlin.*` plugin version, same places |
| JDK running Gradle | `./gradlew --version` (the JVM line), `org.gradle.java.home` in `gradle.properties`, `JAVA_HOME`, Android Studio's bundled JDK. Flutter: `flutter doctor -v` shows the Java binary, and `flutter config --jdk-dir` overrides it |

Then check them against each other with the official tables — AGP ↔ Gradle ↔ JDK in the Android Gradle plugin release notes, Gradle ↔ Java in the Gradle compatibility matrix, Kotlin ↔ Gradle/AGP in the Kotlin Gradle plugin docs. Quote the versions you found; do not state a compatibility range from memory.

Typical signatures:

- `Android Gradle plugin requires Java 17 to run. You are currently using Java 11.` → Gradle runs on an older JDK than AGP needs. Fix the JDK Gradle uses, not the app's `compileOptions`.
- `Unsupported class file major version 65` (or 61, 66...) → a JDK newer than the Gradle version supports (major 61 = Java 17, 65 = Java 21). Upgrade the wrapper or run Gradle on an older JDK.
- `Minimum supported Gradle version is X. Current version is Y.` → upgrade `distributionUrl` to at least X.
- `Inconsistent JVM-target compatibility detected for tasks 'compileDebugJavaWithJavac' (1.8) and 'compileDebugKotlin' (17)` → Java and Kotlin target different bytecode levels. Align them, preferably with `kotlin { jvmToolchain(N) }` or matching `compileOptions` and `kotlinOptions.jvmTarget`.

## 3. Dependencies

- [ ] `Could not resolve` / `Could not find` → check the repositories in `settings.gradle(.kts)` (`dependencyResolutionManagement`) and the module build files. `repositoriesMode.set(FAIL_ON_PROJECT_REPOS)` makes module-level `repositories {}` an error. A coordinate that only existed in JCenter will not resolve anymore. Also rule out `--offline` and corporate proxies.
- [ ] `Duplicate class X found in modules A and B` → two artifacts ship the same classes. Find who brings each: `./gradlew :app:dependencyInsight --dependency <group:name> --configuration debugRuntimeClasspath`. Align versions (a BOM or platform) or exclude the redundant artifact — do not add both.
- [ ] `Dependency 'X' requires libraries and applications that depend on it to compile against version N or later of the Android APIs` → raise `compileSdk` to N. This is only the compile SDK; `targetSdk` is a separate decision with behavior changes.
- [ ] Version conflicts after an upgrade: `./gradlew :app:dependencies --configuration debugRuntimeClasspath` shows what Gradle actually picked (`->` marks an upgrade).

## 4. Manifest and module setup

- [ ] `uses-sdk:minSdkVersion A cannot be smaller than version B declared in library X` → a dependency needs a higher `minSdk`. Raising it drops devices below B; say so. `tools:overrideLibrary` only silences the check and crashes at runtime on those devices.
- [ ] `android:exported needs to be explicitly specified for element <activity ...>` → apps targeting Android 12 (API 31) or higher must set `android:exported` on components with intent filters. Decide per component: `true` only for real entry points (launcher activity, deep links).
- [ ] `Namespace not specified` → AGP 8 requires `android { namespace = "..." }` in each Android module; the `package` attribute in the manifest is no longer used for it.
- [ ] `Manifest merger failed` with other messages → read `app/build/intermediates/merged_manifest/<variant>/.../AndroidManifest.xml` and the merger report next to it to see which library contributed the conflicting attribute.

## 5. Annotation processing and code generation

- [ ] kapt or KSP errors after a Kotlin upgrade → KSP releases are built for specific Kotlin versions. Check that the KSP plugin version matches the project's Kotlin version in the KSP release list.
- [ ] Hilt, Room or Moshi generated code missing → the processor dependency is declared with the wrong configuration (`implementation` instead of `kapt`/`ksp`), or the plugin is not applied in that module.

## 6. Release builds

- [ ] `Missing classes detected while running R8` → R8 writes suggested rules to `app/build/outputs/mapping/<variant>/missing_rules.txt`. Read them before copying: a `-dontwarn` for a class the app really uses turns a build error into a runtime crash.
- [ ] Release crashes that do not happen in debug → reflection-based libraries stripped by R8; check the library's documented keep rules.
- [ ] `Keystore file not found` / `signingConfig` errors → the path or password comes from `key.properties` or environment variables that do not exist on this machine or CI. Never suggest committing the keystore or its passwords.

## 7. Environment

- [ ] `Java heap space`, `GC overhead limit exceeded` or `Metaspace` → raise `org.gradle.jvmargs` in `gradle.properties` (for example `-Xmx4g`), and check that parallel builds fit the machine or CI runner.
- [ ] Errors mentioning corrupted caches or transforms (`Could not read workspace metadata`) → first `./gradlew --stop` and retry. Deleting `~/.gradle/caches` works but forces a full re-download; propose it, do not run it without confirmation.

## Output

Report the first real error, the versions involved, the cause with evidence (`file:line` or the log line), and the minimal fix as a diff or commands. State side effects of the fix, such as a higher minimum Android version or a Gradle upgrade that requires a newer JDK on CI.
