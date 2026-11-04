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
    'keychain', 'secure storage',
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
  offline: [
    'offline', 'off-line', 'sem conexao', 'sem internet', 'sem rede', 'modo aviao',
    'airplane mode', 'sincroniza', 'sync', 'dessincroniz', 'out of sync', 'conflito',
    'conflict', 'idempot', 'fila de operac', 'operation queue', 'outbox', 'reconect',
    'reconnect', 'local-first', 'local first', 'cache local', 'last write wins',
    'ultima escrita vence', 'replica',
  ],
  observability: [
    'observab', 'telemetri', 'telemetry', 'opentelemetry', 'crashlytics', 'sentry',
    'datadog', 'new relic', 'firebase analytics', 'analytics', 'monitorament', 'monitoring',
    'structured log', 'log estruturad', 'logging', 'alerta', 'alert', 'sampling',
    'amostragem', 'distributed trac', 'trace distribu', 'correlation id', 'correlation-id',
    'crash-free', 'crash free', 'error reporting', 'relatorio de erro', 'breadcrumb',
    'slo', 'sli',
  ],
  release: [
    'release', 'publica', 'publish', 'loja', 'app store', 'play store', 'testflight',
    'lancamento', 'submission', 'store review', 'rejeita', 'reject',
  ],
  accessibility: [
    'acessibilidade', 'accessibility', 'a11y', 'leitor de tela', 'screen reader',
    'talkback', 'voiceover', 'contraste', 'semantics',
  ],
  // Keep visual design separate from software architecture and UI test requests.
  design: [
    'ui/ux', 'ux/ui', 'ui design', 'ux design', 'design review', 'design de interface',
    'design de tela', 'design system', 'visual design', 'interface design',
    'wireframe', 'usabilidade', 'usability', 'hierarquia visual', 'visual hierarchy',
    'tipografia', 'typography', 'apple hig', 'human interface guidelines',
    'liquid glass', 'redesign', 'redesenhar',
  ],
  review: [
    'review', 'revis', 'code review', 'pull request', 'pr', 'prs', 'analis', 'avali', 'audit',
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
  privacy: [
    'privacy', 'privacidade', 'consent', 'consentimento', 'account deletion',
    'delete account', 'exclusao de conta', 'excluir conta', 'data retention',
    'retencao de dados', 'privacy manifest', 'data safety', 'analytics consent',
  ],
  networking: [
    'networking', 'api integration', 'integracao de api', 'integrar api',
    'http client', 'cliente http', 'pagination', 'paginacao', 'resumable upload',
    'upload retomavel', 'websocket', 'request cancellation', 'cancelar requisic',
  ],
  auth: [
    'authentication', 'autentica', 'passkey', 'sign-in', 'sign in', 'login',
    'logout', 'oauth', 'oidc', 'pkce', 'session management', 'gestao de sessao',
    'account linking', 'vincular conta', 'token refresh', 'renovacao de token',
  ],
  notifications: [
    'push notification', 'local notification', 'notification permission',
    'notification channel', 'notification tap', 'notifica', 'fcm', 'apns',
  ],
  // "assinatura", "subscription" and "entitlement" alone also mean code signing, a stream
  // subscription and an iOS signing entitlement, so only specific phrases route here.
  billing: [
    'billing', 'cobranca', 'in-app purchase', 'in app purchase', 'compra no app',
    'compras no app', 'compra dentro do app', 'compras dentro do app', 'compra in-app',
    'compras in-app', 'subscription purchase', 'in-app subscription', 'auto-renewable',
    'assinatura no app', 'assinaturas no app', 'assinatura recorrente', 'paywall', 'storekit',
    'play billing', 'restore purchase', 'restaurar compra', 'revenuecat',
  ],
  // Plain "analytics" stays with observability; these longer phrases claim their span first.
  analytics: [
    'product analytics', 'analytics de produto', 'tracking plan', 'plano de tracking',
    'plano de rastreamento', 'event tracking', 'rastreamento de eventos', 'event taxonomy',
    'taxonomia de eventos', 'analytics event', 'evento de analytics', 'eventos de analytics',
    'funnel', 'funil', 'conversion event', 'evento de conversao', 'user properties',
    'propriedades de usuario', 'mixpanel', 'posthog', 'amplitude analytics', 'amplitude sdk',
  ],
  // "localizacao" alone also means translation, so location uses specific phrases; "ble" is a
  // whole word (see WHOLE_WORDS). Biometrics belongs to auth and security.
  hardware: [
    'hardware', 'bluetooth', 'ble', 'nfc', 'camera', 'microphone', 'microfone', 'sensor',
    'accelerometer', 'acelerometro', 'gyroscope', 'giroscopio', 'gps', 'geolocation',
    'geolocaliza', 'geofenc', 'background location', 'localizacao em segundo plano',
    'location updates', 'atualizacoes de localizacao', 'barcode', 'codigo de barras', 'qr code',
    'codigo qr', 'haptic', 'vibration', 'vibracao', 'usb',
  ],
};

export const INTENT_IDS = Object.keys(INTENTS);

// Terms matched as whole words instead of stems: as stems, "pr" would also claim "premium",
// "product" and "preço", and "ble" would claim "blend".
export const WHOLE_WORDS = new Set(['pr', 'prs', 'ble']);

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
