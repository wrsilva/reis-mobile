---
name: detect-mobile-stack
description: Detects the mobile stack of the current project (Flutter, Android, iOS, React Native, Kotlin Multiplatform), its languages and target platforms, using the reis-mobile detector. Use when you need to know which mobile stack a project uses before reviewing, debugging or changing it, or when the user asks "what stack is this project?".
routing: manual
stacks: ["*"]
---

# Detect Mobile Stack

Use the reis-mobile deterministic detector instead of guessing from the folder structure.

## How to run

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/mobile.mjs" detect --json --dir "<project directory>"
```

Result fields:

| Field | Meaning |
|---|---|
| `stack` | `flutter`, `react-native`, `kotlin-multiplatform`, `android`, `ios` or `unknown` |
| `variant` | `plugin` (Flutter), `expo` (React Native) or `null` |
| `languages` | Languages found, the main one first (includes native code in cross-platform apps) |
| `platforms` | Target platforms (`android`, `ios`, `web`, `macos`, `desktop`...) |
| `evidence` | Files that justify the detection |
| `candidates` | Every stack that matched, in priority order |

## Interpretation

- Cross-platform stacks take priority: a Flutter app contains `android/` and `ios/`, but the stack is `flutter`.
- `unknown` means there is no mobile project at the given root. In monorepos, run it again with `--dir` pointing at the app.
- More than one item in `candidates` indicates a hybrid project (for example, KMP with an Android module). Consider both stacks when loading skills.
