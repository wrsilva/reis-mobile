# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). O projeto segue [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Não publicado]

### Adicionado

- Comando `/reis-mobile:debate`: debate estruturado entre três especialistas com prioridades conflitantes. Rodada 1 às cegas (evita ancoragem), rodada 2 de réplica a pontos específicos, e decisão final pelo `lead-mobile`. Flags `--rounds`, `--agents` e `--external`.
- Participantes heterogêneos em modelo: o comando distribui `opus` e `sonnet` conforme o papel, sobrescrevendo o `model: inherit` dos agents. Três instâncias do mesmo modelo compartilham os mesmos vieses e convergem por motivos alheios à questão debatida; a escalação garante ao menos dois modelos distintos.
- Seção **Debate moderation** no agent `lead-mobile`: como pesar evidência contra posição e fechar numa decisão em vez de um empate.
- `tests/commands.test.mjs`: valida o frontmatter de todo comando e garante que agents e skills citados por eles existem de fato — o `validate` cobria agents, skills e stacks, mas não `commands/`.

### Segurança

- `/reis-mobile:debate --external` envia o contexto do debate para as CLIs `codex` e `gemini`, de terceiros. Sem a flag, nada sai da sessão. Documentado em README.md.

## [0.2.1] - 2026-09-15

### Adicionado

- Comando `/reis-mobile`: ponto de entrada que lista os comandos e encaminha para `doctor`, `review` ou, com um pedido livre, para o agent e as skills da stack detectada. Também aparece no menu de comandos da extensão do VS Code, que não encontra `/reis-mobile:doctor` ao digitar só `/reis-mobile`.

## [0.2.0] - 2026-09-15

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
