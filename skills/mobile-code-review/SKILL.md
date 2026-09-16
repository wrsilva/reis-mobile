---
name: mobile-code-review
description: Reviews mobile code for the bugs that reach production on every stack — Flutter and Dart (pull request checklist, widget lifecycle and rebuilds, project health, static analysis), native Android (Kotlin, coroutines, Jetpack Compose, lifecycle), native iOS (Swift concurrency, SwiftUI, retain cycles) and React Native (hooks, re-renders, platform code, Expo) — with file:line evidence and a structured report. Use whenever the user asks for a code review, PR or merge request review, project audit or quality check of a mobile app, or runs /reis-mobile:review, even if they only point at a diff or a folder.
intents: [review, performance]
stacks: ["*"]
---

# Mobile Code Review

One review process for every mobile stack. This file holds how to review and what always matters; each platform's checklist lives in its reference.

## 1. Pick the checklists

Detect the stack first, then apply the platform checklist to the files in scope:

| Project | Read |
|---|---|
| Flutter / Dart | [references/flutter.md](references/flutter.md), which orders the Flutter checklists in `references/flutter/` |
| Native Android (Kotlin/Java), or the Android side of Kotlin Multiplatform | [references/android.md](references/android.md) |
| Native iOS (Swift/Objective-C) | [references/ios.md](references/ios.md) |
| React Native or Expo | [references/react-native.md](references/react-native.md) |

In a cross-platform app, native code in `android/`, `ios/` or native modules gets the native checklist too. Security findings follow `mobile-security-audit` when it is loaded.

## 2. Scope

- **Changes (diff or pull request):** review what changed, reading the whole file when the hunk is not enough to understand it. New untracked files are not in the diff; read them.
- **Whole project:** start at the entry points (app startup, navigation, dependency setup), then the data layer, authentication and the most complex screens.

## 3. Evidence before findings

- Open the code and confirm every suspicion. A finding without evidence at `file:line` does not go in the report.
- Do not invent APIs, versions or lint rules. Check the lock files and build files (`pubspec.lock`, version catalog, `Package.resolved`, `package.json`) before claiming something is missing, deprecated or unavailable.
- Do not report style that a configured linter already enforces.
- When the project deliberately does something differently and it is coherent, say so instead of flagging it.

## 4. What always matters, on any stack

- **Lifecycle:** async work that outlives its screen; listeners, subscriptions, timers and controllers never released.
- **Threading:** I/O or heavy parsing on the main/UI thread; UI updated off it.
- **State:** impossible states that can be represented; loading and error handled; state lost on rotation, backgrounding or process death.
- **Network:** timeouts, retries without backoff, offline handling, unvalidated responses.
- **Credentials:** tokens in insecure storage, secrets in code or the bundle, sensitive data in logs.
- **Platform:** permissions requested without handling denial; manifest, `Info.plist`, entitlements or config changes that affect store publishing.
- **Tests:** new logic without tests when the project already has a suite.

## 5. Severity

Rank by real impact on users: crash or data loss, credential leak, store rejection, then noticeable degradation, then maintainability. Say why each finding matters, not only what rule it breaks.

## Report

Unless an agent defines its own format, answer with:

```markdown
## Summary
Stack, scope (diff or project), verdict: approve | approve-with-changes | request-changes.

## Critical
## Bugs
## Architecture
## Security
## Performance
## Maintainability

## Suggested changes
Prioritized list. For each item: file:line, problem, why it matters, fix.
```

Write "No findings." in a section with nothing to report.
