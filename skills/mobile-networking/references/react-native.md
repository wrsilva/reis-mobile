# Networking in React Native and Expo

- Follow the existing [data/networking setup](../../mobile-rn/references/data-networking.md): reuse the client, query cache and response validators.
- On `fetch`, inspect HTTP status explicitly and use the supported abort mechanism for cancellation/timeouts. Do not assume promise rejection on an HTTP error.
- Include account identity and query parameters in cache keys. Cancel/invalidate the old account's queries and ignore late completions after logout or account switch.
- Coordinate refresh with one promise per session, clear it on completion and prevent interceptor recursion. A failed refresh must settle every waiter.
- Wire foreground/connectivity state into the installed query client's supported managers. Avoid continuous polling or WebSocket assumptions while JS is suspended.
- JS file uploads need a native background solution if they must outlive suspension. Check installed Expo/RN versions and development-build requirements rather than prescribing an unverified file-system API.
- Test request cancellation, concurrent 401s and cache isolation with the existing runner; exercise native transfer recovery in a device build.

Official references: [React Native networking](https://reactnative.dev/docs/network), [TanStack Query React Native integration](https://tanstack.com/query/latest/docs/framework/react/react-native).
