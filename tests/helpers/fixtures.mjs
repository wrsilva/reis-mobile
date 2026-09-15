import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after } from 'node:test';

const created = [];

after(async () => {
  await Promise.all(created.map((dir) => rm(dir, { recursive: true, force: true })));
});

/** Creates a throwaway project. Keys ending in "/" create empty directories. */
export async function makeProject(files = {}) {
  const root = await mkdtemp(join(tmpdir(), 'reis-mobile-test-'));
  created.push(root);
  for (const [path, content] of Object.entries(files)) {
    const full = join(root, path);
    if (path.endsWith('/')) {
      await mkdir(full, { recursive: true });
    } else {
      await mkdir(dirname(full), { recursive: true });
      await writeFile(full, content);
    }
  }
  return root;
}

export function git(cwd, ...args) {
  const result = spawnSync(
    'git',
    ['-c', 'user.name=reis-mobile', '-c', 'user.email=test@reis-mobile.dev', '-c', 'init.defaultBranch=main', ...args],
    { cwd, encoding: 'utf8' },
  );
  if (result.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${result.stderr}`);
  return result.stdout;
}

export const FLUTTER_PUBSPEC = `name: demo_app
environment:
  sdk: ^3.5.0
dependencies:
  flutter:
    sdk: flutter
flutter:
  uses-material-design: true
`;

export const FLUTTER_APP = {
  'pubspec.yaml': FLUTTER_PUBSPEC,
  'lib/main.dart': 'void main() {}\n',
  'android/app/src/main/kotlin/com/example/demo_app/MainActivity.kt': 'class MainActivity\n',
  'ios/Runner/AppDelegate.swift': 'class AppDelegate {}\n',
};
