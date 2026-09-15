// Minimal YAML frontmatter parser, dependency-free on purpose: the plugin must run
// straight from the Claude Code plugin cache without `npm install`.
//
// Supported subset: `key: scalar`, `key: [a, b]`, block lists (`key:` followed by
// `  - item` lines) and block scalars (`key: |`, `|-`, `>`, `>-`). Nested maps, such as
// the `metadata:` block of upstream skills, are skipped.

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)([\s\S]*)$/;
const BLOCK_SCALAR = /^([|>])([+-]?)$/;

export function parseFrontmatter(source) {
  const match = FRONTMATTER.exec(source);
  if (!match) return { data: {}, body: source };
  return { data: parseYamlSubset(match[1]), body: match[2] };
}

function parseYamlSubset(text) {
  const data = {};
  const lines = text.split(/\r?\n/);
  let listKey = null;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (!line.trim() || line.trimStart().startsWith('#')) continue;

    const item = /^\s+-\s+(.*)$/.exec(line);
    if (item && listKey) {
      data[listKey].push(parseScalar(item[1]));
      continue;
    }

    const pair = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!pair) continue;

    const [, key, value] = pair;
    listKey = null;
    const block = BLOCK_SCALAR.exec(value);

    if (block) {
      const collected = [];
      while (index + 1 < lines.length && (lines[index + 1].trim() === '' || /^\s/.test(lines[index + 1]))) {
        collected.push(lines[++index]);
      }
      data[key] = foldBlock(collected, block[1], block[2]);
    } else if (value === '') {
      data[key] = [];
      listKey = key;
    } else {
      data[key] = parseValue(value);
    }
  }
  return data;
}

function foldBlock(lines, style, chomping) {
  const indent = Math.min(...lines.filter((line) => line.trim()).map((line) => line.match(/^\s*/)[0].length));
  const content = lines.map((line) => line.slice(Number.isFinite(indent) ? indent : 0));
  const text = style === '|' ? content.join('\n') : content.map((line) => line.trim()).join(' ').replace(/ {2,}/g, ' ');
  return chomping === '+' ? `${text}\n` : text.trimEnd();
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
