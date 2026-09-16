# Firebase Remote Config — native Android (Kotlin)

Use this reference instead of the Dart code in `SKILL.md` when the project is a native Android app or the Android side of a Kotlin Multiplatform app. The product concepts in `SKILL.md` — security rules, data modeling, error handling, testing with the Local Emulator Suite — still apply.

## Setup

- Register the Android app in the Firebase console and put `google-services.json` in the app module (`app/`). Apply the Google services Gradle plugin (`com.google.gms.google-services`) there.
- Declare Firebase through the Firebase Android BoM — `implementation(platform("com.google.firebase:firebase-bom:<version>"))` — and omit versions on Firebase artifacts. Reuse the BoM version already in the version catalog or build files; check the current one in the Firebase release notes before adding it.
- Use the main modules, not `-ktx` artifacts. The Kotlin extensions moved into the main modules in BoM 32.5.0, and the KTX modules were removed from the BoM in 34.0.0. Imports look like `com.google.firebase.Firebase` and `com.google.firebase.<product>.<product>`.
- Firebase initializes from `google-services.json` automatically; call `FirebaseApp.initializeApp` only for manual or multiple-app setups.
- `.await()` on Firebase `Task`s comes from `org.jetbrains.kotlinx:kotlinx-coroutines-play-services`.
- The Android emulator reaches the Firebase Local Emulator Suite on the host at `10.0.2.2`, not `localhost`.

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
- Keep Firebase security rules and App Check as the real protection: anything in the app binary can be read or modified.
