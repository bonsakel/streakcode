import { CompileError } from './judge';
import type { JudgeError } from './types';

/** Strip types with sucrase (loaded lazily). Transpile-only: type errors are not reported. */
export async function transpileTypeScript(code: string): Promise<string> {
  const { transform } = await import('sucrase');
  try {
    return transform(code, {
      transforms: ['typescript'],
      disableESTransforms: true,
      filePath: 'solution.ts',
    }).code;
  } catch (e) {
    throw new CompileError(describeTranspileError(e));
  }
}

export function describeTranspileError(e: unknown): JudgeError {
  const raw = e instanceof Error ? e.message : String(e);
  const loc = (e as { loc?: { line?: number; column?: number } } | null)?.loc;
  // Depending on the sucrase build the position is "(2:12)" or "(line 2)"; strip it and the file prefix.
  const match = /^(?:Error transforming [^:]+: )?(.*?)\s*\((?:line )?(\d+)(?::(\d+))?\)\s*$/s.exec(
    raw,
  );
  const message = match?.[1] ?? raw;
  const line = loc?.line ?? (match?.[2] === undefined ? undefined : Number(match[2]));
  const column = loc?.column ?? (match?.[3] === undefined ? undefined : Number(match[3]));
  return {
    name: 'SyntaxError',
    message,
    ...(line === undefined ? {} : { line }),
    ...(column === undefined ? {} : { column: column + 1 }),
  };
}
