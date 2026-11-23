import type { Meters } from './types';

/** All the game's numbers in one place. Tune balance here. */
export const RULES = {
  start: { job: 0, blame: 10, sanity: 7 } as Meters,
  max: { job: 100, blame: 100, sanity: 10 } as Meters,
  /** Job Hunt needed after Level 12 to get the offer (else: Second Chance). */
  offerThreshold: 50,
  /** Blame at or above this = Terminated During Notice. */
  blameLimit: 100,
  /** Win endings (tuned with scripts/simulate.mjs). */
  boomerangBlame: 5,
  cleanStars: 45, // of 51 (17 story levels)
};

/** Level id -> mini-game module (games/<key>.ts). Ids are stable; the order players see comes from the script. */
export const LEVEL_GAMES: Record<number, string> = {
  1: 'rage', 2: 'darts', 3: 'maze', 4: 'slice', 5: 'slingshot', 6: 'pong', 7: 'alttab', 8: 'stealth',
  9: 'stack', 10: 'runner', 11: 'pour', 12: 'poker', 13: 'crossing', 14: 'invaders', 15: 'boss',
  16: 'toss', 17: 'fight', 18: 'smash',
};

/** Free Play catalogue, in story order, plus bonus games that aren't in the story. */
export const FREE_PLAY: { id: number; title: string; game: string; bonus?: boolean }[] = [
  { id: 16, title: 'The Bin', game: 'Paper Toss' },
  { id: 1, title: 'The Draft', game: 'Rage-to-Polite' },
  { id: 2, title: 'The Quick Call', game: 'Darts' },
  { id: 3, title: 'The Portal', game: 'HR Portal Maze' },
  { id: 4, title: 'Calendar Carnage', game: 'Slice the Invites' },
  { id: 5, title: 'Apply-o-Matic', game: 'CV Slingshot' },
  { id: 6, title: 'Blame Pong', game: 'Pong' },
  { id: 7, title: 'Boss Is Coming', game: 'Alt-Tab Reflex' },
  { id: 8, title: 'The Great Sneak', game: 'Office Stealth' },
  { id: 9, title: 'Tell Me About Yourself', game: 'Résumé Stack' },
  { id: 10, title: 'The Chase', game: 'Office Runner' },
  { id: 11, title: 'The Brain Dump', game: 'Pour the KT' },
  { id: 12, title: 'The Number', game: 'Salary Poker' },
  { id: 13, title: 'No-Dues Crossing', game: 'Laptop Run' },
  { id: 14, title: 'Reply-All Storm', game: 'Inbox Invaders' },
  { id: 17, title: 'One Last Quick Call', game: 'Office Brawl (2D fight)' },
  { id: 15, title: 'The Relieving Letter', game: 'Final Boss' },
  { id: 18, title: 'Stress Buster', game: 'Smash the office (bonus)', bonus: true },
];

export const ENDINGS = {
  exploring: 'ending:EXPLORING OPPORTUNITIES',
  terminated: 'ending:TERMINATED DURING NOTICE',
  revoked: 'ending:OFFER REVOKED',
};
export const SECOND_CHANCE = 'branch:SECOND CHANCE';

export const HERO_LOOKS = [
  { id: 'a', skin: '#c68863', hair: '#1d1d1d', shirt: '#3d7be0', hairStyle: 'short' },
  { id: 'b', skin: '#8d5a3b', hair: '#111111', shirt: '#e0503d', hairStyle: 'long' },
  { id: 'c', skin: '#e2b48f', hair: '#5a3a22', shirt: '#2fa36b', hairStyle: 'curly' },
  { id: 'd', skin: '#a8714f', hair: '#2b2b2b', shirt: '#f2b21b', hairStyle: 'bun' },
] as const;
export type HeroLook = (typeof HERO_LOOKS)[number];

export function clampMeters(m: Meters): Meters {
  return {
    job: Math.max(0, Math.min(RULES.max.job, m.job)),
    blame: Math.max(0, Math.min(RULES.max.blame, m.blame)),
    sanity: Math.max(0, Math.min(RULES.max.sanity, m.sanity)),
  };
}

export function winEnding(stars: Record<number, number>, blame: number): { title: string; blurb: string } {
  const total = Object.values(stars).reduce((a, b) => a + b, 0);
  if (total >= RULES.cleanStars) return { title: 'THE CLEAN GETAWAY', blurb: `${total} of 51 stars. Legends speak of you in the canteen.` };
  if (blame <= RULES.boomerangBlame) return { title: 'THE BOOMERANG', blurb: '"Door\'s always open!" (It isn\'t.)' };
  return { title: 'RELIEVED', blurb: 'Signed, stamped, and out. Mostly in one piece.' };
}
