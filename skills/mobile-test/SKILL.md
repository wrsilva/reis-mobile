---
name: mobile-test
description: Writes, runs and reviews automated tests for mobile apps on every stack — Flutter and Dart (unit, widget and integration tests, Patrol, mocktail, mockito, coverage, package:checks), native Android (JUnit, coroutines and Flow tests, Robolectric, Compose UI tests, Espresso, Hilt, screenshot tests), native iOS (Swift Testing, XCTest, XCUITest) and React Native (Jest, React Native Testing Library, Detox, Maestro). Use whenever the user wants to add, fix or audit tests, set up a test stack, mock dependencies, measure coverage or deal with flaky tests in a mobile project, even if they only name a class to test.
intents: [test]
stacks: ["*"]
---

# Mobile Test

One skill for tests on every mobile stack. This file holds what is true everywhere; each platform's tools, APIs and commands live in its reference.

## 1. Pick the reference

Detect the stack first (the router result, or `pubspec.yaml`, Gradle files, the Xcode project, `package.json`), then read only what applies:

| Project | Read |
|---|---|
| Flutter / Dart | [references/flutter.md](references/flutter.md), which links to the detailed guides in `references/flutter/` |
| Native Android (Kotlin), or the Android side of Kotlin Multiplatform | [references/android.md](references/android.md); for setting up a test stack from scratch, [references/android/setup/GUIDE.md](references/android/setup/GUIDE.md) |
| Native iOS (Swift) | [references/ios.md](references/ios.md) |
| React Native or Expo | [references/react-native.md](references/react-native.md) |

A cross-platform app with native code (`android/`, `ios/`, native modules) uses the native reference for that code.

## 2. Bind the request to the project

Use the [shared project brief](../../docs/agent-context.md). Reuse a supplied brief and fill only missing evidence; do not repeat discovery performed by the calling command or agent. Read the relevant implementation, nearest tests, fixtures, dependency injection and test configuration before proposing a test.

Infer the operation from the request:

| Operation | Work |
|---|---|
| Run | Execute the requested existing suite or the smallest relevant suite; report failures without silently changing application behavior. |
| Write | Add tests for the named behavior using the current framework and fixtures. |
| Fix | Reproduce the failing test, distinguish a product defect from a test defect, and preserve the intended assertion while fixing the cause. |
| Audit | Inspect existing tests and give evidence-backed gaps; do not add dependencies or rewrite suites as part of a review. |

For each selected behavior, record an actual **source path and symbol → input/trigger → observable result → dependency seam → test path → execution command**. Name the repository, service, state owner or native bridge involved instead of returning a generic testing checklist. An unknown product rule is a gap to surface, not a fixture to invent.

A project that already uses mockito, XCTest or Detox gets tests in that style unless the user asks to migrate. Use its existing build variant, test target and helper conventions. Examples in references illustrate a technique; their application symbols and command placeholders must be replaced with repository evidence.

## 3. What to test, in order of value

1. **Business rules** — use cases, view models, reducers, mappers — with their edge cases: empty data, missing fields, boundary values.
2. **State changes** — observable states and transitions on success and failure; require an exact sequence only when the contract guarantees every emission. A conflating state holder may skip intermediate values.
3. **Error handling** — a failing data source becomes the expected user-facing state.
4. **Critical UI states** — loading, error, empty, content, and what the user can do in each.
5. **End-to-end flows** — only the few journeys that must never break (sign-in, purchase), because they are slow and fragile.

Most tests belong at the top of this list. If a behavior can be verified without a device, test it without one.

## 4. Test doubles

- **Fakes** (simple working implementations) for the project's own interfaces — repositories, services, clocks.
- **Mocks** only at real boundaries — network clients, platform channels, native modules, third-party SDKs — and only when the interaction itself is what the test checks.
- A test that mocks every collaborator verifies the mocks, not the code.

## 5. Determinism

- Isolate network, time and randomness in unit tests. Integration tests may use a temporary database or filesystem when that is the behavior under test; create and clean it per test. Avoid production services and arbitrary sleeps. Inject a clock and dispatchers or schedulers; use the platform's virtual time or fake async.
- Each test sets up its own state; order must not matter.
- A flaky test is a bug. Find the race (unawaited async work, animations, shared state) instead of adding retries or longer timeouts.

## 6. Names, structure and coverage

- Names state the behavior and the condition: `emits error when the repository fails`.
- Arrange, act, assert, with one behavior per test.
- Coverage shows what is **not** tested; a high number does not prove the tests are meaningful. Prioritize untested risky paths over raising the percentage.

## 7. Run before reporting

Resolve the command from the project's scripts, Gradle tasks, Xcode scheme/test plan or CI before execution; do not run an example with guessed names. Run the relevant existing test first when reproducing a failure, then run the changed tests and their affected suite. Never weaken an assertion or delete a test to make the suite green.

For instrumented, UI and end-to-end tests, discover available devices and the project's runner policy. Use a compatible local emulator or simulator when authorized by the task; do not erase its data or silently switch to a physical device. If the SDK, runtime or destination is unavailable, report the exact blocker and the resolved command that remains unrun. A build, a skipped test or an empty filtered run is not a passing test: inspect the test count and results.

## Output

Report the operation, source symbols and behaviors covered, files changed, exact command and working directory, executed test counts/result and any report artifact. Separate passed, failed, skipped and blocked checks. When auditing, link each gap or flaky test to a concrete path, the missing assertion or race, and the smallest useful test to add.
