// L15 · Final boss: Madame Policy. Phase 1 dodge PDFs · Phase 2 reflect "Policy is policy" · Phase 3 land the pen on the letter.
import * as Phaser from 'phaser';
import { MiniGame, W, H, C, INK, dist, rand } from './kit';

type Proj = { o: Phaser.GameObjects.Container; vx: number; vy: number; glow?: number; reflected?: boolean };

export default class Boss extends MiniGame {
  phase = 1;
  hits = 0;
  me!: Phaser.GameObjects.Container;
  boss!: Phaser.GameObjects.Container;
  projs: Proj[] = [];
  reflects = 0;
  pen!: Phaser.GameObjects.Container;
  grabbed = false;
  sign!: Phaser.GameObjects.Rectangle;
  zones: Phaser.GameObjects.Rectangle[] = [];
  phaseTxt!: Phaser.GameObjects.Text;
  penT = 0;

  create() {
    this.phase = 1; this.hits = 0; this.projs = []; this.reflects = 0; this.grabbed = false; this.zones = []; this.penT = 0;
    this.paper(0x3a0d12);
    this.hud('MADAME POLICY');
    const b = this.add.ellipse(0, 0, 90, 100, 0xe8bf9a).setStrokeStyle(4, INK);
    const hair = this.add.circle(0, -60, 18, 0x4b4b4b).setStrokeStyle(3, INK);
    const gl = this.add.graphics().lineStyle(3, INK).strokeCircle(-16, -6, 11).strokeCircle(16, -6, 11);
    const body = this.add.rectangle(0, 70, 120, 50, C.purple).setStrokeStyle(4, INK);
    this.boss = this.add.container(W / 2, 140, [body, b, hair, gl]);
    const meB = this.add.circle(0, 0, 16, C.yellow).setStrokeStyle(3, INK);
    this.me = this.add.container(W / 2, H - 90, [meB, this.body(0, 0, '🙂', 16)]);
    this.phaseTxt = this.label(W / 2, 260, 'PHASE 1: PDF BARRAGE', 22, '#ffd23f');
    this.setScore('Hits: 0');
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onMove(p));
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onDown(p));
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.onUp(p));
    this.time.addEvent({ delay: 850, loop: true, callback: () => this.spawn() });
    this.time.delayedCall(15000, () => this.toPhase(2));
  }

  onMove(p: Phaser.Input.Pointer) {
    if (this.phase === 1 && p.isDown) this.me.setPosition(Phaser.Math.Clamp(p.x, 20, W - 20), Phaser.Math.Clamp(p.y, 320, H - 30));
    if (this.phase === 3 && this.grabbed) this.pen.setPosition(p.x, p.y);
  }

  onDown(p: Phaser.Input.Pointer) {
    if (this.phase === 1) this.me.setPosition(Phaser.Math.Clamp(p.x, 20, W - 20), Phaser.Math.Clamp(p.y, 320, H - 30));
    if (this.phase === 2) {
      const pr = this.projs.find((q) => !q.reflected && dist(q.o.x, q.o.y, p.x, p.y) < 60);
      if (pr && (pr.glow ?? 0) > 0) { pr.reflected = true; pr.vy = -420; pr.vx = (this.boss.x - pr.o.x) * 1.5; this.pop(pr.o.x, pr.o.y, '"SHOW ME THE CLAUSE"', '#ffd23f', 16); }
      else if (pr) this.pop(p.x, p.y, 'wait for the glow…', '#ffffff', 14);
    }
    if (this.phase === 3 && dist(p.x, p.y, this.pen.x, this.pen.y) < 40) this.grabbed = true;
  }

  onUp(p: Phaser.Input.Pointer) {
    if (this.phase !== 3 || !this.grabbed) return;
    this.grabbed = false;
    if (Phaser.Geom.Rectangle.Contains(this.sign.getBounds(), p.x, p.y)) {
      this.pop(W / 2, this.sign.y - 30, 'SIGNED!', '#2fa36b', 40);
      this.finish(this.hits <= 2 ? 3 : this.hits <= 5 ? 2 : this.hits <= 10 ? 1 : 0);
    }
  }

  spawn() {
    if (this.ended) return;
    if (this.phase === 1) {
      const r = this.add.rectangle(0, 0, 30, 38, 0xffffff).setStrokeStyle(2, INK);
      const o = this.add.container(this.boss.x + rand(-40, 40), this.boss.y + 60, [r, this.body(0, 0, 'PDF', 10, '#e63946')]);
      const a = Math.atan2(this.me.y - o.y, this.me.x - o.x) + rand(-0.35, 0.35);
      const sp = 200 + this.stress * 80;
      this.projs.push({ o, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp });
    } else if (this.phase === 2 && Math.random() < 0.7) {
      const r = this.add.rectangle(0, 0, 130, 34, C.red).setStrokeStyle(3, INK);
      const o = this.add.container(rand(80, W - 80), this.boss.y + 70, [r, this.body(0, 0, 'POLICY IS POLICY', 12, '#ffffff')]);
      this.projs.push({ o, vx: 0, vy: 95 + this.stress * 30, glow: 0 });
    }
  }

  toPhase(n: number) {
    if (this.ended) return;
    this.phase = n;
    this.projs.forEach((p) => p.o.destroy());
    this.projs = [];
    this.cameras.main.flash(300, 255, 210, 63);
    if (n === 2) { this.phaseTxt.setText('PHASE 2: TAP THE GLOWING SHIELDS'); this.me.setPosition(W / 2, H - 60); }
    if (n === 3) {
      this.phaseTxt.setText('PHASE 3: GRAB THE PEN → SIGN');
      this.sign = this.add.rectangle(W / 2, H - 70, 260, 50, 0xffffff).setStrokeStyle(3, INK);
      this.body(W / 2, H - 70, 'RELIEVING LETTER — sign here: ______', 12);
      this.pen = this.add.container(W / 2, 380, [this.add.rectangle(0, 0, 12, 60, 0x222222).setStrokeStyle(2, C.yellow), this.body(0, -40, '🖊', 20)]);
      for (let i = 0; i < 2; i++) this.zones.push(this.add.rectangle(0, 470 + i * 60, 120, 26, C.red, 0.85).setStrokeStyle(2, INK));
      this.startTimer(40, () => this.finish(0));
    }
  }

  update(t: number, dt: number) {
    if (this.ended) return;
    const s = dt / 1000;
    if (this.phase === 1) {
      const kx = (this.down('RIGHT') ? 1 : 0) - (this.down('LEFT') ? 1 : 0), ky = (this.down('DOWN') ? 1 : 0) - (this.down('UP') ? 1 : 0);
      if (kx || ky) this.me.setPosition(Phaser.Math.Clamp(this.me.x + kx * 300 * s, 20, W - 20), Phaser.Math.Clamp(this.me.y + ky * 300 * s, 320, H - 30));
    }
    this.boss.x = W / 2 + Math.sin(t / 900) * 90;
    for (const p of this.projs) {
      p.o.x += p.vx * s; p.o.y += p.vy * s;
      if (this.phase === 2 && !p.reflected) {
        p.glow = Math.sin(t / 180 + p.o.x) > 0.55 ? 1 : 0;
        (p.o.list[0] as Phaser.GameObjects.Rectangle).setFillStyle(p.glow ? C.yellow : C.red);
      }
      if (p.reflected && dist(p.o.x, p.o.y, this.boss.x, this.boss.y) < 60) {
        p.o.destroy(); this.reflects++; this.shake(0.02); this.pop(this.boss.x, this.boss.y, 'ARMOUR CRACKS!', '#ffd23f', 22);
        if (this.reflects >= 3) this.toPhase(3);
        continue;
      }
      if (!p.reflected && p.o.active && dist(p.o.x, p.o.y, this.me.x, this.me.y) < 26) {
        this.hits++; this.setScore(`Hits: ${this.hits}`); this.shake(0.012); p.o.destroy();
      }
    }
    this.projs = this.projs.filter((p) => p.o.active && p.o.y < H + 40 && p.o.y > -40);
    if (this.phase === 3) {
      this.zones.forEach((z, i) => (z.x = W / 2 + Math.sin(t / (500 + i * 230)) * 130));
      if (!this.grabbed) {
        this.penT += s;
        this.pen.setPosition(W / 2 + Math.sin(this.penT * 1.7) * 140, 360 + Math.cos(this.penT * 2.3) * 50);
      } else if (this.zones.some((z) => Phaser.Geom.Rectangle.Contains(z.getBounds(), this.pen.x, this.pen.y))) {
        this.grabbed = false; this.hits++; this.setScore(`Hits: ${this.hits}`);
        this.pop(this.pen.x, this.pen.y, '"AS PER PROCESS"', '#e63946', 18);
      }
    }
  }
}
