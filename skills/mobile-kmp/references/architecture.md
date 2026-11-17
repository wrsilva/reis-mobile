# KMP: architecture and implementation

Architecture reviews, implemented-code reviews, feature implementation, module boundaries and state holders in Kotlin Multiplatform and Compose Multiplatform projects.

| Guide | What it covers |
|---|---|
| [kotlin-project-architecture-review](architecture/kotlin-project-architecture-review/GUIDE.md) | Use when reviewing KMP architecture, feature proposals, PR structure, layer boundaries, state-holder design, Android entry-point discipline, source-set placement, modularization, and long-term maintainability in Kotlin Multiplatform / Compose Multiplatform projects. |
| [kotlin-kmp-code-review](architecture/kotlin-kmp-code-review/GUIDE.md) | Use when reviewing implemented Kotlin Multiplatform / Compose Multiplatform code for architecture consistency, business-logic placement, state correctness, concurrency, Compose quality, design-system usage, security, performance, resilience, and maintainability. |
| [kotlin-project-feature-implementation](architecture/kotlin-project-feature-implementation/GUIDE.md) | Use when implementing or extending a feature in a Kotlin Multiplatform project. Provides pre-coding inspection, KMP source-set discipline, state pipeline design, architectural defaults, security/performance guardrails, and implementation rules. Forward-looking only — not a review skill. |
| [kotlin-project-modularization](architecture/kotlin-project-modularization/GUIDE.md) | Use when designing, reviewing, or refactoring module boundaries in KMP or Android projects — feature, data, app, and common modules, dependency direction, visibility control, and granularity. |
| [kotlin-project-state-management](architecture/kotlin-project-state-management/GUIDE.md) | Use when choosing, implementing, or reviewing state-holder patterns in a KMP project — ViewModel, shared presenter, MVI, or StateFlow-in-common — including effect handling, UiState modeling, and testability. |

Each guide lives in its own folder with its references. Relative paths in a guide refer to that guide's folder. When a guide names `kotlin-project-code-review`, it means [kotlin-kmp-code-review](architecture/kotlin-kmp-code-review/GUIDE.md).
