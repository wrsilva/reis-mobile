# AGENTS.md

Instruções para agentes de IA (Claude Code, Codex, Gemini) que trabalham **neste repositório**.

## Projeto

reis-mobile é um plugin do Claude Code com uma CLI em Node.js que orquestra agents e skills para desenvolvimento mobile. Leia [ARCHITECTURE.md](ARCHITECTURE.md) antes de mudar o núcleo.

## Regras

- **Mobile first.** Todo agent, skill ou comando novo precisa ajudar diretamente no desenvolvimento mobile.
- **Zero dependências.** `core/` e `bin/` usam apenas a biblioteca padrão do Node.js 22+. Não adicione pacotes npm.
- **ES modules** (`.mjs`), 2 espaços, aspas simples, ponto e vírgula.
- **Não invente.** Checklists de skills citam APIs, lints, flags e requisitos de loja que existem de fato. Na dúvida, instrua o modelo a verificar a versão no lock file do projeto em vez de afirmar.
- **Skills pequenas.** Uma skill resolve um problema (`flutter-widget-review`), não um domínio inteiro (`mobile-development`).
- **Nomes com prefixo de stack**: `flutter-*`, `android-*`, `ios-*`, `rn-*`, `kmp-*`. Skills agnósticas usam `mobile-*`.
- **Skills de terceiros** mantêm o nome original, declaram `source` e `license` no frontmatter e aparecem em `THIRD_PARTY_NOTICES.md` com o texto da licença. Só importe de fontes com licença que permita redistribuição, e nunca copie agents ou skills com dados de clientes, caminhos locais ou código proprietário.
- Todo agent e skill declara `intents` e `stacks` no frontmatter, ou `routing: manual`.
- Mudança no detector, no router ou na redação exige teste em `tests/`.

## Verificação

```bash
npm run check    # validate + test
```

## Adicionando componentes

| Quero... | Crie | E também |
|---|---|---|
| Uma skill | `skills/<nome>/SKILL.md` | Um caso em `tests/router.test.mjs` se ela mudar a seleção de alguma rota |
| Um agent | `agents/<nome>.md` | Um teste de roteamento para a intent |
| Um comando | `commands/<nome>.md` (vira `/reis-mobile:<nome>`) | Documentação no README |
| Uma intent | Termos em `core/router/intents.mjs` | Casos em `tests/intent-detector.test.mjs` |
| Uma stack | Regra em `stack-detector.mjs` + `stacks/<id>/stack.json` | Casos em `tests/stack-detector.test.mjs` |
