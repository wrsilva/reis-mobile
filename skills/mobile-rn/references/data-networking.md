# React Native data and networking

## Server state with TanStack Query

```tsx
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 2 } } });

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootNavigator />
    </QueryClientProvider>
  );
}

export const useOrder = (orderId: string) =>
  useQuery({ queryKey: ['orders', orderId], queryFn: () => api.orders.get(orderId) });

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.orders.cancel,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });
}
```

The names are illustrative. Use RTK Query instead if the project is built on Redux Toolkit.

- React Native has no window focus or online events: wire `focusManager` to `AppState` and `onlineManager` to NetInfo so queries refetch when the app returns to the foreground or reconnects.
- Keys include every variable the request depends on.

## HTTP client

- One typed client on `fetch` (or axios, if the project uses it) with a base URL, auth header injection, token refresh and timeouts. `fetch` has no timeout: use an `AbortController` with a timer.
- `fetch` does not reject on 4xx/5xx; check `response.ok`.
- Validate or map responses at the boundary (for example with zod) instead of `as` casts in screens.
- Base URLs and public config come from app config or EAS environment variables; secrets stay on the backend.

## Persistence

| Data | Store |
|---|---|
| Tokens, credentials | `expo-secure-store` or `react-native-keychain` (Keychain/Keystore) |
| Preferences, small key-value data | MMKV (`react-native-mmkv`) or AsyncStorage |
| Relational or large data | SQLite (`expo-sqlite` or the library the project uses), optionally with an ORM such as Drizzle |
| Files and media | `expo-file-system` or the file library the project uses |
| Query cache across launches | TanStack Query persisters, for data that is safe to show stale |

AsyncStorage is unencrypted and asynchronous; do not store secrets there, and avoid large values.

## Offline

- Detect connectivity with `@react-native-community/netinfo` to show offline state, but still handle request failures.
- For offline-first flows, read from local storage, sync from the network into it, and queue writes with retry and a visible pending state.

## Real-time

WebSockets or server-sent updates must pause or reconnect with `AppState` changes; the OS suspends connections in the background.
