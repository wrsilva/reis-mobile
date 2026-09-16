# Reviewing Flutter and Dart code

Apply the checklists in this order; stop early for a small diff that only touches widgets.

| Step | Checklist | When |
|---|---|---|
| 1 | [flutter/static-analysis.md](flutter/static-analysis.md) — `dart analyze`, `dart fix` | Always, when the Dart SDK is available; report the analyzer output before manual findings |
| 2 | [flutter/pr-review.md](flutter/pr-review.md) — pull request checklist: correctness, security, style, tests, docs | Reviewing a diff, branch or pull request |
| 3 | [flutter/widget-review.md](flutter/widget-review.md) — lifecycle, `BuildContext` across async gaps, dispose, rebuilds, lists, layout, accessibility | Files with widgets, screens or pages; performance reviews |
| 4 | [flutter/project-audit.md](flutter/project-audit.md) — `pubspec.yaml`, lints, native configuration, flavors, structure, CI | Auditing a whole project, or a diff that touches `pubspec.yaml`, `android/`, `ios/` or CI |

## Flutter-specific notes

- Dart style and idioms: the Effective Dart and Dart 3 guides in the `mobile-flutter` skill (`references/dart.md`).
- Follow the project's state management (BLoC/Cubit, Riverpod, Provider) instead of suggesting another one.
- Check the Flutter and Dart versions in `pubspec.lock` before recommending newer APIs (`MediaQuery.sizeOf`, Dart 3 patterns).
- Generated files (`*.g.dart`, `*.freezed.dart`, `*.mocks.dart`) are reviewed through their source annotations, not line by line.
- Native code under `android/` and `ios/` follows [android.md](android.md) and [ios.md](ios.md).
