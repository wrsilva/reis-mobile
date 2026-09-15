---
name: mobile-security-audit
description: Security audit for mobile apps based on the OWASP MASVS categories — insecure token storage, hardcoded secrets, cleartext traffic, TLS validation bypass, exported components, WebView exposure, sensitive logging and release hardening — with concrete checks for Flutter, Android, iOS and React Native. Use when reviewing mobile code, auditing app security, handling authentication or tokens, or preparing a release.
intents: [review, security, release]
stacks: ["*"]
---

# Mobile Security Audit

Organizado pelas categorias do OWASP MASVS. Aplique a seção geral e depois a da stack detectada (em apps cross-platform, aplique também Android e iOS às pastas nativas).

Todo achado precisa de evidência no código ou na configuração. Severidade:

- **Critical:** credencial ou dado sensível exposto, validação TLS desativada, componente exportado que executa ação privilegiada.
- **High:** token em armazenamento não seguro, tráfego em texto claro para a API, WebView com bridge JavaScript exposto a conteúdo remoto.
- **Medium/Low:** hardening ausente, logs verbosos, backup habilitado sem necessidade.

## Geral (todas as stacks)

**MASVS-STORAGE**
- [ ] Access token, refresh token e dados pessoais guardados em armazenamento não seguro (preferências, arquivos, banco sem criptografia).
- [ ] Dados sensíveis em logs, analytics ou crash reports.

**MASVS-CRYPTO**
- [ ] Chaves de API privadas, client secrets, chaves de assinatura ou senhas no código-fonte, em assets ou em arquivos de configuração empacotados. Tudo que vai no app é extraível; secret de verdade fica no backend.
- [ ] Criptografia caseira, IV/chave fixos, MD5/SHA-1 para senhas.

**MASVS-AUTH**
- [ ] Autorização decidida só no cliente (flag `isAdmin` local, esconder botão como controle de acesso).
- [ ] Sessão sem expiração ou refresh token nunca invalidado no logout.
- [ ] Biometria usada só como booleano local, sem vínculo com chave criptográfica.

**MASVS-NETWORK**
- [ ] URLs `http://` para APIs.
- [ ] Validação de certificado desativada.
- [ ] Pinning, se existir, sem estratégia de rotação (pin único sem backup).

**MASVS-PLATFORM**
- [ ] Deep links e universal links que executam ação sem validar parâmetros ou sem autenticação.
- [ ] WebView carregando conteúdo remoto com JavaScript e bridge nativo habilitados.
- [ ] Dados sensíveis na área de transferência ou visíveis no snapshot do app switcher.

**MASVS-CODE / RESILIENCE**
- [ ] Build de release sem ofuscação/minificação quando o app tem lógica sensível.
- [ ] Código ou endpoints de debug acessíveis em release.

**MASVS-PRIVACY**
- [ ] Permissões pedidas sem uso real no código.
- [ ] SDKs de terceiros coletando dados não declarados (Privacy Manifest no iOS, Data safety na Play Store).

## Flutter

- [ ] Tokens em `shared_preferences`, `hive` ou `sqflite` sem criptografia: use `flutter_secure_storage` (Keychain/Keystore).
- [ ] `HttpClient.badCertificateCallback` retornando `true` ou `HttpOverrides.global` desativando validação: Critical se chegar ao build de release.
- [ ] `print`/`debugPrint`/`log` com token, header `Authorization` ou payload de login. Interceptors do `dio` com `LogInterceptor` ativo em release.
- [ ] Secrets passados por `--dart-define` e tratados como seguros: ficam no binário.
- [ ] Build de release sem `--obfuscate --split-debug-info` quando o app precisa de ofuscação.
- [ ] `webview_flutter` com `JavaScriptMode.unrestricted` e `addJavaScriptChannel` carregando URL não controlada.

## Android (Kotlin/Java, ou `android/` de apps cross-platform)

- [ ] `AndroidManifest.xml`: `android:usesCleartextTraffic="true"` ou `network_security_config` com `cleartextTrafficPermitted="true"` para domínios de produção.
- [ ] `network_security_config` confiando em certificados de usuário (`<certificates src="user"/>`) em release.
- [ ] `android:allowBackup="true"` (ou ausente) em app com dados sensíveis, sem regras de exclusão.
- [ ] `activity`/`service`/`receiver`/`provider` com `android:exported="true"` sem permissão e sem validar o `Intent`.
- [ ] `android:debuggable="true"` fixo no manifest.
- [ ] Tokens em `SharedPreferences` sem criptografia.
- [ ] `WebView` com `setJavaScriptEnabled(true)` + `addJavascriptInterface` ou `setAllowFileAccess(true)`.
- [ ] `TrustManager`/`HostnameVerifier` customizado que aceita tudo.
- [ ] `Log.d`/`Log.v` com dados sensíveis sem remoção em release (regras R8 ou wrapper de log).
- [ ] Senhas de keystore em `build.gradle` versionado em vez de `key.properties`/variáveis de ambiente.

## iOS (Swift/Objective-C, ou `ios/` de apps cross-platform)

- [ ] `Info.plist`: `NSAppTransportSecurity` com `NSAllowsArbitraryLoads = true` sem exceção justificada por domínio.
- [ ] Tokens em `UserDefaults` ou arquivos em vez do Keychain.
- [ ] Itens do Keychain com acessibilidade permissiva (`kSecAttrAccessibleAlways*`, já descontinuada) em vez de `...WhenUnlocked`/`...AfterFirstUnlock`.
- [ ] `URLSessionDelegate` aceitando qualquer `serverTrust` sem avaliar.
- [ ] URL schemes customizados executando ação sem validação (prefira universal links).
- [ ] `NSLog`/`print` com dados sensíveis.
- [ ] Tela com dado sensível sem proteção de snapshot ao ir para background.

## React Native

- [ ] Tokens em `AsyncStorage`: use Keychain/Keystore (`react-native-keychain`, `expo-secure-store`).
- [ ] `.env` via `react-native-config`/`expo-constants` com secrets: vão para o bundle JS, legível no APK/IPA.
- [ ] `react-native-webview` com `originWhitelist={['*']}` e `onMessage` executando ações.
- [ ] `console.log` com dados sensíveis sem remoção em release (por exemplo, `babel-plugin-transform-remove-console`).
- [ ] Deep links tratados em `Linking` sem validar origem e parâmetros.

## Comandos úteis (somente leitura)

```bash
git ls-files | grep -Ei '\.(jks|keystore|p12|p8|mobileprovision|env)$|key\.properties|google-services\.json|GoogleService-Info\.plist'
grep -rn --include='*.xml' -E 'usesCleartextTraffic|allowBackup|exported="true"|debuggable' android app 2>/dev/null
grep -rn -E 'NSAllowsArbitraryLoads' --include='*.plist' . 2>/dev/null
```

## Saída

Reporte em **Security** (ou **Critical**, quando a severidade for Critical), com categoria MASVS, `arquivo:linha`, impacto e correção.
