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
  cleanStars: 40,
};

/** Level number -> mini-game module (games/<key>.ts). */
export const LEVEL_GAMES: Record<number, string> = {
  1: 'rage', 2: 'darts', 3: 'maze', 4: 'slice', 5: 'slingshot', 6: 'pong', 7: 'alttab', 8: 'stealth',
  9: 'stack', 10: 'runner', 11: 'pour', 12: 'poker', 13: 'crossing', 14: 'invaders', 15: 'boss',
};

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
  const total = Array.from({ length: 15 }, (_, i) => stars[i + 1] ?? 0).reduce((a, b) => a + b, 0);
  if (total >= RULES.cleanStars) return { title: 'THE CLEAN GETAWAY', blurb: `${total} of 45 stars. Legends speak of you in the canteen.` };
  if (blame <= RULES.boomerangBlame) return { title: 'THE BOOMERANG', blurb: '"Door\'s always open!" (It isn\'t.)' };
  return { title: 'RELIEVED', blurb: 'Signed, stamped, and out. Mostly in one piece.' };
}
