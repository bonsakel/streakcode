/**
 * Hygiene, not a security boundary: user code runs in the same realm as the harness, so a determined
 * author can get around this. It stops accidental network calls and makes the intent obvious.
 */
const BLOCKED_GLOBALS = [
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'EventSource',
  'WebTransport',
  'importScripts',
  'Worker',
  'SharedWorker',
  'BroadcastChannel',
  'postMessage',
] as const;

export function lockDownGlobals(scope: object = globalThis): void {
  for (const name of BLOCKED_GLOBALS) {
    const blocked = function blockedGlobal() {
      throw new Error(`${name} is disabled in the Skill Issue sandbox.`);
    };
    try {
      Object.defineProperty(scope, name, {
        value: blocked,
        writable: false,
        configurable: false,
        enumerable: false,
      });
    } catch {
      // Already locked down (or non-configurable in this runtime); nothing more to do.
    }
  }
}
