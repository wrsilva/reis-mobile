# 📱 reis-mobile

Um app mobile não é um projeto genérico. Um code review que não conhece `BuildContext` após `await`, `android:exported`, `NSAllowsArbitraryLoads` ou `Podfile.lock` deixa passar justamente os bugs que só aparecem no dispositivo. O **reis-mobile** detecta a stack do seu projeto, escolhe o especialista certo e carrega só as skills que se aplicam a Flutter, Android, iOS ou React Native.

**AI agents for mobile engineering.** Um plugin do Claude Code com agents, skills e workflows especializados em desenvolvimento mobile.

<p align="center">
  <a href="https://github.com/wrsilva/reis-mobile/actions/workflows/ci.yml"><img src="https://github.com/wrsilva/reis-mobile/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/Version-0.2.0-blue" alt="Version 0.2.0">
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

👥 **7 agents e 67 skills de mobile.** Arquiteto Flutter, engenheiros de performance e de testes, staff engineer Flutter/Android/iOS, especialista em plugins nativos, revisor de código e um lead que coordena todos, além de skills para BLoC, Riverpod, Firebase, testes, layout, plugins e segurança.

🧭 **Roteia para o especialista certo.** Descreva o problema em português ou inglês, e o router identifica a intent, a stack e a plataforma em foco. "O build Android do meu app Flutter quebrou" carrega o contexto de Flutter **e** de Android.

🛡️ **Segurança mobile de verdade.** Checklist baseado no OWASP MASVS, com verificações concretas por stack: `flutter_secure_storage`, `network_security_config`, ATS, Keychain e `AsyncStorage`.

🩺 **Doctor que entende mobile.** Verifica Flutter, Dart, Java, Android SDK, Xcode, CocoaPods, Gradle wrapper e lock files, mas só o que importa para a stack detectada.

🔒 **Secrets nunca chegam ao modelo.** O diff enviado para revisão passa por uma camada que mascara API keys, tokens, JWTs, chaves privadas e senhas de keystore.

🪶 **Sem dependências.** Instala com um comando, zero dependências npm, nenhum hook, nenhum provider externo.

---

## Novidades

> 🆕 **v0.2.0: time de especialistas.** 6 novos agents e 63 novas skills de Flutter, Dart e Firebase. O router passa a acionar `flutter-architect`, `flutter-performance-engineer`, `flutter-test-engineer` e `mobile-staff-engineer` conforme o pedido, e o `lead-mobile` coordena auditorias completas.
>
> ```bash
> reis-mobile route "a lista está com jank no scroll"   # → flutter-performance-engineer
> reis-mobile route "escreva testes para o login cubit" # → flutter-test-engineer
> ```

| Versão | Destaques |
|--------|-----------|
| **v0.2.0** (atual) | 6 novos agents (`flutter-architect`, `flutter-performance-engineer`, `flutter-test-engineer`, `mobile-staff-engineer`, `plugin-native-expert`, `lead-mobile`) e 63 novas skills de Flutter, Dart e Firebase. O router passa a ter especialista para debug, test, architecture e performance. |
| **v0.1.0** | Plugin `reis-mobile` para o Claude Code. Detecção de 5 stacks. Router intent + stack → agent + skills. Context engine com diff mascarado. `/reis-mobile:doctor` e `/reis-mobile:review`. CLI `reis-mobile`. |

[Changelog completo →](CHANGELOG.md)

## Instalação

Requisitos: **Node.js 22+** e, para usar os comandos `/reis-mobile:*`, o **[Claude Code](https://claude.com/claude-code)**.

Todos os métodos instalam a CLI `reis-mobile`. Quando o Claude Code está disponível, o instalador também registra o plugin. Se ele não estiver, rode `reis-mobile init` depois de instalá-lo.

### Quick Install (macOS/Linux) — recomendado

```bash
curl -fsSL https://raw.githubusercontent.com/wrsilva/reis-mobile/main/install.sh | sh
```

Instala em `~/.local/share/reis-mobile`, cria o comando em `~/.local/bin` e confere o SHA-256 do download. Se `~/.local/bin` não estiver no `PATH`:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc   # ou ~/.bashrc
```

### Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/wrsilva/reis-mobile/main/install.ps1 | iex
```

Instala em `%LOCALAPPDATA%\reis-mobile`, cria `reis-mobile.cmd` em `%USERPROFILE%\.local\bin` e adiciona essa pasta ao `PATH` do usuário. Abra um novo terminal depois.

### Homebrew

```bash
brew install wrsilva/tap/reis-mobile
reis-mobile init
```

### npm

```bash
npm install -g reis-mobile
reis-mobile init
```

### Só o plugin do Claude Code

```bash
claude plugin marketplace add https://github.com/wrsilva/reis-mobile.git
claude plugin install reis-mobile@reis-mobile
```

### Verificar a instalação

```bash
reis-mobile --version   # reis-mobile 0.2.0
```

Depois, reinicie o Claude Code e rode, na pasta do seu app:

```text
/reis-mobile:doctor
/reis-mobile:review
```

<details>
<summary>Opções do instalador</summary>

| Variável | Padrão | Uso |
|----------|--------|-----|
| `REIS_MOBILE_VERSION` | última release | Instala uma tag específica, por exemplo `v0.2.0` |
| `REIS_MOBILE_HOME` | `~/.local/share/reis-mobile` | Pasta de instalação |
| `REIS_MOBILE_BIN_DIR` | `~/.local/bin` | Pasta do comando `reis-mobile` |
| `REIS_MOBILE_SKIP_PLUGIN` | `0` | `1` instala só a CLI, sem registrar o plugin |

```bash
curl -fsSL https://raw.githubusercontent.com/wrsilva/reis-mobile/main/install.sh | REIS_MOBILE_VERSION=v0.2.0 sh
```
</details>

<details>
<summary>Atualizar / desinstalar</summary>

```bash
# Atualizar: rode o instalador de novo, ou
brew upgrade reis-mobile          # Homebrew
npm update -g reis-mobile         # npm
claude plugin marketplace update reis-mobile && claude plugin update reis-mobile@reis-mobile

# Desinstalar
reis-mobile init --uninstall      # remove o plugin do Claude Code
rm -rf ~/.local/share/reis-mobile ~/.local/bin/reis-mobile   # instalação via curl
brew uninstall reis-mobile        # ou: npm uninstall -g reis-mobile
```

Reinicie o Claude Code depois de atualizar.
</details>

<details>
<summary>Desenvolvimento a partir do clone</summary>

```bash
git clone https://github.com/wrsilva/reis-mobile.git
cd reis-mobile
npm link                      # CLI apontando para o clone
reis-mobile init --local      # plugin apontando para o clone
npm run check                 # valida e roda os testes
```

Depois de editar agents, skills ou commands, reinicie a sessão do Claude Code.
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
Agent       mobile-staff-engineer
Skills      dart-fix-runtime-errors, dart-resolve-package-conflicts, flutter-errors, flutter-fix-layout-issues

$ reis-mobile route "escreva testes para o login cubit"
Intent      test (confidence 1)
Stack       flutter
Agent       flutter-test-engineer
Skills      dart-add-unit-test, dart-collect-coverage, dart-generate-test-mocks, flutter-add-integration-test, flutter-add-widget-test, mockito, mocktail, patrol-e2e-testing, testing
```

O router nunca inventa um especialista: se nenhum agent atende a intent, ele avisa. Você não precisa chamar os agents pelo nome, porque o Claude Code os aciona pela descrição quando o pedido se encaixa. Para forçar um deles, peça: *"use o reis-mobile:flutter-architect para revisar a arquitetura"*.

---

## Escolha pelo objetivo

| Quero... | Use | Status |
|----------|-----|--------|
| Saber se meu ambiente está pronto para buildar | `/reis-mobile:doctor` | ✅ |
| Revisar um PR ou minhas mudanças | `/reis-mobile:review` | ✅ |
| Auditar um projeto Flutter inteiro | `/reis-mobile:review` sem mudanças pendentes | ✅ |
| Descobrir a stack de um projeto | `reis-mobile detect` | ✅ |
| Revisar a arquitetura de um app Flutter | agent `flutter-architect` | ✅ |
| Achar a causa de jank, rebuilds ou vazamentos | agent `flutter-performance-engineer` | ✅ |
| Escrever ou auditar testes Flutter | agent `flutter-test-engineer` | ✅ |
| Depurar build do Gradle, Xcode ou CocoaPods | agent `mobile-staff-engineer` | ✅ |
| Criar um plugin ou depurar MethodChannel/EventChannel | agent `plugin-native-expert` | ✅ |
| Auditoria completa com vários especialistas | agent `lead-mobile` | ✅ |
| Comando dedicado de debug | `/reis-mobile:debug` | 🔜 v0.3 |
| Comando dedicado de testes (incluindo XCTest e Espresso) | `/reis-mobile:test` | 🔜 v0.4 |
| Checar se o app está pronto para a loja | `/reis-mobile:release` | 🔜 v0.5 |
| Decisão consolidada por consenso entre agents | `/reis-mobile:council` | 🔜 v0.8 |

<details>
<summary><strong>Qual a diferença para o Claude Code puro?</strong></summary>

| | Claude Code puro | reis-mobile |
|---|---|---|
| **Domínio** | Genérico | Flutter, Android, iOS, React Native, KMP |
| **Contexto do projeto** | Você explica a stack | Detecção determinística de stack, plataforma e variante |
| **Review** | Genérico | Checklists mobile: ciclo de vida, `BuildContext`, MASVS, manifest, ATS |
| **Secrets no diff** | Enviados como estão | Mascarados antes de chegar ao modelo |
| **Especialistas** | Nenhum | 7 agents e 67 skills de mobile |
| **Custo de contexto** | Zero | ~4.800 tokens fixos (descrições de agents e skills), sem hooks |
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
     ├─ select skills ─────── code-review · effective-dart · flutter-project-audit · flutter-widget-review · mobile-security-audit …
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

### Agents

| Agent | Stack | Acionado para | O que faz |
|-------|-------|---------------|-----------|
| `mobile-code-reviewer` | todas | review | Review com evidência `arquivo:linha`, focado no que quebra em produção |
| `flutter-architect` | Flutter | architecture | Camadas, feature-first, acoplamento, lógica fora do lugar, plano de refatoração |
| `flutter-performance-engineer` | Flutter | performance | Rebuilds, jank, listas, vazamentos, paint, startup, com score e top 3 correções |
| `flutter-test-engineer` | Flutter | test | Unit, BLoC/Cubit, widget e integração, auditoria de cobertura e testes frágeis |
| `mobile-staff-engineer` | todas | debug, architecture, performance, test, security, release, migration, dependency, build, deployment, accessibility | Especialista sênior Flutter/Android/iOS para o que nenhum agent específico cobre |
| `plugin-native-expert` | Flutter | sob demanda | MethodChannel, EventChannel, Pigeon e bridges Kotlin/Swift, threading e ciclo de vida |
| `lead-mobile` | todas | sob demanda | Coordena os demais agents e consolida um plano de ação único |

Quando mais de um agent atende a intent, vence o específico da stack. Num app Flutter, `performance` vai para o `flutter-performance-engineer`; num app Android nativo, vai para o `mobile-staff-engineer`.

### Skills

Skills **auto-roteadas** são carregadas pelo router junto com o agent. As demais (—) são acionadas pelo Claude Code quando o pedido combina com a descrição, por exemplo *"adicione push notifications com FCM"* → `firebase-messaging`.

<details>
<summary><strong>Review e qualidade</strong> (7)</summary>

| Skill | O que faz | Auto-roteada para | Stack | Origem |
|---|---|---|---|---|
| `code-review` | Performs thorough code reviews for Flutter/Dart pull requests and merge requests. | review | Flutter | evanca/flutter-ai-rules |
| `effective-dart` | Applies Effective Dart guidelines in Flutter/Dart code. | review | Flutter | evanca/flutter-ai-rules |
| `dart-run-static-analysis` | Execute `dart analyze` to identify warnings and errors, and use `dart fix --apply` to automatically resolve… | review | Flutter | dart-lang/skills |
| `flutter-project-audit` | Audits the health of a Flutter project as a whole — pubspec constraints and lock file, analysis_options and lints,… | review, architecture, dependency | Flutter | reis-mobile |
| `flutter-widget-review` | Reviews Flutter widget code for lifecycle bugs, BuildContext misuse across async gaps, missing dispose, side effects… | review, performance | Flutter | reis-mobile |
| `dart-3-updates` | Applies Dart 3 language features in Flutter/Dart code. | migration | Flutter | evanca/flutter-ai-rules |
| `dart-use-pattern-matching` | Applies Dart 3 pattern matching, switch expressions, and destructuring idiomatically to validate data schemas,… | — | Flutter | dart-lang/skills |

</details>

<details>
<summary><strong>Arquitetura e estado</strong> (9)</summary>

| Skill | O que faz | Auto-roteada para | Stack | Origem |
|---|---|---|---|---|
| `architecture-feature-first` | Structures Flutter apps using layered architecture (UI / Logic / Data) with feature-first file organization. | architecture | Flutter | evanca/flutter-ai-rules |
| `flutter-app-architecture` | Provides best practices for Flutter app architecture, including layered architecture, data flow, state management… | architecture | Flutter | evanca/flutter-ai-rules |
| `flutter-apply-architecture-best-practices` | Architects a Flutter application using the recommended layered approach (UI, Logic, Data). | architecture | Flutter | flutter/skills |
| `flutter-managing-state` | Manages application and ephemeral state in a Flutter app. | architecture | Flutter | flutter/skills |
| `bloc` | Implements Flutter state management using the bloc library (Bloc and Cubit). | — | Flutter | evanca/flutter-ai-rules |
| `riverpod` | Uses Riverpod for state management in Flutter/Dart. | — | Flutter | evanca/flutter-ai-rules |
| `provider` | Uses the Provider package for dependency injection and state management in Flutter. | — | Flutter | evanca/flutter-ai-rules |
| `flutter-change-notifier` | Implements state management with ChangeNotifier and Provider in Flutter. | — | Flutter | evanca/flutter-ai-rules |
| `flutter-login-usecase` | Implements a Flutter login use case that authenticates through an injected repository and persists the access token… | — | Flutter | reis-mobile |

</details>

<details>
<summary><strong>Testes</strong> (10)</summary>

| Skill | O que faz | Auto-roteada para | Stack | Origem |
|---|---|---|---|---|
| `testing` | Writes and reviews Flutter/Dart tests. | test | Flutter | evanca/flutter-ai-rules |
| `dart-add-unit-test` | Write and organize unit tests for functions, methods, and classes using `package:test`. | test | Flutter | dart-lang/skills |
| `flutter-add-widget-test` | Implement a component-level test using `WidgetTester` to verify UI rendering and user interactions (tapping,… | test | Flutter | flutter/skills |
| `flutter-add-integration-test` | Configures Flutter Driver for app interaction and converts MCP actions into permanent integration tests. | test | Flutter | flutter/skills |
| `patrol-e2e-testing` | Generates and maintains end-to-end tests for Flutter apps using Patrol. | test | Flutter | evanca/flutter-ai-rules |
| `mocktail` | Uses the Mocktail package for mocking in Flutter/Dart tests. | test | Flutter | evanca/flutter-ai-rules |
| `mockito` | Uses the Mockito package for mocking in Flutter/Dart tests. | test | Flutter | evanca/flutter-ai-rules |
| `dart-generate-test-mocks` | Define and generate mock objects for external dependencies using `package:mockito` and `build_runner`. | test | Flutter | dart-lang/skills |
| `dart-collect-coverage` | Collect coverage using the coverage packge and create an LCOV report | test | Flutter | dart-lang/skills |
| `dart-migrate-to-checks-package` | Replace the usage of `expect` and similar functions from `package:matcher` to `package:checks` equivalents. | migration | Flutter | dart-lang/skills |

</details>

<details>
<summary><strong>Debug</strong> (4)</summary>

| Skill | O que faz | Auto-roteada para | Stack | Origem |
|---|---|---|---|---|
| `flutter-errors` | Diagnoses and fixes common Flutter errors. | debug | Flutter | evanca/flutter-ai-rules |
| `flutter-fix-layout-issues` | Fixes Flutter layout errors (overflows, unbounded constraints) using Dart and Flutter MCP tools. | debug | Flutter | flutter/skills |
| `dart-fix-runtime-errors` | Uses get_runtime_errors and lsp to fetch an active stack trace, locate the failing line, apply a fix, and verify… | debug | Flutter | dart-lang/skills |
| `dart-resolve-package-conflicts` | Workflow for fixing package version conflicts. | debug, dependency | Flutter | dart-lang/skills |

</details>

<details>
<summary><strong>Performance</strong> (3)</summary>

| Skill | O que faz | Auto-roteada para | Stack | Origem |
|---|---|---|---|---|
| `flutter-reducing-app-size` | Measures and optimizes the size of Flutter application bundles for deployment. | performance | Flutter | flutter/skills |
| `flutter-handling-concurrency` | Executes long-running tasks in background isolates to keep the UI responsive. | performance | Flutter | flutter/skills |
| `flutter-caching-data` | Implements caching strategies for Flutter apps to improve performance and offline support. | — | Flutter | flutter/skills |

</details>

<details>
<summary><strong>UI, layout e navegação</strong> (8)</summary>

| Skill | O que faz | Auto-roteada para | Stack | Origem |
|---|---|---|---|---|
| `flutter-building-layouts` | Builds Flutter layouts using the constraint system and layout widgets. | — | Flutter | flutter/skills |
| `flutter-build-responsive-layout` | Use `LayoutBuilder`, `MediaQuery`, or `Expanded/Flexible` to create a layout that adapts to different screen sizes. | — | Flutter | flutter/skills |
| `flutter-building-forms` | Builds Flutter forms with validation and user input handling. | — | Flutter | flutter/skills |
| `flutter-animating-apps` | Implements animated effects, transitions, and motion in a Flutter app. | — | Flutter | flutter/skills |
| `flutter-theming-apps` | Customizes the visual appearance of a Flutter app using the theming system. | — | Flutter | flutter/skills |
| `flutter-add-widget-preview` | Adds interactive widget previews to the project using the previews.dart system. | — | Flutter | flutter/skills |
| `flutter-setup-declarative-routing` | Configure `MaterialApp.router` using a package like `go_router` for advanced URL-based navigation. | — | Flutter | flutter/skills |
| `flutter-adding-home-screen-widgets` | Adds home screen widgets to a Flutter app for Android and iOS. | — | Flutter | flutter/skills |

</details>

<details>
<summary><strong>Dados e rede</strong> (3)</summary>

| Skill | O que faz | Auto-roteada para | Stack | Origem |
|---|---|---|---|---|
| `flutter-use-http-package` | Use the `http` package to execute GET, POST, PUT, or DELETE requests. | — | Flutter | flutter/skills |
| `flutter-implement-json-serialization` | Create model classes with `fromJson` and `toJson` methods using `dart:convert`. | — | Flutter | flutter/skills |
| `flutter-working-with-databases` | Manages local data persistence using SQLite or other database solutions. | — | Flutter | flutter/skills |

</details>

<details>
<summary><strong>Nativo e plugins</strong> (3)</summary>

| Skill | O que faz | Auto-roteada para | Stack | Origem |
|---|---|---|---|---|
| `flutter-building-plugins` | Builds Flutter plugins that provide native interop for other apps to use. | — | Flutter | flutter/skills |
| `flutter-interoperating-with-native-apis` | Interoperates with native platform APIs on Android, iOS, and the web. | — | Flutter | flutter/skills |
| `flutter-embedding-native-views` | Embeds native Android, iOS, or macOS views into a Flutter app. | — | Flutter | flutter/skills |

</details>

<details>
<summary><strong>Segurança</strong> (3)</summary>

| Skill | O que faz | Auto-roteada para | Stack | Origem |
|---|---|---|---|---|
| `mobile-security-audit` | Security audit for mobile apps based on the OWASP MASVS categories — insecure token storage, hardcoded secrets,… | review, security, release | todas | reis-mobile |
| `flutter-secure-token-store` | Stores JWT access tokens on Flutter with platform secure storage (Keychain on iOS, Keystore-backed storage on… | security | Flutter | reis-mobile |
| `firebase-app-check` | Integrates Firebase App Check into Flutter apps. | security | Flutter | evanca/flutter-ai-rules |

</details>

<details>
<summary><strong>Acessibilidade e internacionalização</strong> (2)</summary>

| Skill | O que faz | Auto-roteada para | Stack | Origem |
|---|---|---|---|---|
| `flutter-improving-accessibility` | Configures a Flutter app to support assistive technologies like Screen Readers. | accessibility | Flutter | flutter/skills |
| `flutter-setup-localization` | Add `flutter_localizations` and `intl` dependencies, enable "generate true" in `pubspec.yaml`, and create an… | — | Flutter | flutter/skills |

</details>

<details>
<summary><strong>Firebase</strong> (13)</summary>

| Skill | O que faz | Auto-roteada para | Stack | Origem |
|---|---|---|---|---|
| `flutterfire-configure` | Sets up Firebase for Flutter apps using FlutterFire CLI. | — | Flutter | evanca/flutter-ai-rules |
| `firebase-auth` | Integrates Firebase Authentication into Flutter apps. | — | Flutter | evanca/flutter-ai-rules |
| `firebase-cloud-firestore` | Integrates Cloud Firestore into Flutter apps. | — | Flutter | evanca/flutter-ai-rules |
| `firebase-database` | Integrates Firebase Realtime Database into Flutter apps. | — | Flutter | evanca/flutter-ai-rules |
| `firebase-storage` | Integrates Firebase Cloud Storage into Flutter apps. | — | Flutter | evanca/flutter-ai-rules |
| `firebase-cloud-functions` | Calls Firebase Cloud Functions from Flutter apps. | — | Flutter | evanca/flutter-ai-rules |
| `firebase-messaging` | Integrates Firebase Cloud Messaging (FCM) into Flutter apps. | — | Flutter | evanca/flutter-ai-rules |
| `firebase-in-app-messaging` | Integrates Firebase In-App Messaging into Flutter apps. | — | Flutter | evanca/flutter-ai-rules |
| `firebase-remote-config` | Integrates Firebase Remote Config into Flutter apps. | — | Flutter | evanca/flutter-ai-rules |
| `firebase-analytics` | Integrates Firebase Analytics into Flutter apps. | — | Flutter | evanca/flutter-ai-rules |
| `firebase-crashlytics` | Integrates Firebase Crashlytics into Flutter apps. | — | Flutter | evanca/flutter-ai-rules |
| `firebase-ai` | Integrates Firebase AI Logic into Flutter apps. | — | Flutter | evanca/flutter-ai-rules |
| `firebase-data-connect` | Integrates Firebase Data Connect into Flutter apps. | — | Flutter | evanca/flutter-ai-rules |

</details>

<details>
<summary><strong>Ambiente</strong> (2)</summary>

| Skill | O que faz | Auto-roteada para | Stack | Origem |
|---|---|---|---|---|
| `flutter-setting-up-on-macos` | Sets up a macOS environment for Flutter development. | — | Flutter | flutter/skills |
| `detect-mobile-stack` | Detects the mobile stack of the current project (Flutter, Android, iOS, React Native, Kotlin Multiplatform), its… | — | todas | reis-mobile |

</details>

As skills de terceiros mantêm o nome e a licença originais. Veja [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

---

## Confiança, segurança e limites

**Somente leitura.** `doctor`, `detect`, `route` e `review` não alteram seu projeto. O comando `/reis-mobile:review` instrui o modelo a não editar arquivos.

**Secrets mascarados.** O diff passa por [`core/security/redact.mjs`](core/security/redact.mjs) antes de chegar ao modelo. Lock files e código gerado (`*.g.dart`, `*.freezed.dart`, `*.pbxproj`) ficam fora do diff. A redação é uma camada de proteção, não uma garantia. Veja [SECURITY.md](SECURITY.md).

**Sem telemetria.** `detect`, `doctor`, `route` e `review` não fazem chamadas de rede. Só a instalação acessa a rede, para baixar a release e registrar o plugin. O único modelo envolvido é o da sua sessão do Claude Code.

**Custo de contexto.** As descrições dos 7 agents e das 67 skills somam cerca de 4.800 tokens fixos por sessão (medido com `claude plugin details reis-mobile`). O conteúdo completo de cada skill só é carregado quando ela é usada.

**Sem hooks.** O plugin não se prende a eventos do Claude Code. Ele só age quando você chama um comando ou quando uma skill é relevante.

**Namespace próprio.** Os comandos ficam em `/reis-mobile:*` e não conflitam com `/review` nem com `/security-review` nativos.

**Instalação verificável.** Os instaladores conferem o SHA-256 da release e não pedem `sudo`. `reis-mobile init --uninstall` remove o plugin sem deixar configuração para trás.

---

## Roadmap

| Versão | Entrega | Status |
|--------|---------|--------|
| v0.1.0 | Fundação, detecção de stack, router, `/reis-mobile:doctor`, `/reis-mobile:review` para Flutter | ✅ |
| v0.2.0 | 6 agents e 63 skills de Flutter, Dart e Firebase | ✅ |
| v0.3.0 | Skills de Android e iOS nativos, `.reis-mobile/config.yaml` e `/reis-mobile:debug` (Gradle, Xcode, CocoaPods, Flutter) | ⏳ |
| v0.4.0 | `/reis-mobile:test` e testes nativos (XCTest, Espresso) | ⏳ |
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
A detecção, o doctor, a skill de segurança e os agents `mobile-code-reviewer`, `mobile-staff-engineer` e `lead-mobile` já funcionam. As skills específicas de Android e iOS chegam na v0.3.0; as 63 skills importadas são de Flutter, Dart e Firebase.

**Já tenho skills com os mesmos nomes em `~/.claude/skills`.**
As do plugin ficam no namespace `reis-mobile:` e não conflitam, mas o Claude Code carrega as duas descrições. Para economizar contexto, remova as cópias globais que o plugin já cobre.

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
- [Third-Party Notices](THIRD_PARTY_NOTICES.md): origem e licença das skills de terceiros
- [Changelog](CHANGELOG.md)

---

## Atribuição

- **[flutter/skills](https://github.com/flutter/skills)** (BSD-3-Clause): 25 skills de Flutter.
- **[dart-lang/skills](https://github.com/dart-lang/skills)** (BSD-3-Clause): 8 skills de Dart.
- **[evanca/flutter-ai-rules](https://github.com/evanca/flutter-ai-rules)** (MIT): 28 skills de Flutter, testes e Firebase.
- **[OWASP MASVS](https://mas.owasp.org/MASVS/)**: categorias usadas na skill `mobile-security-audit`.

---

## Licença

MIT. Veja [LICENSE](LICENSE).

<p align="center">
  <a href="https://github.com/wrsilva">wrsilva</a> | MIT License | <a href="https://github.com/wrsilva/reis-mobile/issues">Report Issues</a>
</p>
