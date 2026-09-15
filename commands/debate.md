---
description: Debate estruturado entre os especialistas mobile — cada agent defende sua perspectiva, refuta as dos outros, e o lead-mobile decide
argument-hint: "[--rounds N] [--agents a,b,c] [--external] <questão>"
allowed-tools: ["Bash(node:*)", "Bash(command:*)", "Bash(mkdir:*)", "Bash(codex:*)", "Bash(gemini:*)", "Agent", "Read", "Write", "Grep", "Glob"]
---

# reis-mobile debate

Argumentos recebidos: `$ARGUMENTS`

Use este comando para decisões de arquitetura com trade-offs reais, não para perguntas de rotina: cada debate custa vários agents em duas rodadas. Se a questão tem uma resposta única e verificável no código, responda direto e diga ao usuário por que não valia um debate.

## 1. Separar os argumentos

| Flag | Padrão | Efeito |
|---|---|---|
| `--rounds N` | 2 | Número de rodadas, de 1 a 3. Acima de 3, avise e use 3. |
| `--agents a,b,c` | automático | Participantes explícitos, pelos nomes da tabela da etapa 3. |
| `--external` | desligado | Soma Codex e Gemini ao debate, quando instalados. |

O que sobrar é a questão, em texto livre. Sem questão, explique o uso e pare.

## 2. Coletar o contexto

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/reis-mobile.mjs" detect --dir "$PWD" --json
```

Se a questão citar arquivos ou diretórios, resolva os caminhos e leia-os agora: os participantes recebem o conteúdo no briefing, não o caminho. Se falhar, mostre o erro e pare.

## 3. Escalar os participantes

Escolha **três** agents cujas prioridades conflitem de verdade na questão. Debate entre papéis que concordam não produz decisão.

| Agent | Defende |
|---|---|
| `reis-mobile:flutter-architect` | Limites de camada, modularização, custo de manutenção a longo prazo |
| `reis-mobile:flutter-performance-engineer` | Frames, rebuilds, memória, tempo de startup — hostil a indireção |
| `reis-mobile:flutter-test-engineer` | Testabilidade, costuras de injeção, custo de cobertura |
| `reis-mobile:plugin-native-expert` | Fronteira Flutter–nativo, platform channels, ciclo de vida |
| `reis-mobile:mobile-staff-engineer` | Build, release, migração, trade-offs entre plataformas |
| `reis-mobile:mobile-code-reviewer` | Risco concreto no código que já existe |

Regras de escalação:

- A stack detectada manda. Os agents `flutter-*` só entram em projeto Flutter; em Android ou iOS nativo, use `mobile-staff-engineer` e `mobile-code-reviewer`.
- Sem código nativo no projeto, não convoque `plugin-native-expert`.
- `--agents` sobrescreve a escolha automática. Nome desconhecido: avise e pare.
- `reis-mobile:lead-mobile` nunca debate — ele modera na etapa 7.

Anuncie ao usuário, em uma linha, a stack, os participantes e o número de rodadas antes de começar.

## 4. Preparar a pasta

```bash
mkdir -p ".reis-mobile/debates/<NNN-slug-da-questao>/rounds"
```

`NNN` é sequencial dentro de `.reis-mobile/debates/`. Escreva `context.md` na pasta com a questão, a stack, os participantes, as flags e o contexto lido na etapa 2.

## 5. Rodada 1 — posições às cegas

Dispare os participantes **em paralelo**, cada um com `Agent(run_in_background: true)`, num único bloco de ferramentas. Nenhum vê a posição do outro nesta rodada: é o que impede o primeiro a responder de ancorar os demais.

Briefing de cada um, autocontido:

```text
Você participa de um debate técnico como <papel do agent>.

QUESTÃO: <questão>
STACK: <stack detectada>
CONTEXTO: <conteúdo dos arquivos relevantes>

Defenda a posição que a sua especialidade sustenta, no máximo 400 palavras.
Cubra: sua recomendação, a evidência no código que a sustenta, o que você
sacrifica ao escolhê-la, e a condição que o faria mudar de ideia.
Fundamente cada afirmação em arquivo:linha. Não escreva o que não verificou.

Grave sua posição em: .reis-mobile/debates/<id>/rounds/r1_<agent>.md
```

### 5.1 Provedores externos (só com `--external`)

Verifique antes de chamar, e siga sem eles se faltarem — a ausência é informativa, não um erro:

```bash
command -v codex >/dev/null 2>&1 && echo codex
command -v gemini >/dev/null 2>&1 && echo gemini
```

Presentes, chame em paralelo com os agents, gravando em `r1_codex.md` e `r1_gemini.md`:

```bash
codex exec --full-auto "<briefing>"
printf '%s' "<briefing>" | gemini -p "" -o text --approval-mode yolo
```

Eles não têm as skills do plugin nem conhecem o projeto: dê o contexto inteiro no briefing e trate o retorno como opinião externa, a ser conferida no código antes de entrar na síntese. Diga na abertura quem entrou e quem faltou.

## 6. Rodada 2 — réplica

Para cada rodada além da primeira, dispare os mesmos participantes de novo, em paralelo, agora com as posições dos outros:

```text
Estas são as posições dos outros participantes na rodada anterior:

<conteúdo de cada r<N-1>_*.md>

Ataque os pontos específicos com que você discorda, citando quem disse e
verificando a afirmação no código. Onde eles estiverem certos e você errado,
diga. Máximo de 300 palavras.

Grave em: .reis-mobile/debates/<id>/rounds/r<N>_<agent>.md
```

Refutar a tese genérica não vale: cada réplica cita uma afirmação concreta de outro participante. Se um participante só repetir a rodada anterior sem engajar, registre isso e desconte o peso dele na síntese.

## 7. Síntese

Invoque `reis-mobile:lead-mobile` com todas as rodadas, seguindo a seção **Debate moderation** de `${CLAUDE_PLUGIN_ROOT}/agents/lead-mobile.md`. Ele resolve as divergências e produz o plano de ação.

Antes de aceitar a síntese, confirme você mesmo no código qualquer afirmação decisiva: os participantes não se verificam entre si. Grave o resultado em `.reis-mobile/debates/<id>/synthesis.md`.

## 8. Apresentar

Mostre a síntese no chat, nesta ordem: a decisão primeiro, depois as divergências que a produziram, depois o plano de ação. Feche com o caminho da pasta do debate.

Não aplique nenhuma mudança de código. O debate termina numa recomendação; implementar é um pedido novo.
