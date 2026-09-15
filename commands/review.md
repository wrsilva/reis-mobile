---
description: Code review mobile — detecta a stack, seleciona o agent e as skills certas e revisa as mudanças (ou o projeto inteiro)
argument-hint: "[--base <ref>] [foco da revisão]"
allowed-tools: ["Bash(node:*)", "Bash(git:*)", "Read", "Grep", "Glob"]
---

# reis-mobile review

Argumentos recebidos: `$ARGUMENTS`

## 1. Rotear e coletar contexto

Separe dos argumentos a opção `--base <ref>` (se houver). O restante é o foco da revisão, em texto livre. Execute via Bash, com as aspas corretas:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/reis-mobile.mjs" review --dir "$PWD" [--base <ref>] -- "<foco da revisão>"
```

A saída informa:

- `Intent`, `Stack` e `focus` (plataformas nativas citadas no foco);
- `Agent`: o agent responsável;
- `Skills`: as skills a aplicar, em ordem de prioridade;
- `Context`: `working-tree`, `range` ou `project`, com a lista de arquivos alterados e o diff (secrets já mascarados).

Se o comando falhar, mostre o erro ao usuário e pare.

## 2. Carregar instruções

Leia com a ferramenta Read, nesta ordem:

1. `${CLAUDE_PLUGIN_ROOT}/agents/<Agent>.md`: papel, processo, regras e formato do relatório;
2. `${CLAUDE_PLUGIN_ROOT}/skills/<skill>/SKILL.md` para cada skill listada.

## 3. Revisar

Siga o processo do agent aplicando os checklists das skills:

- **working-tree / range:** revise os arquivos alterados. Leia o arquivo completo quando o diff não der contexto suficiente. Arquivos `untracked` não aparecem no diff: leia-os diretamente. Se o diff veio truncado, leia os arquivos restantes.
- **project:** não há mudanças; faça a auditoria do projeto começando pelos pontos de entrada e pela camada de dados.

Confirme cada achado no código antes de reportá-lo. Não altere arquivos: esta é uma revisão.

## 4. Relatório

Responda no formato definido pelo agent (Summary, Critical, Bugs, Architecture, Security, Performance, Maintainability, Suggested changes). Na primeira linha do Summary, informe a stack, o agent e as skills usadas, para deixar o roteamento visível.

Se o router emitiu avisos (linhas com `!`), mencione-os no Summary.
