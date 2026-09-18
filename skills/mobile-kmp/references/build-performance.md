# Build, profiling and delivery

List Gradle tasks for the affected module and configured target before naming a command. Use the wrapper, version catalog and CI matrix as the source of the Kotlin, Gradle, Compose and Android plugin versions. A compilation failure in `commonMain` affects all targets; an `ios*` link failure or Android variant failure has a narrower owner.

For performance, identify whether the cost is shared algorithm work, Android UI, iOS host/Compose UI or framework crossing. Measure the same journey and input on each affected target with that target's profiler and release-like configuration; do not infer iOS frame time from JVM or Android traces. Attribute retained state to the shared object, native host or bridge that owns it.

For delivery, trace Android artifact and iOS archive separately to their app IDs, signing, symbols and store workflow. The shared library is an input to both; publishing one platform does not publish the other. Preserve the host app's rollout and rollback process.

References: [KMP test tasks and reports](https://kotlinlang.org/docs/multiplatform-run-tests.html), [iOS framework integration](https://kotlinlang.org/docs/multiplatform-ios-integration-overview.html).
