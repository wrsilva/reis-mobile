# Analytics in Kotlin Multiplatform

- Define the typed events and the analytics interface in `commonMain`, and implement it per host with the native SDK unless the project already uses a multiplatform SDK.
- Keep consent and identity transitions in shared code when the project shares them, but leave automatic collection settings and SDK startup in each host: a `commonMain` flag does not stop a collector the host initialized first.
- Emit events from shared state owners after the outcome is confirmed, and map them to each SDK's names in one place.
- Test event emission in `commonTest` with a fake implementation. Verify each host's SDK delivery separately with [Android](android.md) and [iOS](ios.md).

Official reference: [platform-specific declarations](https://kotlinlang.org/docs/multiplatform/multiplatform-expect-actual.html).
