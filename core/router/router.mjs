import { detectStack } from '../detection/stack-detector.mjs';
import { ANY_STACK, loadRegistry } from '../registry/registry.mjs';
import { AREA_PLATFORM, INTENT_IDS } from './intents.mjs';
import { detectIntent } from './intent-detector.mjs';

/**
 * prompt → intent → stack → agent → skills.
 *
 * The project on disk decides the stack. Prompt hints only fill in an unknown stack or
 * narrow a cross-platform project to one of its native platforms ("the Android build of
 * my Flutter app fails" loads Flutter and Android skills).
 */
export async function route({ prompt = '', intent: explicitIntent, projectDir = process.cwd(), registry } = {}) {
  if (explicitIntent && !INTENT_IDS.includes(explicitIntent)) {
    throw new Error(`Unknown intent "${explicitIntent}". Known intents: ${INTENT_IDS.join(', ')}`);
  }

  const components = registry ?? (await loadRegistry());
  const parsed = detectIntent(prompt);
  const detection = await detectStack(projectDir);
  const warnings = [];

  const intent = explicitIntent ?? parsed.intent;
  const stack = detection.stack !== 'unknown' ? detection.stack : (parsed.stack ?? 'unknown');
  const platformFocus = [...new Set([...parsed.stackHints, AREA_PLATFORM[parsed.area]])].filter(
    (hint) => hint && hint !== stack && detection.platforms.includes(hint),
  );

  if (detection.stack === 'unknown') {
    warnings.push(
      parsed.stack
        ? `No mobile project found in ${detection.projectDir}; using "${parsed.stack}" from the prompt.`
        : `No mobile project found in ${detection.projectDir}; only stack-agnostic skills apply.`,
    );
  }
  if (!intent) warnings.push('Could not infer an intent from the prompt; pass --intent explicitly.');

  const agent = intent ? selectAgent(components.agents, intent, stack) : null;
  if (intent && !agent) warnings.push(`No agent handles intent "${intent}" yet.`);

  const skills = intent ? selectSkills(components.skills, intent, [stack, ...platformFocus]) : [];

  return {
    intent,
    intentSource: explicitIntent ? 'explicit' : 'prompt',
    confidence: explicitIntent ? 1 : parsed.confidence,
    area: parsed.area,
    stack,
    platformFocus,
    detection,
    agent,
    skills,
    warnings,
  };
}

export function selectAgent(agents, intent, stack) {
  return (
    agents
      .filter((agent) => agent.routed && agent.intents.includes(intent))
      .map((agent) => ({ agent, score: stackScore(agent.stacks, [stack]) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || a.agent.name.localeCompare(b.agent.name))[0]?.agent ?? null
  );
}

/** Skills for the primary stack first, then focused platforms, then stack-agnostic ones. */
export function selectSkills(skills, intent, stacks) {
  return skills
    .filter((skill) => skill.routed && skill.intents.includes(intent))
    .map((skill) => ({ skill, score: stackScore(skill.stacks, stacks) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.skill.name.localeCompare(b.skill.name))
    .map(({ skill }) => skill);
}

// Earlier stacks weigh more; "*" matches anything with the lowest weight.
function stackScore(declared, stacks) {
  for (const [index, stack] of stacks.entries()) {
    if (declared.includes(stack)) return stacks.length - index + 1;
  }
  return declared.includes(ANY_STACK) ? 1 : 0;
}
