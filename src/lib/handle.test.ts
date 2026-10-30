import { generateHandle } from './handle';

describe('generateHandle', () => {
  it('produces Adjective + Creature + number', () => {
    expect(generateHandle()).toMatch(/^[A-Z][a-z]+[A-Z][a-z]+\d{1,2}$/);
  });

  it('is deterministic for a seeded rng', () => {
    expect(generateHandle(() => 0)).toBe('SleepyCapybara1');
  });

  it('never returns an out-of-range pick when rng is just under 1', () => {
    expect(generateHandle(() => 0.999999)).toBe('WholesomeFrog99');
  });
});
