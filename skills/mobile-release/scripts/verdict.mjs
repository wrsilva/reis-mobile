import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const REQUIRED_GATES = ['identity', 'build', 'tests', 'analysis', 'version', 'signing', 'symbols', 'store', 'privacy', 'listing', 'rollout'];
const text = (value) => typeof value === 'string' && value.trim().length > 0;

/** Validate decision consistency. Evidence truth and applicability remain the auditor's job. */
export function evaluateReadiness(report) {
  if (!report || !Array.isArray(report.targets)) throw new Error('targets must be an array');
  const risks = report.risks ?? [];
  if (!Array.isArray(risks) || !risks.every(text)) throw new Error('risks must be an array of non-empty strings');
  const targets = new Set();
  const gates = [];
  for (const item of report.targets) {
    if (!item || !text(item.target) || !Array.isArray(item.gates)) throw new Error('each target needs a name and gates array');
    if (targets.has(item.target)) throw new Error(`duplicate target: ${item.target}`);
    targets.add(item.target);
    const byId = new Map();
    for (const gate of item.gates) {
      if (!gate || !REQUIRED_GATES.includes(gate.id)) throw new Error('unknown gate id');
      if (byId.has(gate.id)) throw new Error(`duplicate gate: ${gate.id}`);
      if (!['pass', 'fail', 'unknown'].includes(gate.status)) throw new Error(`invalid status for ${gate.id}`);
      if (gate.evidence !== undefined && (!Array.isArray(gate.evidence) || !gate.evidence.every((value) => typeof value === 'string'))) {
        throw new Error(`evidence for ${gate.id} must be a string array`);
      }
      byId.set(gate.id, gate);
    }
    for (const id of REQUIRED_GATES) {
      const supplied = byId.get(id);
      const evidence = (supplied?.evidence ?? []).filter(text);
      const status = !supplied || (supplied.status !== 'unknown' && !evidence.length) ? 'unknown' : supplied.status;
      gates.push({
        target: item.target, id, status, evidence,
        nextAction: status === 'pass' ? 'None.' : (text(supplied?.nextAction) && supplied.nextAction !== 'None.'
          ? supplied.nextAction : `Provide and verify ${id} evidence for ${item.target}.`),
      });
    }
  }
  if (!targets.size) gates.push({ target: 'unresolved', id: 'targets', status: 'unknown', evidence: [], nextAction: 'Identify the app artifacts and intended store targets.' });
  const blockers = gates.filter((gate) => gate.status !== 'pass');
  const unknowns = gates.filter((gate) => gate.status === 'unknown');
  return { verdict: blockers.length ? 'NO-GO' : risks.length ? 'GO WITH RISKS' : 'GO', gates, blockers, risks, unknowns };
}

// stdin avoids creating an audit file in the inspected project. Exit zero means evaluated, not GO.
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    let input = '';
    for await (const chunk of process.stdin) input += chunk;
    console.log(JSON.stringify(evaluateReadiness(JSON.parse(input)), null, 2));
  } catch (error) {
    console.error(`readiness: ${error.message}`);
    process.exitCode = 1;
  }
}
