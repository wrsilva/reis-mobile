## O que muda

<!-- Resumo em poucas linhas e o problema mobile que isso resolve. Referencie a issue: Closes #123 -->

## Tipo

- [ ] Bug fix
- [ ] Nova skill ou agent
- [ ] Melhoria no core (detecção, router, context, doctor)
- [ ] Instalação, release ou CI
- [ ] Documentação

## Como foi verificado

<!-- Cole a saída relevante: `npm run check`, `reis-mobile route "..."`, `reis-mobile review` num projeto real. -->

```text

```

## Checklist

- [ ] `npm run check` passa (validação do registry e testes)
- [ ] Mudanças no detector, no router ou na redação têm teste em `tests/`
- [ ] Agents e skills novos declaram `intents` e `stacks` (ou `routing: manual`)
- [ ] Conteúdo de terceiros declara `source` e `license` e está em `THIRD_PARTY_NOTICES.md`
- [ ] Nenhum dado de cliente, caminho local, secret ou código proprietário
- [ ] README e CHANGELOG (`[Unreleased]`) atualizados quando o comportamento muda
