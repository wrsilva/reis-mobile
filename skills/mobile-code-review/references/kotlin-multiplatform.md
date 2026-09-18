# Kotlin Multiplatform review

Read the changed module's source-set graph and all configured target implementations. Review the public contract as it is consumed by Android and the Swift/iOS host.

- **Shared logic:** check that DTO/domain conversions, error mapping, coroutine ownership and repository state remain target-neutral. Cite the exact shared symbol and affected caller.
- **Target completeness:** compare every changed `expect` declaration and actual implementation or injected adapter across configured targets. Check target-only dependencies are declared in the correct source set.
- **iOS boundary:** inspect framework export, Swift nullability/error handling and callback or coroutine lifetime when a shared API changes. A shared Kotlin compile alone does not validate the Swift caller.
- **UI boundary:** first determine whether the project shares Compose UI. Review the Android/iOS host lifecycle and accessibility in the correct native or Compose reference.
- **Tests:** look for common tests for the rule and target/host tests where behavior depends on platform services. Verify that CI actually runs the relevant target tasks.

Return only reproducible findings at `path:line`, with the affected target and smallest fix. Use the [source-set guide](../../mobile-kmp/references/source-sets.md) for the dependency graph.
