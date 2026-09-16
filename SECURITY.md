# Security

## Reporting vulnerabilities

Do not open a public issue. Use [GitHub private vulnerability reporting](https://github.com/wrsilva/reis-mobile/security/advisories/new) with the description, steps to reproduce and impact.

## What to never commit

This repository and the projects analyzed by reis-mobile must not contain:

- API keys, tokens and passwords
- `.env` with real values
- keystores (`*.jks`, `*.keystore`) and `key.properties`
- certificates and keys (`*.p12`, `*.p8`, `*.pem`)
- provisioning profiles (`*.mobileprovision`)

`.gitignore` already blocks these patterns.

## How reis-mobile handles data

- **Read-only.** `detect`, `doctor`, `route` and `review` do not modify the analyzed project.
- **Secrets masked.** The diff sent to the model goes through `core/security/redact.mjs`, which masks `Authorization` headers, JWTs, AWS, Google and GitHub keys, private key blocks and assignments such as `apiKey = "..."`, `API_KEY=...` and `storePassword=...`.
- **Lock files and generated code** stay out of the diff body.
- **Installers verify integrity.** `install.sh` and `install.ps1` download the release asset and abort if the SHA-256 does not match `SHA256SUMS`. To audit before running, download the script and read it: `curl -fsSL .../install.sh -o install.sh`.
- Redaction is a protection layer, not a guarantee. Do not rely on it to expose repositories with committed secrets.
