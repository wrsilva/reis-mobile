// Minimal YAML frontmatter parser, dependency-free on purpose: the plugin must run
// straight from the Claude Code plugin cache without `npm install`.
//
// Supported subset: `key: scalar`, `key: [a, b]` and block lists (`key:` followed by
// `  - item` lines). Multi-line scalars (`|`, `>`) and nested maps are not supported
// and must not be used in agent or skill frontmatter.

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)([\s\S]*)$/;

export function parseFrontmatter(source) {
  const match = FRONTMATTER.exec(source);
  if (!match) return { data: {}, body: source };
  return { data: parseYamlSubset(match[1]), body: match[2] };
}

function parseYamlSubset(text) {
  const data = {};
  let listKey = null;

  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;

    const item = /^\s+-\s+(.*)$/.exec(line);
    if (item && listKey) {
      data[listKey].push(parseScalar(item[1]));
      continue;
    }

    const pair = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!pair) continue;

    const [, key, value] = pair;
    if (value === '') {
      data[key] = [];
      listKey = key;
    } else {
      data[key] = parseValue(value);
      listKey = null;
    }
  }
  return data;
}

function parseValue(value) {
  if (value.startsWith('[') && value.endsWith(']')) {
    return value
      .slice(1, -1)
      .split(',')
      .map((part) => parseScalar(part.trim()))
      .filter((part) => part !== '');
  }
  return parseScalar(value);
}

function parseScalar(raw) {
  const value = raw.trim();
  if (value.length >= 2 && value[0] === value.at(-1) && (value[0] === '"' || value[0] === "'")) {
    return value.slice(1, -1).replaceAll(`\\${value[0]}`, value[0]);
  }
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}
