// L4 · Slice the Invites: swipe meeting invites before they land on your calendar. Never slice the Overlord's gold invite.
import * as Phaser from 'phaser';
import { MiniGame, W, H, C, INK, pick, rand, segHitsCircle } from './kit';

const NAMES = ['Quick Sync (2 hrs)', 'Alignment on the Alignment', 'Pre-read for Pre-meeting', 'Brainstorm (cams ON)', 'Fun Friday Committee', 'Phoenix: who owns this?', 'Touch base', 'Status on the status'];

type Inv = { c: Phaser.GameObjects.Container; vx: number; vy: number; gold: boolean; dead: boolean; r: number };

export default class Slice extends MiniGame {
  invs: Inv[] = [];
  landed = 0;
  goldCut = 0;
  last: { x: number; y: number } | null = null;
  trail!: Phaser.GameObjects.Graphics;
  slots: Phaser.GameObjects.Rectangle[] = [];

  create() {
    this.invs = []; this.landed = 0; this.goldCut = 0; this.last = null; this.slots = [];
    this.paper(0xf0f4ff);
    this.hud('CALENDAR CARNAGE');
    this.body(W / 2, 64, this.hint('Your afternoon (8 slots). Swipe to slice invites!', 'Your afternoon (8 slots). Drag the mouse to slice invites!'), 13);
    for (let i = 0; i < 8; i++) this.slots.push(this.add.rectangle(30 + i * 48, H - 26, 42, 30, 0xffffff).setStrokeStyle(2, INK));
    this.trail = this.add.graphics();
    this.startTimer(42, () => this.end());
    const loop = () => {
      if (this.ended) return;
      this.launch();
      if (Math.random() < 0.12 + (42 - this.timeLeft) / 120) this.time.delayedCall(220, () => this.launch());
      this.time.delayedCall(Math.max(700, 1500 - (42 - this.timeLeft) * 16), loop);
    };
    this.time.delayedCall(500, loop);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => (this.last = { x: p.x, y: p.y }));
    this.input.on('pointerup', () => (this.last = null));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!p.isDown || !this.last) return;
      const a = this.last;
      let cut = 0;
      for (const v of this.invs) {
        if (!v.dead && segHitsCircle(a.x, a.y, p.x, p.y, v.c.x, v.c.y, v.r)) { this.cut(v); cut++; }
      }
      if (cut >= 3) this.pop(p.x, p.y - 30, `DECLINED ×${cut}`, '#ffd23f', 24);
      this.trail.lineStyle(5, 0xffffff, 0.9).lineBetween(a.x, a.y, p.x, p.y);
      this.time.delayedCall(90, () => this.trail.clear());
      this.last = { x: p.x, y: p.y };
    });
  }

  launch() {
    const gold = Math.random() < 0.12;
    const x = rand(60, W - 60);
    const bg = this.add.rectangle(0, 0, 130, 46, gold ? C.yellow : 0xffffff).setStrokeStyle(3, INK);
    const head = this.add.rectangle(0, -17, 130, 12, gold ? C.orange : C.blue);
    const t = this.body(0, 4, gold ? '★ THE OVERLORD: Town Hall' : pick(NAMES), 10, '#141414', { wordWrap: { width: 120 } });
    const c = this.add.container(x, H + 30, [bg, head, t]);
    this.invs.push({ c, vx: (W / 2 - x) * rand(0.2, 0.6), vy: -rand(560, 700) - this.stress * 60, gold, dead: false, r: 48 });
  }

  cut(v: Inv) {
    v.dead = true;
    if (v.gold) {
      this.goldCut++;
      this.cameras.main.flash(250, 230, 57, 70);
      this.pop(v.c.x, v.c.y, 'YOU DECLINED THE OVERLORD', '#e63946', 18);
    } else this.pop(v.c.x, v.c.y, 'SLICE!', '#2fa36b', 22);
    this.tweens.add({ targets: v.c, angle: 40, alpha: 0, scale: 0.6, duration: 300, onComplete: () => v.c.destroy() });
  }

  update(_: number, dt: number) {
    if (this.ended) return;
    const s = dt / 1000;
    for (const v of this.invs) {
      if (v.dead) continue;
      v.vy += 620 * s;
      v.c.x += v.vx * s;
      v.c.y += v.vy * s;
      v.c.angle += v.vx * s * 0.2;
      if (v.vy > 0 && v.c.y > H - 60) {
        v.dead = true;
        v.c.destroy();
        if (!v.gold) {
          if (this.landed < 8) this.slots[this.landed].setFillStyle(C.red);
          this.landed++;
          this.shake(0.008);
          if (this.landed >= 8) this.end();
        }
      }
    }
    this.invs = this.invs.filter((v) => !v.dead);
    this.setScore(`Free slots: ${Math.max(0, 8 - this.landed)}`);
  }

  end() {
    const free = Math.max(0, 8 - this.landed);
    const s = (free >= 6 ? 3 : free >= 4 ? 2 : free >= 2 ? 1 : 0) - this.goldCut;
    this.finish(Math.max(0, s));
  }
}
