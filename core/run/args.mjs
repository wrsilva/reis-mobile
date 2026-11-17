const RUN_FLAGS = new Set(['--raw', '--json', '--no-log']);
const RUN_VALUES = new Set(['--mode', '--max-lines', '--log-dir', '--dir']);

/** Parses `run [options] [--] <command...>`: options stop at `--` or at the first other word. */
export function parseRunArgs(argv) {
  const options = {};
  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg === '--') {
      i++;
      break;
    }
    if (arg === '-h' || arg === '--help') {
      options.help = true;
      i++;
      continue;
    }
    const [name, inline] = arg.startsWith('--') ? arg.split(/=(.*)/s, 2) : [arg];
    if (RUN_FLAGS.has(name)) {
      options[name.slice(2).replace('no-log', 'noLog')] = true;
      i++;
      continue;
    }
    if (RUN_VALUES.has(name)) {
      const value = inline ?? argv[i + 1];
      if (value === undefined) throw new Error(`${name} needs a value`);
      options[name.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
      i += inline === undefined ? 2 : 1;
      continue;
    }
    break;
  }
  return { options, command: argv.slice(i) };
}
