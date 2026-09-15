import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { detectIntent } from '../core/router/intent-detector.mjs';

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
    ['a lista está com jank no scroll', 'performance'],
    ['escreva testes de widget para o login', 'test'],
    ['como modularizar o app em features', 'architecture'],
    ['preparar a publicação na App Store', 'release'],
    ['o app funciona com TalkBack?', 'accessibility'],
    ['migrar de BLoC para Riverpod', 'migration'],
    ['configurar pipeline com fastlane', 'deployment'],
    ['o tamanho do apk dobrou', 'performance'],
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

  it('returns no intent and zero confidence for unrelated text', () => {
    const result = detectIntent('bom dia');

    assert.equal(result.intent, null);
    assert.equal(result.confidence, 0);
    assert.equal(result.stack, null);
  });
});
