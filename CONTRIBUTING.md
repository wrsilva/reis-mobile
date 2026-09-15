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

## Fluxo

1. Abra uma issue descrevendo o problema mobile que a mudança resolve.
2. Crie um branch a partir de `main`.
3. Siga as regras de [AGENTS.md](AGENTS.md).
4. Rode `npm run check`.
5. Abra o PR explicando o que mudou e como foi verificado, de preferência com a saída de `reis-mobile route` ou `reis-mobile review` num projeto real.

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
