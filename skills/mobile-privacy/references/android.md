# Privacy on Android

- Inspect the merged manifest, automatic SDK initialization, application startup and scheduled workers. A UI consent switch cannot prevent an initializer from sending data earlier.
- Treat runtime permission as revocable. Refresh the actual permission state when returning from Settings; reduced or denied access must preserve unrelated features.
- Separate analytics preference, notification permission and data collection purpose. Declare only permissions exercised by the app and check transitive SDK additions.
- Cancel account-scoped workers before clearing app-owned data; reconcile deletion with server state after process death. Inspect backup inclusion/exclusion rules for retained personal data.
- Compare the inventory with Play Data safety and the account deletion entry points required by current Play policy. Reuse the [Play policy guides](../../mobile-android/references/play.md) for submission checks.
- Verify cold start, permission revocation and account deletion with a test account; do not infer server deletion from an empty local database.

Official references: [runtime permissions](https://developer.android.com/training/permissions/requesting), [backup rules](https://developer.android.com/identity/data/autobackup).
