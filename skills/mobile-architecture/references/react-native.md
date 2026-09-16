# React Native architecture

Adapt to what the project uses — Expo or bare React Native, React Navigation or Expo Router, its state libraries — instead of forcing a rewrite. Check the versions in `package.json` before recommending APIs.

## Structure

```text
src/
  app/ or navigation/        routes (Expo Router) or navigators, providers
  features/<name>/
    screens/                 screen components
    components/              feature components
    hooks/                   feature logic exposed as hooks
    api/                     requests and response mapping
  shared/                    design system, API client, utilities, types
```

Features depend on `shared`; they do not import each other's internals.

## State: decide by kind

| Kind | Where it lives |
|---|---|
| Server state (data from APIs) | A server-state cache: TanStack Query or RTK Query — caching, refetching, retries and invalidation included |
| Screen state (inputs, toggles) | `useState`/`useReducer` in the screen or a feature hook |
| App-wide client state (session, preferences) | A small store (Zustand, Redux Toolkit) or context with a narrow value |
| Navigation state | The router; pass ids in params, not objects |
| Persisted state | MMKV or AsyncStorage for preferences, SQLite for relational data, the Keychain/Keystore for secrets |

Copying server data into a global store and synchronizing it by hand is the most common source of stale data.

## Logic in hooks, UI in components

```tsx
export function useOrders() {
  return useQuery({ queryKey: ['orders'], queryFn: api.orders.list });
}

export function OrdersScreen() {
  const { data, isPending, isError, refetch } = useOrders();
  if (isPending) return <Loading />;
  if (isError) return <ErrorState onRetry={refetch} />;
  return <OrderList orders={data} />;
}
```

The names are illustrative. Components render and delegate; data access and rules live in hooks and plain TypeScript modules that can be tested without rendering.

## Boundaries

- **API layer:** one typed client; responses validated or mapped at the boundary (for example with zod) instead of `as` casts in screens.
- **Platform differences:** `.ios.tsx`/`.android.tsx` files or a small platform module, not `Platform.OS` checks spread across screens.
- **Native code:** behind a typed module interface (Turbo Modules or Expo Modules), wrapped once. Check whether the app runs on the New Architecture before choosing a native module approach.
- **Configuration:** environment values through the build (app config, EAS environment variables); secrets stay on the backend.

## Problems to look for

- `fetch`/`axios` calls and business rules inside components and effects.
- One large context re-rendering the whole app on any change, or deep prop drilling.
- Large objects or callbacks passed through navigation params.
- `strict` TypeScript disabled in a codebase that relies on types.
