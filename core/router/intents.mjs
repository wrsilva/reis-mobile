// Keyword stems are matched against normalized text (lowercase, no diacritics) at word
// boundaries, so "compil" matches "compilar", "compile" and "compilação".
// Order matters: it is the tie-break priority when two intents score the same. Specific
// concerns (security, performance...) come before the generic "review".
export const INTENTS = {
  debug: [
    'debug', 'erro', 'error', 'crash', 'falh', 'fail', 'exception', 'excecao', 'bug',
    'quebr', 'parou', 'nao compila', 'nao funciona', 'not working', 'stack trace',
    'stacktrace', 'broken', 'fatal', 'anr',
  ],
  security: [
    'seguranca', 'security', 'vulnerab', 'owasp', 'secret', 'credencia', 'criptograf',
    'encrypt', 'ssl pinning', 'certificate pinning', 'jailbreak', 'root detection',
    'keychain', 'secure storage', 'autentica',
  ],
  performance: [
    'performance', 'desempenho', 'lento', 'lentidao', 'slow', 'jank', 'fps', 'memoria',
    'memory', 'leak', 'startup', 'rebuild', 'bateria', 'battery', 'app size', 'apk size',
    'ipa size', 'tamanho do app', 'tamanho do apk', 'tamanho do ipa', 'lag',
    'travando', 'engasg',
  ],
  test: [
    'test', 'teste', 'cobertura', 'coverage', 'golden', 'espresso', 'xctest', 'maestro',
    'appium', 'patrol', 'tdd', 'mock',
  ],
  architecture: [
    'arquitetura', 'architecture', 'modulariza', 'clean architecture', 'feature-first',
    'feature first', 'estrutura de pastas', 'state management', 'gerenciamento de estado',
    'injecao de dependencia', 'dependency injection', 'design pattern', 'camada',
  ],
  release: [
    'release', 'publica', 'publish', 'loja', 'app store', 'play store', 'testflight',
    'lancamento', 'submission', 'store review', 'rejeita', 'reject',
  ],
  accessibility: [
    'acessibilidade', 'accessibility', 'a11y', 'leitor de tela', 'screen reader',
    'talkback', 'voiceover', 'contraste', 'semantics',
  ],
  review: [
    'review', 'revis', 'code review', 'pull request', 'pr', 'analis', 'avali', 'audit',
    'code smell',
  ],
  migration: ['migra', 'migrate', 'upgrade', 'null safety'],
  dependency: [
    'dependencia', 'dependenc', 'pacote', 'package', 'pubspec', 'podfile', 'outdated',
    'desatualizad', 'npm audit',
  ],
  build: [
    'build', 'compil', 'gradle', 'xcodebuild', 'archive', 'apk', 'aab', 'ipa', 'assemble',
  ],
  deployment: [
    'deploy', 'pipeline', 'ci/cd', 'github actions', 'fastlane', 'codemagic', 'bitrise',
    'azure devops',
  ],
};

export const INTENT_IDS = Object.keys(INTENTS);

// A failing build or pipeline is a debugging task, not a build/deploy task.
export const DEBUG_DOMINATES = new Set(['build', 'deployment', 'dependency', 'migration']);

// First match wins, so the most specific stacks come first.
export const STACK_HINTS = [
  ['flutter', ['flutter', 'dart', 'pubspec']],
  ['react-native', ['react native', 'react-native', 'expo', 'metro']],
  ['kotlin-multiplatform', ['kotlin multiplatform', 'kmp', 'compose multiplatform']],
  ['android', ['android', 'kotlin', 'gradle', 'jetpack compose', 'play store', 'apk', 'aab']],
  ['ios', ['ios', 'swift', 'swiftui', 'xcode', 'cocoapods', 'testflight', 'app store', 'ipa']],
];

export const AREAS = [
  ['gradle', ['gradle', 'agp', 'compiledebugkotlin', 'kapt', 'ksp']],
  ['xcode', ['xcode', 'xcodebuild', 'derived data', 'deriveddata']],
  ['cocoapods', ['cocoapods', 'pod install', 'podfile']],
  ['spm', ['swift package', 'spm']],
  ['metro', ['metro']],
  ['signing', ['signing', 'assinatura', 'provisioning', 'certificado', 'certificate', 'keystore']],
  ['manifest', ['androidmanifest', 'manifest']],
  ['proguard', ['proguard', 'r8', 'minify']],
  ['pub', ['pub get', 'pubspec', 'version solving']],
];

export const AREA_IDS = AREAS.map(([id]) => id);

// Areas that only exist on one native platform, used to focus cross-platform projects.
export const AREA_PLATFORM = {
  gradle: 'android',
  manifest: 'android',
  proguard: 'android',
  xcode: 'ios',
  cocoapods: 'ios',
  spm: 'ios',
};
