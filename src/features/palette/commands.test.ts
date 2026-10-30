import { describe, expect, it, vi } from 'vitest';
import { filterCommands, scoreCommand, type Command } from './commands';

describe('command filtering', () => {
  const run = vi.fn();
  const cmd = (id: string, title: string, group: Command['group'], keywords?: string): Command => ({
    id,
    title,
    group,
    keywords,
    run,
  });
  const all = [
    cmd('p', 'Problems', 'Go to'),
    cmd('profile', 'Profile', 'Go to'),
    cmd('t', 'Theme: Gamer Neon', 'Theme', 'color dark'),
    cmd('s', 'Turn sound on', 'Settings', 'audio'),
    cmd('prob', 'Rizz Calculator', 'Problems', 'easy arrays'),
  ];

  it('returns everything in order for an empty query', () => {
    expect(filterCommands(all, '').map((c) => c.id)).toEqual(['p', 'profile', 't', 's', 'prob']);
  });
  it('requires every word and ranks prefix title matches first', () => {
    expect(
      filterCommands(all, 'pro')
        .map((c) => c.id)
        .slice(0, 2),
    ).toEqual(['p', 'profile']);
    expect(filterCommands(all, 'rizz calc').map((c) => c.id)).toEqual(['prob']);
    expect(filterCommands(all, 'rizz zzz')).toEqual([]);
  });
  it('matches keywords below title matches', () => {
    expect(filterCommands(all, 'audio').map((c) => c.id)).toEqual(['s']);
    expect(scoreCommand(all[2]!, 'neon')).toBeGreaterThan(scoreCommand(all[2]!, 'dark'));
  });
});
