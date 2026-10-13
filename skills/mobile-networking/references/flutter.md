# Networking in Flutter

- Reuse the installed HTTP client and inspect `pubspec.lock`. Begin with the [existing HTTP guide](../../mobile-flutter/references/data/http.md); do not introduce a second client to add one endpoint.
- Put refresh coordination in the session/client boundary, not each widget or interceptor invocation. Ensure replayed requests cannot re-enter an unlimited refresh loop.
- Cancellation support varies by client/version. A discarded Dart `Future` does not cancel a socket or prevent a late repository write; invalidate stale account/query generations too.
- Stream file data through the client's supported API. Use native background-transfer integration only when the product needs continuation after suspension, and verify both host implementations.
- Test client errors and response mapping without widgets; use widget tests for loading/error/retry presentation. Validate process interruption on a device for resumable transfers.

Official reference: [Flutter networking cookbook](https://docs.flutter.dev/cookbook/networking).
