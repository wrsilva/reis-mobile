# iOS Code Review

Apply to Swift and Objective-C sources of the app and its extensions. Items are ordered by impact: the first sections cause crashes, leaks or data races. Before flagging an API, check the deployment target (`IPHONEOS_DEPLOYMENT_TARGET`) — `@Observable`, for example, requires iOS 17.

## 1. Memory and retain cycles (leak)

- [ ] **Closures capturing `self` strongly** where the closure is stored by `self` or by something `self` owns: completion handlers kept in properties, Combine `sink` stored in `cancellables`, `Timer` blocks, `NotificationCenter` block observers. Use `[weak self]` (or `[unowned self]` only when the lifetime is guaranteed).
- [ ] **Delegates declared strong.** `var delegate: SomeDelegate?` should be `weak`, with a class-bound protocol (`AnyObject`).
- [ ] **`Timer` and `CADisplayLink` not invalidated.** They retain their target until invalidated; invalidate them when the screen goes away.
- [ ] **Observers not removed.** Block-based `NotificationCenter` observers must be removed; KVO observations kept alive by stored `NSKeyValueObservation` tokens.

## 2. Swift concurrency and threading (crash / data race)

- [ ] **UI updated off the main thread.** UIKit and SwiftUI state changed from a background queue or a non-isolated `Task`. UI-facing types should be `@MainActor`; completion handlers from `URLSession` and other APIs are not on the main thread.
- [ ] **Tasks outliving the screen.** `Task { }` started in `viewDidLoad` or `onAppear` and never cancelled keeps working after the user leaves. SwiftUI's `.task` modifier cancels automatically; stored tasks must be cancelled in `deinit` or on disappear.
- [ ] **Cancellation ignored.** Long loops without `try Task.checkCancellation()`, and errors from cancellation shown to the user as failures.
- [ ] **Shared mutable state** accessed from several tasks or queues without an actor or lock. Compiler warnings about `Sendable` or actor isolation are real bugs, not noise.
- [ ] **Main thread blocked** by synchronous network calls, `DispatchQueue.main.sync` from the main thread (deadlock), large image decoding or disk I/O.

## 3. SwiftUI

- [ ] **Ownership.** A view that creates its view model with `@ObservedObject var model = Model()` recreates it on every parent update; the creating view must use `@StateObject` (or `@State` with `@Observable`). Views that receive the object use `@ObservedObject` or plain properties.
- [ ] **Identity.** `ForEach(items, id: \.self)` with non-unique values, or indices as ids for lists that change, attaches state to the wrong row.
- [ ] **Work in `body`.** Formatting, sorting, filtering large collections or creating objects inside `body` repeats on every render.
- [ ] **Side effects in `init` or `body`.** Loading data should happen in `.task` or the view model, not when the view struct is created, since SwiftUI creates views often.

## 4. Error handling and data

- [ ] **Force unwraps, `try!` and `as!`** on data that comes from the network, the user, the disk or a dictionary. Acceptable only for true programmer errors (a bundled resource that must exist).
- [ ] **Decoding failures swallowed.** `try? JSONDecoder().decode(...)` returning `nil` silently hides API contract changes; log or surface the error.
- [ ] **Errors not shown to the user**, or loading states that never end on failure.

## 5. Platform and privacy

- [ ] **Credentials and tokens** in `UserDefaults` or files instead of the Keychain. Details in `mobile-security`.
- [ ] **Permissions.** Each protected API used needs its `NS...UsageDescription` in `Info.plist`, and the code must handle denied and restricted states, not only granted.
- [ ] **Background execution.** Work that must finish when the app goes to background without `beginBackgroundTask` or `BGTaskScheduler`.
- [ ] **Deployment target.** APIs used without `#available` checks when the deployment target is lower than the API's availability.

## 6. Maintainability and UI quality

- [ ] Hardcoded user-visible strings when the project uses localization (`String(localized:)`, `NSLocalizedString`, string catalogs).
- [ ] Missing accessibility labels on icon-only buttons and images, fixed font sizes that ignore Dynamic Type.
- [ ] Massive view controllers or views mixing networking, persistence and layout.
- [ ] New logic without tests when the project already has a test target.

## Output

Report in the matching section of the `mobile-code-reviewer` report (Bugs for sections 1–4, Performance for main-thread and SwiftUI rendering issues, Security for credentials), always with `file:line` and the corrected snippet when the fix is short.
