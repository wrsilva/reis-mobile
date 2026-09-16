# Debugging Flutter apps

Identify whether the failure happens while **building** or while **running**, then open the matching guide.

| Symptom | Guide |
|---|---|
| `flutter run` / `flutter build` fails: pub version solving, Dart compile errors, generated code, the Gradle or Xcode step | [flutter/build.md](flutter/build.md) — locates the failing layer and hands off to the native guides |
| `version solving failed`, incompatible package constraints | [flutter/package-conflicts.md](flutter/package-conflicts.md) |
| Exceptions at runtime: red screen, `Null check operator used on a null value`, `setState() called after dispose()`, assertion failures | [flutter/errors.md](flutter/errors.md) |
| An exception with a live app and the Dart/Flutter MCP tools available | [flutter/runtime-errors.md](flutter/runtime-errors.md) |
| `RenderFlex overflowed`, `unbounded height/width`, `Vertical viewport was given unbounded height` | [flutter/layout-issues.md](flutter/layout-issues.md) |

## First checks for any Flutter failure

```bash
flutter --version
flutter doctor -v          # Flutter, Dart, Android toolchain and the JDK it uses, Xcode, CocoaPods
flutter run -v             # or flutter build <target> -v, for the full underlying output
```

- A project pinned with FVM (`.fvmrc`, `.fvm/`) or asdf must run with that Flutter version, not the global one.
- Native failures inside `android/` follow [android.md](android.md); inside `ios/`, [ios.md](ios.md).
- `flutter clean` removes `build/` and `.dart_tool/`: it fixes stale outputs, not version conflicts. Propose it only after the version checks, and run it only when the user agrees.
