# Kotlin Multiplatform tests

Resolve the configured targets and actual Gradle test tasks before running a command. Use the [KMP testing guide](https://kotlinlang.org/docs/multiplatform-run-tests.html) and the project's Kotlin plugin version to interpret the task graph.

| Behavior under test | Location and runner |
|---|---|
| Shared domain rule or mapper | `commonTest`; run the configured target test tasks that compile and execute it. |
| Android or iOS `actual` implementation | The matching target test source set and runner; a JVM-only pass does not cover Kotlin/Native. |
| Swift adapter or native host flow | The host app's XCTest/XCUITest or Android local/instrumented suite, depending on the boundary. |
| Shared Compose screen | Compose Multiplatform UI test where supported by the installed version; also verify the target accessibility and host flow. |

For each requested test, record **source path:symbol → input → result → dependency seam → test source set → real task**. Use existing fixtures and test libraries. Discover task names with the project's Gradle wrapper; avoid assuming all iOS targets run on the current machine. Inspect test counts and target results, not only a successful compilation. [Compose Multiplatform UI testing](https://kotlinlang.org/docs/multiplatform/compose-test.html) has separate host constraints.
