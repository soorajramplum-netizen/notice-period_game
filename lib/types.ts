export type MeterKey = 'job' | 'blame' | 'sanity';
export type Meters = Record<MeterKey, number>;
export type Effects = Partial<Meters>;

export type Line = { who: string; mode: string; text: string };

export type Panel = {
  kind: 'panel' | 'splash' | 'choice';
  label: string;
  desc: string;
  lines: Line[];
  card?: string[];
  options?: { label: string; lines: Line[]; fx: Effects }[];
};

export type CoverItem = { type: 'cover'; desc: string; tagline: string };
export type PageItem = { type: 'page'; label: string; panels: Panel[] };
export type LevelItem = {
  type: 'level';
  n: number;
  title: string;
  game: string;
  intro: string;
  results: Record<'0' | '2' | '3', { lines: Line[]; fx: Effects }>;
};
export type Item = CoverItem | PageItem | LevelItem;

export type Sequence = { id: string; kind: 'issue' | 'branch' | 'ending'; num?: number; title: string; items: Item[] };
export type Comic = { sequences: Record<string, Sequence> };

/** What every mini game receives. */
export type Device = 'mobile' | 'desktop';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type GameCtx = {
  device: Device;
  /** Set in Free Play only; the story uses Sanity instead. */
  difficulty?: Difficulty;
  sanity: number;
  hard: boolean;
  stars: Record<number, number>;
  font: string;
  bodyFont: string;
  done: (stars: number) => void;
};
