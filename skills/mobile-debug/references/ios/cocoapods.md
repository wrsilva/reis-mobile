# iOS CocoaPods Debug

Most CocoaPods failures come from three places: the spec repository is out of date, the version constraints cannot be satisfied, or the Ruby installation running `pod` is broken. Identify which one before touching `Podfile.lock`.

## 1. Know what each command does

Explain this to the user when proposing a fix, because the wrong command causes unwanted upgrades:

| Command | Effect |
|---|---|
| `pod install` | Installs the versions pinned in `Podfile.lock`; only resolves pods that are new or whose constraint changed. The default. |
| `pod install --repo-update` | Same, after updating the spec repos. For "could not find" errors on a pod that exists. |
| `pod update X` | Upgrades pod X within its `Podfile` constraint and rewrites the lock. |
| `pod update` | Upgrades **every** pod. Almost never the right fix for a build error. |
| `pod deintegrate` | Removes CocoaPods from the Xcode project. Last resort, and it must be followed by `pod install`. |

In Flutter, run these from `ios/`; `flutter build ios` and `flutter run` already call `pod install`.

## 2. Versions and environment

- [ ] `pod --version` against the `COCOAPODS:` line at the end of `Podfile.lock`. A different major or minor version rewrites the lock and can change behavior; CocoaPods prints a warning about it.
- [ ] A `Gemfile` in the project (or `ios/`) → CocoaPods is pinned by Bundler: run `bundle install`, then `bundle exec pod install`. Plain `pod` uses whatever version is global.
- [ ] `which pod` and `which ruby` → macOS system Ruby, Homebrew, rbenv/rvm/asdf. Errors loading `ffi` or native extensions (`LoadError`, `incompatible architecture`) on Apple Silicon mean the gems were built for another architecture or Ruby; reinstall CocoaPods with the same Ruby that runs it.
- [ ] `platform :ios, 'X'` in the `Podfile` → if it is commented out, CocoaPods picks a default and warns. It should match the app's `IPHONEOS_DEPLOYMENT_TARGET`.

## 3. Resolution errors

- [ ] `CocoaPods could not find compatible versions for pod "X"` → read the full message: it lists what each dependent requires.
  - The version exists but the local spec repo is old → `pod install --repo-update`.
  - Two pods require incompatible versions of X → upgrade the one with the older constraint (`pod update <that pod>`) or align the constraints in the `Podfile`.
  - `required a higher minimum deployment target` → the pod needs a newer iOS than `platform :ios`. Raising the platform drops older iOS versions; say so.
- [ ] `Unable to find a specification for 'X'` → a private pod whose `source` line is missing from the `Podfile`, a typo, or a pod that was removed from trunk.
- [ ] `The sandbox is not in sync with the Podfile.lock. Run 'pod install'` → `Pods/Manifest.lock` differs from `Podfile.lock`, usually after switching branches or a merge. `pod install` fixes it; if `Pods/` is committed, both lock files must be committed together.
- [ ] Merge conflicts in `Podfile.lock` → resolve the `Podfile` first, then regenerate the lock with `pod install`; do not hand-merge checksums.

## 4. Build errors inside Pods

- [ ] Pods compiled with a lower deployment target than Xcode supports (warnings like `The iOS deployment target 'IPHONEOS_DEPLOYMENT_TARGET' is set to 9.0, but the range of supported deployment target versions is ...`) → a `post_install` hook that sets the deployment target for the pod targets. Keep the existing hook content (Flutter's `flutter_additional_ios_build_settings` must stay).
- [ ] Script phases failing with sandbox `deny` errors after moving to Xcode 15 or later → see [xcode-build.md](xcode-build.md) (user script sandboxing); updating CocoaPods is the first step.
- [ ] `No such module` for a pod → the project was built as `.xcodeproj` instead of `.xcworkspace`, or the target is missing from the `Podfile`.
- [ ] `use_frameworks!` changes (static vs dynamic) → some pods require one mode; changing it affects every pod. Check each pod's installation notes before switching.

## 5. Cleanup, with confirmation

These commands work but are slow or discard state. Propose them with what they delete, and run them only when the user agrees:

- `rm -rf Pods` followed by `pod install` → rebuilds the Pods project from the lock.
- `pod cache clean --all` → clears downloaded pod sources.
- `pod repo update` → refreshes all spec repos; can take minutes.

## 6. Longer term

CocoaPods has announced that its trunk spec repository is moving to read-only. For new dependencies, check whether the library supports Swift Package Manager, and check the current status on blog.cocoapods.org before recommending a migration. Do not migrate an existing project as part of fixing a build error.

## Output

Report the failing command and its first real error, the CocoaPods and Ruby versions involved, the cause with evidence (`Podfile`, `Podfile.lock` line or log line) and the minimal fix. Say which pods change version, if any, and why `pod update` was or was not needed.
