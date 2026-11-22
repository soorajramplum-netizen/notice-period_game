// L2 · Darts: you're on mute. Hit the manager's face on the imaginary board; pop his speech balloons.
import * as Phaser from 'phaser';
import { MiniGame, W, H, C, INK, dist, pick } from './kit';

const LINES = ['Think long-term!', 'Growth mindset!', "Who'll handle Q4?", "We're a family!", 'Sleep on it!', "Let's circle back"];

export default class Darts extends MiniGame {
  board!: Phaser.GameObjects.Container;
  reticle!: Phaser.GameObjects.Arc;
  balloons: Phaser.GameObjects.Text[] = [];
  aim = { x: W / 2, y: 260 };
  darts = 10;
  score = 0;
  frozen = false;
  flying = false;
  clock = 31;

  create() {
    this.balloons = []; this.darts = 10; this.score = 0; this.frozen = false; this.flying = false; this.clock = 31;
    this.paper(0x2b2d42);
    this.hud('THE QUICK CALL');
    this.label(W / 2, 64, '🔇 YOU ARE ON MUTE', 18, '#7CFC9A');
    const face = this.add.graphics();
    face.fillStyle(0xf4e4c1).fillCircle(0, 0, 90).lineStyle(4, INK).strokeCircle(0, 0, 90);
    face.lineStyle(3, C.red).strokeCircle(0, 0, 62).strokeCircle(0, 0, 34);
    face.fillStyle(0xd9a27a).fillEllipse(0, 4, 70, 80).lineStyle(3, INK).strokeEllipse(0, 4, 70, 80);
    face.fillStyle(0x2a2a2a).fillEllipse(0, -30, 74, 26);
    face.fillStyle(INK).fillCircle(-13, -2, 4).fillCircle(13, -2, 4);
    face.fillStyle(0xffffff).fillRoundedRect(-20, 16, 40, 14, 6).lineStyle(2, INK).strokeRoundedRect(-20, 16, 40, 14, 6);
    this.board = this.add.container(W / 2, 250, [face]);
    this.reticle = this.add.circle(W / 2, 260, 14).setStrokeStyle(3, 0xffd23f);
    this.setScore(`Darts: 10   Score: 0`);
    this.startTimer(9999, () => {}, () => `0:${String(Math.min(47, this.clock)).padStart(2, '0')}`);
    this.time.addEvent({ delay: 1300, loop: true, callback: () => this.spawnBalloon() });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => { this.aim = { x: p.x, y: Math.min(p.y, 470) }; });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { this.aim = { x: p.x, y: Math.min(p.y, 470) }; });
    this.input.on('pointerup', () => this.throwDart());
    this.label(W / 2, 600, this.hint('Aim, then release to throw', 'Aim with the mouse, click to throw'), 16, '#ffffff');
  }

  spawnBalloon() {
    if (this.ended) return;
    const b = this.body(this.board.x + 40, this.board.y + 20, pick(LINES), 13, '#141414', { backgroundColor: '#ffffff', padding: { x: 6, y: 4 } });
    b.setData('vx', Phaser.Math.Between(-40, 40));
    this.balloons.push(b);
  }

  throwDart() {
    if (this.flying || this.ended || this.darts <= 0) return;
    this.flying = true;
    const tx = this.reticle.x, ty = this.reticle.y;
    const dart = this.add.triangle(W / 2, H - 60, 0, 30, 6, 0, 12, 30, C.red).setStrokeStyle(2, INK);
    this.tweens.add({
      targets: dart, x: tx, y: ty, scale: 0.6, duration: 260,
      onComplete: () => {
        this.flying = false;
        this.darts--;
        this.clock += 2;
        let pts = 0;
        const d = dist(tx, ty, this.board.x, this.board.y);
        if (d < 28) pts = 2; else if (d < 90) pts = 1;
        for (const b of this.balloons) {
          if (b.active && Phaser.Geom.Rectangle.Contains(b.getBounds(), tx, ty)) { pts += 1; this.pop(b.x, b.y, 'POP!', '#ffd23f'); b.destroy(); }
        }
        if (pts) { this.pop(tx, ty - 10, pts >= 2 ? 'BULLSEYE!' : 'THWACK!', '#ffd23f'); this.shake(0.006); }
        this.score += pts;
        this.setScore(`Darts: ${this.darts}   Score: ${this.score}`);
        this.tweens.add({ targets: dart, alpha: 0, delay: 500, duration: 300, onComplete: () => dart.destroy() });
        if (this.darts % 3 === 0 && this.darts > 0) { this.frozen = true; this.pop(W / 2, 140, 'CONNECTION FROZE', '#7CFC9A', 18); this.time.delayedCall(1800, () => (this.frozen = false)); }
        if (this.darts <= 0) this.time.delayedCall(400, () => this.finish(this.score >= 15 ? 3 : this.score >= 10 ? 2 : this.score >= 5 ? 1 : 0));
      },
    });
  }

  update(t: number, dt: number) {
    if (this.ended) return;
    if (!this.frozen) {
      const speed = 0.0017 + (10 - this.darts) * 0.00015;
      this.board.x = W / 2 + Math.sin(t * speed) * 110;
      this.board.y = 250 + Math.sin(t * speed * 1.7) * 30;
    }
    const wob = 10 + this.stress * 26;
    this.reticle.setPosition(this.aim.x + Math.sin(t / 170) * wob, this.aim.y + Math.cos(t / 230) * wob);
    for (const b of this.balloons) {
      if (!b.active) continue;
      b.y -= (35 * dt) / 1000;
      b.x += ((b.getData('vx') as number) * dt) / 1000;
      if (b.y < 70) b.destroy();
    }
    this.balloons = this.balloons.filter((b) => b.active);
  }
}
