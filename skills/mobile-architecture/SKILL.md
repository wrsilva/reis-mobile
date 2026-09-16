---
name: mobile-architecture
description: Designs and reviews the architecture of mobile apps on every stack — layers (UI, domain, data), unidirectional data flow, state ownership and state management, feature-first modularization, dependency injection, navigation, offline data and use cases — for Flutter (BLoC, Riverpod, Provider, ChangeNotifier), native Android (ViewModel, Hilt, Gradle modules), native iOS (SwiftUI and UIKit, Observation, Swift packages, actors) and React Native (server vs client state, React Navigation, Expo Router, native modules). Use when structuring a new app or feature, choosing or implementing state management, refactoring to layers or modules, or when the user asks where code should live, even if they only mention one class or screen.
intents: [architecture]
stacks: ["*"]
---

# Mobile Architecture

What makes a mobile codebase keep up with its team, and how each stack expresses it. This file holds the principles; each platform's patterns, libraries and structure live in its reference.

## 1. Pick the reference

| Project | Read |
|---|---|
| Flutter | [references/flutter.md](references/flutter.md) — structure guides and one guide per state management library |
| Native Android (Kotlin), or the Android side of Kotlin Multiplatform | [references/android.md](references/android.md) |
| Native iOS (Swift) | [references/ios.md](references/ios.md) |
| React Native or Expo | [references/react-native.md](references/react-native.md) |

## 2. Map before judging

Read the entry point, navigation setup, dependency wiring, module or package graph and two or three representative features before proposing changes. A coherent structure that differs from the references is not a finding; inconsistency and coupling are.

## 3. Principles on every stack

- **Layers with one direction of dependency.** UI renders state and sends events; logic (view models, blocs, stores, use cases) decides; data (repositories and data sources) fetches and stores. UI never calls HTTP clients, databases or platform SDKs directly.
- **Unidirectional data flow.** State flows down to the UI; events flow up. The UI does not mutate shared state in place.
- **Single source of truth.** Each piece of data has one owner — usually a repository — that the rest of the app observes. Duplicated copies drift.
- **State ownership.** Screen state lives with the screen's logic and survives configuration changes where the platform requires it; app-wide state (session, settings) has one explicit owner; server data lives in a cache or repository, not copied into global stores.
- **Impossible states unrepresentable.** Model loading, content and error as one sealed or discriminated state instead of independent flags.
- **Feature boundaries.** Organize by feature once there are several; features depend on shared core code, not on each other's internals.
- **Dependencies injected.** Construct dependencies at a composition root (DI container or initializers) and pass them in; no service locators reached from deep inside features.
- **Offline and errors by design.** Decide what works offline, how writes sync and how failures reach the user before building screens.
- **Testability as a check.** If business logic cannot be tested without a device, it is in the wrong layer.

## 4. Proportion

Match the structure to the app and team. A domain layer, a DI framework or a multi-module build pays off with size and team count; adding them to a small app is also a finding. Propose incremental steps with the files involved, highest impact and lowest risk first.

## Output

```markdown
## Architecture Overview
## Architecture Issues
## Coupling Problems
## Refactoring Suggestions
## Recommended Architecture
## Action Plan
```

Cite `path:line` for every finding.
