# Networking in Kotlin Multiplatform

- Keep the API contract, mapping and retry decisions in shared code when already shared. Inspect the HTTP engine installed for each target; engine behavior and TLS/background integration are platform-specific.
- For Ktor, verify installed plugin/engine versions and ownership of the `HttpClient`; close clients at their actual lifecycle boundary instead of constructing one per request.
- A shared mutex/state owner can coalesce refresh. Check account generation after suspension points, release waiters on every failure and preserve cancellation.
- Place OS-managed background transfers behind host interfaces. A coroutine in `commonMain` does not keep an iOS app alive or survive Android process death.
- Test mapping, pagination and refresh races in `commonTest`, then verify cancellation and transfer integration on both target engines. Record which results came from host tests.

Official reference: [Ktor client engines](https://ktor.io/docs/client-engines.html). Use [Android](android.md) and [iOS](ios.md) for host lifecycle behavior.
