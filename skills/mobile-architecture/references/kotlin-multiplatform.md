# Kotlin Multiplatform architecture

Read the [KMP source-set guide](../../mobile-kmp/references/source-sets.md) before assigning a responsibility to shared or target code.

1. Draw the actual module and source-set graph from Gradle configuration. Mark `commonMain`, intermediate sets, target sets and the Android/iOS host entry points that consume the module. Do not infer a shared UI from the KMP plugin.
2. Trace one user action through each host into the same shared domain object. Record the state owner, repository or use-case interface, platform adapter, persistence model and error conversion. Include the Swift-facing API if iOS calls shared Kotlin.
3. Put platform-neutral rules and data contracts in shared code only when both callers need the same behavior. Keep lifecycle, permissions, UI navigation and platform SDK setup with their actual owners. For small platform operations, compare an `expect`/`actual` seam with an injected interface; follow the project's existing pattern.
4. Specify object mappings at API and persistence boundaries, especially nullability and error types exported to Swift. Name who writes each object and which cache is authoritative.
5. Return a table of **object/symbol → source set → owner → Android caller → iOS caller → test seam**, plus a minimal migration sequence. Mark proposed paths as proposed.

Check [Kotlin's source-set hierarchy](https://kotlinlang.org/docs/multiplatform/multiplatform-dsl-reference.html) and [platform API connection guidance](https://kotlinlang.org/docs/multiplatform/multiplatform-connect-to-apis.html) against the installed Kotlin version.
