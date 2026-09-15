# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). O projeto segue [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Adicionado

- Agents `flutter-architect`, `flutter-performance-engineer`, `flutter-test-engineer`, `mobile-staff-engineer`, `plugin-native-expert` e `lead-mobile`.
- 63 skills de Flutter, Dart e Firebase: 25 de `flutter/skills`, 8 de `dart-lang/skills`, 28 de `evanca/flutter-ai-rules` e 2 próprias (`flutter-login-usecase`, `flutter-secure-token-store`).
- `THIRD_PARTY_NOTICES.md` com origem e licença; frontmatter com `source` e `license` nas skills de terceiros.
- Parser de frontmatter com suporte a blocos `|` e `>`.

### Alterado

- O router agora encontra agent para `debug`, `test`, `architecture`, `performance` e demais intents, e não só para `review`.
- `/reis-mobile:review` em projetos Flutter também carrega `code-review`, `effective-dart` e `dart-run-static-analysis`.

## [0.1.0] - 2026-09-15

### Adicionado

- Plugin do Claude Code `reis-mobile`, com marketplace local.
- Detector de stack: Flutter (app e plugin), React Native (incluindo Expo), Kotlin Multiplatform, Android e iOS nativos.
- Registries de stacks, agents e skills, com validação (`reis-mobile validate`).
- Detector de intents em português e inglês, e router intent + stack → agent + skills.
- Context engine com diff do working tree ou de um range, lock files excluídos e secrets mascarados.
- `/reis-mobile:doctor` e `reis-mobile doctor`.
- `/reis-mobile:review` e `reis-mobile review`.
- Agent `mobile-code-reviewer`.
- Skills `flutter-project-audit`, `flutter-widget-review`, `mobile-security-audit` e `detect-mobile-stack`.
- CLI `reis-mobile`: `init`, `detect`, `doctor`, `route`, `review`, `agents`, `skills`, `stacks`, `validate`.
- `reis-mobile init`: registra (ou remove, com `--uninstall`) o plugin no Claude Code.
- Instaladores `install.sh` (macOS/Linux) e `install.ps1` (Windows), com verificação SHA-256.
- Workflow de release: tarball, `SHA256SUMS`, fórmula do Homebrew e publicação no npm.
- CI no GitHub Actions (Node 22 e 24, Ubuntu e macOS) e teste dos instaladores em Ubuntu, macOS e Windows.
