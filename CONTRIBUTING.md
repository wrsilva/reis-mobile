# Contribuindo

Obrigado pelo interesse no reis-mobile.

## Ambiente

- Node.js 22 ou superior
- Git

```bash
git clone https://github.com/wrsilva/reis-mobile.git
cd reis-mobile
npm run check
```

Não há `npm install`: o projeto não tem dependências.

Para testar o plugin no Claude Code a partir do clone:

```text
/plugin marketplace add /caminho/para/reis-mobile
/plugin install reis-mobile@reis-mobile
```

Depois de editar agents, skills ou commands, reinicie a sessão do Claude Code para recarregar o plugin.

## Por onde começar

- Issues marcadas com [`good first issue`](https://github.com/wrsilva/reis-mobile/labels/good%20first%20issue) são pequenas e bem delimitadas.
- [`help wanted`](https://github.com/wrsilva/reis-mobile/labels/help%20wanted) indica onde o projeto mais precisa de ajuda, como skills de Android, iOS e React Native.
- Dúvidas e ideias ainda sem forma vão para as [Discussions](https://github.com/wrsilva/reis-mobile/discussions).
- Leia o [Código de Conduta](CODE_OF_CONDUCT.md). Ele vale para issues, PRs e discussões.

## Fluxo

1. Abra uma issue pelo template adequado (bug, funcionalidade ou nova skill/agent), descrevendo o problema mobile que a mudança resolve. Para mudanças pequenas e óbvias, como typos, pode ir direto ao PR.
2. Crie um branch a partir de `main`.
3. Siga as regras de [AGENTS.md](AGENTS.md).
4. Rode `npm run check`.
5. Faça um fork, crie o branch e abra o PR contra `main`. O template pede a verificação e um checklist, de preferência com a saída de `reis-mobile route` ou `reis-mobile review` num projeto real.
6. O CI precisa passar e o mantenedor precisa aprovar. Os PRs entram por squash merge, e o título vira a mensagem do commit, então use Conventional Commits no título.

## Licença das contribuições

Ao contribuir, você concorda que sua contribuição seja distribuída sob a [licença MIT](LICENSE) do projeto. Conteúdo de terceiros só entra com licença compatível, declarando `source` e `license` e com o aviso em `THIRD_PARTY_NOTICES.md`.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`.

## Qualidade de skills

Uma boa skill de reis-mobile:

- tem descrição que diz **o que faz e quando usar**, pois é o que o Claude Code usa para ativá-la;
- é um checklist verificável, ordenado por impacto (crash e perda de dados primeiro);
- não afirma versões, lints ou requisitos de loja de memória. Quando o valor muda com o tempo, manda verificar;
- indica em que seção do relatório cada achado entra.

## Publicando uma versão

1. Atualize a versão em `package.json`, `.claude-plugin/plugin.json` e `.claude-plugin/marketplace.json`, e registre as mudanças no `CHANGELOG.md`.
2. `node scripts/versions.mjs vX.Y.Z` confirma que tudo bate.
3. Commit, `git tag vX.Y.Z` e `git push origin main vX.Y.Z`.
4. O workflow **Release** roda os testes e publica na release o tarball, o `SHA256SUMS` e o `reis-mobile.rb`. Se o secret `NPM_TOKEN` existir, também publica no npm.
5. Copie o `reis-mobile.rb` da release para `Formula/reis-mobile.rb` no repositório `wrsilva/homebrew-tap`.
