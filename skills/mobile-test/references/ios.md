# Testing native iOS apps

## Detect the setup

- Framework: **Swift Testing** (`import Testing`, `@Test`, `#expect`) or **XCTest** (`XCTestCase`). Swift Testing needs Xcode 16 or later; both can live in the same test target, so follow what the file or target already uses.
- Test targets, test plans and schemes in the Xcode project, or test targets in `Package.swift`.
- Whether unit tests run inside a host app (the app target launches) or as a logic test bundle.
- Existing doubles and fixtures; snapshot testing only if the project already has a library for it.

## Unit tests with Swift Testing

```swift
import Testing
@testable import App

@MainActor
struct LoginViewModelTests {
    @Test func emitsSuccessWhenCredentialsAreValid() async {
        let viewModel = LoginViewModel(authService: FakeAuthService(result: .success(.fixture)))

        await viewModel.submit(email: "user@example.com", password: "secret")

        #expect(viewModel.state == .success(.fixture))
    }

    @Test(arguments: ["", "no-at-sign", "a@"])
    func rejectsInvalidEmails(_ email: String) {
        #expect(EmailValidator.isValid(email) == false)
    }
}
```

- `#expect` records a failure and continues; `try #require(...)` stops the test (use it to unwrap optionals the rest of the test depends on).
- `#expect(throws: SomeError.self) { try parser.parse(data) }` checks thrown errors.
- Parameterized tests (`arguments:`) replace copy-pasted test methods.
- Suites are plain types; setup goes in `init`, teardown in `deinit`.

## Unit tests with XCTest

```swift
final class LoginViewModelTests: XCTestCase {
    @MainActor
    func testEmitsSuccessWhenCredentialsAreValid() async {
        let viewModel = LoginViewModel(authService: FakeAuthService(result: .success(.fixture)))

        await viewModel.submit(email: "user@example.com", password: "secret")

        XCTAssertEqual(viewModel.state, .success(.fixture))
    }
}
```

- Use `async` test methods and `await` the work instead of `XCTestExpectation` with timeouts where possible.
- Methods must start with `test`; `setUp`/`tearDown` (or their `async throws` variants) reset state.

## Test doubles and determinism

- Inject dependencies through protocols in initializers; fakes return canned results and record calls when the test needs them.
- No real network: fake the API client, or register a custom `URLProtocol` on the test `URLSessionConfiguration`.
- No shared `UserDefaults.standard` or real Keychain: inject a store, or use `UserDefaults(suiteName:)` removed after each test.
- Inject a clock or date provider instead of reading `Date()` in code under test.

## UI tests (XCUITest)

- Find elements by accessibility identifier: set `.accessibilityIdentifier("loginButton")` in SwiftUI or `accessibilityIdentifier` in UIKit.
- Launch into a known state with `app.launchArguments` / `app.launchEnvironment` read by the app (for example to use fake services or skip onboarding).
- Wait with `waitForExistence(timeout:)` on the element, never with `sleep`.
- Keep UI tests to critical flows; they are slow and the first to go flaky.

## Commands

```bash
xcrun simctl list devices available            # pick a simulator that exists on this machine
xcodebuild test -scheme App -destination 'platform=iOS Simulator,name=<Device>'
xcodebuild test -scheme App -destination 'platform=iOS Simulator,name=<Device>' -only-testing:AppTests/LoginViewModelTests
xcodebuild test -scheme App -destination '...' -enableCodeCoverage YES -resultBundlePath TestResults.xcresult
xcrun xccov view --report TestResults.xcresult
swift test                                      # Swift packages
```
