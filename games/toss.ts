// Paper Toss: crumple the "Meets Expectations" printouts and flick them into the bin across the aisle.
// The office fan blows a different way every throw. Swipe (or drag the mouse) up from the paper ball.
import * as Phaser from 'phaser';
import { MiniGame, W, H, C, INK, rand } from './kit';

const BALL0 = { x: W / 2, y: 560 };
const BIN = { x: W / 2, y: 200 };
const FLIGHT = 1.0; // seconds
const IDEAL = 260; // swipe length that lands at the bin's depth
const V = (pts: { x: number; y: number }[]) => pts.map((p) => new Phaser.Math.Vector2(p.x, p.y));

export default class Toss extends MiniGame {
  throws = 10;
  score = 0;
  wind = 0;
  flying = false;
  start: { x: number; y: number } | null = null;
  ball!: Phaser.GameObjects.Container;
  shadow!: Phaser.GameObjects.Ellipse;
  windText!: Phaser.GameObjects.Text;
  fanBlades!: Phaser.GameObjects.Text;
  shot: { vx: number; vz: number; t: number } | null = null;

  create() {
    this.throws = 10; this.score = 0; this.flying = false; this.start = null; this.shot = null;
    this.paper(0xeef1f6);
    this.hud('THE BIN');
    // office floor in perspective
    const g = this.add.graphics();
    g.fillStyle(0xd7dde6).fillPoints(V([{ x: 120, y: 150 }, { x: 280, y: 150 }, { x: W, y: H }, { x: 0, y: H }]), true);
    g.lineStyle(2, 0xb6bfcc);
    for (let i = 1; i < 8; i++) { const y = 150 + (i * i * (H - 150)) / 64; g.lineBetween(120 - (y - 150) * 0.27, y, 280 + (y - 150) * 0.27, y); }
    // desks on the sides
    this.box(40, 330, 70, 120, 0xbcaaa4, 6);
    this.box(360, 330, 70, 120, 0xbcaaa4, 6);
    this.body(40, 300, 'Yes-Man\n☕', 11);
    // the bin
    g.fillStyle(0x5d6d7e).fillPoints(V([{ x: BIN.x - 34, y: BIN.y - 30 }, { x: BIN.x + 34, y: BIN.y - 30 }, { x: BIN.x + 26, y: BIN.y + 22 }, { x: BIN.x - 26, y: BIN.y + 22 }]), true);
    g.lineStyle(3, INK).strokePoints(V([{ x: BIN.x - 34, y: BIN.y - 30 }, { x: BIN.x + 34, y: BIN.y - 30 }, { x: BIN.x + 26, y: BIN.y + 22 }, { x: BIN.x - 26, y: BIN.y + 22 }]), true);
    g.fillStyle(0x2c3e50).fillEllipse(BIN.x, BIN.y - 30, 68, 16);
    g.lineStyle(3, INK).strokeEllipse(BIN.x, BIN.y - 30, 68, 16);
    this.body(BIN.x, BIN.y + 4, 'BIN', 11, '#ffffff');
    // the fan
    this.box(345, 110, 60, 50, 0xffffff, 8);
    this.fanBlades = this.label(345, 106, '✣', 30, '#3d7be0');
    this.windText = this.body(345, 146, '', 12);
    // paper ball + shadow
    this.shadow = this.add.ellipse(BALL0.x, BALL0.y + 26, 40, 12, 0x000000, 0.18);
    const p = this.add.circle(0, 0, 22, 0xffffff).setStrokeStyle(3, INK);
    const crease = this.add.graphics().lineStyle(2, 0x9aa3ad).lineBetween(-10, -6, 6, 2).lineBetween(-4, 10, 10, -10).lineBetween(-12, 6, -2, 14);
    const note = this.body(0, 0, '3%', 10, '#e63946');
    this.ball = this.add.container(BALL0.x, BALL0.y, [p, crease, note]);
    this.body(W / 2, H - 14, this.hint('Swipe up from the paper ball. Mind the fan!', 'Drag up from the paper ball and let go. Mind the fan!'), 13);
    this.newWind();
    this.setScore('Throws: 10   In: 0');
    this.input.on('pointerdown', (pt: Phaser.Input.Pointer) => {
      if (!this.flying && Phaser.Math.Distance.Between(pt.x, pt.y, BALL0.x, BALL0.y) < 90) this.start = { x: pt.x, y: pt.y };
    });
    this.input.on('pointerup', (pt: Phaser.Input.Pointer) => {
      if (!this.start) return;
      const dx = pt.x - this.start.x, dy = pt.y - this.start.y;
      this.start = null;
      if (dy > -40) return; // not a throw
      this.launch(dx, -dy);
    });
  }

  newWind() {
    const strength = 55 + Math.max(0, this.stress) * 80 + (this.stress < 0 ? this.stress * 60 : 0);
    this.wind = Math.round(rand(-1, 1) * strength);
    const arrows = Math.max(1, Math.round(Math.abs(this.wind) / 25));
    this.windText.setText(this.wind === 0 ? 'off' : (this.wind < 0 ? '◀'.repeat(arrows) : '▶'.repeat(arrows)));
  }

  /** dx: sideways swipe, power: upward swipe length (px). */
  launch(dx: number, power: number) {
    if (this.flying || this.ended || this.throws <= 0) return;
    this.flying = true;
    this.shot = { vx: dx * 1.6, vz: power / IDEAL, t: 0 };
  }

  land(x: number, z: number) {
    const dz = Math.abs(z - 1), dxBin = Math.abs(x - BIN.x);
    let msg = 'MISS', color = '#9aa3ad';
    if (dz < 0.1 && dxBin < 14) { this.score += 1; msg = 'SWISH!'; color = '#2fa36b'; this.score += 0.5; }
    else if (dz < 0.12 && dxBin < 26) { this.score += 1; msg = 'IN!'; color = '#2fa36b'; }
    else if (dz < 0.17 && dxBin < 38) { msg = 'RIM! 😩'; color = '#f39c12'; }
    else if (x < 90 && z > 0.6 && z < 1.2) { msg = 'IN THE YES-MAN\'S COFFEE'; color = '#e63946'; }
    this.pop(BIN.x, BIN.y - 60, msg, color, msg.length > 10 ? 18 : 30);
    if (msg.startsWith('SWISH') || msg === 'IN!') this.shake(0.006);
    this.throws--;
    this.setScore(`Throws: ${this.throws}   In: ${Math.floor(this.score)}`);
    this.time.delayedCall(500, () => {
      this.ball.setPosition(BALL0.x, BALL0.y).setScale(1).setAngle(0);
      this.shadow.setPosition(BALL0.x, BALL0.y + 26).setScale(1);
      this.flying = false;
      this.newWind();
      if (this.throws <= 0) {
        const s = this.score;
        this.finish(s >= 8 ? 3 : s >= 5 ? 2 : s >= 2 ? 1 : 0);
      }
    });
  }

  update(t: number, dt: number) {
    if (this.ended) return;
    this.fanBlades.setAngle(this.fanBlades.angle + (this.wind / 4) * (dt / 16));
    if (!this.shot) return;
    const sh = this.shot;
    sh.t = Math.min(FLIGHT, sh.t + dt / 1000);
    const u = sh.t / FLIGHT;
    const z = sh.vz * u; // depth 0 (you) .. 1 (bin)
    const x = BALL0.x + sh.vx * u + 0.5 * this.wind * u * u;
    const scale = 1 - 0.55 * Math.min(1.3, z);
    const groundY = BALL0.y + (BIN.y - BALL0.y) * z;
    const h = 260 * 4 * u * (1 - u) * (0.6 + 0.4 * sh.vz); // arc height
    this.ball.setPosition(x, groundY - h * scale).setScale(scale).setAngle(u * 540);
    this.shadow.setPosition(x, groundY + 26 * scale).setScale(scale);
    if (sh.t >= FLIGHT) { this.shot = null; this.land(x, z); }
  }
}
void C;
