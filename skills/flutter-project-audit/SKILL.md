---
name: flutter-project-audit
description: Audits the health of a Flutter project as a whole — pubspec constraints and lock file, analysis_options and lints, SDK and platform configuration (minSdk, iOS deployment target), flavors and environments, generated code, folder structure and test setup. Use when reviewing or auditing a Flutter app or plugin, before a release, or when the user asks whether a Flutter project is well configured.
intents: [review, architecture, dependency]
stacks: [flutter]
---

# Flutter Project Audit

Checklist de saúde do projeto. Cada item deve ser confirmado lendo o arquivo citado; não reporte o que não conseguiu verificar.

## 1. `pubspec.yaml` e dependências

- [ ] `environment.sdk` com limite inferior compatível com os recursos usados (records, patterns e sealed classes exigem Dart 3).
- [ ] Dependências com constraint de caret (`^x.y.z`). `any` ou versões sem limite superior são achado.
- [ ] `dependency_overrides` presente sem comentário justificando: achado (mascara conflitos e costuma ficar esquecido).
- [ ] Pacotes de dev (`build_runner`, `mocktail`, `flutter_lints`/`very_good_analysis`) em `dev_dependencies`, não em `dependencies`.
- [ ] Dependências via `git:` ou `path:` num app publicado: confirme se é intencional e se o `ref` está fixado.
- [ ] `pubspec.lock` versionado em **apps** (garante build reproduzível). Em **packages/plugins**, versionar é opcional.
- [ ] Pacotes descontinuados ou substituídos: só reporte se tiver evidência (aviso do `pub`, README do pacote). Não afirme de memória.

Comando útil, se o Flutter estiver disponível: `flutter pub outdated`.

## 2. Análise estática

- [ ] `analysis_options.yaml` existe e inclui um conjunto de lints (`package:flutter_lints/flutter.yaml`, `package:lints/recommended.yaml` ou `very_good_analysis`).
- [ ] Regras desativadas em massa (`ignore:` no topo de arquivos, `// ignore_for_file:`) sem justificativa.
- [ ] Arquivos gerados (`*.g.dart`, `*.freezed.dart`, `*.mocks.dart`) excluídos da análise e consistentes com as anotações. Gerado desatualizado é bug de build.

Comando útil: `flutter analyze`.

## 3. Configuração nativa

**Android** (`android/app/build.gradle` ou `build.gradle.kts`):
- [ ] `applicationId` não é o padrão `com.example.*` (a Play Store rejeita).
- [ ] `minSdk`/`targetSdk`/`compileSdk`: valores explícitos ou `flutter.*`. `targetSdk` defasado bloqueia publicação; confirme o requisito atual da Play Store antes de citar número.
- [ ] `signingConfig` de release não usa a debug key; senhas vêm de `key.properties` fora do versionamento.
- [ ] `minifyEnabled`/`shrinkResources` e regras ProGuard/R8 coerentes com os plugins que usam reflexão.

**iOS** (`ios/Runner.xcodeproj`, `ios/Podfile`, `ios/Runner/Info.plist`):
- [ ] `PRODUCT_BUNDLE_IDENTIFIER` não é `com.example.*`.
- [ ] `platform :ios` do Podfile alinhado ao `IPHONEOS_DEPLOYMENT_TARGET` do projeto.
- [ ] Cada permissão usada tem sua `NS*UsageDescription` com texto real (texto vazio ou genérico gera rejeição na App Store).

## 4. Ambientes e flavors

- [ ] URLs e chaves de ambiente não estão hardcoded em `lib/`. O padrão é `--dart-define`/`--dart-define-from-file` ou flavors.
- [ ] Valores passados por `--dart-define` **não são secretos**: ficam no binário. Chave privada de API nunca deve estar no app.
- [ ] Arquivos `.env`, `key.properties`, `*.jks`, `*.keystore`, `google-services.json` e `GoogleService-Info.plist` de produção: confira `.gitignore` e `git ls-files`.

## 5. Estrutura e arquitetura

- [ ] Organização consistente (feature-first ou por camadas). Misturar os dois sem critério é achado de manutenção.
- [ ] UI não chama HTTP, banco ou plugins de plataforma diretamente; existe uma camada de dados/repositório.
- [ ] Uma única abordagem de state management predominante (BLoC, Riverpod, Provider...). Várias sem motivo é achado.
- [ ] Injeção de dependência centralizada (construtores, `get_it`, providers), sem singletons globais espalhados.

## 6. Testes e CI

- [ ] Existe `test/` com testes que correspondem à lógica de negócio (não só o `widget_test.dart` padrão do template).
- [ ] Se há `integration_test/`, ele está no CI.
- [ ] Pipeline (`.github/workflows`, `codemagic.yaml`, `bitrise.yml`...) roda pelo menos `flutter analyze` e `flutter test`.

## Saída

Reporte cada achado na seção correspondente do relatório do `mobile-code-reviewer` (Architecture, Security, Maintainability...), com `arquivo:linha` e a correção proposta.
