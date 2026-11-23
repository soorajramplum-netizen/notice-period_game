'use client';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@astryxdesign/core/Button';
import { TextInput } from '@astryxdesign/core/TextInput';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import comicData from '@/content/comic.json';
import type { Comic, Device, Difficulty, Effects, LevelItem, Meters, PageItem } from '@/lib/types';
import { RULES, LEVEL_GAMES, FREE_PLAY, ENDINGS, SECOND_CHANCE, HERO_LOOKS, clampMeters, winEnding } from '@/lib/rules';
import { CoverView, PageView, PanelView, FxChips, type Ctx } from './Comic';
import { Figure } from './Figures';

const PhaserHost = dynamic(() => import('@/games/PhaserHost'), { ssr: false });
const comic = comicData as unknown as Comic;
const SAVE_KEY = 'notice-period-save-v1';
const FREE_KEY = 'notice-period-free-v1';

/** Story levels in the order players meet them (ids are stable; the number shown is this order). */
const STORY_ORDER: number[] = [1, 2, 3, 4, 5].flatMap((n) =>
  comic.sequences[`issue${n}`].items.flatMap((i) => (i.type === 'level' ? [i.n] : [])),
);
const levelNo = (id: number) => STORY_ORDER.indexOf(id) + 1;
const findLevel = (id: number) => {
  for (const sq of Object.values(comic.sequences)) for (const i of sq.items) if (i.type === 'level' && i.n === id) return i;
  return null;
};
type Best = Record<string, number>; // `${id}:${difficulty}` -> best stars
function loadBest(): Best { try { return JSON.parse(localStorage.getItem(FREE_KEY) || '{}') as Best; } catch { return {}; } }

type Mode = 'title' | 'setup' | 'story' | 'intro' | 'play' | 'result' | 'over' | 'win' | 'free' | 'fplay' | 'fresult';
type Pos = { seq: string; idx: number };
type Save = {
  name: string; lookId: string; notes: boolean; device: Device;
  pos: Pos; meters: Meters; stars: Record<number, number>;
  snapshot: { pos: Pos; meters: Meters; stars: Record<number, number> };
  choices: Record<string, number>;
  returnTo: Pos | null; secondChance: boolean; lateToInterview: boolean; bossRetried?: boolean;
  stats: { blamed: number; choices: number };
};

const guessDevice = (): Device =>
  typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches ? 'mobile' : 'desktop';

const fresh = (name = '', lookId = 'a', notes = true, device: Device = guessDevice()): Save => ({
  name, lookId, notes, device,
  pos: { seq: 'issue1', idx: 0 }, meters: { ...RULES.start }, stars: {},
  snapshot: { pos: { seq: 'issue1', idx: 0 }, meters: { ...RULES.start }, stars: {} },
  choices: {}, returnTo: null, secondChance: false, lateToInterview: false, stats: { blamed: 0, choices: 0 },
});

function loadSave(): Save | null {
  try { const s = localStorage.getItem(SAVE_KEY); return s ? ({ device: guessDevice(), ...JSON.parse(s) } as Save) : null; } catch { return null; }
}
function cssVar(n: string, fallback: string) {
  if (typeof window === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || fallback;
}

export default function Game() {
  const [mode, setMode] = useState<Mode>('title');
  const [save, setSave] = useState<Save>(fresh());
  const [hasSave, setHasSave] = useState(false);
  const [lastResult, setLastResult] = useState<{ level: LevelItem; stars: number } | null>(null);
  const [lvlOverride, setLvlOverride] = useState<LevelItem | null>(null);
  // Free Play
  const [fpId, setFpId] = useState<number>(16);
  const [diff, setDiff] = useState<Difficulty>('medium');
  const [fpRun, setFpRun] = useState(0);
  const [fpStars, setFpStars] = useState(0);
  const [best, setBest] = useState<Best>({});

  // Reads the device save once on mount (localStorage only exists in the browser, so this can't be initial state).
  useEffect(() => {
    const s = loadSave();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (s) { setHasSave(true); setSave(s); }
    setBest(loadBest());
    // Dev shortcut: /?level=7 opens that level's intro; add &autoplay=1 to start it straight away.
    const q = new URLSearchParams(window.location.search);
    const n = Number(q.get('level'));
    if (n) {
      for (const sq of Object.values(comic.sequences)) {
        const idx = sq.items.findIndex((i) => i.type === 'level' && i.n === n);
        if (idx >= 0) { setSave({ ...fresh(s?.name || 'Tester', s?.lookId), pos: { seq: sq.id, idx } }); setMode(q.get('autoplay') ? 'play' : 'intro'); break; }
      }
    }
  }, []);
  useEffect(() => {
    if (mode === 'title' || mode === 'setup') return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* storage is optional */ }
  }, [save, mode]);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [save.pos.seq, save.pos.idx, mode]);

  const look = HERO_LOOKS.find((l) => l.id === save.lookId) ?? HERO_LOOKS[0];
  const ctx: Ctx = { name: save.name || 'You', look, notes: save.notes };
  const seq = comic.sequences[save.pos.seq];
  const item = seq?.items[save.pos.idx];
  const level: LevelItem | null = lvlOverride ?? (item?.type === 'level' ? item : null);

  const applyFx = (s: Save, fx: Effects): Save => {
    const m = clampMeters({ job: s.meters.job + (fx.job ?? 0), blame: s.meters.blame + (fx.blame ?? 0), sanity: s.meters.sanity + (fx.sanity ?? 0) });
    return { ...s, meters: m, stats: { ...s.stats, blamed: s.stats.blamed + ((fx.blame ?? 0) > 0 ? 1 : 0) } };
  };

  const goto = (s: Save, pos: Pos): Save => {
    const seqTo = comic.sequences[pos.seq];
    const snap = seqTo.kind === 'issue' && pos.idx === 0 ? { pos, meters: s.meters, stars: s.stars } : s.snapshot;
    return { ...s, pos, snapshot: snap };
  };

  const toEnding = (s: Save, id: string) => { setSave(goto(s, { seq: id, idx: 0 })); setMode('story'); };

  /** Move past the current item. */
  const next = (s0: Save = save) => {
    let s = s0;
    if (s.meters.blame >= RULES.blameLimit && seq.kind !== 'ending') return toEnding(s, ENDINGS.terminated);
    const items = seq.items;
    if (s.pos.idx + 1 < items.length) {
      s = goto(s, { seq: s.pos.seq, idx: s.pos.idx + 1 });
      setSave(s);
      setMode(items[s.pos.idx].type === 'level' ? 'intro' : 'story');
      return;
    }
    if (seq.kind === 'issue') {
      if ((seq.num ?? 1) < 5) { setSave(goto(s, { seq: `issue${(seq.num ?? 1) + 1}`, idx: 0 })); setMode('story'); }
      else setMode('win');
      return;
    }
    if (seq.id === SECOND_CHANCE) {
      const l9 = comic.sequences.issue3.items.find((i) => i.type === 'level' && i.n === 9) as LevelItem;
      setLvlOverride(l9);
      setSave({ ...s, secondChance: true });
      setMode('intro');
      return;
    }
    setMode('over');
  };

  const onLevelDone = (stars: number) => {
    const lv = level!;
    setLastResult({ level: lv, stars });
    setMode('result');
  };

  const afterResult = () => {
    if (!lastResult) return;
    const { level: lv, stars } = lastResult;
    // The final boss gets one free retry: losing 25 minutes of play on one level is too harsh.
    if (lv.n === 15 && stars === 0 && !save.bossRetried) {
      setLastResult(null);
      setSave({ ...save, bossRetried: true });
      setMode('intro');
      return;
    }
    const key = stars >= 3 ? '3' : stars >= 1 ? '2' : '0';
    let s = applyFx(save, lv.results[key]?.fx ?? {});
    s = { ...s, stars: { ...s.stars, [lv.n]: Math.max(s.stars[lv.n] ?? 0, stars) } };
    if (lv.n === 8 && stars === 0) s.lateToInterview = true;
    setLastResult(null);
    if (lvlOverride) {
      setLvlOverride(null);
      if (s.meters.job >= RULES.offerThreshold && s.returnTo) { const r = s.returnTo; s.returnTo = null; setSave(goto(s, r)); setMode('story'); }
      else toEnding(s, ENDINGS.exploring);
      return;
    }
    if (s.meters.blame >= RULES.blameLimit) return toEnding(s, ENDINGS.terminated);
    if (lv.n === 15 && stars === 0) return toEnding(s, ENDINGS.revoked);
    if (lv.n === 12 && s.meters.job < RULES.offerThreshold) {
      s.returnTo = { seq: s.pos.seq, idx: s.pos.idx + 1 };
      setSave(goto(s, { seq: SECOND_CHANCE, idx: 0 }));
      setMode('story');
      return;
    }
    next(s);
  };

  const choose = (panelIdx: number, optIdx: number, fx: Effects) => {
    const k = `${save.pos.seq}:${save.pos.idx}:${panelIdx}`;
    if (save.choices[k] !== undefined) return;
    const s = applyFx(save, fx);
    setSave({ ...s, choices: { ...s.choices, [k]: optIdx }, stats: { ...s.stats, choices: s.stats.choices + 1 } });
  };

  const chosenFor = useMemo(() => {
    const out: Record<number, number> = {};
    for (const [k, v] of Object.entries(save.choices)) {
      const [sq, ix, p] = k.split(':');
      if (sq === save.pos.seq && Number(ix) === save.pos.idx) out[Number(p)] = v;
    }
    return out;
  }, [save.choices, save.pos]);

  const retryIssue = () => {
    const snap = save.snapshot;
    setLvlOverride(null);
    setSave({ ...save, pos: snap.pos, meters: snap.meters, stars: snap.stars, returnTo: null, secondChance: false, bossRetried: false });
    setMode('story');
  };
  const startOver = () => { setLvlOverride(null); setSave(fresh(save.name, save.lookId, save.notes, save.device)); setMode('story'); };

  const fpDone = (stars: number) => {
    setFpStars(stars);
    const k = `${fpId}:${diff}`;
    const nb = { ...best, [k]: Math.max(best[k] ?? 0, stars) };
    setBest(nb);
    try { localStorage.setItem(FREE_KEY, JSON.stringify(nb)); } catch { /* storage is optional */ }
    setMode('fresult');
  };

  /** Where Continue will take you, in words. */
  const resumeLabel = (() => {
    const sq = comic.sequences[save.pos.seq];
    if (!sq) return 'Continue';
    const it = sq.items[save.pos.idx];
    const where = sq.kind === 'issue' ? `#${sq.num} ${sq.title}` : sq.title;
    return it?.type === 'level' ? `Continue · ${where} · Level ${levelNo(it.n) || ''}` : `Continue · ${where}`;
  })();

  const gameCtx = {
    device: save.device,
    sanity: save.meters.sanity,
    hard: (level?.n === 9 && (save.secondChance || save.lateToInterview)) || false,
    stars: save.stars,
    font: cssVar('--font-bangers', 'Impact'),
    bodyFont: cssVar('--font-comic', 'Arial'),
    done: onLevelDone,
  };

  // ---------- screens ----------
  if (mode === 'title') {
    return (
      <main className="title-screen">
        <div className="logo">NOTICE<br />PERIOD</div>
        <div className="byline">By Sooraj Ram</div>
        <div className="logo-sub">A motion comic in 5 issues · 17 levels · ~30 min</div>
        <svg viewBox="0 0 120 140" className="title-fig"><Figure id="hero" mood="shout" look={HERO_LOOKS[0]} /></svg>
        <div className="title-quote">&ldquo;Got 5 mins? 🙂&rdquo;</div>
        <div className="mode-card">
          <div className="mode-title">📖 STORY MODE</div>
          <div className="mode-sub">The full comic. Progress saves on this device, so you can stop any time and pick up where you left off.</div>
          <div className="title-btns">
            {hasSave && <Button label={resumeLabel} variant="primary" size="lg" onClick={() => setMode(comic.sequences[save.pos.seq]?.items[save.pos.idx]?.type === 'level' ? 'intro' : 'story')} />}
            <Button label={hasSave ? 'New story' : 'Start the story'} variant={hasSave ? 'secondary' : 'primary'} size="lg" onClick={() => setMode('setup')} />
          </div>
        </div>
        <div className="mode-card">
          <div className="mode-title">🎮 FREE PLAY</div>
          <div className="mode-sub">Skip the story. Pick any game, choose Easy, Medium or Hard, and chase three stars.</div>
          <div className="title-btns"><Button label="Play the games" variant="secondary" size="lg" onClick={() => setMode('free')} /></div>
        </div>
        <p className="fine">All characters and companies are fictional. Any resemblance to your manager is your manager&apos;s problem.</p>
      </main>
    );
  }

  if (mode === 'free') {
    return (
      <main className="free">
        <div className="free-top">
          <Button label="◀ Title" variant="ghost" onClick={() => setMode('title')} />
          <h1 className="setup-h">FREE PLAY</h1>
        </div>
        <div className="seg">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
            <Button key={d} label={d === 'easy' ? '😌 Easy' : d === 'medium' ? '😐 Medium' : '😤 Hard'} variant={diff === d ? 'primary' : 'secondary'} onClick={() => setDiff(d)} />
          ))}
        </div>
        <div className="seg">
          <Button label="📱 Phone" variant={save.device === 'mobile' ? 'primary' : 'secondary'} onClick={() => setSave({ ...save, device: 'mobile' })} />
          <Button label="💻 Computer" variant={save.device === 'desktop' ? 'primary' : 'secondary'} onClick={() => setSave({ ...save, device: 'desktop' })} />
        </div>
        <div className="fp-grid">
          {FREE_PLAY.map((g, i) => {
            const b = best[`${g.id}:${diff}`] ?? 0;
            return (
              <button key={g.id} className={`fp-card ${g.bonus ? 'bonus' : ''}`} onClick={() => { setFpId(g.id); setFpRun((r) => r + 1); setMode('fplay'); }}>
                <span className="fp-no">{g.bonus ? 'BONUS' : `#${i + 1}`}</span>
                <span className="fp-title">{g.title}</span>
                <span className="fp-game">{g.game}</span>
                <span className="fp-best">{'★'.repeat(b)}{'☆'.repeat(3 - b)}</span>
              </button>
            );
          })}
        </div>
      </main>
    );
  }

  if (mode === 'fplay' || mode === 'fresult') {
    const g = FREE_PLAY.find((x) => x.id === fpId)!;
    const lv = findLevel(fpId);
    return (
      <main className="playwrap">
        <div className="hud">
          <div className="hud-title">FREE PLAY · {g.title} · {diff.toUpperCase()}</div>
          {lv?.intro && <div className="fp-intro">{lv.intro}</div>}
        </div>
        {mode === 'fplay' ? (
          <PhaserHost
            key={`fp-${fpId}-${diff}-${fpRun}`}
            gameKey={LEVEL_GAMES[fpId]}
            ctx={{ ...gameCtx, difficulty: diff, sanity: 7, hard: diff === 'hard' && (fpId === 9 || fpId === 12), done: fpDone }}
          />
        ) : (
          <div className="intro-card">
            <div className="lvl-title">{g.title}</div>
            <div className="result-stars">{'★'.repeat(fpStars)}{'☆'.repeat(3 - fpStars)}</div>
            <p className="lvl-intro">Best on {diff}: {'★'.repeat(best[`${fpId}:${diff}`] ?? 0) || 'none yet'}</p>
            <div className="title-btns">
              <Button label="Play again" variant="primary" onClick={() => { setFpRun((r) => r + 1); setMode('fplay'); }} />
              <Button label="All games" onClick={() => setMode('free')} />
            </div>
          </div>
        )}
      </main>
    );
  }

  if (mode === 'setup') {
    return (
      <main className="setup">
        <h1 className="setup-h">WHO&apos;S QUITTING?</h1>
        <TextInput label="Your hero's name" value={save.name} onChange={(v) => setSave({ ...save, name: v.slice(0, 16) })} placeholder="e.g. Priya" />
        <div className="looks">
          {HERO_LOOKS.map((l) => (
            <button key={l.id} className={`look ${save.lookId === l.id ? 'on' : ''}`} onClick={() => setSave({ ...save, lookId: l.id })} aria-label={`Look ${l.id}`}>
              <svg viewBox="0 0 120 140"><Figure id="hero" look={l} /></svg>
            </button>
          ))}
        </div>
        <div className="device-q">
          <div className="device-label">Where are you playing?</div>
          <div className="device-opts">
            <Button label="📱 Phone (touch)" variant={save.device === 'mobile' ? 'primary' : 'secondary'} onClick={() => setSave({ ...save, device: 'mobile' })} />
            <Button label="💻 Computer (mouse + keys)" variant={save.device === 'desktop' ? 'primary' : 'secondary'} onClick={() => setSave({ ...save, device: 'desktop' })} />
          </div>
        </div>
        <label className="notes-toggle">
          <input type="checkbox" checked={save.notes} onChange={(e) => setSave({ ...save, notes: e.target.checked })} />
          Show scene notes under each panel (recommended until the final art is in)
        </label>
        <Button label="Resign. Begin Issue #1 ▶" variant="primary" size="lg" isDisabled={!save.name.trim()} onClick={() => { setSave(fresh(save.name.trim(), save.lookId, save.notes, save.device)); setMode('story'); }} />
      </main>
    );
  }

  const hud = (
    <div className="hud">
      <div className="hud-title">{seq?.kind === 'issue' ? `#${seq.num} · ${seq.title}` : seq?.title}</div>
      <div className="meters">
        <ProgressBar label="💼 Job Hunt" value={save.meters.job} max={100} variant="success" hasValueLabel formatValueLabel={(v) => `${v}`} />
        <ProgressBar label="🎯 Blame" value={save.meters.blame} max={100} variant="error" hasValueLabel formatValueLabel={(v) => `${v}`} />
        <ProgressBar label="🔋 Sanity" value={save.meters.sanity} max={10} variant="warning" hasValueLabel formatValueLabel={(v) => `${v}/10`} />
      </div>
    </div>
  );

  if (mode === 'win') {
    const end = winEnding(save.stars, save.meters.blame);
    const total = Object.values(save.stars).reduce((a, b) => a + b, 0);
    const share = `NOTICE PERIOD: ${ctx.name} got "${end.title}". ⭐ ${total}/51 · Blamed ${save.stats.blamed} times · Blame left: ${save.meters.blame}. Got 5 mins? 🙂`;
    return (
      <main className="win">
        <div className="share-card">
          <div className="masthead small">NOTICE PERIOD</div>
          <div className="ending-kicker">THE ENDING</div>
          <div className="ending-title">{end.title}</div>
          <svg viewBox="0 0 120 140" className="win-fig"><Figure id="hero" mood="smug" look={look} /></svg>
          <div className="ending-hero">starring {ctx.name}</div>
          <p className="ending-blurb">{end.blurb}</p>
          <div className="stats">
            <span>⭐ {total}/51</span><span>🎯 blamed {save.stats.blamed}×</span><span>🧾 choices {save.stats.choices}</span>
          </div>
          <div className="stargrid">
            {STORY_ORDER.map((id) => <span key={id}>{'★'.repeat(save.stars[id] ?? 0) || '·'}</span>)}
          </div>
        </div>
        <div className="title-btns">
          <Button label="Copy share text" variant="primary" onClick={() => navigator.clipboard?.writeText(share)} />
          <Button label="Play again" onClick={startOver} />
        </div>
      </main>
    );
  }

  if (mode === 'over') {
    return (
      <main className="over">
        <div className="over-title">GAME OVER</div>
        <p>{seq?.title}</p>
        <div className="title-btns">
          <Button label="Retry this Issue" variant="primary" onClick={retryIssue} />
          <Button label="Start over" onClick={startOver} />
        </div>
      </main>
    );
  }

  if ((mode === 'intro' || mode === 'play') && level) {
    return (
      <main className="playwrap">
        {hud}
        {mode === 'intro' ? (
          <div className="intro-card">
            <div className="lvl-no">LEVEL {levelNo(level.n)} OF {STORY_ORDER.length}</div>
            <div className="lvl-title">{level.title}</div>
            <div className="lvl-game">{level.game}</div>
            <p className="lvl-intro">{level.intro}</p>
            {(level.n === 9 && (save.secondChance || save.lateToInterview)) && <p className="lvl-hard">Hard mode: you start with a wobble.</p>}
            {level.n === 15 && save.bossRetried && <p className="lvl-hard">Madame Policy: &ldquo;Form rejected. Resubmit.&rdquo; Last chance.</p>}
            <Button label="PLAY ▶" variant="primary" size="lg" onClick={() => setMode('play')} />
          </div>
        ) : (
          <PhaserHost key={`${level.n}-${save.pos.seq}-${save.pos.idx}`} gameKey={LEVEL_GAMES[level.n]} ctx={gameCtx} />
        )}
      </main>
    );
  }

  if (mode === 'result' && lastResult) {
    const key = lastResult.stars >= 3 ? '3' : lastResult.stars >= 1 ? '2' : '0';
    const r = lastResult.level.results[key];
    return (
      <main className="reader">
        {hud}
        <div className="page" onClick={afterResult}>
          <div className="result-stars">{'★'.repeat(lastResult.stars)}{'☆'.repeat(3 - lastResult.stars)}</div>
          <PanelView panel={{ kind: 'panel', label: '', desc: `{HERO} ${(r?.lines ?? []).map((l) => `${l.who} ${l.text}`).join(' ')}`, lines: r?.lines ?? [] }} ctx={{ ...ctx, notes: false }} />
          <FxChips fx={r?.fx ?? {}} />
          <div className="pager" onClick={(e) => e.stopPropagation()}><span /><Button label="Continue ▶" variant="primary" onClick={afterResult} /></div>
        </div>
      </main>
    );
  }

  if (item?.type === 'cover') {
    return <main className="reader"><CoverView cover={item} num={seq.num ?? 1} title={seq.title} ctx={ctx} onNext={() => next()} /></main>;
  }

  if (item?.type === 'page') {
    const prev = seq.items[save.pos.idx - 1];
    return (
      <main className="reader">
        {hud}
        <PageView
          key={`${save.pos.seq}-${save.pos.idx}`}
          page={item as PageItem}
          ctx={ctx}
          chosen={chosenFor}
          onChoose={choose}
          onNext={() => next()}
          onBack={() => setSave({ ...save, pos: { ...save.pos, idx: save.pos.idx - 1 } })}
          canBack={prev?.type === 'page'}
        />
      </main>
    );
  }

  if (item?.type === 'level') return <main className="reader">{hud}<div className="intro-card"><Button label="PLAY ▶" variant="primary" onClick={() => setMode('intro')} /></div></main>;
  return <main className="reader"><Button label="Back to title" onClick={() => setMode('title')} /></main>;
}
