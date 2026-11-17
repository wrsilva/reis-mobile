/**
 * Watches a command that keeps running for the moment it is usable: an output line that
 * matches a pattern (`Flutter run key commands.`) or a URL that answers (Metro's `/status`).
 * `onReady` is called once, with the line or the answer that proved it.
 */
export function createReadiness({ pattern = null, url = null, body = null, onReady, intervalMs = 1000, fetchImpl = globalThis.fetch } = {}) {
  let fired = false;
  let timer = null;
  let inFlight = false;

  const stop = () => {
    if (timer) clearInterval(timer);
    timer = null;
  };
  const fire = (reason) => {
    if (fired) return;
    fired = true;
    stop();
    onReady?.(reason);
  };

  if (url && fetchImpl) {
    timer = setInterval(async () => {
      if (inFlight || fired) return;
      inFlight = true;
      try {
        const response = await fetchImpl(url, { signal: AbortSignal.timeout(Math.max(intervalMs, 500)) });
        const text = body ? await response.text() : '';
        // Without an expected body, any HTTP answer means the server is listening.
        if (!body || text.includes(body)) fire(`${url} answered ${body ? `"${body}"` : `HTTP ${response.status}`}`);
      } catch {
        // Not listening yet.
      } finally {
        inFlight = false;
      }
    }, intervalMs);
    timer.unref?.();
  }

  return {
    get fired() {
      return fired;
    },
    observe(line) {
      if (!fired && pattern?.test(line)) fire(line.trim());
    },
    stop,
  };
}

/** How readiness is detected, for the log header and the help of a command without a signal. */
export function describeReady({ pattern = null, url = null, body = null } = {}) {
  const parts = [
    pattern && `output matching /${pattern.source}/`,
    url && `${url} answering${body ? ` "${body}"` : ''}`,
  ].filter(Boolean);
  return parts.length ? parts.join(' or ') : null;
}
