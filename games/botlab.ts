/* eslint-disable @typescript-eslint/no-explicit-any */
// Bot lab (dev only): plays every mini game headlessly, faster than real time, with bots of different skill.
// Each bot acts through the game's own methods with human-like reaction time and accuracy, so the results
// show whether a level can be won and how the stars spread. Open /botlab in `npm run dev` to run it.
import type { GameCtx } from '@/lib/types';

type Bot = (sc: any, dt: number, m: any, k: number) => void;
const R = Math.random;
const acc = (k: number) => 0.86 + 0.12 * k; // chance an intended action succeeds
const react = (k: number) => 520 - 300 * k + R() * 200; // ms before reacting

const bfs = (sc: any, from: any, to: any) => sc.bfs(from, to) as { x: number; y: number }[] | null;

export const BOTS: Record<string, Bot> = {
  rage(sc, dt, m, k) {
    for (const w of sc.words) {
      if (w.done || !w.angry || w._d) continue;
      w._age = (w._age ?? 0) + dt;
      if (w._age > react(k) + 500) { w._d = true; if (R() < acc(k)) sc.hit(w); }
    }
  },
  darts(sc, dt, m, k) {
    m.t = (m.t ?? 0) + dt;
    if (sc.flying || m.t < 1200) return;
    if (!m.aimed) {
      const b = sc.balloons.find((x: any) => x.active && x.y > 130);
      const useB = b && R() < 0.3;
      const err = 10 + 45 * (1 - k);
      sc.aim = { x: (useB ? b.x : sc.board.x) + (R() - 0.5) * err, y: (useB ? b.y - 12 : sc.board.y) + (R() - 0.5) * err };
      m.aimed = true;
      return;
    }
    m.wait = (m.wait ?? 0) + dt;
    if (m.wait < 250) return;
    sc.throwDart();
    m.t = 0; m.aimed = false; m.wait = 0;
  },
  maze(sc, dt, m, k) {
    m.t = (m.t ?? 0) + dt;
    if (sc.path.length || m.t < 250 + 300 * (1 - k)) return;
    m.t = 0;
    const goal = { x: 7, y: 11 };
    const p = bfs(sc, sc.player, goal);
    if (!p || !p.length) return;
    const n = p[0];
    if (sc.ghostOn && Math.abs(sc.ghost.x - n.x) + Math.abs(sc.ghost.y - n.y) <= 1 && R() < 0.4 + 0.5 * k) return; // wait it out
    sc.slide(n.x - sc.player.x, n.y - sc.player.y);
  },
  slice(sc, dt, m, k) {
    for (const v of sc.invs) {
      if (v.dead || v._d) continue;
      v._age = (v._age ?? 0) + dt;
      if (v._age < react(k) + 150) continue;
      v._d = true;
      if (v.gold) { if (R() < 0.05 * (1 - k)) sc.cut(v); continue; }
      if (R() < acc(k)) sc.cut(v);
    }
  },
  slingshot(sc, dt, m, k) {
    m.t = (m.t ?? 0) + dt;
    if (sc.cv || sc.shots <= 0 || m.t < 900) return;
    m.t = 0;
    const targets = sc.boxes.filter((b: any) => !b.lit && b.kind !== 'spiky').sort((a: any, b: any) => (b.kind === 'referral' ? 1 : 0) - (a.kind === 'referral' ? 1 : 0));
    const tgt = targets[0] ?? sc.boxes.find((b: any) => b.kind !== 'spiky');
    let best: any = null;
    for (let dx = 20; dx <= 110; dx += 3) for (let dy = 10; dy <= 110; dy += 3) {
      const len = Math.hypot(dx, dy); if (len > 110) continue;
      const vx = dx * 6.2, vy = -dy * 6.2;
      const t = (tgt.x - 70) / vx; const y = 540 + vy * t + 0.5 * 520 * t * t;
      const e = Math.abs(y - tgt.y);
      if (!best || e < best.e) best = { dx, dy, e };
    }
    const noise = 2 + 9 * (1 - k);
    sc.fire({ x: 70 - (best.dx + (R() - 0.5) * noise), y: 540 + (best.dy + (R() - 0.5) * noise) });
  },
  pong(sc, dt, m, k) {
    const speed = (330 + 300 * k) * (dt / 1000);
    m.err ??= 0; m.t = (m.t ?? 0) + dt;
    if (m.t > 600) { m.t = 0; m.err = (R() - 0.5) * 70 * (1 - k); }
    const target = sc.ball.x + m.err;
    sc.paddle.x += Math.max(-speed, Math.min(speed, target - sc.paddle.x));
  },
  alttab(sc, dt, m, k) {
    if (sc.incoming) {
      m.seen = (m.seen ?? 0) + dt;
      const looksThreat = sc.incoming.threat || R() < 0.02 * (1 - k) * dt; // averages sometimes panic at false alarms
      if (sc.onPrep && looksThreat && m.seen > react(k) - 150) sc.toggle();
    } else {
      m.seen = 0;
      if (!sc.onPrep) { m.back = (m.back ?? 0) + dt; if (m.back > 300) { sc.toggle(); m.back = 0; } }
    }
  },
  stealth(sc, dt, m, k) {
    const WP = [{ x: 45, y: 520 }, { x: 40, y: 400 }, { x: 300, y: 390 }, { x: 300, y: 300 }, { x: 330, y: 160 }, { x: 350, y: 80 }];
    m.i ??= 0;
    const wp = WP[m.i];
    if (Math.hypot(sc.me.x - wp.x, sc.me.y - wp.y) < 10 && m.i < WP.length - 1) m.i++;
    const look = 26 + 30 * k;
    const a = Math.atan2(wp.y - sc.me.y, wp.x - sc.me.x);
    const nx = sc.me.x + Math.cos(a) * look, ny = sc.me.y + Math.sin(a) * look;
    const danger = sc.guards.some((g: any) => {
      const d = Math.hypot(g.x - nx, g.y - ny); if (d > g.range + 10) return false;
      const ang = Math.atan2(ny - g.y, nx - g.x) - g.dir;
      return Math.abs(Math.atan2(Math.sin(ang), Math.cos(ang))) < g.half + 0.25;
    }) || Math.hypot(sc.ripple.x - nx, sc.ripple.y - ny) < 50;
    sc.target = danger && R() < 0.6 + 0.4 * k ? null : wp;
  },
  stack(sc, dt, m, k) {
    if (sc.dropping || sc.blocks <= 0) return;
    m.tol ??= 4 + R() * 34 * (1 - k);
    if (Math.abs(sc.hanger.x - sc.topX) < m.tol) {
      const bold = sc.wobble < 0.45 + 0.1 * k;
      sc.drop(bold);
      m.tol = undefined;
    }
  },
  runner(sc, dt, m, k) {
    for (const ob of sc.obs) {
      if (ob.hit || ob._d) continue;
      const dx = ob.o.x - 80;
      if (dx < 72 + R() * 26 && dx > 0) {
        ob._d = true;
        if (R() < acc(k)) { if (ob.kind === 'low') sc.jump(); else sc.slide(); }
      }
    }
  },
  pour(sc, dt, m, k) {
    sc.pouring = true;
    for (const h of [...sc.holes]) {
      h._age = (h._age ?? 0) + dt;
      if (h._age > react(k) && R() < acc(k)) sc.plug(h);
    }
  },
  poker(sc, dt, m, k) {
    if (sc.busy || sc.ended) return;
    m.t = (m.t ?? 0) + dt; if (m.t < 700) return; m.t = 0;
    const live = sc.cards.filter((c: any) => c.uses > 0);
    const read = sc.nerve + (R() - 0.5) * 40 * (1 - k);
    const pickId = (id: string) => live.find((c: any) => c.id === id);
    let card = read > 55 ? pickId('hold') : pickId('comp') ?? pickId('rare') ?? pickId('phx') ?? pickId('res') ?? pickId('hold');
    if (read > 40 && card?.id === 'comp') card = pickId('res') ?? pickId('hold');
    if (card) sc.play(card);
  },
  crossing(sc, dt, m, k) {
    m.t = (m.t ?? 0) + dt;
    if (m.t < 200 + 200 * (1 - k)) return;
    m.t = 0;
    const T = 50;
    const unsafe = (c: number, r: number) => sc.movers.some((mv: any) => mv.row === r && Math.abs(mv.o.x + mv.v * (0.25 + 0.2 * k) - (c * T + T / 2)) < mv.w / 2 + 22);
    const left = sc.desks.filter((d: any) => !d.got && (d.name !== 'ADMIN' || sc.adminOpen || Math.abs(d.r - sc.pos.r) > 2));
    if (!left.length) return;
    const d = left.sort((a: any, b: any) => Math.abs(a.c - sc.pos.c) + Math.abs(a.r - sc.pos.r) - (Math.abs(b.c - sc.pos.c) + Math.abs(b.r - sc.pos.r)))[0];
    const opts: [number, number][] = [];
    if (d.r !== sc.pos.r) opts.push([0, Math.sign(d.r - sc.pos.r)]);
    if (d.c !== sc.pos.c) opts.push([Math.sign(d.c - sc.pos.c), 0]);
    for (const [dc, dr] of opts) {
      if (!unsafe(sc.pos.c + dc, sc.pos.r + dr) || R() > acc(k)) { sc.move(dc, dr); return; }
    }
    if (unsafe(sc.pos.c, sc.pos.r)) for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!unsafe(sc.pos.c + dc, sc.pos.r + dr)) { sc.move(dc, dr); return; }
  },
  invaders(sc, dt, m, k) {
    const speed = (300 + 150 * k) * (dt / 1000);
    let tx = sc.ship.x;
    const low = [...sc.invs].sort((a: any, b: any) => b.o.y - a.o.y)[0];
    if (low) tx = low.o.x;
    const bomb = sc.bombs.find((b: any) => Math.abs(b.x - sc.ship.x) < 45 && b.y > sc.ship.y - 160);
    if (bomb && R() < 0.5 + 0.5 * k) tx = sc.ship.x + (bomb.x > sc.ship.x ? -90 : 90);
    sc.ship.x = Math.max(40, Math.min(360, sc.ship.x + Math.max(-speed, Math.min(speed, tx - sc.ship.x))));
  },
  boss(sc, dt, m, k) {
    if (sc.phase === 1) {
      const near = sc.projs.filter((p: any) => Math.hypot(p.o.x - sc.me.x, p.o.y - sc.me.y) < 130 + 40 * k);
      let tx = 200, ty = 560;
      if (near.length && R() < 0.75 + 0.25 * k) {
        const p = near[0]; const a = Math.atan2(p.vy, p.vx) + Math.PI / 2;
        tx = sc.me.x + Math.cos(a) * 80; ty = sc.me.y + Math.sin(a) * 40;
      }
      const sp = 260 * (dt / 1000);
      sc.me.x = Math.max(20, Math.min(380, sc.me.x + Math.max(-sp, Math.min(sp, tx - sc.me.x))));
      sc.me.y = Math.max(320, Math.min(610, sc.me.y + Math.max(-sp, Math.min(sp, ty - sc.me.y))));
    } else if (sc.phase === 2) {
      for (const p of sc.projs) {
        if (p.reflected || !p.glow || p._tried) continue;
        p._seen = (p._seen ?? 0) + dt;
        if (p._seen > react(k) * 0.4) { p._tried = R() > acc(k); if (!p._tried) sc.onDown({ x: p.o.x, y: p.o.y }); }
      }
    } else if (sc.phase === 3 && sc.pen) {
      m.t = (m.t ?? 0) + dt;
      if (!sc.grabbed) { if (m.t > react(k)) { m.t = 0; if (R() < acc(k)) sc.onDown({ x: sc.pen.x, y: sc.pen.y }); } return; }
      const target = { x: 200, y: 570 };
      const zoneNear = sc.zones.some((z: any) => Math.abs(z.y - (sc.pen.y + 30)) < 30 && Math.abs(z.x - sc.pen.x) < 110);
      const step = 7 * (dt / 33);
      const ny = zoneNear && R() < 0.85 + 0.15 * k ? sc.pen.y : sc.pen.y + step;
      const nx = sc.pen.x + Math.max(-step, Math.min(step, target.x - sc.pen.x));
      sc.onMove({ x: nx, y: ny, isDown: true });
      if (Math.abs(sc.pen.y - target.y) < 18 && Math.abs(sc.pen.x - target.x) < 100) sc.onUp({ x: sc.pen.x, y: sc.pen.y });
    }
  },
  toss(sc, dt, m, k) {
    m.t = (m.t ?? 0) + dt;
    if (sc.flying || sc.throws <= 0 || m.t < 700) return;
    m.t = 0;
    // swipe so the ball lands at the bin, leaning into the fan's wind (humans misjudge it a bit)
    const windRead = sc.wind * (0.75 + 0.25 * k + (R() - 0.5) * 0.4 * (1 - k));
    const vx = 200 - 200 - 0.5 * windRead;
    const noise = 1 - k;
    // a thumb swipe is imprecise: about ±12% power and ±25 px sideways for an average player
    sc.launch(vx / 1.6 + (R() - 0.5) * 2 * (10 + 30 * noise), 260 * (1 + (R() - 0.5) * 2 * (0.05 + 0.13 * noise)));
  },
  fight(sc, dt, m, k) {
    const h = sc.hero, b = sc.boss;
    const dist = Math.abs(b.x - h.x);
    sc.held.left = false; sc.held.right = false; sc.held.block = false;
    if (b.act === 'windup') {
      m.saw = (m.saw ?? 0) + dt;
      if (m.saw > (m.r ??= react(k))) {
        if (b.move === 'grab') { if (h.x < b.x) sc.held.left = true; else sc.held.right = true; }
        else if (R() < 0.85 + 0.15 * k) sc.held.block = true;
      }
      return;
    }
    m.saw = 0; m.r = undefined;
    if (sc.projs.some((p: any) => !p.fromHero && Math.abs(p.o.x - h.x) < 120) && R() < acc(k)) { sc.held.block = true; return; }
    if (sc.meter >= 100) sc.heroSpecial();
    if (dist > 72) { if (h.x < b.x) sc.held.right = true; else sc.held.left = true; return; }
    m.t = (m.t ?? 0) + dt;
    if (m.t > 220 + 200 * (1 - k)) { m.t = 0; if (R() < acc(k)) sc.heroAttack(R() < 0.6 ? 'punch' : 'kick'); }
  },
  smash(sc, dt, m, k) {
    for (const th of sc.things) {
      if (!th.o.active || th.hp <= 0) continue;
      th._age = (th._age ?? 0) + dt;
      if (th.bad) { if (!th._d && th._age > 300) { th._d = true; if (R() < 0.06 * (1 - k)) sc.smash(th); } continue; }
      th._next ??= react(k) * 0.8;
      if (th._age > th._next) { th._next = th._age + 120 + 140 * (1 - k); if (R() < acc(k)) sc.smash(th); }
    }
  },
};

const yieldUI = () => new Promise<void>((r) => { const c = new MessageChannel(); c.port1.onmessage = () => r(); c.port2.postMessage(0); });

/** Plays one level `runs` times with a bot of skill k (0 = shaky, 1 = sharp). Returns the star counts. */
export async function runLevel(key: string, runs: number, k: number, extra: Partial<GameCtx> = {}) {
  const Phaser = await import('phaser');
  const mod = (await import(`./${key}`)) as { default: typeof Phaser.Scene };
  const ctx: GameCtx = { device: 'mobile', sanity: 7, hard: false, stars: { 10: 2 }, font: 'Arial', bodyFont: 'Arial', done: () => {}, ...extra };
  const div = document.createElement('div');
  div.style.cssText = 'position:absolute;left:-9999px;width:400px;height:640px';
  document.body.appendChild(div);
  const g = new Phaser.Game({
    type: Phaser.HEADLESS, parent: div, width: 400, height: 640, banner: false, audio: { noAudio: true },
    scene: [mod.default], callbacks: { preBoot: (gm) => { gm.registry.set('ctx', ctx); } },
  });
  while (!g.isRunning) await new Promise((r) => setTimeout(r, 30));
  g.loop.stop();
  const counts = [0, 0, 0, 0];
  const secs: number[] = [];
  const scores: number[] = [];
  const dt = 1000 / 30;
  let t = 0;
  // Tweens time themselves with Date.now(); point it at the simulated clock while the bots play.
  const realNow = Date.now;
  let simNow = realNow();
  Date.now = () => simNow;
  for (let run = 0; run < runs; run++) {
    let sc = g.scene.scenes[0] as any;
    if (run > 0) { sc.scene.restart(); }
    const mem: any = {};
    let steps = 0;
    for (; steps < 30 * 200; steps++) {
      t += dt;
      // Tweens read the loop's clock, so advance it by hand along with the step.
      const loop = g.loop as any;
      loop.delta = dt; loop.rawDelta = dt; loop.time = t; loop.now = t; loop.frame++;
      simNow += dt;
      g.headlessStep(t, dt);
      sc = g.scene.scenes[0] as any;
      if (!sc?.ctx || !sc.sys.isActive()) continue;
      if (sc.lastStars >= 0) break;
      if (!sc.ended) BOTS[key](sc, dt, mem, k);
    }
    const s = sc.lastStars >= 0 ? sc.lastStars : 0;
    if (typeof sc.score === 'number') scores.push(sc.score);
    counts[s]++;
    secs.push(steps / 30);
    if (run % 4 === 3) { Date.now = realNow; await yieldUI(); Date.now = () => simNow; }
  }
  Date.now = realNow;
  g.destroy(true);
  div.remove();
  const avgStars = (counts[1] + 2 * counts[2] + 3 * counts[3]) / runs;
  return { counts, avgStars: Math.round(avgStars * 100) / 100, avgSeconds: Math.round(secs.reduce((a, b) => a + b, 0) / runs), avgScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null };
}
