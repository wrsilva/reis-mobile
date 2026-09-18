# Shared-code boundaries

Read the actual `kotlin {}` targets and `sourceSets {}` dependency graph. Identify `commonMain`, intermediate source sets (such as `iosMain`) and target sources. A file's folder does not establish that every configured binary includes it; check `dependsOn` and the target hierarchy.

For a requested feature, record the shared public type, its caller on each target, input/output values and error/cancellation contract. Keep pure business rules and serialization in common code when all targets use the same contract. Put platform SDK calls behind a small common interface or `expect`/`actual` declaration; confirm every configured target has the implementation. Prefer the project's existing injection pattern rather than adding a second one.

When a shared type is exported to Swift, check the actual framework API and conversion at the call site. Kotlin nullability, exceptions, collections and asynchronous work can have a different Swift-facing shape from the Kotlin call. Do not infer that a Kotlin unit test covers the Swift consumer.

References: [source-set DSL](https://kotlinlang.org/docs/multiplatform/multiplatform-dsl-reference.html), [platform APIs and interfaces](https://kotlinlang.org/docs/multiplatform/multiplatform-connect-to-apis.html).
