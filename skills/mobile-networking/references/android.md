# Networking on Android

- Identify the installed client (for example OkHttp/Retrofit or Ktor), its interceptors/authenticator and coroutine adapters before changing it. Follow that version's cancellation and response-body ownership contract.
- Avoid blocking an exhausted HTTP dispatcher while refresh waits for another request on the same dispatcher. Make refresh coordination explicit and test simultaneous unauthorized responses.
- Use structured coroutine ownership for screen work; repository mutations may need a longer-lived owner. Propagate cancellation instead of converting it to a retryable network error.
- Keep large parsing/file I/O off the main thread. Close response bodies and file streams on success, failure and cancellation according to the client API.
- Use the [background execution guide](../../mobile-performance/references/background.md) when a transfer must survive the screen. Work scheduling is distinct from the server's resumable-upload protocol.
- Verify rotation/process recreation, account switch, captive network, timeouts and interrupted transfers. A connectivity callback is not proof that the API is reachable.

Official references: [Android connectivity](https://developer.android.com/develop/connectivity/network-ops), [Kotlin coroutine cancellation](https://kotlinlang.org/docs/cancellation-and-timeouts.html).
