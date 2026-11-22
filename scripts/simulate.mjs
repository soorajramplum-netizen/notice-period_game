// Balance simulator: plays thousands of runs through content/comic.json using the same rules as the game,
// with three player types (how often they get 3★ / 1–2★ / 0★ on a level). Run: node scripts/simulate.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const comic = JSON.parse(readFileSync(join(root, 'content', 'comic.json'), 'utf8')).sequences;
// Keep in sync with lib/rules.ts
const RULES = JSON.parse(process.env.RULES || '{"start":{"job":0,"blame":10,"sanity":7},"offerThreshold":50,"blameLimit":100,"boomerangBlame":5,"cleanStars":40}');

const PLAYERS = {
  struggling: { p3: 0.15, p2: 0.45 }, // rest = 0 stars
  average: { p3: 0.3, p2: 0.5 },
  skilled: { p3: 0.6, p2: 0.35 },
};
const N = 20000;

const clamp = (m) => ({ job: Math.max(0, Math.min(100, m.job)), blame: Math.max(0, Math.min(100, m.blame)), sanity: Math.max(0, Math.min(10, m.sanity)) });
const apply = (m, fx) => clamp({ job: m.job + (fx.job || 0), blame: m.blame + (fx.blame || 0), sanity: m.sanity + (fx.sanity || 0) });

function stars(p, sanity) {
  // Low sanity makes games harder: shift some probability from 3★ to 0★.
  const pen = Math.max(0, (6 - sanity) / 6) * 0.15;
  const r = Math.random();
  if (r < p.p3 - pen) return 3;
  if (r < p.p3 - pen + p.p2) return 2;
  return 0;
}

function playLevel(lv, m, p, hard = false) {
  const s = stars(hard ? { p3: p.p3 * 0.6, p2: p.p2 } : p, m.sanity);
  return { s, m: apply(m, lv.results[s === 3 ? '3' : s ? '2' : '0'].fx) };
}

function run(p) {
  let m = { ...RULES.start };
  const st = [];
  let minSanity = m.sanity, maxBlame = m.blame;
  for (let n = 1; n <= 5; n++) {
    for (const it of comic[`issue${n}`].items) {
      if (it.type === 'page') for (const pn of it.panels) if (pn.kind === 'choice') m = apply(m, pn.options[Math.floor(Math.random() * pn.options.length)].fx);
      if (it.type !== 'level') continue;
      const r = playLevel(it, m, p);
      m = r.m; st.push(r.s);
      minSanity = Math.min(minSanity, m.sanity); maxBlame = Math.max(maxBlame, m.blame);
      if (m.blame >= RULES.blameLimit) return { end: 'terminated', at: it.n, m, minSanity };
      if (it.n === 12 && m.job < RULES.offerThreshold) {
        const l9 = comic.issue3.items.find((i) => i.type === 'level' && i.n === 9);
        const r2 = playLevel(l9, m, p, true);
        m = r2.m;
        if (m.job < RULES.offerThreshold) return { end: 'exploring', at: 12, m, minSanity, second: true };
        if (m.blame >= RULES.blameLimit) return { end: 'terminated', at: 12, m, minSanity };
      }
      if (it.n === 15 && r.s === 0) {
        // One free retry of the final boss (the failed attempt's penalty is not applied).
        m = r.m; // undo below
        const r3 = playLevel(it, { ...m, blame: m.blame - (it.results['0'].fx.blame || 0) }, p);
        st[st.length - 1] = r3.s; m = r3.m;
        if (r3.s === 0) return { end: 'revoked', at: 15, m, minSanity };
      }
    }
  }
  const total = st.reduce((a, b) => a + b, 0);
  return { end: total >= RULES.cleanStars ? 'clean' : m.blame <= RULES.boomerangBlame ? 'boomerang' : 'relieved', m, minSanity, maxBlame };
}

for (const [name, p] of Object.entries(PLAYERS)) {
  const counts = {};
  let jobAt12 = 0, blameEnd = 0, lowSan = 0;
  for (let i = 0; i < N; i++) {
    const r = run(p);
    counts[r.end] = (counts[r.end] || 0) + 1;
    blameEnd += r.m.blame; jobAt12 += r.m.job;
    if (r.minSanity <= 2) lowSan++;
  }
  const pct = (x) => `${((100 * x) / N).toFixed(1)}%`;
  const wins = (counts.clean || 0) + (counts.boomerang || 0) + (counts.relieved || 0);
  console.log(`\n${name.toUpperCase()} (3★ ${p.p3 * 100}%, 1–2★ ${p.p2 * 100}%)`);
  console.log(`  WIN ${pct(wins)}  ·  ` + Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${pct(v)}`).join(' · '));
  console.log(`  avg final Job ${(jobAt12 / N).toFixed(0)} · avg final Blame ${(blameEnd / N).toFixed(0)} · sanity ever ≤2: ${pct(lowSan)}`);
}
