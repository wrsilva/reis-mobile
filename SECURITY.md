# Segurança

## Reportando vulnerabilidades

Não abra issue pública. Use o [private vulnerability reporting do GitHub](https://github.com/wrsilva/reis-mobile/security/advisories/new) com a descrição, os passos para reproduzir e o impacto.

## O que nunca versionar

Este repositório e os projetos analisados pelo reis-mobile não devem conter:

- API keys, tokens e senhas
- `.env` com valores reais
- keystores (`*.jks`, `*.keystore`) e `key.properties`
- certificados e chaves (`*.p12`, `*.p8`, `*.pem`)
- provisioning profiles (`*.mobileprovision`)

O `.gitignore` já bloqueia esses padrões.

## Como o reis-mobile trata dados

- **Somente leitura.** `detect`, `doctor`, `route` e `review` não alteram o projeto analisado.
- **Secrets mascarados.** O diff enviado ao modelo passa por `core/security/redact.mjs`, que mascara headers `Authorization`, JWTs, chaves AWS, Google e GitHub, blocos de chave privada e atribuições como `apiKey = "..."`, `API_KEY=...` e `storePassword=...`.
- **Lock files e código gerado** ficam fora do corpo do diff.
- **Instaladores verificam integridade.** `install.sh` e `install.ps1` baixam o asset da release e abortam se o SHA-256 não bater com `SHA256SUMS`. Para auditar antes de executar, baixe o script e leia: `curl -fsSL .../install.sh -o install.sh`.
- A redação é uma camada de proteção, não uma garantia. Não confie nela para expor repositórios com secrets versionados.
