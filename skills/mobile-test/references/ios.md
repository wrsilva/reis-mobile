# Testing native iOS apps

Use this reference for Swift/Objective-C tests and native iOS modules inside Flutter or React Native apps. Keep XCTest, Swift Testing and XCUITest in the roles already established by the target.

## Resolve the container, target and destination

1. Find the owning `.xcworkspace`, `.xcodeproj` or `Package.swift`, and read CI's test invocation. Use the app's workspace when that is how its dependencies are integrated; do not select a dependency's internal project/workspace.
2. Inspect the scheme's Test action and `.xctestplan` files. Identify the unit/UI test target, test host, source membership, exclusions and configurations. A new file outside the test target or a target excluded by the plan contributes no tests.
3. Inspect `import XCTest` / `XCTestCase` versus `import Testing` / `@Test`, the toolchain version and existing helpers. Preserve the framework used by the nearest tests. Swift Testing is available with Xcode 16 and later; it can coexist with XCTest in a test target. See [adding tests to Xcode projects](https://developer.apple.com/documentation/xcode/adding-tests-to-your-xcode-project).
4. Map the real source symbol to its protocol dependencies, actor isolation, input and observable result. Read the existing fixture builders rather than inventing application entities.

These are command templates: replace every `<...>` from repository or tool output. Use `-project '<path>.xcodeproj'` instead of `-workspace '<path>.xcworkspace'` throughout when the project has no relevant workspace.

```bash
xcodebuild -list -workspace '<workspace-path>.xcworkspace'
xcodebuild -workspace '<workspace-path>.xcworkspace' -scheme '<scheme>' -showTestPlans
xcodebuild -workspace '<workspace-path>.xcworkspace' -scheme '<scheme>' -showdestinations
xcrun simctl list devices available
```

Choose a compatible destination listed for that scheme, using its simulator ID to avoid ambiguous device names. A listed simulator may still need to boot. Preserve the project's destination policy and avoid selecting a physical device implicitly. If there is no compatible runtime, record the blocker. See [Xcode command-line discovery](https://developer.apple.com/library/archive/technotes/tn2339/_index.html) and [test plans](https://developer.apple.com/documentation/xcode/organizing-tests-to-improve-feedback).

## XCTest: choose the async mechanism that matches the subject

- Synchronous function: invoke it and assert its returned value or observable state with `XCTAssert...`; use `try XCTUnwrap` for values required by subsequent steps.
- `async` function: use a `test...` method marked `async` or `async throws`, await the operation, then assert. Apply `@MainActor` when the subject requires it; do not add an unawaited `Task` inside a synchronous test.
- Callback, delegate or publisher: create an expectation before triggering work, assert the callback's result, fulfill it, and wait for completion. For an async XCTest method use `await fulfillment(of:timeout:)` when supported by the project's toolchain; a synchronous method can use `wait(for:timeout:)`. Avoid a blocking wait inside an async test.
- If the method only starts background work, awaiting that method alone may not prove completion. Observe the completion callback/state transition rather than immediately asserting a value that races.

See [asynchronous XCTest tests](https://developer.apple.com/documentation/xctest/asynchronous-tests-and-expectations) and [async expectation fulfillment](https://developer.apple.com/documentation/xctest/xctestcase/fulfillment%28of%3Atimeout%3Aenforceorder%3A%29).

The following method illustrates a callback test. `repository`, `cachedOrder` and `loadCachedOrder` stand for an inspected project fixture and API, not generated application types. Arrange an isolated repository fixture that contains the expected order before invoking it:

```swift
func testLoadsPreviouslySavedOrder() async {
    let loaded = expectation(description: "Cached order is delivered")

    repository.loadCachedOrder { result in
        switch result {
        case .success(let order):
            XCTAssertEqual(order, cachedOrder)
        case .failure(let error):
            XCTFail("Expected the saved order, received \(error)")
        }
        loaded.fulfill()
    }

    await fulfillment(of: [loaded], timeout: 1.0)
}
```

Choose a bounded timeout appropriate to the isolated operation. Keep captured values compatible with the API's actor/Sendable requirements. Fulfill on both success and failure so assertion failures do not become unexplained timeouts; clean subscriptions and tasks during teardown.

## Swift Testing and dependency isolation

- Follow the target's current `@Test`, `#expect` and `#require` conventions. Parameterize genuinely identical behavior with different inputs instead of duplicating bodies. Preserve the suite's isolation and parallelization assumptions; do not migrate XCTest UI tests to Swift Testing.
- Inject the app's existing protocol-based services, clock and persistence boundary. When testing URL loading, a custom `URLProtocol` belongs on an isolated `URLSessionConfiguration`, with a deterministic handler scoped to that test.
- Use a dedicated `UserDefaults` suite or temporary persistence store with cleanup. Keep real Keychain/network access out of unit tests unless those integrations are explicitly the subject and have an isolated test setup. Reset fixtures in setup/teardown; avoid global state shared by parallel tests.

## XCUITest: launch state, interaction, observable result

Use the UI test target with `XCTestCase` and `XCUIApplication`. It runs separately from the app, so an in-process fake in the test does not replace the app's services. Reuse launch arguments/environment that the app actually reads to select a deterministic fixture; do not invent flags such as `--uitesting` and assume they work.

Locate elements through identifiers found in SwiftUI's `.accessibilityIdentifier(...)` or UIKit's `accessibilityIdentifier`. Wait for the relevant state using `waitForExistence(timeout:)` rather than sleeping. Element existence alone does not guarantee it is enabled or hittable; inspect those states when the action requires them. See [XCUIElement](https://developer.apple.com/documentation/xcuiautomation/xcuielement).

Illustrative method: replace the identifiers and expected error with the inspected screen's values. This scenario assumes an empty form is submitted and the app shows a required-field error:

```swift
func testSubmittingEmptyFormShowsRequiredEmailError() {
    let app = XCUIApplication()
    app.launch()
    defer { app.terminate() }

    let submit = app.buttons["signIn.submit"]
    XCTAssertTrue(submit.waitForExistence(timeout: 5))
    XCTAssertTrue(submit.isEnabled)
    XCTAssertTrue(submit.isHittable)
    submit.tap()

    let error = app.staticTexts["signIn.emailError"]
    XCTAssertTrue(error.waitForExistence(timeout: 5))
    XCTAssertEqual(error.label, "Email is required")
}
```

Set the app's existing fixture arguments/environment before `launch()` when needed to reach a fresh form. The post-tap assertion proves the behavior; a launch-only smoke test does not. For network-driven flows, make the app consume a controlled response and assert the resulting screen/state.

## Run the selected tests and inspect the result

Use actual names found above. The `-only-testing` identifier uses the test target name, then the XCTest class and optionally method. Select a plan only when the scheme has that plan; omit `-testPlan` for schemes without one:

```bash
xcodebuild test -workspace '<workspace-path>.xcworkspace' \
  -scheme '<scheme>' -testPlan '<test-plan>' \
  -destination 'platform=iOS Simulator,id=<simulator-id>' \
  '-only-testing:<test-target>/<test-class>' \
  -resultBundlePath '<new-result-path>.xcresult'
```

Use a new result-bundle path per run, then inspect executed tests, failures and skips. A successful build or zero matching tests is not a passing suite. Preserve the `.xcresult` path in the report. For coverage, add `-enableCodeCoverage YES` when requested and inspect the bundle with `xcrun xccov view --report '<result-path>.xcresult'`; verify command support with the installed Xcode. See [running tests and interpreting results](https://developer.apple.com/documentation/xcode/running-tests-and-interpreting-results).

For a Swift package whose tests support the host platform, run `swift test` from the package directory, using its supported filter when narrowing scope. iOS-only package tests still need the app/Xcode scheme and compatible simulator; `swift test` on macOS does not supply an iOS runtime.
