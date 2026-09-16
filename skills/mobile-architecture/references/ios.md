# iOS architecture

Adapt to what the project uses — SwiftUI or UIKit, MVVM or another pattern — instead of forcing a rewrite. Check the deployment target before recommending APIs such as `@Observable` (iOS 17) or SwiftData (iOS 17).

## Layers

- **Presentation:** SwiftUI views stay declarative and render state from an observable model; UIKit view controllers stay thin and delegate to a view model or presenter.
- **Domain / services:** business rules in plain Swift types behind protocols, testable without UI.
- **Data:** API clients, persistence (SwiftData, Core Data, files, Keychain) and caching behind repository-like types. Views never call `URLSession` or `UserDefaults` directly.

```swift
@MainActor
@Observable
final class OrdersModel {
    private(set) var state: LoadState<[Order]> = .loading
    private let repository: OrdersRepository

    init(repository: OrdersRepository) { self.repository = repository }

    func load() async {
        do { state = .loaded(try await repository.orders()) }
        catch { state = .failed(error) }
    }
}
```

The names are illustrative. Before iOS 17, the same model is an `ObservableObject` with `@Published` properties.

## State ownership

- The view that creates a model owns it: `@State` with `@Observable`, or `@StateObject` with `ObservableObject`. Views that receive it do not recreate it (`@ObservedObject`, `@Bindable` or a plain property).
- App-wide dependencies are injected at the root (initializers or the SwiftUI environment), not reached through singletons.
- Navigation state lives in one place per flow: a `NavigationStack` path in a model, or a coordinator in UIKit.

## Concurrency boundaries

- UI-facing types are `@MainActor`.
- Shared mutable state lives in an `actor` or is confined to one isolation domain.
- Types crossing isolation boundaries are `Sendable`; compiler warnings about isolation are architecture findings, not noise.

## Modularization

```text
App/                         app target: composition root, navigation, app lifecycle
Packages/
  Core/                      networking, persistence, design system, shared models
  Features/<Name>/           views and models of one feature
```

- Local Swift packages make boundaries explicit and build incrementally; features depend on `Core`, not on each other.
- Split when build time, ownership or boundaries need it; a small app does not need a package per screen.

## Problems to look for

- Massive view controllers or views mixing networking, persistence and layout.
- Singletons used as shared mutable state across features.
- Models recreated by views that do not own them; navigation state scattered across views.
- `DispatchQueue.main.async` sprinkled to silence threading warnings instead of actor isolation.
