import { resolveLanguage } from '../config/language.mjs';
import { collectReviewContext } from '../context/context-engine.mjs';
import { detectStack } from '../detection/stack-detector.mjs';
import { runDoctor } from '../diagnostics/doctor.mjs';
import { releaseContext } from '../release/context.mjs';
import { route } from '../router/router.mjs';

// The `--json` output of the read-only commands. The CLI prints it and the MCP server returns
// it, so both surfaces describe a project the same way. `project` is resolveProjectDir's result.

export async function detectPayload({ project, lang }) {
  const detection = await detectStack(project.projectDir);
  return { ...detection, ...(await common(project, lang)) };
}

export async function doctorPayload({ project, all, lang }) {
  const report = await runDoctor({ projectDir: project.projectDir, all });
  return { ...report, ...(await common(project, lang)) };
}

export async function routePayload({ project, prompt, intent, lang }) {
  const result = await route({ prompt, intent, projectDir: project.projectDir });
  return { ...summarizeRoute(result), ...(await common(project, lang)) };
}

export async function reviewPayload({ project, base, prompt, lang }) {
  const result = await route({ prompt, intent: 'review', projectDir: project.projectDir });
  const context = collectReviewContext({ projectDir: project.projectDir, base });
  return { ...summarizeRoute(result), ...(await common(project, lang)), context };
}

/** Most build failures are toolchain mismatches, so the doctor report travels with the route. */
export async function debugPayload({ project, prompt, lang }) {
  const result = await route({ prompt, intent: 'debug', projectDir: project.projectDir });
  const doctor = await runDoctor({ projectDir: project.projectDir });
  return { ...summarizeRoute(result), ...(await common(project, lang)), doctor };
}

/** Evidence for the test agent; running the selected suite is the agent's job. */
export async function testPayload({ project, base, prompt, lang }) {
  const result = await route({ prompt, intent: 'test', projectDir: project.projectDir });
  const context = collectReviewContext({ projectDir: project.projectDir, base });
  const doctor = await runDoctor({ projectDir: project.projectDir });
  return { ...summarizeRoute(result), ...(await common(project, lang)), context, doctor };
}

/** Release evidence; the specialist audits it before assigning a verdict. */
export async function releasePayload({ project, prompt, lang }) {
  const result = await route({ prompt, intent: 'release', projectDir: project.projectDir });
  const context = collectReviewContext({ projectDir: project.projectDir });
  const doctor = await runDoctor({ projectDir: project.projectDir });
  const release = releaseContext(result.detection);
  return { ...summarizeRoute(result), ...(await common(project, lang)), context, doctor, release };
}

async function common(project, lang) {
  return { language: await resolveLanguage({ flag: lang }), projectConfig: project.config?.path ?? null };
}

function summarizeRoute(result) {
  const component = (item) => item && { name: item.name, description: item.description, path: item.path };
  return { ...result, agent: component(result.agent), skills: result.skills.map(component) };
}
