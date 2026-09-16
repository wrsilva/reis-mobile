# Android architecture

Follows Google's guide to app architecture. Adapt to the project instead of forcing a rewrite.

## Layers

- **UI layer:** Composables (or Views) render a `UiState` exposed by a `ViewModel` as `StateFlow`; user events call `ViewModel` functions. Composables stay stateless where possible and receive state and callbacks as parameters (state hoisting).
- **Domain layer (optional):** use cases for business logic that is reused by several `ViewModel`s or complex enough to test alone. Name them by action (`GetUserOrdersUseCase`) with one public `operator fun invoke`.
- **Data layer:** repositories are the single source of truth, expose `Flow` or suspend functions, and hide data sources (Retrofit/Ktor services, Room DAOs, DataStore). Offline-first apps read from the database and sync from the network into it.

```kotlin
@HiltViewModel
class OrdersViewModel @Inject constructor(repository: OrdersRepository) : ViewModel() {
    val uiState: StateFlow<OrdersUiState> = repository.observeOrders()
        .map<List<Order>, OrdersUiState> { OrdersUiState.Content(it) }
        .catch { emit(OrdersUiState.Error) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), OrdersUiState.Loading)
}
```

The names are illustrative; use the project's conventions.

## State

- `ViewModel` survives configuration changes; `SavedStateHandle` keeps what must survive process death (ids, form input).
- Collect state in the UI with lifecycle awareness (`collectAsStateWithLifecycle` in Compose, `repeatOnLifecycle` in Views).
- One-off events (navigation, messages) are modeled as state the UI consumes, or handled by the UI directly, not replayed on rotation.

## Modularization

```text
:app                         application, navigation graph, DI wiring
:feature:<name>              screens and ViewModels of one feature
:core:data, :core:domain     repositories, use cases
:core:ui, :core:designsystem shared UI and theme
:core:testing                fakes and test utilities
```

- Feature modules do not depend on each other; they communicate through navigation and `:core` contracts.
- Prefer `implementation` over `api` dependencies to keep modules decoupled and builds incremental.
- Share build logic with convention plugins and versions with the version catalog.
- Split into modules when build time, ownership or boundaries need it, not by default in a small app.

## Dependency injection and navigation

- Hilt (or Koin) at the composition root; constructor injection everywhere else. Dispatchers are injected so tests can control them.
- Navigation: Navigation Compose, or Navigation 3 for new Compose apps (see `mobile-android` → UI). Pass ids between destinations, not objects.

## Problems to look for

- Activities, Fragments or Composables calling DAOs, Retrofit services or `SharedPreferences`.
- `ViewModel`s holding `Context`, Views or Activity references.
- Several classes owning the same data, or UI state split into contradictory fields.
- A single `:app` module in a large codebase, or circular and `api`-leaking module dependencies.
