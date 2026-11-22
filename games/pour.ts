// L11 · The Brain Dump: hold to pour knowledge into Pinto's head; tap the leaks to plug them with sticky notes.
import * as Phaser from 'phaser';
import { MiniGame, W, H, C, INK, pick, rand, dist } from './kit';

const PUDDLES = ['Where the passwords are', 'Why it’s called test2.py', 'Never restart on Friday', 'Who to call at 2 AM', 'The real deadline'];
type Hole = { x: number; y: number; g: Phaser.GameObjects.Arc };

export default class Pour extends MiniGame {
  fill = 0;
  holes: Hole[] = [];
  pouring = false;
  liquid!: Phaser.GameObjects.Rectangle;
  stream!: Phaser.GameObjects.Graphics;
  head = { x: W / 2, y: 430, w: 220, h: 200 };

  create() {
    this.fill = 0; this.holes = []; this.pouring = false;
    this.paper(0xf3f0ff);
    this.hud('THE BRAIN DUMP');
    // your head (top)
    this.add.circle(W / 2, 120, 44, 0xc68863).setStrokeStyle(3, INK);
    this.add.circle(W / 2, 120, 22, 0x9be7ff).setStrokeStyle(2, INK);
    this.body(W / 2, 180, 'YOU (14 months of Phoenix)', 12);
    // Pinto's head (x-ray container)
    const hd = this.head;
    this.add.ellipse(hd.x, hd.y, hd.w + 30, hd.h + 30, 0xe4b896).setStrokeStyle(4, INK);
    this.liquid = this.add.rectangle(hd.x, hd.y + hd.h / 2, hd.w, 0, 0x4fc3f7).setOrigin(0.5, 1);
    this.add.line(0, 0, hd.x - hd.w / 2, hd.y - hd.h / 2 + 20, hd.x + hd.w / 2, hd.y - hd.h / 2 + 20, C.green).setOrigin(0).setLineWidth(3);
    this.body(hd.x, hd.y - hd.h / 2 + 8, 'understands Phoenix', 11, '#2fa36b');
    this.body(hd.x, hd.y + hd.h / 2 + 30, 'PINTO (x-ray). Leaving for an MBA in March.', 12);
    this.stream = this.add.graphics();
    this.body(W / 2, 616, this.hint('HOLD to pour · TAP holes to plug', 'Hold SPACE to pour · click holes to plug'), 14);
    this.startTimer(30, () => this.end());
    this.time.addEvent({ delay: 1100 - this.stress * 250, loop: true, callback: () => this.newHole() });
    this.time.addEvent({ delay: 5200, loop: true, callback: () => { this.pop(hd.x + 100, hd.y - 120, '📱 bzzt', '#7b3fa0', 18); this.newHole(); } });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const h = this.holes.find((o) => dist(o.x, o.y, p.x, p.y) < 26);
      if (h) return this.plug(h);
      this.pouring = true;
    });
    this.input.on('pointerup', () => (this.pouring = false));
  }

  newHole() {
    if (this.ended || this.holes.length >= 6) return;
    const hd = this.head;
    const side = Math.random() < 0.5 ? -1 : 1;
    const y = rand(hd.y - 40, hd.y + hd.h / 2 - 20);
    const x = hd.x + side * (hd.w / 2 + 6);
    this.holes.push({ x, y, g: this.add.circle(x, y, 13, 0x141414).setStrokeStyle(3, C.red) });
  }

  plug(h: Hole) {
    h.g.destroy();
    this.holes = this.holes.filter((o) => o !== h);
    const note = this.add.rectangle(h.x, h.y, 30, 30, C.yellow).setStrokeStyle(2, INK).setAngle(rand(-15, 15));
    this.tweens.add({ targets: note, alpha: 0, delay: 1200, duration: 400, onComplete: () => note.destroy() });
    this.pop(h.x, h.y - 20, 'PLUGGED', '#2fa36b', 16);
  }

  update(_: number, dt: number) {
    if (this.ended) return;
    const s = dt / 1000;
    this.stream.clear();
    const pouring = this.pouring || this.down('SPACE');
    if (pouring) {
      this.fill += s * 5.5;
      this.stream.fillStyle(0x4fc3f7, 0.9).fillRect(W / 2 - 6, 165, 12, this.head.y - this.head.h / 2 - 150 + 20);
    }
    for (const h of this.holes) {
      if (this.fill > 0) {
        this.fill = Math.max(0, this.fill - s * 3);
        if (Math.random() < s * 0.5) this.pop(h.x + (h.x > W / 2 ? 30 : -30), h.y + 30, pick(PUDDLES), '#3d7be0', 11);
      }
    }
    this.fill = Math.min(100, this.fill);
    this.liquid.height = (this.fill / 100) * (this.head.h - 20);
    this.setScore(`Understanding: ${Math.round(this.fill)}%`);
    if (this.fill >= 100) this.finish(this.timeLeft >= 6 ? 3 : 2);
  }

  end() { this.finish(this.fill >= 70 ? 2 : this.fill >= 40 ? 1 : 0); }
}
void H;
