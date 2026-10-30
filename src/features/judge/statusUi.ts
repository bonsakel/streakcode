import type { Tint } from '@/components/Badge';
import type { TestStatus, VerdictKind } from './types';

export const STATUS_TINT: Record<TestStatus, Tint> = {
  passed: 'ok',
  wrong_answer: 'bad',
  runtime_error: 'bad',
  compile_error: 'bad',
  time_limit_exceeded: 'warn',
  skipped: 'neutral',
};

export const STATUS_LABEL: Record<TestStatus, string> = {
  passed: 'Passed',
  wrong_answer: 'Wrong answer',
  runtime_error: 'Runtime error',
  compile_error: 'Compile error',
  time_limit_exceeded: 'Time limit exceeded',
  skipped: 'Skipped',
};

export const VERDICT_LABEL: Record<VerdictKind, string> = {
  accepted: 'Accepted',
  wrong_answer: 'Wrong Answer',
  time_limit_exceeded: 'Time Limit Exceeded',
  runtime_error: 'Runtime Error',
  compile_error: 'Compile Error',
};

export const VERDICT_TINT: Record<VerdictKind, Tint> = {
  accepted: 'ok',
  wrong_answer: 'bad',
  runtime_error: 'bad',
  compile_error: 'bad',
  time_limit_exceeded: 'warn',
};

export const LANGUAGE_LABEL = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
} as const;
