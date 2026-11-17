import { FAMILIES, NOISE, STREAM_FILTERS } from './families.mjs';

const ANSI = /\x1B\[[0-?]*[ -/]*[@-~]|\x1B\][^\x07\x1B]*(\x07|\x1B\\)|\x1B[@-Z\\-_]/g;
const MAX_LINE = 500;
const TAIL_LINES = 30;
const IMPLICIT_CONTEXT = { cont: /^\s+\S|^\s*\|/, max: 4 };

/** Removes color codes and keeps only the last state of a carriage-return progress line. */
export function cleanLine(raw) {
  const text = raw.replace(ANSI, '');
  if (!text.includes('\r')) return text;
  const parts = text.split('\r').filter((part) => part.trim());
  return parts.at(-1) ?? '';
}

export function truncate(line, max = MAX_LINE) {
  return line.length > max ? `${line.slice(0, max)} … (+${line.length - max} chars)` : line;
}

const MAX_FRAMES = 6;
// Stack frames of Dart, Java/Kotlin, JavaScript and native (Swift, Objective-C) traces.
const FRAME = /^\s*(package:\S+|dart:\S+|\S+\.dart) \d+:\d+\s|^\s+at [\w$.<>[\]]|^\s*#\d+\s+(0x[0-9a-f]+|\S+ \()|^\s*\d+\s+\S+\s+0x[0-9a-f]+ /;

const normalize = (line) => line.trim().replace(/\s+/g, ' ');
const matches = (rule, line) => (rule instanceof RegExp ? rule : rule.re).test(line);

/**
 * Filters output line by line. `emit` receives each line to show, as soon as it is decided,
 * so long-running commands stream. Call `end(exitCode)` once for summaries and the fallback.
 */
export class Compactor {
  constructor({ mode = 'light', families = ['common'], streamFilter, maxLines = 150, maxWarnings = 10, maxInfos = 5, emit }) {
    this.mode = mode;
    this.families = families.map((name) => {
      const family = FAMILIES[name];
      if (!family) throw new Error(`Unknown output family "${name}"`);
      return family;
    });
    this.streamFilter = streamFilter ? STREAM_FILTERS[streamFilter] : null;
    this.maxLines = mode === 'stream' ? Infinity : mode === 'light' ? Math.max(maxLines * 2, 300) : maxLines;
    this.maxWarnings = maxWarnings;
    this.maxInfos = maxInfos;
    this.emit = emit;
    this.pending = '';
    this.block = null;
    this.seen = new Set();
    this.summaries = new Map();
    this.order = 0;
    this.tail = [];
    this.previous = null;
    this.repeats = 0;
    this.lastBlank = true;
    this.stats = {
      rawLines: 0, rawBytes: 0, shownLines: 0, shownBytes: 0,
      errors: 0, warnings: 0, infos: 0, hiddenWarnings: 0, hiddenInfos: 0, duplicates: 0, overLimit: 0,
    };
  }

  /** Feeds a chunk of output; complete lines are processed, the rest waits for more data. */
  push(chunk) {
    this.pending += chunk;
    const lines = this.pending.split('\n');
    this.pending = lines.pop();
    for (const line of lines) this.line(line);
  }

  line(raw) {
    this.stats.rawLines++;
    this.stats.rawBytes += Buffer.byteLength(raw) + 1;
    let line = cleanLine(raw).replace(/\s+$/, '');
    for (const family of this.families) if (family.pre) line = family.pre(line);

    if (line.trim()) {
      this.tail.push(line);
      if (this.tail.length > TAIL_LINES * 3) this.tail.splice(0, this.tail.length - TAIL_LINES * 3);
    }

    if (this.mode === 'compact') this.compactLine(line);
    else this.lightLine(line);
  }

  lightLine(line) {
    if (NOISE.some((re) => re.test(line))) return;
    if (this.streamFilter && line.trim() && !this.streamFilter(line)) return;
    if (!line.trim()) {
      if (this.lastBlank) return;
      this.lastBlank = true;
      this.show('');
      return;
    }
    if (line === this.previous) {
      this.repeats++;
      this.stats.duplicates++;
      return;
    }
    this.flushRepeats();
    this.previous = line;
    this.lastBlank = false;
    this.show(truncate(line));
  }

  flushRepeats() {
    if (this.repeats) this.show(`  (previous line repeated ${this.repeats}×)`);
    this.repeats = 0;
  }

  compactLine(line) {
    if (this.families.some((family) => family.never?.some((re) => re.test(line)))) {
      // Implicit context covers only the lines right after an error, not lines past dropped noise.
      if (this.block?.implicit) this.closeBlock();
      return;
    }

    if (this.block) {
      const consumed = this.continueBlock(line);
      if (consumed) return;
    }
    if (!line.trim()) return;
    if (line.length > 2000) return;

    for (const family of this.families) {
      for (const kind of ['error', 'warn', 'info', 'keep']) {
        const rule = family[kind]?.find((candidate) => matches(candidate, line));
        if (rule) return this.important(line, kind, rule);
      }
      const summary = family.summary?.find((re) => re.test(line));
      if (summary) {
        this.summaries.set(summary, { line, order: this.order++ });
        return;
      }
    }
  }

  /** Returns true when the block took the line. */
  continueBlock(line) {
    const block = this.block;
    if (block.until?.test(line)) {
      this.closeBlock();
      if (block.inclusive) {
        if (!block.suppressed) this.show(truncate(line));
        return true;
      }
      return false;
    }
    if (block.cont && !block.cont.test(line)) {
      this.closeBlock();
      return false;
    }
    if (!line.trim()) {
      if (block.blank !== 'keep') {
        this.closeBlock();
        return true;
      }
      if (block.lastBlank) return true;
      block.lastBlank = true;
    } else {
      block.lastBlank = false;
    }
    if (block.count >= block.max) {
      this.closeBlock();
      return false;
    }
    block.count++;
    if (FRAME.test(line)) {
      block.frames = (block.frames ?? 0) + 1;
      if (block.frames > MAX_FRAMES) {
        block.hiddenFrames = (block.hiddenFrames ?? 0) + 1;
        return true;
      }
    } else {
      this.flushFrames(block);
      block.frames = 0;
    }
    if (!block.suppressed) this.show(truncate(line));
    return true;
  }

  closeBlock() {
    this.flushFrames(this.block);
    this.block = null;
  }

  flushFrames(block) {
    if (block?.hiddenFrames && !block.suppressed) this.show(`  … ${block.hiddenFrames} more stack frames (full log)`);
    if (block) block.hiddenFrames = 0;
  }

  important(line, kind, rule) {
    const key = normalize(line);
    const duplicate = this.seen.has(key);
    const blockOptions = rule.block ?? (kind === 'error' ? IMPLICIT_CONTEXT : null);
    if (duplicate) {
      this.stats.duplicates++;
      if (blockOptions) this.block = { ...blockOptions, count: 0, suppressed: true, implicit: !rule.block };
      return;
    }
    if (kind === 'warn' && this.stats.warnings >= this.maxWarnings) {
      this.stats.hiddenWarnings++;
      return;
    }
    if (kind === 'info' && this.stats.infos >= this.maxInfos) {
      this.stats.hiddenInfos++;
      return;
    }
    this.seen.add(key);
    if (kind === 'error') this.stats.errors++;
    if (kind === 'warn') this.stats.warnings++;
    if (kind === 'info') this.stats.infos++;
    this.show(truncate(line));
    if (blockOptions) this.block = { ...blockOptions, count: 0, suppressed: false, implicit: !rule.block };
  }

  show(line) {
    if (this.stats.shownLines >= this.maxLines) {
      this.stats.overLimit++;
      return;
    }
    this.stats.shownLines++;
    this.stats.shownBytes += Buffer.byteLength(line) + 1;
    this.emit(line);
  }

  /** Flushes the last partial line, then prints summaries and, on failure, the fallback tail. */
  end(exitCode) {
    if (this.pending) this.line(this.pending);
    this.pending = '';
    this.flushRepeats();
    if (this.block) this.closeBlock();

    if (this.mode === 'compact') {
      const shown = new Set();
      for (const { line } of [...this.summaries.values()].sort((a, b) => a.order - b.order)) {
        if (shown.has(line)) continue;
        shown.add(line);
        this.show(truncate(line));
      }
      if (exitCode !== 0 && this.stats.errors === 0) {
        const tail = this.tail.filter((line) => !this.families.some((family) => family.never?.some((re) => re.test(line))) && line.length <= 2000);
        if (tail.length) this.show('… no known error pattern matched; last lines of the output:');
        for (const line of tail.slice(-TAIL_LINES)) this.show(truncate(line));
      }
    }
    return this.stats;
  }
}
