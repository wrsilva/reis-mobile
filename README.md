# 📱 reis-mobile

Um app mobile não é um projeto genérico. Um code review que não conhece `BuildContext` após `await`, `android:exported`, `NSAllowsArbitraryLoads` ou `Podfile.lock` deixa passar justamente os bugs que só aparecem no dispositivo. O **reis-mobile** detecta a stack do seu projeto, escolhe o especialista certo e carrega só as skills que se aplicam a Flutter, Android, iOS ou React Native.

**AI agents for mobile engineering.** Um plugin do Claude Code com agents, skills e workflows especializados em desenvolvimento mobile.

<p align="center">
  <a href="https://github.com/wrsilva/reis-mobile/actions/workflows/ci.yml"><img src="https://github.com/wrsilva/reis-mobile/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/Version-0.1.0-blue" alt="Version 0.1.0">
  <img src="https://img.shields.io/badge/Claude_Code-plugin-blueviolet" alt="Claude Code plugin">
  <img src="https://img.shields.io/badge/Node.js-22+-339933?logo=node.js&logoColor=white" alt="Node.js 22+">
  <img src="https://img.shields.io/badge/Dependencies-0-brightgreen" alt="Zero dependencies">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Flutter-02569B?logo=flutter&logoColor=white" alt="Flutter">
  <img src="https://img.shields.io/badge/Android-3DDC84?logo=android&logoColor=white" alt="Android">
  <img src="https://img.shields.io/badge/iOS-000000?logo=apple&logoColor=white" alt="iOS">
  <img src="https://img.shields.io/badge/React_Native-20232A?logo=react&logoColor=61DAFB" alt="React Native">
  <img src="https://img.shields.io/badge/Kotlin_Multiplatform-7F52FF?logo=kotlin&logoColor=white" alt="Kotlin Multiplatform">
</p>

🔎 **Detecta a stack sozinho.** Flutter (app ou plugin), React Native (incluindo Expo), Kotlin Multiplatform, Android e iOS nativos, com linguagens e plataformas-alvo. Um app Flutter com `android/` e `ios/` continua sendo Flutter.

🧭 **Roteia para o especialista certo.** Descreva o problema em português ou inglês, e o router identifica a intent, a stack e a plataforma em foco. "O build Android do meu app Flutter quebrou" carrega o contexto de Flutter **e** de Android.

🛡️ **Segurança mobile de verdade.** Checklist baseado no OWASP MASVS, com verificações concretas por stack: `flutter_secure_storage`, `network_security_config`, ATS, Keychain e `AsyncStorage`.

🩺 **Doctor que entende mobile.** Verifica Flutter, Dart, Java, Android SDK, Xcode, CocoaPods, Gradle wrapper e lock files, mas só o que importa para a stack detectada.

🔒 **Secrets nunca chegam ao modelo.** O diff enviado para revisão passa por uma camada que mascara API keys, tokens, JWTs, chaves privadas e senhas de keystore.

🪶 **Leve.** Zero dependências npm, nenhum hook, nenhum provider externo. Cerca de 590 tokens fixos por sessão.

---

## Novidades

> 🆕 **v0.1.0: fundação.** Detecção de stack, router, `/reis-mobile:doctor` e `/reis-mobile:review` de ponta a ponta para projetos Flutter, com o agent `mobile-code-reviewer` e as skills de auditoria de projeto, widgets e segurança.
>
> ```bash
> /reis-mobile:doctor
> /reis-mobile:review --base main foco no fluxo de login
> ```

| Versão | Destaques |
|--------|-----------|
| **v0.1.0** (atual) | Plugin `reis-mobile` para o Claude Code. Detecção de 5 stacks. Router intent + stack → agent + skills. Context engine com diff mascarado. `/reis-mobile:doctor` e `/reis-mobile:review`. CLI `reis-mobile`. |

[Changelog completo →](CHANGELOG.md)

## Quickstart

```bash
# No terminal (fora de uma sessão do Claude Code):
claude plugin marketplace add https://github.com/wrsilva/reis-mobile.git
claude plugin install reis-mobile@reis-mobile

# Depois, dentro do Claude Code, na pasta do seu app:
/reis-mobile:doctor
/reis-mobile:review
```

Só isso. Requisitos: **Claude Code** e **Node.js 22+** no `PATH`. Não há `npm install`.

<details>
<summary>Usar como CLI (sem o Claude Code)</summary>

```bash
git clone https://github.com/wrsilva/reis-mobile.git
cd reis-mobile && npm link      # expõe o comando reis-mobile

cd ~/meu-app
reis-mobile doctor
reis-mobile detect
reis-mobile route "o build android parou depois de atualizar o Kotlin"
reis-mobile review --base main
```

Todos os comandos aceitam `--json` e `--dir <path>`. Rode `reis-mobile --help` para ver a lista completa.
</details>

<details>
<summary>Instalar a partir de um clone local (desenvolvimento)</summary>

```bash
git clone https://github.com/wrsilva/reis-mobile.git
claude plugin marketplace add ./reis-mobile
claude plugin install reis-mobile@reis-mobile
```

Depois de editar agents, skills ou commands, reinicie a sessão do Claude Code.
</details>

<details>
<summary>Atualizar / desinstalar</summary>

```bash
# Atualizar
claude plugin marketplace update reis-mobile
claude plugin update reis-mobile@reis-mobile

# Desinstalar
claude plugin uninstall reis-mobile
claude plugin marketplace remove reis-mobile
```

Reinicie o Claude Code depois de atualizar.
</details>

---

## Comandos

```bash
/reis-mobile:doctor                               # Ambiente e projeto: SDKs, Xcode, CocoaPods, Gradle wrapper, lock files
/reis-mobile:doctor --all                         # Verifica todas as ferramentas, não só as da stack detectada
/reis-mobile:review                               # Revisa as mudanças não commitadas (ou o projeto inteiro, se não houver)
/reis-mobile:review --base main                   # Revisa o branch atual contra main, no estilo de pull request
/reis-mobile:review --base main foco em segurança # Foco livre, em português ou inglês
```

Não sabe o que o router vai escolher? Pergunte à CLI:

```text
$ reis-mobile route "Execution failed for task ':app:compileDebugKotlin'"
Intent      debug (confidence 0.5) · area gradle
Stack       flutter · focus android
Agent       -
Skills      -
! No agent handles intent "debug" yet.
```

O router nunca inventa um especialista. Se ainda não existe agent para a intent, ele avisa.

---

## Escolha pelo objetivo

| Quero... | Use | Status |
|----------|-----|--------|
| Saber se meu ambiente está pronto para buildar | `/reis-mobile:doctor` | ✅ |
| Revisar um PR ou minhas mudanças | `/reis-mobile:review` | ✅ |
| Auditar um projeto Flutter inteiro | `/reis-mobile:review` sem mudanças pendentes | ✅ |
| Descobrir a stack de um projeto | `reis-mobile detect` | ✅ |
| Depurar build do Gradle, Xcode ou CocoaPods | `/reis-mobile:debug` | 🔜 v0.3 |
| Gerar testes (unit, widget, XCTest, Espresso) | `/reis-mobile:test` | 🔜 v0.4 |
| Checar se o app está pronto para a loja | `/reis-mobile:release` | 🔜 v0.5 |
| Ouvir vários especialistas sobre uma decisão | `/reis-mobile:council` | 🔜 v0.8 |

<details>
<summary><strong>Qual a diferença para o Claude Code puro?</strong></summary>

| | Claude Code puro | reis-mobile |
|---|---|---|
| **Domínio** | Genérico | Flutter, Android, iOS, React Native, KMP |
| **Contexto do projeto** | Você explica a stack | Detecção determinística de stack, plataforma e variante |
| **Review** | Genérico | Checklists mobile: ciclo de vida, `BuildContext`, MASVS, manifest, ATS |
| **Secrets no diff** | Enviados como estão | Mascarados antes de chegar ao modelo |
| **Custo de contexto** | Zero | ~590 tokens fixos, sem hooks |
| **Melhor para** | Tarefas gerais | Times e devs que trabalham com apps mobile |

**Resumindo:** o Claude Code já sabe programar. O reis-mobile faz ele olhar para o que importa num app mobile.

</details>

---

## Como funciona

```text
/reis-mobile:review
     │
     ├─ detect stack ──────── pubspec.yaml → flutter (android, ios)
     ├─ detect intent ─────── review
     ├─ select agent ──────── mobile-code-reviewer
     ├─ select skills ─────── flutter-project-audit · flutter-widget-review · mobile-security-audit
     ├─ collect context ───── git diff (lock files fora, secrets mascarados)
     └─ review report ─────── Summary · Critical · Bugs · Architecture · Security · Performance · Maintainability
```

O núcleo em Node.js decide **o que** carregar. O modelo decide **como** revisar, seguindo as instruções carregadas. Detalhes em [ARCHITECTURE.md](ARCHITECTURE.md).

### Detecção de stack

| Stack | Evidência |
|-------|-----------|
| Flutter | `pubspec.yaml` com `sdk: flutter` (variante `plugin` quando aplicável) |
| React Native | `package.json` dependendo de `react-native` (variante `expo`) |
| Kotlin Multiplatform | `build.gradle.kts` com o plugin multiplatform |
| Android | Gradle na raiz + `AndroidManifest.xml` ou plugin `com.android.*` |
| iOS | `*.xcodeproj`, `*.xcworkspace`, `Podfile` ou `Package.swift` com `.iOS` |

### Agents e skills

| Componente | Tipo | Stacks | O que faz |
|------------|------|--------|-----------|
| `mobile-code-reviewer` | agent | todas | Review com evidência `arquivo:linha`, focado no que quebra em produção |
| `flutter-project-audit` | skill | Flutter | `pubspec`, lints, `minSdk`/deployment target, flavors, `--dart-define`, estrutura, CI |
| `flutter-widget-review` | skill | Flutter | `BuildContext` após `await`, `dispose`, `Future` no `build`, rebuilds, listas, layout, a11y |
| `mobile-security-audit` | skill | todas | OWASP MASVS, com verificações específicas para Flutter, Android, iOS e React Native |
| `detect-mobile-stack` | skill | todas | Detecção de stack sob demanda |

---

## Confiança, segurança e limites

**Somente leitura.** `doctor`, `detect`, `route` e `review` não alteram seu projeto. O comando `/reis-mobile:review` instrui o modelo a não editar arquivos.

**Secrets mascarados.** O diff passa por [`core/security/redact.mjs`](core/security/redact.mjs) antes de chegar ao modelo. Lock files e código gerado (`*.g.dart`, `*.freezed.dart`, `*.pbxproj`) ficam fora do diff. A redação é uma camada de proteção, não uma garantia. Veja [SECURITY.md](SECURITY.md).

**Sem rede, sem telemetria.** A CLI não faz chamadas de rede e não grava nada fora do terminal. O único modelo envolvido é o da sua sessão do Claude Code.

**Sem hooks.** O plugin não se prende a eventos do Claude Code. Ele só age quando você chama um comando ou quando uma skill é relevante.

**Namespace próprio.** Os comandos ficam em `/reis-mobile:*` e não conflitam com `/review` nem com `/security-review` nativos.

**Desinstalação limpa.** `claude plugin uninstall reis-mobile` remove tudo.

---

## Roadmap

| Versão | Entrega | Status |
|--------|---------|--------|
| v0.1.0 | Fundação, detecção de stack, router, `/reis-mobile:doctor`, `/reis-mobile:review` para Flutter | ✅ |
| v0.2.0 | Skills de review para Android e iOS nativos, `.reis-mobile/config.yaml` | ⏳ |
| v0.3.0 | `mobile-debugger` + `/reis-mobile:debug` (Gradle, Xcode, CocoaPods, Flutter) | ⏳ |
| v0.4.0 | `mobile-qa` + `/reis-mobile:test` | ⏳ |
| v0.5.0 | `/reis-mobile:release` com quality gates | ⏳ |
| v0.6.0 | Pack React Native | ⏳ |
| v0.7.0 | MCP server | ⏳ |
| v0.8.0 | `/reis-mobile:council`: multi-agent com consenso | ⏳ |
| v0.9.0 | Multi-provider (Claude, OpenAI, Gemini, OpenRouter, Ollama) | ⏳ |
| v1.0.0 | Primeira versão estável: Flutter, Android, iOS e React Native | ⏳ |

---

## FAQ

**Preciso ter Flutter, Xcode ou Android SDK instalados?**
Não para o review, que só lê código. O `/reis-mobile:doctor` mostra o que falta caso você queira buildar.

**Meu app está dentro de um monorepo.**
Rode a partir da pasta do app, ou use `--dir apps/mobile` na CLI. O diff fica restrito a essa pasta.

**Funciona com Android e iOS nativos?**
A detecção, o doctor e a skill de segurança já funcionam. As skills de review específicas de Android e iOS chegam na v0.2.0.

**Funciona no Codex ou no Cursor?**
Ainda não. O suporte está planejado junto com o MCP server (v0.7.0).

**O que o reis-mobile envia para fora da minha máquina?**
A CLI não envia nada. O que o modelo lê durante o `/reis-mobile:review` segue as mesmas regras de qualquer sessão do Claude Code.

---

## Contribuindo

1. Leia [AGENTS.md](AGENTS.md) (regras do projeto) e [CONTRIBUTING.md](CONTRIBUTING.md).
2. `git clone https://github.com/wrsilva/reis-mobile.git && cd reis-mobile && npm run check`
3. Abra um PR mostrando a saída de `reis-mobile route` ou `reis-mobile review` num projeto real.

---

## Documentação

- [Arquitetura](ARCHITECTURE.md): módulos, detecção, roteamento e contrato de agents e skills
- [AGENTS.md](AGENTS.md): regras para quem (ou qual IA) contribui com o repositório
- [Contribuindo](CONTRIBUTING.md)
- [Segurança](SECURITY.md)
- [Changelog](CHANGELOG.md)

---

## Atribuição

- **[OWASP MASVS](https://mas.owasp.org/MASVS/)**: categorias usadas na skill `mobile-security-audit`.

---

## Licença

MIT. Veja [LICENSE](LICENSE).

<p align="center">
  <a href="https://github.com/wrsilva">wrsilva</a> | MIT License | <a href="https://github.com/wrsilva/reis-mobile/issues">Report Issues</a>
</p>
