import { formatValue, normalizeValue, valuesMatch } from './compare';
import type { CaseOutcome, CaseRequest } from './protocol';
import { MAX_STDOUT_BYTES, type JudgeError } from './types';

const USER_SOURCE = 'user-code.js';
const CHECKER_SOURCE = 'checker.js';
/** The user's code starts on line 2 of the evaluated source; line 1 is the wrapper opener. */
const LINE_OFFSET = 1;
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;
const CONSOLE_METHODS = ['log', 'info', 'warn', 'error', 'debug'] as const;
const MAX_MESSAGE_LENGTH = 1000;

class LogBuffer {
  text = '';
  truncated = false;

  push(args: unknown[]): void {
    const remaining = MAX_STDOUT_BYTES - this.text.length;
    if (remaining <= 0) {
      this.truncated = true;
      return;
    }
    const line = `${args.map(formatLogArg).join(' ')}\n`;
    if (line.length > remaining) {
      this.text += line.slice(0, remaining);
      this.truncated = true;
    } else {
      this.text += line;
    }
  }
}

function formatLogArg(arg: unknown): string {
  if (typeof arg === 'string') return arg;
  try {
    if (arg instanceof Error) return arg.stack ?? `${arg.name}: ${arg.message}`;
    return JSON.stringify(arg) ?? String(arg);
  } catch {
    try {
      return String(arg);
    } catch {
      return '[unprintable]';
    }
  }
}

function captureConsole(buffer: LogBuffer): () => void {
  const target = globalThis.console as unknown as Record<string, unknown>;
  const saved = CONSOLE_METHODS.map((method) => [method, target[method]] as const);
  for (const method of CONSOLE_METHODS) {
    target[method] = (...args: unknown[]) => buffer.push(args);
  }
  return () => {
    for (const [method, original] of saved) target[method] = original;
  };
}

function locationFromStack(
  stack: unknown,
  source: string,
): { line: number; column: number } | null {
  if (typeof stack !== 'string') return null;
  const escaped = source.replace('.', '\\.');
  const match = new RegExp(`${escaped}:(\\d+):(\\d+)`).exec(stack);
  if (!match) return null;
  const line = Number(match[1]) - LINE_OFFSET;
  return line >= 1 ? { line, column: Number(match[2]) } : null;
}

function describeError(thrown: unknown, source = USER_SOURCE): JudgeError {
  if (typeof thrown === 'object' && thrown !== null && 'message' in thrown) {
    const err = thrown as { name?: unknown; message: unknown; stack?: unknown };
    const location = locationFromStack(err.stack, source);
    return {
      name: typeof err.name === 'string' ? err.name : 'Error',
      message: String(err.message).slice(0, MAX_MESSAGE_LENGTH),
      ...(location ?? {}),
    };
  }
  let message: string;
  try {
    message = String(thrown);
  } catch {
    message = 'Something non-printable was thrown.';
  }
  return { name: 'Error', message: message.slice(0, MAX_MESSAGE_LENGTH) };
}

function wrapSource(code: string, fnName: string, sourceName: string): string {
  return `(function(){\n${code}\n;return typeof ${fnName}==='function'?${fnName}:undefined;\n})()\n//# sourceURL=${sourceName}`;
}

type UserFunction = (...args: unknown[]) => unknown;

type Loaded =
  | { ok: true; fn: UserFunction }
  | { ok: false; kind: 'compile_error' | 'error'; error: JudgeError };

function loadFunction(code: string, fnName: string, sourceName: string): Loaded {
  try {
    // Parse-only check first, so syntax errors are told apart from errors thrown by top-level code
    // and so code cannot break out of the wrapper.
    new Function(code);
  } catch (e) {
    return { ok: false, kind: 'compile_error', error: describeError(e, sourceName) };
  }
  let value: unknown;
  try {
    value = (0, eval)(wrapSource(code, fnName, sourceName));
  } catch (e) {
    return { ok: false, kind: 'error', error: describeError(e, sourceName) };
  }
  if (typeof value !== 'function') {
    return {
      ok: false,
      kind: 'error',
      error: {
        name: 'ReferenceError',
        message: `Function "${fnName}" is not defined. Did you rename or delete it?`,
      },
    };
  }
  return { ok: true, fn: value as UserFunction };
}

function cloneForChecker(input: unknown[]): unknown[] {
  return structuredClone(input);
}

async function execute(req: CaseRequest, logs: LogBuffer): Promise<CaseOutcome> {
  const done = () => ({ stdout: logs.text, stdoutTruncated: logs.truncated });

  if (!IDENTIFIER.test(req.fnName)) {
    return {
      kind: 'error',
      error: { name: 'JudgeConfigError', message: `"${req.fnName}" is not a valid function name.` },
      timeMs: null,
      ...done(),
    };
  }

  const loaded = loadFunction(req.code, req.fnName, USER_SOURCE);
  if (!loaded.ok) {
    return { kind: loaded.kind, error: loaded.error, timeMs: null, ...done() };
  }

  const checkerInput = req.checker ? cloneForChecker(req.input) : [];
  const start = performance.now();
  let returned: unknown;
  try {
    returned = await loaded.fn(...req.input);
  } catch (e) {
    return { kind: 'error', error: describeError(e), timeMs: performance.now() - start, ...done() };
  }
  const timeMs = performance.now() - start;

  const normalized = normalizeValue(returned);
  if (!normalized.ok) {
    return {
      kind: 'error',
      error: { name: 'SerializationError', message: normalized.reason },
      timeMs,
      ...done(),
    };
  }

  let accepted: boolean;
  if (req.checker) {
    const checker = loadFunction(req.checker, 'checker', CHECKER_SOURCE);
    if (!checker.ok) {
      return {
        kind: 'error',
        error: { ...checker.error, message: `Checker problem: ${checker.error.message}` },
        timeMs,
        ...done(),
      };
    }
    try {
      accepted = Boolean(await checker.fn(checkerInput, normalized.value, req.expected));
    } catch (e) {
      const error = describeError(e, CHECKER_SOURCE);
      return {
        kind: 'error',
        error: { ...error, message: `Checker problem: ${error.message}` },
        timeMs,
        ...done(),
      };
    }
  } else {
    accepted = valuesMatch(normalized.value, req.expected, req.epsilon);
  }

  return {
    kind: accepted ? 'pass' : 'fail',
    got: formatValue(normalized.value),
    timeMs,
    ...done(),
  };
}

/** Run a single test case. Never throws; every failure becomes an outcome. */
export async function runCase(req: CaseRequest): Promise<CaseOutcome> {
  const logs = new LogBuffer();
  const restoreConsole = captureConsole(logs);
  try {
    return await execute(req, logs);
  } finally {
    restoreConsole();
  }
}
