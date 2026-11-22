// L8 · The Great Sneak: reach the lift without entering a vision cone. Hide behind plants. Chai Uncle opens a shortcut.
import * as Phaser from 'phaser';
import { MiniGame, W, H, C, INK, dist } from './kit';

type Guard = { x: number; y: number; dir: number; range: number; half: number; kind: 'sweep' | 'patrol'; ax?: number; bx?: number; t: number; color: number; name: string };
const START = { x: 50, y: 590 };
const LIFT = { x: 350, y: 80 };

export default class Stealth extends MiniGame {
  me = { ...START };
  target: { x: number; y: number } | null = null;
  guards: Guard[] = [];
  plants = [{ x: 140, y: 470 }, { x: 290, y: 400 }, { x: 90, y: 270 }, { x: 250, y: 200 }, { x: 330, y: 160 }];
  walls: Phaser.Geom.Rectangle[] = [];
  shortcut!: Phaser.Geom.Rectangle;
  shortcutG!: Phaser.GameObjects.Rectangle;
  check = { ...START };
  spotted = 0;
  hidden = false;
  cones!: Phaser.GameObjects.Graphics;
  meG!: Phaser.GameObjects.Arc;
  ripple = { x: 200, y: 330 };
  rippleG!: Phaser.GameObjects.Text;

  create() {
    this.me = { ...START }; this.check = { ...START }; this.spotted = 0; this.target = null;
    this.paper(0xece4d8);
    this.hud('THE GREAT SNEAK');
    this.walls = [new Phaser.Geom.Rectangle(0, 340, 230, 24), new Phaser.Geom.Rectangle(170, 520, 230, 20), new Phaser.Geom.Rectangle(150, 120, 24, 120)];
    this.shortcut = new Phaser.Geom.Rectangle(230, 340, 170, 24);
    for (const w of this.walls) this.add.rectangle(w.centerX, w.centerY, w.width, w.height, 0x8d6e63).setStrokeStyle(3, INK);
    this.shortcutG = this.add.rectangle(this.shortcut.centerX, this.shortcut.centerY, this.shortcut.width, this.shortcut.height, 0xa1887f).setStrokeStyle(3, INK);
    this.body(this.shortcut.centerX, this.shortcut.centerY, 'service door (locked)', 10, '#ffffff');
    for (const d of [[90, 430], [300, 470], [80, 200], [260, 270]]) this.add.rectangle(d[0], d[1], 70, 36, 0xbcaaa4).setStrokeStyle(2, INK);
    for (const p of this.plants) { this.add.circle(p.x, p.y, 22, C.green).setStrokeStyle(3, INK); this.body(p.x, p.y, '🌿', 18); }
    this.add.rectangle(LIFT.x, LIFT.y, 70, 60, C.yellow).setStrokeStyle(3, INK);
    this.label(LIFT.x, LIFT.y, 'LIFT', 22);
    this.add.circle(40, 400, 18, 0xb07a52).setStrokeStyle(3, INK);
    this.body(40, 400, '🍵', 16);
    this.body(40, 428, 'Chai Uncle', 10);
    this.guards = [
      { x: 340, y: 600, dir: Math.PI * 1.2, range: 150, half: 0.45, kind: 'sweep', t: 0, color: C.blue, name: 'Captain' },
      { x: 60, y: 480, dir: 0, range: 120, half: 0.3, kind: 'patrol', ax: 60, bx: 330, t: 0, color: 0x6aa7e6, name: 'Yes-Man' },
      { x: 330, y: 260, dir: Math.PI, range: 120, half: 0.3, kind: 'patrol', ax: 200, bx: 360, t: 0, color: 0x6aa7e6, name: 'Yes-Man' },
    ];
    this.cones = this.add.graphics();
    for (const g of this.guards) (g as Guard & { s?: Phaser.GameObjects.Arc }).s = this.add.circle(g.x, g.y, 14, g.color).setStrokeStyle(3, INK);
    this.rippleG = this.label(this.ripple.x, this.ripple.y, '〰', 30, '#7b3fa0').setAlpha(0.5);
    this.meG = this.add.circle(this.me.x, this.me.y, 12, C.yellow).setStrokeStyle(3, INK);
    this.setScore('Spotted: 0');
    this.startTimer(90, () => this.finish(0));
    this.body(W / 2, 630, this.hint('Hold to walk. Plants hide you.', 'Arrow keys (or hold the mouse) to walk. Plants hide you.'), 12);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => (this.target = { x: p.x, y: p.y }));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => { if (p.isDown) this.target = { x: p.x, y: p.y }; });
    this.input.on('pointerup', () => (this.target = null));
  }

  blockedAt(x: number, y: number) {
    const all = this.shortcutG.active ? [...this.walls, this.shortcut] : this.walls;
    return all.some((r) => Phaser.Geom.Rectangle.Contains(r, x, y)) || x < 10 || x > W - 10 || y < 54 || y > H - 20;
  }

  seen(g: Guard) {
    if (this.hidden) return false;
    const d = dist(g.x, g.y, this.me.x, this.me.y);
    if (d > g.range) return false;
    const a = Phaser.Math.Angle.Wrap(Math.atan2(this.me.y - g.y, this.me.x - g.x) - g.dir);
    return Math.abs(a) < g.half;
  }

  update(t: number, dt: number) {
    if (this.ended) return;
    const s = dt / 1000;
    const kx = (this.down('RIGHT') ? 1 : 0) - (this.down('LEFT') ? 1 : 0), ky = (this.down('DOWN') ? 1 : 0) - (this.down('UP') ? 1 : 0);
    if (kx || ky) this.target = { x: this.me.x + kx * 40, y: this.me.y + ky * 40 };
    else if (!this.input.activePointer.isDown && this.target && !this.mobile) this.target = null;
    if (this.target) {
      const a = Math.atan2(this.target.y - this.me.y, this.target.x - this.me.x);
      const sp = 120 * s;
      const nx = this.me.x + Math.cos(a) * sp, ny = this.me.y + Math.sin(a) * sp;
      if (dist(this.me.x, this.me.y, this.target.x, this.target.y) > 4) {
        if (!this.blockedAt(nx, this.me.y)) this.me.x = nx;
        if (!this.blockedAt(this.me.x, ny)) this.me.y = ny;
      }
    }
    this.hidden = this.plants.some((p) => dist(p.x, p.y, this.me.x, this.me.y) < 24);
    for (const p of this.plants) if (dist(p.x, p.y, this.me.x, this.me.y) < 24) this.check = { x: p.x, y: p.y };
    if (this.shortcutG.active && dist(40, 400, this.me.x, this.me.y) < 34) {
      this.shortcutG.destroy();
      this.pop(this.shortcut.centerX, this.shortcut.centerY, 'CHAI UNCLE OPENED IT', '#2fa36b', 16);
    }
    // ripple (Credit Phantom) drifts
    this.ripple = { x: 200 + Math.sin(t / 1500) * 150, y: 300 + Math.cos(t / 1100) * 120 };
    this.rippleG.setPosition(this.ripple.x, this.ripple.y);
    const sp = 1 + this.stress * 0.6;
    this.cones.clear();
    for (const g of this.guards) {
      if (g.kind === 'sweep') g.dir = Math.PI * 1.25 + Math.sin(t / 1300 * sp) * 0.9;
      else {
        g.t += s * 0.25 * sp;
        const k = (Math.sin(g.t * Math.PI) + 1) / 2;
        const nx = g.ax! + (g.bx! - g.ax!) * k;
        g.dir = nx > g.x ? 0 : Math.PI;
        g.x = nx;
      }
      (g as Guard & { s: Phaser.GameObjects.Arc }).s.setPosition(g.x, g.y);
      this.cones.fillStyle(0xffeb3b, 0.35).slice(g.x, g.y, g.range, g.dir - g.half, g.dir + g.half, false).fillPath();
    }
    const caught = this.guards.some((g) => this.seen(g)) || (!this.hidden && dist(this.ripple.x, this.ripple.y, this.me.x, this.me.y) < 26);
    if (caught) {
      this.spotted++;
      this.setScore(`Spotted: ${this.spotted}`);
      this.shake(0.015);
      this.pop(W / 2, 300, '"GOT 5 MINS?"', '#e63946', 34);
      this.timeLeft = Math.max(1, this.timeLeft - 6);
      this.me = { ...this.check };
      this.target = null;
    }
    this.meG.setPosition(this.me.x, this.me.y).setAlpha(this.hidden ? 0.45 : 1);
    if (dist(this.me.x, this.me.y, LIFT.x, LIFT.y) < 36) {
      const used = 90 - this.timeLeft;
      this.finish(this.spotted === 0 && used < 35 ? 3 : this.spotted <= 1 ? 2 : 1);
    }
  }
}
void H;
