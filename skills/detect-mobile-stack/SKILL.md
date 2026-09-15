---
name: detect-mobile-stack
description: Detects the mobile stack of the current project (Flutter, Android, iOS, React Native, Kotlin Multiplatform), its languages and target platforms, using the reis-mobile detector. Use when you need to know which mobile stack a project uses before reviewing, debugging or changing it, or when the user asks "que stack é esse projeto?".
routing: manual
stacks: ["*"]
---

# Detect Mobile Stack

Use o detector determinístico do reis-mobile em vez de adivinhar pela estrutura de pastas.

## Como executar

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/reis-mobile.mjs" detect --json --dir "<diretório do projeto>"
```

Campos do resultado:

| Campo | Significado |
|---|---|
| `stack` | `flutter`, `react-native`, `kotlin-multiplatform`, `android`, `ios` ou `unknown` |
| `variant` | `plugin` (Flutter), `expo` (React Native) ou `null` |
| `languages` | Linguagens encontradas, a principal primeiro (inclui código nativo de apps cross-platform) |
| `platforms` | Plataformas-alvo (`android`, `ios`, `web`, `macos`, `desktop`...) |
| `evidence` | Arquivos que justificam a detecção |
| `candidates` | Todas as stacks que casaram, em ordem de prioridade |

## Interpretação

- Stacks cross-platform têm prioridade: um app Flutter contém `android/` e `ios/`, mas a stack é `flutter`.
- `unknown` significa que não há projeto mobile na raiz informada. Em monorepos, rode de novo com `--dir` apontando para o app.
- Mais de um item em `candidates` indica projeto híbrido (por exemplo, KMP com módulo Android). Considere as duas stacks ao carregar skills.
