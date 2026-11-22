// L5 · CV Slingshot: launch CVs into company mailboxes across a night skyline. Mind the ATS Black Hole.
import * as Phaser from 'phaser';
import { MiniGame, W, H, C, INK, dist } from './kit';

type Box = { x: number; y: number; baseY: number; kind: 'normal' | 'moving' | 'spiky' | 'referral'; lit: boolean; g: Phaser.GameObjects.Container; win: Phaser.GameObjects.Rectangle };
const ORIGIN = { x: 70, y: 540 };
const G = 520;

export default class Slingshot extends MiniGame {
  boxes: Box[] = [];
  shots = 12;
  points = 0;
  cv: { o: Phaser.GameObjects.Rectangle; vx: number; vy: number } | null = null;
  drag = false;
  hole!: Phaser.GameObjects.Container;
  guide!: Phaser.GameObjects.Graphics;
  band!: Phaser.GameObjects.Graphics;

  create() {
    this.boxes = []; this.shots = 12; this.points = 0; this.cv = null; this.drag = false;
    this.add.rectangle(W / 2, H / 2, W, H, C.sky);
    for (let i = 0; i < 40; i++) this.add.circle(Phaser.Math.Between(0, W), Phaser.Math.Between(50, 300), 1.5, 0xffffff, 0.7);
    this.hud('APPLY-O-MATIC');
    const specs: [number, number, number, Box['kind']][] = [
      [190, 470, 150, 'normal'], [250, 420, 260, 'moving'], [310, 380, 220, 'normal'],
      [360, 450, 200, 'spiky'], [230, 330, 330, 'referral'], [330, 300, 280, 'moving'], [290, 520, 120, 'spiky'],
    ];
    for (const [x, top, hgt, kind] of specs) {
      const b = this.add.rectangle(x, top + hgt / 2 + 20, 46, hgt, 0x2d3a5c).setStrokeStyle(2, INK);
      void b;
      const win = this.add.rectangle(x, top + 60, 30, 24, 0x3b4a70);
      const box = this.add.rectangle(0, 0, 36, 24, kind === 'referral' ? C.yellow : kind === 'spiky' ? C.red : 0xffffff).setStrokeStyle(3, INK);
      const lab = this.body(0, 0, kind === 'referral' ? 'REF ×3' : kind === 'spiky' ? 'IMMED.' : '✉', kind === 'normal' || kind === 'moving' ? 14 : 8);
      const g = this.add.container(x, top, [box, lab]);
      this.boxes.push({ x, y: top, baseY: top, kind, lit: false, g, win });
    }
    const hc = this.add.circle(0, 0, 30, 0x000000).setStrokeStyle(4, C.purple);
    const hl = this.body(0, 0, 'ATS', 12, '#b388ff');
    this.hole = this.add.container(200, 200, [hc, hl]);
    this.add.rectangle(ORIGIN.x, ORIGIN.y + 50, 14, 100, 0x8b5a2b).setStrokeStyle(2, INK);
    this.band = this.add.graphics();
    this.guide = this.add.graphics();
    this.body(W / 2, H - 20, 'Drag back from the slingshot, release to fire', 13, '#ffffff');
    this.setScore('CVs: 12  Lit: 0');
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { if (!this.cv && dist(p.x, p.y, ORIGIN.x, ORIGIN.y) < 90) this.drag = true; });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => { if (this.drag) this.drawAim(p); });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => { if (this.drag) this.fire(p); });
  }

  vel(p: Phaser.Input.Pointer) {
    let dx = ORIGIN.x - p.x, dy = ORIGIN.y - p.y;
    const len = Math.hypot(dx, dy), max = 110;
    if (len > max) { dx *= max / len; dy *= max / len; }
    return { vx: dx * 6.2, vy: dy * 6.2, dx, dy };
  }

  drawAim(p: Phaser.Input.Pointer) {
    const v = this.vel(p);
    this.band.clear().lineStyle(4, 0x5a3a1b).lineBetween(ORIGIN.x - 10, ORIGIN.y, ORIGIN.x - v.dx, ORIGIN.y - v.dy).lineBetween(ORIGIN.x + 10, ORIGIN.y, ORIGIN.x - v.dx, ORIGIN.y - v.dy);
    this.guide.clear().fillStyle(0xffffff, 0.8);
    for (let t = 0.05; t < 0.32; t += 0.05) this.guide.fillCircle(ORIGIN.x + v.vx * t, ORIGIN.y + v.vy * t + 0.5 * G * t * t, 3);
  }

  fire(p: Phaser.Input.Pointer) {
    this.drag = false;
    this.band.clear(); this.guide.clear();
    const v = this.vel(p);
    if (Math.hypot(v.dx, v.dy) < 15) return;
    const o = this.add.rectangle(ORIGIN.x, ORIGIN.y, 18, 24, 0xffffff).setStrokeStyle(2, INK);
    const wind = this.shots < 6 ? Phaser.Math.Between(-60, 60) : 0;
    this.cv = { o, vx: v.vx + wind, vy: v.vy };
    this.shots--;
  }

  land(msg: string, color: string) {
    if (!this.cv) return;
    this.pop(this.cv.o.x, this.cv.o.y, msg, color, 18);
    this.cv.o.destroy();
    this.cv = null;
    this.setScore(`CVs: ${this.shots}  Lit: ${this.points}`);
    if (this.shots <= 0) this.time.delayedCall(500, () => this.finish(this.points >= 7 ? 3 : this.points >= 4 ? 2 : this.points >= 2 ? 1 : 0));
  }

  update(t: number, dt: number) {
    if (this.ended) return;
    this.hole.setPosition(200 + Math.sin(t / 1800) * 120, 230 + Math.cos(t / 2300) * 60);
    for (const b of this.boxes) if (b.kind === 'moving') { b.y = b.baseY + Math.sin(t / 600 + b.x) * 40; b.g.y = b.y; }
    if (!this.cv) return;
    const s = dt / 1000, c = this.cv;
    c.vy += G * s;
    c.o.x += c.vx * s; c.o.y += c.vy * s; c.o.angle += 400 * s;
    if (dist(c.o.x, c.o.y, this.hole.x, this.hole.y) < 38) return this.land('SWALLOWED BY ATS', '#b388ff');
    for (const b of this.boxes) {
      if (Math.abs(c.o.x - b.x) < 26 && Math.abs(c.o.y - b.y) < 20) {
        if (b.kind === 'spiky') { c.vx = -Math.abs(c.vx) * 0.8; c.vy = -200; this.pop(b.x, b.y - 20, 'IMMEDIATE JOINERS ONLY', '#e63946', 14); return; }
        if (!b.lit) { b.lit = true; b.win.setFillStyle(C.yellow); this.points += b.kind === 'referral' ? 3 : 1; }
        else this.points += 0;
        return this.land(b.kind === 'referral' ? 'REFERRAL!' : 'APPLIED!', '#ffd23f');
      }
    }
    if (c.o.y > H || c.o.x > W + 20 || c.o.x < -20) this.land('MISSED', '#aaaaaa');
  }
}
