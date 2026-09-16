# iOS UI and navigation

## SwiftUI state

| Wrapper | Use for |
|---|---|
| `@State` | Value state owned by the view; also owns an `@Observable` model the view creates |
| `@Binding` | Two-way access to state owned by a parent |
| `@Observable` class (iOS 17+) | A model; views update only for properties they read |
| `@Bindable` | Bindings to properties of an `@Observable` model the view does not own |
| `ObservableObject` + `@StateObject` / `@ObservedObject` | Models before iOS 17: `@StateObject` where created, `@ObservedObject` where passed in |
| `@Environment` | Values and models injected from an ancestor |
| `@FocusState` | Keyboard focus in forms |

A view must not recreate a model it does not own on every update; that resets state.

## Navigation

```swift
enum Route: Hashable { case order(Order.ID), settings }

struct RootView: View {
    @State private var path: [Route] = []

    var body: some View {
        NavigationStack(path: $path) {
            OrdersList(onSelect: { path.append(.order($0)) })
                .navigationDestination(for: Route.self) { route in
                    switch route {
                    case .order(let id): OrderDetail(id: id)
                    case .settings: SettingsView()
                    }
                }
        }
    }
}
```

- `NavigationStack` with a path (iOS 16+) makes deep links and state restoration possible; `NavigationView` is deprecated.
- Pass identifiers in routes, not whole models.
- Sheets and full-screen covers are driven by optional state (`.sheet(item:)`), not booleans plus separate data.

## Lists and forms

- `List` and `LazyVStack` need stable identity: `Identifiable` models, not indices, for data that changes.
- Heavy work does not belong in `body`: format, sort and filter in the model.
- Forms: `Form`, `TextField` with `.textContentType` and `.keyboardType`, `@FocusState` to move between fields and dismiss the keyboard, validation in the model.

## UIKit interop

- Use a UIKit view in SwiftUI with `UIViewRepresentable` / `UIViewControllerRepresentable`, coordinating delegates through a `Coordinator`.
- Embed SwiftUI in UIKit with `UIHostingController`.
- In UIKit, prefer diffable data sources and compositional layouts for collections.

## Accessibility and localization

- Support Dynamic Type: system text styles (`.font(.body)`), no fixed heights around text.
- Label icon-only controls (`.accessibilityLabel`), group related elements, and keep touch targets at least 44×44 points.
- Test with VoiceOver and the largest accessibility text sizes.
- Localize user-facing strings with String Catalogs (`.xcstrings`) or `String(localized:)`; SwiftUI `Text("key")` literals are localizable automatically.

## Previews

`#Preview { OrdersList(orders: .fixtures) }` with fixture data and injected fake services, so previews never hit the network.
