# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). O projeto segue [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [0.1.0] - 2026-09-15

### Adicionado

- Plugin do Claude Code `reis`, com marketplace local.
- Detector de stack: Flutter (app e plugin), React Native (incluindo Expo), Kotlin Multiplatform, Android e iOS nativos.
- Registries de stacks, agents e skills, com validação (`reis-mobile validate`).
- Detector de intents em português e inglês, e router intent + stack → agent + skills.
- Context engine com diff do working tree ou de um range, lock files excluídos e secrets mascarados.
- `/reis:doctor` e `reis-mobile doctor`.
- `/reis:review` e `reis-mobile review`.
- Agent `mobile-code-reviewer`.
- Skills `flutter-project-audit`, `flutter-widget-review`, `mobile-security-audit` e `detect-mobile-stack`.
- CLI `reis-mobile`/`reis`: `detect`, `doctor`, `route`, `review`, `agents`, `skills`, `stacks`, `validate`.
- CI no GitHub Actions (Node 22 e 24, Ubuntu e macOS).
