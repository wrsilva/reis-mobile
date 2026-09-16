# Firebase Authentication — native Android (Kotlin)

Use this reference instead of the Dart code in `SKILL.md` when the project is a native Android app or the Android side of a Kotlin Multiplatform app. The product concepts in `SKILL.md` — security rules, data modeling, error handling, testing with the Local Emulator Suite — still apply.

## Setup

- Register the Android app in the Firebase console and put `google-services.json` in the app module (`app/`). Apply the Google services Gradle plugin (`com.google.gms.google-services`) there.
- Declare Firebase through the Firebase Android BoM — `implementation(platform("com.google.firebase:firebase-bom:<version>"))` — and omit versions on Firebase artifacts. Reuse the BoM version already in the version catalog or build files; check the current one in the Firebase release notes before adding it.
- Use the main modules, not `-ktx` artifacts. The Kotlin extensions moved into the main modules in BoM 32.5.0, and the KTX modules were removed from the BoM in 34.0.0. Imports look like `com.google.firebase.Firebase` and `com.google.firebase.<product>.<product>`.
- Firebase initializes from `google-services.json` automatically; call `FirebaseApp.initializeApp` only for manual or multiple-app setups.
- `.await()` on Firebase `Task`s comes from `org.jetbrains.kotlinx:kotlinx-coroutines-play-services`.
- The Android emulator reaches the Firebase Local Emulator Suite on the host at `10.0.2.2`, not `localhost`.

## Dependency

`implementation("com.google.firebase:firebase-auth")`

## Auth state

```kotlin
private val auth = Firebase.auth
private val listener = FirebaseAuth.AuthStateListener { firebaseAuth -> render(firebaseAuth.currentUser) }

fun start() = auth.addAuthStateListener(listener)
fun stop() = auth.removeAuthStateListener(listener)   // or expose it as a Flow with callbackFlow + awaitClose
```

Keep the listener in a repository or `ViewModel`, not in an Activity that is recreated on rotation.

## Email and password

```kotlin
suspend fun signUp(email: String, password: String): FirebaseUser? =
    auth.createUserWithEmailAndPassword(email, password).await().user

suspend fun signIn(email: String, password: String): FirebaseUser? =
    auth.signInWithEmailAndPassword(email, password).await().user
```

Map errors by exception type: `FirebaseAuthInvalidCredentialsException`, `FirebaseAuthInvalidUserException`, `FirebaseAuthUserCollisionException`, `FirebaseAuthWeakPasswordException`, `FirebaseAuthRecentLoginRequiredException`. With email enumeration protection enabled, wrong email and wrong password both surface as invalid credentials; do not tell the user which one was wrong.

## Google sign-in

Use Credential Manager (`androidx.credentials`) with `GetGoogleIdOption`, read the Google ID token from the result and sign in with `GoogleAuthProvider.getCredential(idToken, null)`. The legacy Google Sign-In for Android API is deprecated. Register the app's SHA-1 and SHA-256 fingerprints in the Firebase console, for debug and release keys; missing fingerprints are the usual cause of sign-in failing only in release.

## Emulator

`auth.useEmulator("10.0.2.2", 9099)` before any other Auth call, in debug builds only.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Keep Firebase security rules and App Check as the real protection: anything in the app binary can be read or modified.
