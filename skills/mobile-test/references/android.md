# Testing native Android apps

For setting up a test stack from scratch (dependencies, UI tests, screenshot tests, Hilt), follow [android/setup/GUIDE.md](android/setup/GUIDE.md). This file covers writing tests in an existing setup.

## Detect the setup

- Test dependencies in the module build files and `gradle/libs.versions.toml`: JUnit 4 or 5, `kotlinx-coroutines-test`, Turbine, MockK or Mockito-Kotlin, Truth or AssertJ, Robolectric, `androidx.compose.ui:ui-test-junit4`, Espresso, `hilt-android-testing`.
- Source sets: **local tests** in `src/test` run on the JVM; **instrumented tests** in `src/androidTest` need a device or emulator.
- Existing helpers: a `MainDispatcherRule`, fakes, a `:core:testing` module, custom test runners.

## Local unit tests: ViewModels, coroutines and Flow

```kotlin
class MainDispatcherRule(val dispatcher: TestDispatcher = UnconfinedTestDispatcher()) : TestWatcher() {
    override fun starting(description: Description) = Dispatchers.setMain(dispatcher)
    override fun finished(description: Description) = Dispatchers.resetMain()
}

class LoginViewModelTest {
    @get:Rule val mainDispatcherRule = MainDispatcherRule()

    private val repository = FakeAuthRepository()

    @Test
    fun `emits success when credentials are valid`() = runTest {
        repository.nextResult = Result.success(fakeUser)
        val viewModel = LoginViewModel(repository)

        viewModel.uiState.test {                       // Turbine
            assertEquals(LoginUiState.Idle, awaitItem())
            viewModel.submit("user@example.com", "secret")
            assertEquals(LoginUiState.Loading, awaitItem())
            assertEquals(LoginUiState.Success(fakeUser), awaitItem())
        }
    }
}
```

- `runTest` skips `delay` with virtual time; `advanceUntilIdle()` and `advanceTimeBy()` control it with a `StandardTestDispatcher`.
- Inject dispatchers into repositories and use cases instead of hardcoding `Dispatchers.IO`; tests pass the test dispatcher.
- Code that uses `viewModelScope` needs `Dispatchers.Main` replaced (the rule above).
- The names above are illustrative; use the project's classes.

## Compose UI tests

```kotlin
class LoginScreenTest {
    @get:Rule val composeRule = createComposeRule()

    @Test
    fun showsErrorWhenLoginFails() {
        composeRule.setContent { LoginScreen(state = LoginUiState.Error("Invalid credentials"), onSubmit = {}) }

        composeRule.onNodeWithText("Invalid credentials").assertIsDisplayed()
        composeRule.onNodeWithText("Sign in").performClick()
    }
}
```

- Test stateless composables with state passed in; they need no ViewModel or DI.
- Prefer finding nodes by text or content description; add `Modifier.testTag` only where there is no user-visible handle.
- These tests are instrumented by default; with Robolectric configured, they can run as local tests.

## Views, Espresso and Hilt

- Espresso: `onView(withId(R.id.submit)).perform(click())`, `check(matches(isDisplayed()))`. Disable animations on test devices, and use idling resources for background work instead of sleeps.
- Hilt: annotate the test with `@HiltAndroidTest`, add `HiltAndroidRule`, use a custom runner that sets `HiltTestApplication`, and replace modules with `@TestInstallIn`. Details in [android/setup/references/android/training/dependency-injection/hilt-testing.md](android/setup/references/android/training/dependency-injection/hilt-testing.md).

## Other components

- **Room**: test DAOs against `Room.inMemoryDatabaseBuilder`; test migrations with `MigrationTestHelper` in instrumented tests.
- **WorkManager**: `work-testing` provides test drivers to run workers synchronously.
- **DataStore**: create it in a temporary folder per test.

## Commands

```bash
./gradlew :app:testDebugUnitTest                               # local tests of one module
./gradlew :app:testDebugUnitTest --tests '*LoginViewModelTest'
./gradlew :app:connectedDebugAndroidTest                       # instrumented tests, needs a device or emulator
```

For coverage, enable `enableUnitTestCoverage` / `enableAndroidTestCoverage` on the build type and run the coverage report task the Android Gradle plugin creates for it; check the task name for the project's AGP version.
