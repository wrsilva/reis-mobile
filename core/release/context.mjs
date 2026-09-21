import { join } from 'node:path';

import { PLUGIN_ROOT } from '../paths.mjs';

/** Detection suggests references, never proves store targets or release readiness. */
export function releaseContext(detection) {
  const platforms = detection.platforms.filter((platform) => ['android', 'ios'].includes(platform));
  const references = detection.stack === 'unknown' ? [] : [...new Set([detection.stack, ...platforms])]
    .map((stack) => join(PLUGIN_ROOT, 'skills/mobile-release/references', `${stack}.md`));
  return { platforms, references, evidenceStatus: 'unverified', verdict: null };
}
