'use client';
import { useEffect, useState } from 'react';
import { LEVEL_GAMES } from '@/lib/rules';

type Row = { level: number; key: string; skill: string; counts: number[]; avgStars: number; avgSeconds: number; avgScore?: number | null };

/** Runs every mini game with an average and a skilled bot, then prints the star spread. */
export default function BotLab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState('starting…');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let stop = false;
    (async () => {
      const { runLevel } = await import('@/games/botlab');
      const q = new URLSearchParams(window.location.search);
      const runs = Number(q.get('runs') ?? 16);
      const only = q.get('levels')?.split(',').map(Number);
      const out: Row[] = [];
      const levels = Object.keys(LEVEL_GAMES).map(Number).filter((n) => !only || only.includes(n));
      const plan: { level: number; skill: string; k: number; hard?: boolean; diff?: 'easy' | 'hard' }[] = [];
      for (const level of levels) {
        plan.push({ level, skill: 'average', k: 0.45 }, { level, skill: 'skilled', k: 0.9 });
        plan.push({ level, skill: 'average · Free Play easy', k: 0.45, diff: 'easy' }, { level, skill: 'average · Free Play hard', k: 0.45, diff: 'hard' });
        if (level === 9) plan.push({ level, skill: 'average (story hard mode)', k: 0.45, hard: true });
      }
      for (const p of plan) {
        if (stop) return;
        setStatus(`Level ${p.level} · ${p.skill}…`);
        try {
          const r = await runLevel(LEVEL_GAMES[p.level], runs, p.k, { hard: !!p.hard || (p.diff === 'hard' && (p.level === 9 || p.level === 12)), difficulty: p.diff });
          out.push({ level: p.level, key: LEVEL_GAMES[p.level], skill: p.skill, ...r });
        } catch (e) {
          out.push({ level: p.level, key: LEVEL_GAMES[p.level], skill: p.skill + ' ERROR ' + String(e), counts: [0, 0, 0, 0], avgStars: 0, avgSeconds: 0 });
        }
        setRows([...out]);
      }
      setStatus('done');
      setDone(true);
    })();
    return () => { stop = true; };
  }, []);

  return (
    <main style={{ padding: 16, maxWidth: 900 }}>
      <h1>Bot lab</h1>
      <p id="status">{status}</p>
      <table cellPadding={4} style={{ borderCollapse: 'collapse', fontSize: 13 }}>
        <thead><tr><th>Level</th><th>Game</th><th>Bot</th><th>0★</th><th>1★</th><th>2★</th><th>3★</th><th>Avg ★</th><th>Avg secs</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderTop: '1px solid #ccc' }}>
              <td>{r.level}</td><td>{r.key}</td><td>{r.skill}</td>
              {r.counts.map((c, j) => <td key={j}>{c}</td>)}
              <td><b>{r.avgStars}</b></td><td>{r.avgSeconds}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {done && <pre id="out">{JSON.stringify(rows.map((r) => [r.level, r.skill, r.counts.join('/'), r.avgStars, r.avgSeconds, r.avgScore]))}</pre>}
    </main>
  );
}
