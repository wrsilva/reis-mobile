# Flutter architecture

Start with the structure guides, then the guide for the state management the project uses. Do not introduce a second state management approach without a reason the user agrees with.

| Guide | What it covers |
|---|---|
| [app-architecture](flutter/app-architecture.md) | Provides best practices for Flutter app architecture, including layered architecture, data flow, state management patterns, and extensibility guidelines. |
| [feature-first](flutter/feature-first.md) | Structures Flutter apps using layered architecture (UI / Logic / Data) with feature-first file organization. |
| [recommended-architecture](flutter/recommended-architecture.md) | Architects a Flutter application using the recommended layered approach (UI, Logic, Data). |
| [managing-state](flutter/managing-state.md) | Manages application and ephemeral state in a Flutter app. |
| [bloc](flutter/bloc.md) | Implements Flutter state management using the bloc library (Bloc and Cubit). |
| [riverpod](flutter/riverpod.md) | Uses Riverpod for state management in Flutter/Dart. |
| [provider](flutter/provider.md) | Uses the Provider package for dependency injection and state management in Flutter. |
| [change-notifier](flutter/change-notifier.md) | Implements state management with ChangeNotifier and Provider in Flutter. |
| [login-use-case](flutter/login-use-case.md) | Implements a Flutter login use case that authenticates through an injected repository and persists the access token through an injected storage abstraction. |

## Deciding

- Detect the state management in `pubspec.yaml` (`flutter_bloc`, `flutter_riverpod`/`riverpod`, `provider`) and in `lib/` before recommending one.
- Layers: UI (widgets) → logic (blocs, notifiers, view models) → data (repositories, data sources). Widgets do not call HTTP clients, databases or plugins directly.
- Feature-first folders scale better than folders by technical type once the app has several features.
