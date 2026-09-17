#!/usr/bin/env node
import { checkForUpdate, updateMessage } from '../core/update/check.mjs';

if (process.env.REIS_MOBILE_UPDATE_CHECK !== '0') {
  try {
    const result = await checkForUpdate();
    if (result.status === 'outdated') {
      const tool = process.env.PLUGIN_ROOT ? 'codex' : 'claude';
      process.stdout.write(`${JSON.stringify({ systemMessage: updateMessage(result, tool) })}\n`);
    }
  } catch {
    // Update checks are advisory and must never fail a session.
  }
}
