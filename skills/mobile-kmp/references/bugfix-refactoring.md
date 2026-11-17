# KMP: bug fixes and refactoring

Root-cause analysis with minimal fixes, and behavior-preserving refactors and migrations of existing KMP code.

| Guide | What it covers |
|---|---|
| [kotlin-project-bugfix](bugfix-refactoring/kotlin-project-bugfix/GUIDE.md) | Use when diagnosing and fixing bugs in a Kotlin Multiplatform project. Focus on root-cause analysis, minimal safe fixes, KMP correctness, UI/state/data/persistence/concurrency issues, and regression prevention. |
| [kotlin-kmp-refactor-safety](bugfix-refactoring/kotlin-kmp-refactor-safety/GUIDE.md) | Use when the task is primarily a refactor, migration, reliability hardening, or architectural cleanup of existing Kotlin Multiplatform code — scope control, behavioral preservation, migration safety, compatibility, observability, and rollback planning. |

Each guide lives in its own folder. For build or toolchain failures, start with the `mobile-debug` KMP reference; these guides cover behavior bugs and safe change. Other guides named in the text are listed in the [theme tables of mobile-kmp](../SKILL.md).
