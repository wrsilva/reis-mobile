---
description: Diagnostica o ambiente mobile (Flutter, Android SDK, Java, Xcode, CocoaPods, Node...) e a configuração do projeto detectado
argument-hint: "[--all] [--dir <path>]"
allowed-tools: ["Bash(node:*)", "Read"]
---

# reis-mobile doctor

Resultado do diagnóstico:

!`node "${CLAUDE_PLUGIN_ROOT}/bin/reis-mobile.mjs" doctor $ARGUMENTS`

## Instruções

1. Mostre o relatório acima ao usuário exatamente como veio, dentro de um bloco de código.
2. Para cada linha marcada com `✗`, explique em uma frase a causa provável e o comando para corrigir, considerando o sistema operacional e a stack detectada. Exemplos:
   - `pubspec.lock missing` → `flutter pub get`
   - `Podfile.lock missing` → `cd ios && pod install`
   - `Android SDK not found` → instalar pelo Android Studio e exportar `ANDROID_HOME`
   - `Java` falhando num projeto Flutter → `flutter doctor -v` mostra qual JDK o Flutter usa; o `java` do PATH pode ser diferente
3. Não execute comandos de instalação ou correção sem o usuário pedir.
4. Se não houver `✗`, diga apenas que o ambiente está pronto para a stack detectada.
