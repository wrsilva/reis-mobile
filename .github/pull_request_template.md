## What changes

<!-- A short summary and the mobile problem this solves. Reference the issue: Closes #123 -->

## Type

- [ ] Bug fix
- [ ] New skill or agent
- [ ] Core improvement (detection, router, context, doctor)
- [ ] Installation, release or CI
- [ ] Documentation

## How it was verified

<!-- Paste the relevant output: `npm run check`, `mobile route "..."`, `mobile review` on a real project. -->

```text

```

## Checklist

- [ ] `npm run check` passes (registry validation and tests)
- [ ] Changes to the detector, the router or the redaction have a test in `tests/`
- [ ] New agents and skills declare `intents` and `stacks` (or `routing: manual`)
- [ ] Third-party content declares `source` and `license` and is listed in `THIRD_PARTY_NOTICES.md`
- [ ] No customer data, local paths, secrets or proprietary code
- [ ] README and CHANGELOG (`[Unreleased]`) updated when behavior changes
