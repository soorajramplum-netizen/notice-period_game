// L6 · Blame Pong: deflect the Blame ball onto someone else. Every miss stamps BLAMED on you.
import * as Phaser from 'phaser';
import { MiniGame, W, H, C, INK } from './kit';

const TARGETS = [
  { name: 'YES-MEN', x: 70, color: 0x6aa7e6 },
  { name: 'THE VENDOR', x: 200, color: C.orange },
  { name: 'LEGACY CODE', x: 330, color: C.grey },
];

export default class Pong extends MiniGame {
  paddle!: Phaser.GameObjects.Rectangle;
  ball!: Phaser.GameObjects.Container;
  vx = 0;
  vy = 0;
  speed = 260;
  points = 0;
  misses = 0;
  vendorHits = 0;
  boss!: Phaser.GameObjects.Rectangle;
  bossOn = false;

  create() {
    this.points = 0; this.misses = 0; this.vendorHits = 0; this.bossOn = false; this.speed = 260 * (1 + this.stress * 0.25);
    this.paper(0xfdf0e6);
    this.hud('BLAME PONG');
    TARGETS.forEach((t) => {
      this.box(t.x, 80, 120, 40, t.color, 6);
      this.label(t.x, 80, t.name, 16, '#141414');
    });
    this.boss = this.add.rectangle(W / 2, 140, 90, 14, C.blue).setStrokeStyle(3, INK).setVisible(false);
    this.paddle = this.add.rectangle(W / 2, H - 70, 100 - this.stress * 30, 18, C.yellow).setStrokeStyle(3, INK);
    this.label(W / 2, H - 40, 'YOU', 16);
    const b = this.add.circle(0, 0, 13, C.red).setStrokeStyle(3, INK);
    this.ball = this.add.container(W / 2, 300, [b, this.body(0, 0, '🔥', 12)]);
    this.serve();
    this.setScore('Deflected: 0  Blamed: 0');
    this.startTimer(45, () => this.end());
    this.time.addEvent({ delay: 7000, loop: true, callback: () => { this.speed += 45; this.pop(W / 2, 200, '"Let\'s take this offline"', '#e63946', 18); } });
    this.time.addEvent({ delay: 9000, loop: true, callback: () => { this.bossOn = !this.bossOn; this.boss.setVisible(this.bossOn); if (this.bossOn) this.pop(W / 2, 170, 'CAPTAIN QUICK-CALL ENTERS', '#3d7be0', 16); } });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => { this.paddle.x = Phaser.Math.Clamp(p.x, 50, W - 50); });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { this.paddle.x = Phaser.Math.Clamp(p.x, 50, W - 50); });
  }

  serve() {
    this.ball.setPosition(W / 2, 260);
    const a = Phaser.Math.FloatBetween(-0.6, 0.6);
    this.vx = Math.sin(a) * this.speed;
    this.vy = Math.cos(a) * this.speed;
  }

  norm() {
    const l = Math.hypot(this.vx, this.vy) || 1;
    this.vx = (this.vx / l) * this.speed; this.vy = (this.vy / l) * this.speed;
  }

  update(t: number, dt: number) {
    if (this.ended) return;
    const s = dt / 1000;
    const kx = (this.down('RIGHT') ? 1 : 0) - (this.down('LEFT') ? 1 : 0);
    if (kx) this.paddle.x = Phaser.Math.Clamp(this.paddle.x + kx * 420 * s, 50, W - 50);
    if (this.bossOn) this.boss.x = W / 2 + Math.sin(t / 500) * 130;
    this.ball.x += this.vx * s; this.ball.y += this.vy * s;
    if (this.ball.x < 14 || this.ball.x > W - 14) { this.vx *= -1; this.ball.x = Phaser.Math.Clamp(this.ball.x, 14, W - 14); }
    // top targets
    if (this.ball.y < 102 && this.vy < 0) {
      this.vy *= -1;
      const tgt = TARGETS.reduce((a, b) => (Math.abs(b.x - this.ball.x) < Math.abs(a.x - this.ball.x) ? b : a));
      this.points++;
      if (tgt.name === 'THE VENDOR') {
        this.vendorHits++;
        if (this.vendorHits % 3 === 0) { this.points += 2; this.cameras.main.flash(200, 255, 160, 0); this.pop(200, 130, 'SLA BREACH!', '#f39c12', 28); }
        else this.pop(tgt.x, 120, 'THEIR FAULT', '#f39c12', 16);
      } else this.pop(tgt.x, 120, tgt.name === 'YES-MEN' ? 'NOT ME!' : 'IT WAS LIKE THIS', '#141414', 14);
    }
    // boss paddle
    if (this.bossOn && Math.abs(this.ball.y - this.boss.y) < 14 && Math.abs(this.ball.x - this.boss.x) < 52 && this.vy < 0) {
      this.vy = Math.abs(this.vy) * 1.1;
      this.pop(this.boss.x, this.boss.y + 20, '"YOU own this"', '#3d7be0', 14);
    }
    // player paddle
    const p = this.paddle;
    if (this.vy > 0 && Math.abs(this.ball.y - p.y) < 18 && Math.abs(this.ball.x - p.x) < p.width / 2 + 10) {
      this.vy = -Math.abs(this.vy);
      this.vx += (this.ball.x - p.x) * 5;
      this.norm();
    }
    if (this.ball.y > H) {
      this.misses++;
      this.shake(0.02);
      this.pop(W / 2, H / 2, 'BLAMED!', '#e63946', 46);
      if (this.misses >= 3) return this.end();
      this.serve();
    }
    this.setScore(`Deflected: ${this.points}  Blamed: ${this.misses}`);
  }

  end() {
    const sc = this.points - 2 * this.misses;
    this.finish(sc >= 11 ? 3 : sc >= 6 ? 2 : sc >= 3 ? 1 : 0);
  }
}
