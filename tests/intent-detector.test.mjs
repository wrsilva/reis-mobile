import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { detectIntent } from '../core/router/intent-detector.mjs';
import { INTENT_IDS } from '../core/router/intents.mjs';

describe('detectIntent', () => {
  it('routes the plan example: a failing Android build after a Kotlin update', () => {
    const result = detectIntent('Meu build Android parou após atualizar Kotlin');

    assert.equal(result.intent, 'debug');
    assert.equal(result.stack, 'android');
    assert.equal(result.area, 'gradle');
  });

  it('recognizes Gradle task failures', () => {
    const result = detectIntent("Flutter build failing with: Execution failed for task ':app:compileDebugKotlin'");

    assert.equal(result.intent, 'debug');
    assert.equal(result.stack, 'flutter');
    assert.equal(result.area, 'gradle');
  });

  it('ignores accents and casing', () => {
    assert.equal(detectIntent('REVISÃO do código').intent, 'review');
    assert.equal(detectIntent('auditoria de SEGURANÇA').intent, 'security');
  });

  for (const [prompt, intent] of [
    ['revise meu pull request', 'review'],
    ['revise o design de interface do app', 'design'],
    ['melhorar a usabilidade da tela', 'design'],
    ['redesenhar a hierarquia visual', 'design'],
    ['review the UI/UX of this screen', 'design'],
    ['create a mobile design system', 'design'],
    ['review this wireframe', 'design'],
    ['apply Apple HIG to this screen', 'design'],
    ['review design patterns', 'architecture'],
    ['write UI tests', 'test'],
    ['audit accessibility', 'accessibility'],
    ['generate a UUID', null],
    ['configure build settings', 'build'],
    ['a lista está com jank no scroll', 'performance'],
    ['escreva testes de widget para o login', 'test'],
    ['como modularizar o app em features', 'architecture'],
    ['preparar a publicação na App Store', 'release'],
    ['o app funciona com TalkBack?', 'accessibility'],
    ['migrar de BLoC para Riverpod', 'migration'],
    ['configurar pipeline com fastlane', 'deployment'],
    ['o tamanho do apk dobrou', 'performance'],
    ['o app precisa funcionar offline e sincronizar depois', 'offline'],
    ['resolver conflito de sincronizacao entre dispositivos', 'offline'],
    ['configurar crashlytics e alertas de crash-free', 'observability'],
    ['add distributed tracing to the mobile app', 'observability'],
    ['implementar exclusão de conta', 'privacy'],
    ['withdraw analytics consent', 'privacy'],
    ['add account deletion', 'privacy'],
    ['definir retenção de dados', 'privacy'],
    ['git push origin main', null],
    ['implementar paginação na listagem', 'networking'],
    ['add resumable uploads', 'networking'],
    ['integrar API no aplicativo', 'networking'],
    ['configure an HTTP client', 'networking'],
    ['implementar autenticação com passkeys', 'auth'],
    ['add sign-in and account linking', 'auth'],
    ['implementar gestão de sessão', 'auth'],
    ['implement token refresh', 'auth'],
    ['auditoria de segurança', 'security'],
    ['implementar notificações push', 'notifications'],
    ['add local notifications', 'notifications'],
    ['handle notification permissions', 'notifications'],
    ['configurar FCM no aplicativo', 'notifications'],
    ['git push --force', null],
    ['review privacy', 'review'],
    ['review networking', 'review'],
    ['review login', 'review'],
    ['review push notifications', 'review'],
    ['configurar pipeline de notificações', 'deployment'],
    ['migrate authentication', 'migration'],
    ['build push notifications', 'build'],
    ['test login', 'test'],
    ['implementar compras no app', 'billing'],
    ['add in-app purchases', 'billing'],
    ['restaurar compras', 'billing'],
    ['integrate StoreKit 2', 'billing'],
    ['configurar Play Billing', 'billing'],
    ['implementar paywall premium', 'billing'],
    ['review paywall', 'review'],
    ['upgrade play billing library', 'migration'],
    ['configurar assinatura do app para release', 'release'],
    ['fix the stream subscription leak', 'performance'],
    ['add the push notification entitlement', 'notifications'],
    ['criar plano de tracking', 'analytics'],
    ['implement product analytics', 'analytics'],
    ['definir taxonomia de eventos', 'analytics'],
    ['add funnel tracking', 'analytics'],
    ['definir funil de conversão do produto', 'analytics'],
    ['integrate Mixpanel', 'analytics'],
    ['review product analytics', 'review'],
    ['add analytics', 'observability'],
    ['conectar a um dispositivo bluetooth', 'hardware'],
    ['integrar leitor de QR code', 'hardware'],
    ['implementar captura com a câmera', 'hardware'],
    ['read NFC tags', 'hardware'],
    ['use the accelerometer', 'hardware'],
    ['track location with GPS', 'hardware'],
    ['testar bluetooth', 'test'],
    ['camera crash', 'debug'],
    ['traduzir a localização do app', null],
    ['configurar assinatura do app', null],
    ['cancel the stream subscription', null],
    ['configure the iCloud entitlement', null],
    ['migrar para null safety falhou', 'debug'],
    ['migrate to null safety failed', 'debug'],
    ['configurar firebase analytics', 'observability'],
    ['firebase analytics setup', 'observability'],
    ['implementar biometria', null],
    ['add biometric unlock', null],
    ['notification permission for the camera', 'notifications'],
    ['add a paywall to the account deletion screen', 'privacy'],
    ['track push notification funnel', 'notifications'],
    ['connect a BLE device', 'hardware'],
    ['fix the blend mode', null],
    ['add a paywall to the notification settings', 'notifications'],
  ]) {
    it(`"${prompt}" → ${intent}`, () => {
      assert.equal(detectIntent(prompt).intent, intent);
    });
  }

  it('does not count "testflight" as a test request', () => {
    const result = detectIntent('enviar build para o TestFlight');

    assert.equal(result.scores.test, undefined);
    assert.equal(result.stack, 'ios');
  });

  it('does not count "kotlin multiplatform" as plain Android', () => {
    assert.deepEqual(detectIntent('revisar projeto kotlin multiplatform').stackHints, ['kotlin-multiplatform']);
  });

  it('matches stems only at word boundaries', () => {
    assert.equal(detectIntent('improve the approach').intent, null);
  });

  it('keeps the capability intents after every existing intent', () => {
    assert.deepEqual(INTENT_IDS.slice(-3), ['billing', 'analytics', 'hardware']);
    assert.equal(INTENT_IDS.indexOf('notifications'), INTENT_IDS.length - 4);
  });

  it('counts PR toward review only as a whole word', () => {
    assert.equal(detectIntent('implementar paywall premium').scores.review, undefined);
    assert.equal(detectIntent('definir funil de conversão do produto').scores.review, undefined);
    assert.equal(detectIntent('comentar no PR').intent, 'review');
    assert.equal(detectIntent('listar PRs abertos').intent, 'review');
  });

  it('returns no intent and zero confidence for unrelated text', () => {
    const result = detectIntent('bom dia');

    assert.equal(result.intent, null);
    assert.equal(result.confidence, 0);
    assert.equal(result.stack, null);
  });
});
