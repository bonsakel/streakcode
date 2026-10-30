import { describeTranspileError } from './transpile';

describe('describeTranspileError', () => {
  it('parses the "(line:column)" format', () => {
    expect(describeTranspileError(new Error('Unexpected token (2:12)'))).toEqual({
      name: 'SyntaxError',
      message: 'Unexpected token',
      line: 2,
      column: 13,
    });
  });

  it('parses the "(line N)" format and strips the file prefix', () => {
    expect(
      describeTranspileError(
        new Error('Error transforming solution.ts: Unexpected token (line 2)'),
      ),
    ).toEqual({ name: 'SyntaxError', message: 'Unexpected token', line: 2 });
  });

  it('prefers the structured loc when present', () => {
    const err = Object.assign(new Error('Unexpected token (line 9)'), {
      loc: { line: 4, column: 1 },
    });
    expect(describeTranspileError(err)).toMatchObject({ line: 4, column: 2 });
  });

  it('falls back to the raw message', () => {
    expect(describeTranspileError('weird')).toEqual({ name: 'SyntaxError', message: 'weird' });
  });
});
