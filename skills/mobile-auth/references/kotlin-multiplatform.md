# Authentication in Kotlin Multiplatform

- Share session models and backend exchanges where appropriate; host apps own browser presentation, credential prompts, secure storage and callback registration.
- Define typed results for success, cancellation, reauthentication and failure at the host boundary. A shared caller must not infer success because a native sheet closed.
- Use one session coordinator across shared callers. An actor/mutex boundary still needs session-generation checks after suspended backend operations.
- Never put a client secret or native UI dependency in `commonMain`. Passkeys still require backend challenges and verification; expose platform ceremonies through interfaces/target implementations.
- Test shared transition/race logic in `commonTest`; verify Android credential and iOS browser/passkey flows separately using [Android](android.md) and [iOS](ios.md).

Official reference: [Kotlin platform-specific declarations](https://kotlinlang.org/docs/multiplatform/multiplatform-expect-actual.html).
