# Networking on iOS

- Reuse the configured `URLSession` and the project's [data layer](../../mobile-ios/references/data-networking.md). Inspect delegate ownership, session configuration and decoding before adding endpoints.
- Serialize shared refresh/session state with the project's concurrency mechanism. Actor methods can interleave across `await`; retain a shared in-flight refresh task and check session identity again before applying its result.
- Check HTTP status before decoding success models. Preserve cancellation as cancellation, and prevent a task finishing after logout from writing account data.
- Use a background `URLSession` when the actual transfer needs OS-managed continuation; verify task/file requirements, delegate recovery and app relaunch behavior for the deployed OS. Do not promise arbitrary execution after force quit.
- A path monitor describes connectivity, not endpoint success. Handle DNS/TLS/server errors in the request path.
- Test transport/decoding with the project's stub mechanism and real background restoration on a compatible device. Restore upload state by reconciling with the server.

Official reference: [URLSession](https://developer.apple.com/documentation/foundation/urlsession).
