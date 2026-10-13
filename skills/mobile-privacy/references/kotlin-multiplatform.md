# Privacy in Kotlin Multiplatform

- Put the purpose/consent model and backend deletion status in shared code where the project shares those responsibilities. Keep native authorization prompts, SDK collection switches and declarations in the host implementations.
- Define a boundary that applies a persisted choice before native collectors send data. Do not assume a `commonMain` flag controls a collector initialized by the host.
- Coordinate cancellation and cleanup across shared jobs, platform workers, databases and host caches. Fence late results using the current account identity/generation.
- Test shared deletion transitions with fake backend responses and test each host's collection behavior separately. An Android pass does not prove iOS startup or manifest behavior.
- Record Android and iOS declaration evidence independently using [Android](android.md) and [iOS](ios.md).

Official reference: [Kotlin platform-specific declarations](https://kotlinlang.org/docs/multiplatform/multiplatform-expect-actual.html).
