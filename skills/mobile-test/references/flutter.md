# Testing Flutter and Dart apps

Start here for Flutter projects, then open the detailed guide for the task.

## Detect the setup

- `dev_dependencies` in `pubspec.yaml`: `flutter_test`, `test`, `mocktail` or `mockito` (with `build_runner`), `bloc_test`, `integration_test`, `patrol`, `checks`.
- State management (BLoC/Cubit, Riverpod, Provider) and existing helpers under `test/`.
- The Dart SDK constraint: records, patterns and sealed classes need Dart 3.

When the project has no mocking library yet, prefer `mocktail`: it needs no code generation.

## Guides

| Task | Guide |
|---|---|
| General guidelines for meaningful Flutter/Dart tests | [flutter/testing-guidelines.md](flutter/testing-guidelines.md) |
| Unit tests for functions and classes with `package:test` | [flutter/unit-tests.md](flutter/unit-tests.md) |
| Widget tests with `WidgetTester` | [flutter/widget-tests.md](flutter/widget-tests.md) |
| Integration tests (`integration_test`, Flutter Driver) | [flutter/integration-tests.md](flutter/integration-tests.md) |
| End-to-end tests with native interactions using Patrol | [flutter/patrol.md](flutter/patrol.md) |
| Mocks with mocktail | [flutter/mocktail.md](flutter/mocktail.md) |
| Mocks with mockito | [flutter/mockito.md](flutter/mockito.md) |
| Generating mocks with `build_runner` | [flutter/generate-mocks.md](flutter/generate-mocks.md) |
| Coverage and LCOV reports | [flutter/coverage.md](flutter/coverage.md) |
| Migrating assertions from `package:matcher` to `package:checks` | [flutter/migrate-to-checks.md](flutter/migrate-to-checks.md) |

## Commands

```bash
flutter test                                   # unit and widget tests
flutter test test/features/login/login_cubit_test.dart
flutter test --coverage                        # writes coverage/lcov.info
flutter test integration_test                  # needs a device, emulator or simulator
dart test                                      # pure Dart packages
```

## Flutter-specific pitfalls

- `pumpAndSettle` never returns while an infinite animation (a progress indicator) runs; pump a fixed duration instead.
- Real timers and `Future.delayed` make widget tests slow and flaky; use `tester.pump(duration)` or `fakeAsync`.
- Widgets that need `MediaQuery`, localization, theme or providers must be wrapped in the same ancestors the app uses; build a shared `pumpApp` helper.
- Platform channels (plugins) have no implementation in tests; mock them with `TestDefaultBinaryMessengerBinding` or inject an abstraction over the plugin.
- Golden tests differ between operating systems and font setups; run them on the same platform in CI that generated the goldens.
