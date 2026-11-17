# KMP: data, testing and build

Repositories and data sources, test strategy across targets, and Gradle build governance.

| Guide | What it covers |
|---|---|
| [kotlin-data-kmp-data-layer](data-testing-build/kotlin-data-kmp-data-layer/GUIDE.md) | Use when implementing or reviewing KMP data layers, including repositories, data sources, source-of-truth design, API exposure, conflict resolution, error handling, and main-safe data operations. |
| [kotlin-testing-kmp](data-testing-build/kotlin-testing-kmp/GUIDE.md) | Use when designing, implementing, or reviewing tests in KMP projects — unit tests, instrumented tests, Compose Multiplatform UI tests, test doubles, test strategy, stability, performance, and screenshot testing. |
| [kotlin-build-kmp-gradle-governance](data-testing-build/kotlin-build-kmp-gradle-governance/GUIDE.md) | Use when reviewing or designing Gradle build structure for KMP projects — shared build logic, convention plugins, version catalogs, Android KMP plugin usage, source-set configuration, and module dependency hygiene. |

Each guide lives in its own folder. Confirm plugin IDs, DSL and task names against the project's Kotlin, AGP and Gradle versions. Other guides named in the text are listed in the [theme tables of mobile-kmp](../SKILL.md).
