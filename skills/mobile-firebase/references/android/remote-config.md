# Firebase Remote Config — native Android (Kotlin)

Project setup shared by every Firebase product is in [../android.md](../android.md). The concepts in `SKILL.md` — security rules, App Check, environments, the Local Emulator Suite — apply here too.

## Dependency

`implementation("com.google.firebase:firebase-config")`

## Setup and fetch

```kotlin
private val remoteConfig = Firebase.remoteConfig

suspend fun initRemoteConfig() {
    remoteConfig.setConfigSettingsAsync(remoteConfigSettings {
        minimumFetchIntervalInSeconds = if (BuildConfig.DEBUG) 0 else 3600
    }).await()
    remoteConfig.setDefaultsAsync(R.xml.remote_config_defaults).await()
    remoteConfig.fetchAndActivate().await()
}

val showNewCheckout: Boolean get() = remoteConfig["show_new_checkout"].asBoolean()
```

- Ship in-app defaults for every key, so the app works offline and before the first fetch.
- Do not block the first screen on the fetch; activate on the next launch, or update when the fetch completes if the change is safe mid-session.
- A low fetch interval in production gets throttled; the default minimum interval is 12 hours.

## Real-time updates

```kotlin
remoteConfig.addOnConfigUpdateListener(object : ConfigUpdateListener {
    override fun onUpdate(configUpdate: ConfigUpdate) { remoteConfig.activate() }
    override fun onError(error: FirebaseRemoteConfigException) { /* log */ }
})
```

Keep the returned `ConfigUpdateListenerRegistration` and remove it when no longer needed.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Security rules and App Check are the real protection: anything in the app binary can be read or modified.
