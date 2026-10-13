# Privacy in React Native and Expo

- Inspect JS bootstrap and native SDK startup. A `useEffect` that disables collection may run after native initialization; configure supported native defaults or gated initialization first.
- Trace consent through the actual store/provider and persist the minimum preference. Account changes must not reuse a previous user's identifiers or cached data.
- In Expo, use app configuration/config plugins for generated native settings; inspect the resulting build. Verify library compatibility with the installed Expo SDK and development-build requirements.
- Coordinate cache clearing, native storage, background tasks and pending promises. Ignore responses from an account generation that is no longer active.
- Validate withdrawal on restart and reconnection in a native build, including queued SDK events. JS unit tests alone cannot verify native collection.

Official references: [Expo app configuration](https://docs.expo.dev/workflow/configuration/), [config plugins](https://docs.expo.dev/config-plugins/introduction/). Apply the [Android](android.md) and [iOS](ios.md) references to native behavior.
