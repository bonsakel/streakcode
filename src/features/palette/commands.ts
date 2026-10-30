export interface Command {
  id: string;
  title: string;
  group: 'Go to' | 'Problems' | 'Theme' | 'Tone' | 'Settings';
  /** Extra words that should match the search. */
  keywords?: string;
  hint?: string;
  run: () => void;
}

/** Every query word must appear; title matches beat keyword matches; earlier matches rank higher. */
export function scoreCommand(command: Command, query: string): number {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 1;
  const title = command.title.toLowerCase();
  const extra = `${command.group} ${command.keywords ?? ''}`.toLowerCase();
  let score = 0;
  for (const word of words) {
    const t = title.indexOf(word);
    if (t >= 0) {
      score += t === 0 ? 30 : title.split(/\s+/).some((w) => w.startsWith(word)) ? 20 : 10;
    } else if (extra.includes(word)) {
      score += 3;
    } else {
      return 0;
    }
  }
  return score;
}

export function filterCommands(commands: readonly Command[], query: string): Command[] {
  return commands
    .map((command, index) => ({ command, index, score: scoreCommand(command, query) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((r) => r.command);
}
