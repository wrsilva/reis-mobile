# Arquitetura

O reis-mobile é um plugin do Claude Code com um núcleo determinístico em Node.js. O núcleo decide **o que** carregar (stack, intent, agent, skills, contexto); o modelo decide **como** revisar, depurar ou implementar, seguindo as instruções carregadas.

```text
USER ──► COMMAND (/reis-mobile:review)
              │
              ▼
          ROUTER ◄──── Intent detector (prompt)
              │  ◄──── Stack detector (arquivos do projeto)
              │  ◄──── Registry (agents, skills, stacks)
              ▼
     AGENT + SKILLS ◄── Context engine (git diff, redação de secrets)
              │
              ▼
     Claude Code (Read/Grep/Bash) ──► relatório
```

## Decisões

| Decisão | Motivo |
|---|---|
| **Zero dependências npm** | O plugin roda direto do cache do Claude Code, onde ninguém executa `npm install`. Por isso existem um parser de frontmatter próprio e testes com `node:test`. |
| **Metadados de roteamento no frontmatter** | `intents` e `stacks` ficam no mesmo arquivo que o Claude Code lê. O router e o plugin não conseguem divergir sobre o que existe. |
| **Detecção determinística, não por LLM** | Stack detection precisa ser previsível, testável e barata. O modelo recebe o resultado pronto. |
| **Projeto no disco decide a stack** | O prompt só preenche uma stack desconhecida ou foca uma plataforma nativa de um app cross-platform. "O build Android" num app Flutter continua sendo Flutter, com foco em Android. |
| **Sem agent, sem chute** | Quando nenhuma intent tem agent registrado, o router emite um aviso em vez de escolher o "mais parecido". |
| **Estrutura plana de skills** | `skills/<nome>/SKILL.md`, com prefixo da stack no nome (`flutter-*`, `android-*`). É o layout que o Claude Code descobre automaticamente. |
| **Secrets mascarados antes do modelo** | O diff passa por `redactSecrets` antes de sair da CLI. Os padrões miram literais (`apiKey = "AIza..."`), não identificadores (`final token = await read()`), para não prejudicar a revisão. |

## Módulos

```text
core/
├── paths.mjs                    raiz do plugin
├── detection/
│   ├── project-probe.mjs        leitura limitada do projeto (ignora build/, Pods/, node_modules/...)
│   └── stack-detector.mjs       regras por stack, em ordem de prioridade
├── registry/
│   ├── frontmatter.mjs          subconjunto de YAML usado nos frontmatters
│   └── registry.mjs             carrega e valida stacks, agents e skills
├── router/
│   ├── intents.mjs              vocabulário: intents, hints de stack, áreas
│   ├── intent-detector.mjs      prompt → intent, stack, área
│   └── router.mjs               intent + stack → agent + skills
├── context/
│   └── context-engine.mjs       arquivos alterados e diff (working tree, range ou projeto)
├── diagnostics/
│   └── doctor.mjs               ferramentas e configuração do projeto
├── install/
│   └── claude-plugin.mjs        registra o plugin no Claude Code (reis-mobile init)
└── security/
    └── redact.mjs               mascaramento de secrets
```

## Detecção de stack

As regras rodam em ordem de prioridade. Stacks cross-platform vêm primeiro porque contêm pastas nativas:

| Ordem | Stack | Evidência exigida |
|---|---|---|
| 1 | `flutter` | `pubspec.yaml` com `sdk: flutter` (um pacote Dart puro não conta) |
| 2 | `react-native` | `package.json` dependendo de `react-native` (variante `expo` se depender de `expo`) |
| 3 | `kotlin-multiplatform` | `build.gradle.kts` na raiz ou um nível abaixo aplicando o plugin multiplatform |
| 4 | `android` | Gradle na raiz **e** (`AndroidManifest.xml` ou plugin `com.android.*`) |
| 5 | `ios` | `*.xcodeproj`/`*.xcworkspace`, `Podfile` ou `Package.swift` com `.iOS(...)` |

Todas as stacks que casam aparecem em `candidates`. A primeira é a principal.

## Roteamento

1. **Intent.** A intent explícita do comando vence. Sem ela, os termos do prompt são normalizados (minúsculas, sem acento) e contados. Termos mais longos reservam seu trecho primeiro, então "testflight" não conta como "test". Falha de build, deploy, dependência ou migração vira `debug`.
2. **Stack.** A stack detectada no disco vence. As plataformas citadas no prompt, ou implicadas pela área (`gradle` → android, `xcode` → ios), viram `platformFocus` quando o projeto as tem.
3. **Agent.** Precisa declarar a intent. Um agent específico da stack vence um agent `"*"`.
4. **Skills.** Precisam declarar a intent. A ordem é: stack principal, depois plataformas em foco, depois `"*"`.

Componentes com `routing: manual` nunca são selecionados pelo router. O Claude Code os invoca apenas pela descrição.

## Contrato dos componentes

Agent (`agents/<name>.md`):

```yaml
---
name: mobile-code-reviewer        # igual ao nome do arquivo
description: Use this agent to... # usado pelo Claude Code para decidir quando delegar
model: inherit
tools: ["Read", "Grep", "Glob", "Bash"]
intents: [review]                 # reis-mobile: intents atendidas
stacks: ["*"]                     # reis-mobile: stacks atendidas ("*" = todas)
---
```

Skill (`skills/<name>/SKILL.md`):

```yaml
---
name: flutter-widget-review       # igual ao nome da pasta
description: Reviews Flutter widget code for...
intents: [review, performance]
stacks: [flutter]
# routing: manual                 # opcional: fora do roteamento automático
---
```

`reis-mobile validate` (e o CI) rejeita nome divergente do arquivo, descrição ausente, intent ou stack desconhecidas e duplicatas.

## Distribuição

A CLI e o plugin são o mesmo código. O plugin do Claude Code é instalado a partir do repositório (marketplace GitHub). A CLI chega por:

| Canal | Origem | Plugin |
|---|---|---|
| `install.sh` / `install.ps1` | Asset `reis-mobile-vX.Y.Z.tar.gz` da release, conferido contra `SHA256SUMS` | Chama `reis-mobile init` se o `claude` existir |
| Homebrew (`wrsilva/homebrew-tap`) | Mesmo asset, fórmula gerada por `scripts/homebrew-formula.mjs` | `reis-mobile init` (caveat) |
| npm | `npm publish` no workflow de release, se houver `NPM_TOKEN` | `reis-mobile init` |

O tarball é gerado por `git archive`. O `.gitattributes` exclui `tests/`, `scripts/`, `.github/` e os instaladores.

Não há binário nativo: o reis-mobile depende de Node.js, então Homebrew declara `depends_on "node"` e os instaladores verificam a versão antes de instalar.

## Fora do escopo desta versão

Estes itens seguem o plano, mas ainda não foram implementados: `.codex-plugin/` (o formato do manifest ainda não foi verificado), `.reis-mobile/config.yaml`, providers, MCP server, hooks, multi-agent e logs de execução.
