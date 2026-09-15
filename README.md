# reis-mobile

**AI agents for mobile engineering.**

Agents, skills e workflows de IA para desenvolvimento Flutter, Android, iOS e React Native. O reis-mobile detecta a stack do projeto, escolhe o especialista certo e carrega só as skills que se aplicam, em vez de tratar um app mobile como um projeto genérico.

> Status: **v0.1.0**, fundação. O fluxo `/reis:review` funciona de ponta a ponta. Veja o [roadmap](#roadmap).

## O que já funciona

| Recurso | Descrição |
|---|---|
| Detecção de stack | Flutter (app ou plugin), React Native (incluindo Expo), Kotlin Multiplatform, Android nativo e iOS nativo, com linguagens e plataformas-alvo |
| `/reis:doctor` | Verifica Git, Node, Flutter, Dart, Java, Android SDK, Xcode, CocoaPods, Swift, npm/yarn/pnpm e Fastlane, conforme a stack detectada, além de lock files e do Gradle wrapper |
| `/reis:review` | Roteia para o `mobile-code-reviewer`, carrega as skills da stack, coleta o diff (com secrets mascarados) e gera um relatório estruturado |
| Router | Detecta a intent em português ou inglês (`debug`, `review`, `security`, `performance`...) e foca a plataforma nativa citada ("o build Android do meu app Flutter") |
| CLI | `reis-mobile detect / doctor / route / review / agents / skills / stacks / validate` |

Componentes incluídos:

- **Agent:** `mobile-code-reviewer`
- **Skills:** `flutter-project-audit`, `flutter-widget-review`, `mobile-security-audit` (OWASP MASVS), `detect-mobile-stack`

## Instalação

Requisitos: [Claude Code](https://claude.com/claude-code) e Node.js 22 ou superior. O plugin não tem dependências npm.

### Como plugin do Claude Code (local)

```bash
git clone https://github.com/wrsilva/reis-mobile.git
```

Dentro do Claude Code:

```text
/plugin marketplace add /caminho/para/reis-mobile
/plugin install reis@reis-mobile
```

Reinicie a sessão e rode, dentro de um projeto mobile:

```text
/reis:doctor
/reis:review
/reis:review --base main foco no fluxo de login
```

### Como CLI

```bash
cd reis-mobile
npm link            # expõe os comandos reis-mobile e reis

cd ~/meu-app-flutter
reis doctor
reis detect
reis route "o build android parou depois de atualizar o Kotlin"
reis review --base main
```

Todos os comandos aceitam `--json` e `--dir <path>`.

## Exemplo

```text
$ reis route --dir ~/apps/demo_app "Execution failed for task ':app:compileDebugKotlin'"
Intent      debug (confidence 0.5) · area gradle
Stack       flutter · focus android
Agent       -
Skills      -
! No agent handles intent "debug" yet.
```

O router nunca inventa um especialista: sem agent para a intent, ele avisa. O `mobile-debugger` está previsto para a v0.3.0.

```text
$ reis review --dir ~/apps/demo_app
Intent      review (explicit)
Stack       flutter
Agent       mobile-code-reviewer
Skills      flutter-project-audit, flutter-widget-review, mobile-security-audit

Context     working-tree
  modified   lib/main.dart
```

## Como funciona

```text
/reis:review
     │
     ├─ detect stack ──────── pubspec.yaml → flutter (android, ios)
     ├─ detect intent ─────── review
     ├─ select agent ──────── mobile-code-reviewer
     ├─ select skills ─────── flutter-project-audit, flutter-widget-review, mobile-security-audit
     ├─ collect context ───── git diff (lock files excluídos, secrets mascarados)
     └─ review report
```

Detalhes em [ARCHITECTURE.md](ARCHITECTURE.md).

## Roadmap

| Versão | Entrega | Status |
|---|---|---|
| v0.1.0 | Fundação, detecção de stack, registries, router, `/reis:doctor`, `/reis:review` para Flutter | ✅ |
| v0.2.0 | Skills de review para Android e iOS nativos, configuração `.reis-mobile/config.yaml` | ⏳ |
| v0.3.0 | `mobile-debugger` + `/reis:debug` (Gradle, Xcode, CocoaPods, Flutter) | ⏳ |
| v0.4.0 | `mobile-qa` + `/reis:test` | ⏳ |
| v0.5.0 | `/reis:release` com quality gates | ⏳ |
| v0.6.0 | Pack React Native | ⏳ |
| v0.7.0 | MCP server | ⏳ |
| v0.8.0 | `/reis:council` (multi-agent + consenso) | ⏳ |
| v0.9.0 | Multi-provider (Claude, OpenAI, Gemini, OpenRouter, Ollama) | ⏳ |

## Contribuindo

Veja [CONTRIBUTING.md](CONTRIBUTING.md). Antes de abrir um PR:

```bash
npm run check   # valida agents/skills/stacks e roda os testes
```

## Licença

[MIT](LICENSE)
