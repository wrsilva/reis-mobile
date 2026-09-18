---
name: mobile-flutter
description: Builds Flutter apps with guides for everything specific to Flutter and Dart — layouts, responsive UI, forms, animations, theming, declarative routing with go_router, widget previews and home screen widgets; HTTP, JSON serialization, local databases and caching; plugins, platform channels and native views; isolates and app size; accessibility and localization; Effective Dart, Dart 3 features and pattern matching; and macOS setup. Use when writing or changing Flutter UI, data or native integration code, or when the user asks how to do something in Flutter, even if they do not name the topic.
intents: [review, performance, accessibility, migration]
stacks: [flutter]
---

# Mobile Flutter

Guides for building Flutter apps. Cross-platform topics live in their own skills and have Flutter references there: architecture and state management in `mobile-architecture`, tests in `mobile-test`, debugging in `mobile-debug`, code review in `mobile-code-review`, security in `mobile-security` and Firebase in `mobile-firebase`.

## Pick the topic

| Topic | Read |
|---|---|
| UI, layout and navigation | [references/ui.md](references/ui.md) |
| Data and networking | [references/data.md](references/data.md) |
| Native code and plugins | [references/native.md](references/native.md) |
| Performance and size | [references/performance.md](references/performance.md) |
| Accessibility and internationalization | [references/accessibility-i18n.md](references/accessibility-i18n.md) |
| Dart language | [references/dart.md](references/dart.md) |
| Environment | [references/setup.md](references/setup.md) |

Each topic file lists its guides; open only the ones the task needs.

## Before writing code

- Follow the project: its state management, folder structure, lints and packages already in `pubspec.yaml`.
- Check the Flutter SDK pin (`.fvmrc`, toolchain config or CI) and the installed `flutter --version` before using newer APIs; `pubspec.lock` records resolved packages, not the exact Flutter SDK version.
- Prefer packages the project already depends on over adding new ones; when adding one, check that it supports every platform the app targets.
