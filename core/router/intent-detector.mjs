import { AREAS, DEBUG_DOMINATES, INTENTS, INTENT_IDS, STACK_HINTS } from './intents.mjs';

export function normalize(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/**
 * Detects what the user wants from a free-text prompt.
 *
 * @returns {{ intent: string|null, confidence: number, scores: Record<string, number>,
 *   stack: string|null, stackHints: string[], area: string|null }}
 */
export function detectIntent(prompt) {
  const text = normalize(prompt);
  const scores = matchTerms(text, Object.entries(INTENTS));
  const stackHints = Object.keys(matchTerms(text, STACK_HINTS));
  const area = Object.keys(matchTerms(text, AREAS))[0] ?? null;

  const ranked = INTENT_IDS.filter((id) => scores[id]).sort((a, b) => scores[b] - scores[a]);
  let intent = ranked[0] ?? null;
  if (intent && DEBUG_DOMINATES.has(intent) && scores.debug) intent = 'debug';

  const total = Object.values(scores).reduce((sum, value) => sum + value, 0);
  const confidence = intent ? round(scores[intent] / total) : 0;
  const stack = stackHints[0] ?? null;

  return {
    intent,
    confidence,
    scores,
    stack,
    stackHints,
    area: area ?? inferArea(intent, stack),
  };
}

// Longest terms claim their span first, so "testflight" never also counts as "test"
// and "kotlin multiplatform" never also counts as "kotlin". Groups with no match are
// omitted; the returned keys keep the declaration order of `groups`.
function matchTerms(text, groups) {
  const terms = groups
    .flatMap(([id, words]) => words.map((word) => ({ id, word })))
    .sort((a, b) => b.word.length - a.word.length);
  const claimed = new Array(text.length).fill(false);
  const counts = new Map();

  for (const { id, word } of terms) {
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(word)}`, 'gu');
    for (const match of text.matchAll(pattern)) {
      const start = match.index;
      const end = start + word.length;
      if (claimed.slice(start, end).some(Boolean)) continue;
      claimed.fill(true, start, end);
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }

  return Object.fromEntries(groups.filter(([id]) => counts.has(id)).map(([id]) => [id, counts.get(id)]));
}

function inferArea(intent, stack) {
  if (intent !== 'debug' && intent !== 'build') return null;
  return { android: 'gradle', ios: 'xcode', 'react-native': 'metro' }[stack] ?? null;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
}

function round(value) {
  return Math.round(value * 100) / 100;
}
