# Firebase Authentication — native Android (Kotlin)

Project setup shared by every Firebase product is in [../android.md](../android.md). The concepts in `SKILL.md` — security rules, App Check, environments, the Local Emulator Suite — apply here too.

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
- Security rules and App Check are the real protection: anything in the app binary can be read or modified.
