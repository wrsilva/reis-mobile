---
description: Ponto de entrada do reis-mobile — lista os comandos ou encaminha para doctor, review ou para o agent certo a partir de um pedido livre
argument-hint: "[doctor | review | pedido livre]"
allowed-tools: ["Bash(node:*)", "Bash(git:*)", "Read", "Grep", "Glob"]
---

# reis-mobile

Argumentos recebidos: `$ARGUMENTS`

Escolha o caso pela primeira palavra dos argumentos.

## Sem argumentos

Responda apenas com esta lista, sem executar nada:

```text
/reis-mobile:doctor                  Ambiente e projeto: SDKs, Xcode, CocoaPods, Gradle wrapper, lock files
/reis-mobile:review [--base <ref>]   Code review das mudanças (ou do projeto inteiro)
/reis-mobile <pedido livre>          Encaminha o pedido para o agent e as skills da stack detectada
```

## `doctor [opções]`

1. Execute via Bash: `node "${CLAUDE_PLUGIN_ROOT}/bin/reis-mobile.mjs" doctor --dir "$PWD" <opções>`.
2. Leia `${CLAUDE_PLUGIN_ROOT}/commands/doctor.md` e siga a seção **Instruções** sobre essa saída.

## `review [opções] [foco]`

Leia `${CLAUDE_PLUGIN_ROOT}/commands/review.md` e siga-o inteiro, tratando o restante dos argumentos (sem a palavra `review`) como `$ARGUMENTS`.

## Qualquer outro texto

É um pedido livre, em português ou inglês.

1. Execute via Bash, com as aspas corretas: `node "${CLAUDE_PLUGIN_ROOT}/bin/reis-mobile.mjs" route --dir "$PWD" -- "<pedido>"`. Se falhar, mostre o erro e pare.
2. Leia `${CLAUDE_PLUGIN_ROOT}/agents/<Agent>.md` e, na ordem, `${CLAUDE_PLUGIN_ROOT}/skills/<skill>/SKILL.md` para cada skill listada.
3. Atenda o pedido seguindo o processo do agent e os checklists das skills. Confirme no código tudo o que afirmar.
4. Na primeira linha da resposta, informe a stack, o agent e as skills usadas. Se o router emitiu avisos (linhas com `!`), mencione-os.
