# Testing native Android apps

Use this reference for Kotlin/Java tests, including native Android modules inside Flutter or React Native apps. For a new test setup, use [android/setup/GUIDE.md](android/setup/GUIDE.md); first inspect the current module rather than installing its entire example stack.

## Resolve the module and test environment

1. Read `settings.gradle` or `settings.gradle.kts` to find the owning module. Inspect its build file, convention plugins, version catalog and CI invocation for the active build type and product flavors.
2. Locate the subject and its nearest test. Identify the real constructor, injected repository/dispatcher, observable state, test fixture and source set. `src/test` normally holds JVM tests; `src/androidTest` holds device tests. Check variant-specific and custom source sets before choosing a destination file.
3. Reuse the installed JUnit engine, assertion library, coroutine test helpers and mocking tool. Do not switch a JUnit 4 suite to JUnit 5 because an example uses another runner.
4. For instrumentation, inspect `testInstrumentationRunner`, runner arguments, AndroidX test dependencies and any Hilt runner. `AndroidJUnitRunner` is the standard runner; preserve a configured custom subclass. Espresso needs the module's `androidTestImplementation` setup, including `espresso-core` and the test runner. Resolve versions from the project instead of copying documentation versions. See [Espresso setup](https://developer.android.com/training/testing/espresso/setup).

From the directory containing the wrapper, discover available tasks before choosing one:

```bash
./gradlew projects
./gradlew '<module-path>:tasks' --all
adb devices -l
```

Replace `<module-path>` with the discovered Gradle path, including its leading colon. The task listing determines the unit, connected or managed-device task for the requested variant. Do not assume `:app`, `Debug` or a connected device exists.

## Select the smallest test that proves the behavior

| Subject | Test and concrete observation |
|---|---|
| Mapper, validator, use case | JVM test with inputs and expected domain result, including a meaningful boundary or failure case. |
| ViewModel or Flow producer | JVM coroutine test with the project's dispatcher rule; trigger the action and observe the state or emitted event. |
| Stateless composable | Existing Compose test harness; interact with a semantic node and assert the resulting state or callback effect. |
| Android Views screen | Espresso instrumentation test against real view IDs and a controlled dependency seam. |
| DAO, worker or persistent store | Existing Room/WorkManager/DataStore harness; assert stored values, constraints or work outcome and clean resources. |

## Coroutines and Flow

- Reuse the project's `MainDispatcherRule` or equivalent when the subject uses `viewModelScope`. Share the test scheduler across injected dispatchers; hardcoded `Dispatchers.IO` work is not controlled by virtual time.
- Use `runTest` and the project's Flow helper, such as Turbine. Start collection before the action when the contract requires observing emissions; launch long-lived collectors in a scope cancelled at test completion.
- A `StateFlow` can conflate rapid updates. Assert its stable final state unless intermediate states are part of the contract; to test loading, pause a fake dependency until the assertion has observed that state, then complete it. Do not assume a synchronous fake guarantees `Idle → Loading → Success` emissions.
- With `StandardTestDispatcher`, explicitly drive scheduled work where necessary using `runCurrent`, `advanceTimeBy` or `advanceUntilIdle`. Do not replace a race with a real delay. See [testing Kotlin coroutines](https://developer.android.com/kotlin/coroutines/test) and [testing flows](https://developer.android.com/kotlin/flow/test).

## Espresso: action, synchronization and assertion

Bind the test to a real Activity/Fragment, view IDs, launch state and expected result. Reuse an existing fake backend or dependency override before launch. Use the app's actual validation rule or response; checking that a button exists does not prove submitting the form works.

This illustrative body assumes the inspected app rejects an empty form and exposes these IDs/resources. Replace them with the actual screen's symbols and use the project's test imports and runner:

```kotlin
@Test
fun submittingEmptyFormShowsRequiredEmailError() {
    ActivityScenario.launch(SignInActivity::class.java).use {
        onView(withId(R.id.email)).perform(clearText(), closeSoftKeyboard())
        onView(withId(R.id.submit)).perform(click())
        onView(withId(R.id.email_error))
            .check(matches(withText(R.string.email_required)))
            .check(matches(isDisplayed()))
    }
}
```

`ActivityScenario` is `androidx.test.core.app.ActivityScenario`; the other calls come from Espresso's `Espresso`, `ViewActions`, `ViewMatchers` and `ViewAssertions`. Match resource imports to the owning module. `use` closes the activity after the assertion, including on failure. See [testing activities](https://developer.android.com/guide/components/activities/testing).

For asynchronous work outside Espresso's built-in synchronization:

1. Identify the operation that makes the assertion race. Use the app's existing `IdlingResource`, or connect one to that operation's actual lifecycle. An unconnected counter cannot synchronize anything.
2. Register it through `IdlingRegistry.getInstance().register(resource)` before the first Espresso interaction that needs it. If startup work is under test, arrange the dependency and registration before launching the activity; an auto-launch rule can run before `@Before`.
3. With `CountingIdlingResource`, increment before scheduling work and decrement on every completion path, including errors and cancellation. Finish relevant state updates before marking the operation idle.
4. Unregister through `IdlingRegistry.getInstance().unregister(resource)` in `@After` or guaranteed cleanup. Restore dependency overrides as well. Avoid `Thread.sleep`, unbounded waits and increasing timeouts to hide a race.

Keep idling resources free of Activity/View references. See [Espresso idling resources](https://developer.android.com/training/testing/espresso/idling-resource).

## Compose, Hilt and storage

- Compose: use the installed `createComposeRule` or `createAndroidComposeRule` harness. Assert after an interaction, including a callback value when testing a stateless composable. Prefer semantics such as text/content description, using a test tag when a node otherwise cannot be identified. Run through the project's configured instrumentation or Robolectric setup.
- Hilt: preserve `@HiltAndroidTest`, `HiltAndroidRule`, custom runner and module replacement conventions; install fakes before the subject is created. See [the Hilt test guide](android/setup/references/android/training/dependency-injection/hilt-testing.md).
- Room: use an isolated database for DAO behavior and `MigrationTestHelper` for migrations. WorkManager: use the existing `work-testing` harness. DataStore: use a temporary location and cancel its scope during teardown. Do not replace a persistence test with a mock of the persistence operation.

## Run and inspect evidence

The following commands are templates. Replace task paths and class names with values found above; use `--tests` only for a Gradle JVM test task:

```bash
./gradlew '<unit-test-task-path>' --tests '<fully-qualified-test-class>'
./gradlew '<instrumentation-test-task-path>'
```

For one instrumentation class or method, reuse the project's runner-argument convention. Alternatively, after building and installing the matching app/test APKs, inspect the installed instrumentation component and select it explicitly:

```bash
adb -s '<serial>' shell pm list instrumentation
adb -s '<serial>' shell am instrument -w \
  -e class '<fully-qualified-test-class>#<test-method>' \
  '<test-package>/<runner-class>'
```

Do not infer the test package from the app namespace. Read the runner output and test counts: no matching tests is not success. Gradle local reports live under the module's `build/reports/tests` and XML results under `build/test-results`; connected-test output is under `build/reports/androidTests/connected` and `build/outputs/androidTest-results/connected`. Report the actual generated path and selected device. See [command-line testing](https://developer.android.com/studio/test/command-line).

For coverage, inspect the module's AGP version and existing configuration, then discover the generated report task. Do not add a coverage plugin or change toolchain versions just to execute an existing test suite.
