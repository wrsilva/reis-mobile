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

## 2. Follow the project before this skill

Read the existing tests, test dependencies, helpers and folder layout before writing anything. A project that already uses mockito, XCTest or Detox gets tests in that style unless the user asks to migrate; consistency beats preference.

## 3. What to test, in order of value

1. **Business rules** — use cases, view models, reducers, mappers — with their edge cases: empty data, missing fields, boundary values.
2. **State changes** — the exact sequence of states on success and on failure.
3. **Error handling** — a failing data source becomes the expected user-facing state.
4. **Critical UI states** — loading, error, empty, content, and what the user can do in each.
5. **End-to-end flows** — only the few journeys that must never break (sign-in, purchase), because they are slow and fragile.

Most tests belong at the top of this list. If a behavior can be verified without a device, test it without one.

## 4. Test doubles

- **Fakes** (simple working implementations) for the project's own interfaces — repositories, services, clocks.
- **Mocks** only at real boundaries — network clients, platform channels, native modules, third-party SDKs — and only when the interaction itself is what the test checks.
- A test that mocks every collaborator verifies the mocks, not the code.

## 5. Determinism

- No real network, disk, clock, randomness or sleeps. Inject a clock and dispatchers or schedulers; use the platform's virtual time or fake async.
- Each test sets up its own state; order must not matter.
- A flaky test is a bug. Find the race (unawaited async work, animations, shared state) instead of adding retries or longer timeouts.

## 6. Names, structure and coverage

- Names state the behavior and the condition: `emits error when the repository fails`.
- Arrange, act, assert, with one behavior per test.
- Coverage shows what is **not** tested; a high number does not prove the tests are meaningful. Prioritize untested risky paths over raising the percentage.

## 7. Run before reporting

Run the tests you wrote with the command in the platform reference and fix until they pass. Never weaken an assertion or delete a test to make the suite green. Instrumented, UI and end-to-end tests need a device, emulator or simulator: ask before starting one.

## Output

When writing tests, report the files created, what each test covers and the command that ran them. When auditing, list the files reviewed, fragile or flaky tests with the reason, and untested scenarios prioritized by risk, each with a concrete suggestion.
