// Stress Buster (Free Play bonus): office junk pops up — smash it. Big things take several hits.
// Don't smash the CCTV camera. Combos for fast smashing.
import * as Phaser from 'phaser';
import { MiniGame, W, H, C, INK, pick, rand } from './kit';

type Thing = { o: Phaser.GameObjects.Container; hp: number; pts: number; bad: boolean; life: number; label: string };
const ITEMS = [
  { label: '🖨 PRINTER', hp: 3, pts: 5, color: C.grey, w: 110 },
  { label: '☕ "QUICK SYNC" MUG', hp: 1, pts: 1, color: 0xffffff, w: 140 },
  { label: '🖥 MONITOR', hp: 2, pts: 3, color: 0x2c3e50, w: 110 },
  { label: '📎 STAPLER', hp: 1, pts: 1, color: C.red, w: 100 },
  { label: '📊 Q3 DECK', hp: 1, pts: 2, color: C.yellow, w: 100 },
  { label: '🏆 "TEAM PLAYER" AWARD', hp: 2, pts: 3, color: C.orange, w: 150 },
];

export default class Smash extends MiniGame {
  things: Thing[] = [];
  score = 0;
  combo = 0;
  lastHit = 0;

  create() {
    this.things = []; this.score = 0; this.combo = 0; this.lastHit = 0;
    this.paper(0x2b2d42);
    this.hud('STRESS BUSTER');
    this.body(W / 2, 64, this.hint('Tap to smash. NOT the camera 📹.', 'Click to smash. NOT the camera 📹.'), 13, '#ffffff');
    this.setScore('Score: 0');
    // Harder settings spawn more junk, so the star targets scale with difficulty.
    const f = 1 + Math.max(-0.3, this.stress) * 0.3;
    this.startTimer(40, () => this.finish(this.score >= 195 * f ? 3 : this.score >= 135 * f ? 2 : this.score >= 70 * f ? 1 : 0));
    const loop = () => {
      if (this.ended) return;
      this.spawn();
      this.time.delayedCall(Math.max(380, 800 - (40 - this.timeLeft) * 10 - this.stress * 150), loop);
    };
    loop();
  }

  spawn() {
    if (this.things.length > 7) return;
    const bad = Math.random() < 0.14 + Math.max(0, this.stress) * 0.12;
    const it = bad ? { label: '📹 CCTV', hp: 1, pts: -10, color: C.pink, w: 90 } : pick(ITEMS);
    const x = rand(it.w / 2 + 10, W - it.w / 2 - 10), y = rand(120, H - 60);
    const r = this.add.rectangle(0, 0, it.w, 56, it.color).setStrokeStyle(3, INK);
    const t = this.body(0, 0, it.label, 12, it.color === 0x2c3e50 ? '#ffffff' : '#141414', { wordWrap: { width: it.w - 8 } });
    const o = this.add.container(x, y, [r, t]).setScale(0);
    this.tweens.add({ targets: o, scale: 1, duration: 160, ease: 'Back.easeOut' });
    const th: Thing = { o, hp: it.hp, pts: it.pts, bad, life: 2600 - this.stress * 700, label: it.label };
    r.setInteractive().on('pointerdown', () => this.smash(th));
    this.things.push(th);
  }

  smash(th: Thing) {
    if (this.ended || th.hp <= 0) return;
    th.hp--;
    this.shake(0.004);
    th.o.setAngle(rand(-12, 12));
    if (th.hp > 0) { this.pop(th.o.x, th.o.y - 30, 'CRACK!', '#ffd23f', 18); return; }
    const now = this.time.now;
    this.combo = now - this.lastHit < 700 ? this.combo + 1 : 0;
    this.lastHit = now;
    const gain = th.bad ? th.pts : th.pts + Math.min(4, this.combo);
    this.score = Math.max(0, this.score + gain);
    this.pop(th.o.x, th.o.y - 30, th.bad ? 'HR SAW THAT. −10' : this.combo > 1 ? `SMASH ×${this.combo + 1}` : 'SMASH!', th.bad ? '#e63946' : '#7CFC9A', 22);
    for (let i = 0; i < 6; i++) {
      const shard = this.add.rectangle(th.o.x, th.o.y, 10, 6, 0xffffff).setStrokeStyle(1, INK);
      this.tweens.add({ targets: shard, x: th.o.x + rand(-80, 80), y: th.o.y + rand(-60, 90), angle: rand(-200, 200), alpha: 0, duration: 500, onComplete: () => shard.destroy() });
    }
    th.o.destroy();
    this.setScore(`Score: ${this.score}`);
  }

  update(_: number, dt: number) {
    if (this.ended) return;
    for (const th of this.things) {
      th.life -= dt;
      if (th.life <= 0 && th.o.active) this.tweens.add({ targets: th.o, scale: 0, duration: 150, onComplete: () => th.o.destroy() });
    }
    this.things = this.things.filter((t) => t.o.active && t.life > -200);
  }
}
