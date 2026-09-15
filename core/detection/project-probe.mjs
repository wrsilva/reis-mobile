import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const IGNORED_DIRS = new Set([
  '.git', '.gradle', '.idea', '.vscode', '.dart_tool', '.expo', '.build', '.swiftpm',
  'node_modules', 'Pods', 'DerivedData', 'build', 'dist', 'vendor', 'Carthage',
]);

const MAX_READ_BYTES = 512 * 1024;

const LANGUAGE_BY_EXTENSION = {
  '.dart': 'dart',
  '.kt': 'kotlin',
  '.java': 'java',
  '.swift': 'swift',
  '.m': 'objective-c',
  '.mm': 'objective-c',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
};

/** Read-only, bounded view over a project directory. All paths are relative to `root`. */
export function createProbe(root) {
  return {
    root,

    async exists(path) {
      return (await statOrNull(join(root, path))) !== null;
    },

    async isDir(path) {
      return (await statOrNull(join(root, path)))?.isDirectory() ?? false;
    },

    async read(path) {
      const info = await statOrNull(join(root, path));
      if (!info?.isFile() || info.size > MAX_READ_BYTES) return null;
      return readFile(join(root, path), 'utf8');
    },

    async list(path = '.') {
      try {
        return await readdir(join(root, path), { withFileTypes: true });
      } catch {
        return [];
      }
    },

    /** Breadth-first search for files, skipping build output and dependency folders. */
    async findFiles(predicate, { from = '.', maxDepth = 4, limit = 50 } = {}) {
      const found = [];
      let queue = [join(root, from)];
      for (let depth = 0; depth <= maxDepth && queue.length && found.length < limit; depth++) {
        const next = [];
        for (const dir of queue) {
          let entries;
          try {
            entries = await readdir(dir, { withFileTypes: true });
          } catch {
            continue;
          }
          for (const entry of entries) {
            const full = join(dir, entry.name);
            if (entry.isDirectory()) {
              if (!IGNORED_DIRS.has(entry.name) && !entry.name.endsWith('.xcassets')) next.push(full);
            } else if (predicate(entry.name)) {
              found.push(relative(root, full));
              if (found.length >= limit) break;
            }
          }
          if (found.length >= limit) break;
        }
        queue = next;
      }
      return found;
    },

    /** Source languages present under `from`, ordered by file count. */
    async languages(from = '.', { maxDepth = 10 } = {}) {
      if (!(await this.isDir(from))) return [];
      const files = await this.findFiles((name) => extname(name) in LANGUAGE_BY_EXTENSION, {
        from,
        maxDepth,
        limit: 400,
      });
      const counts = new Map();
      for (const file of files) {
        const language = LANGUAGE_BY_EXTENSION[extname(file)];
        counts.set(language, (counts.get(language) ?? 0) + 1);
      }
      return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([language]) => language);
    },
  };
}

async function statOrNull(path) {
  try {
    return await stat(path);
  } catch {
    return null;
  }
}
