/**
 * The status lines `reis-mobile run` prints on stderr and writes to the log. They share one
 * prefix, so a single filter (`grep '^\[reis-mobile run: '`) follows progress, readiness and
 * the exit of any command.
 */

export const STATUS_PREFIX = '[reis-mobile run: ';
export const READY_LINE = /^\[reis-mobile run: (.+?) · ready after ([^\s·\]]+)/;
export const EXIT_LINE = /^\[reis-mobile run: (.+?) · exit (\d+)(?: · ([^\s·\]]+))?/;

/** 0.4s, 12s, 2m05s, 1h03m. */
export function duration(ms) {
  const seconds = Math.max(0, ms) / 1000;
  if (seconds < 10) return `${seconds.toFixed(1)}s`;
  const total = Math.round(seconds);
  if (total < 60) return `${total}s`;
  const minutes = Math.floor(total / 60);
  if (minutes < 60) return `${minutes}m${String(total % 60).padStart(2, '0')}s`;
  return `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, '0')}m`;
}

export const statusLine = (tool, parts) => `${STATUS_PREFIX}${[tool, ...parts.filter(Boolean)].join(' · ')}]`;
