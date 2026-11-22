// L9 · Résumé Stack: drop achievement blocks to build past the HIRE line. Bold blocks are taller but wobble.
import * as Phaser from 'phaser';
import { MiniGame, W, H, C, INK, pick } from './kit';

const HONEST = ['Led a team of 4', 'Fixed Phoenix', 'Never missed a deadline', 'Wrote the docs', 'Trained 2 juniors'];
const BOLD = ['Visionary leader', 'Saved ₹2 Cr (approx.)', 'Excel wizard', 'Fluent in 6 languages (3)', 'Thought leader'];
const BASE_Y = H - 70;
const HIRE_Y = 245;

export default class Stack extends MiniGame {
  blocks = 10;
  topY = BASE_Y;
  topX = W / 2;
  topW = 170;
  wobble = 0;
  dropping = false;
  hanger!: Phaser.GameObjects.Container;
  tower: Phaser.GameObjects.Container[] = [];
  swingT = 0;
  windT = 0;

  create() {
    this.blocks = 10; this.topY = BASE_Y; this.topX = W / 2; this.topW = 170; this.dropping = false; this.tower = []; this.swingT = 0;
    this.wobble = this.ctx.hard ? 0.35 : 0;
    this.paper(0xeaf6ff);
    this.hud(this.ctx.hard ? 'ONE LAST SHOT' : 'TELL ME ABOUT YOURSELF');
    this.add.line(0, 0, 0, HIRE_Y, W, HIRE_Y, C.green).setOrigin(0).setLineWidth(4);
    this.label(W - 60, HIRE_Y - 16, 'HIRE ▸', 22, '#2fa36b');
    this.box(W / 2, BASE_Y + 22, 200, 28, 0x8d6e63, 4);
    this.body(W / 2, BASE_Y + 22, 'The Panel’s table', 12, '#ffffff');
    this.add.rectangle(W / 4, 620, W / 2 - 8, 30, 0xffffff).setStrokeStyle(2, INK);
    this.add.rectangle((3 * W) / 4, 620, W / 2 - 8, 30, C.pink).setStrokeStyle(2, INK);
    this.body(W / 4, 620, this.hint('◀ tap: HONEST (steady)', '◀ / click: HONEST'), 12);
    this.body((3 * W) / 4, 620, this.hint('tap: BOLD (tall, wobbly) ▶', 'BOLD (wobbly): click / ▶'), 12);
    // The crane hook: shows where the next block will drop from.
    const rope = this.add.rectangle(0, -30, 3, 40, INK);
    const ghost = this.add.rectangle(0, 8, 130, 34, 0xffffff, 0.6).setStrokeStyle(3, INK);
    const q = this.body(0, 8, 'your next line ▼', 12);
    this.hanger = this.add.container(W / 2, 90, [rope, ghost, q]);
    this.setScore('Blocks: 10');
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.drop(p.x > W / 2));
    this.time.addEvent({ delay: 3500, loop: true, callback: () => { this.windT = 1; this.pop(W / 2, 140, pick(['*centre frowns*', '*loud typing*', '*left nods*']), '#7b3fa0', 15); } });
  }

  makeBlock(bold: boolean) {
    const w = bold ? 150 : 120, h = bold ? 54 : 34;
    const r = this.add.rectangle(0, 0, w, h, bold ? C.pink : 0xffffff).setStrokeStyle(3, INK);
    const t = this.body(0, 0, pick(bold ? BOLD : HONEST), bold ? 13 : 11);
    const c = this.add.container(0, 0, [r, t]);
    c.setData({ w, h, bold });
    return c;
  }

  drop(bold: boolean) {
    if (this.dropping || this.ended || this.blocks <= 0) return;
    this.dropping = true;
    const b = this.makeBlock(bold);
    b.setPosition(this.hanger.x, this.hanger.y);
    const h = b.getData('h') as number, w = b.getData('w') as number;
    const landY = this.topY - h / 2;
    this.tweens.add({
      targets: b, y: landY, duration: 380, ease: 'Quad.easeIn',
      onComplete: () => {
        this.dropping = false;
        this.blocks--;
        const off = b.x - this.topX;
        if (Math.abs(off) > (this.topW + w) / 2 - 14) {
          this.tweens.add({ targets: b, y: H + 60, angle: off > 0 ? 70 : -70, duration: 500 });
          this.pop(b.x, landY, 'DIDN’T LAND', '#e63946', 18);
        } else {
          this.wobble += (Math.abs(off) / this.topW) * (bold ? 0.9 : 0.45) + (bold ? 0.08 : 0.02);
          this.tower.push(b);
          this.topY -= h; this.topX = b.x; this.topW = w;
          this.pop(b.x, landY - 20, bold ? 'BOLD!' : 'SOLID', bold ? '#ff5fa2' : '#2fa36b', 18);
          if (this.wobble >= 1) return this.topple();
          if (this.topY <= HIRE_Y) return this.finish(this.blocks >= 3 ? 3 : 2);
        }
        this.setScore(`Blocks: ${this.blocks}   Wobble: ${Math.round(this.wobble * 100)}%`);
        if (this.blocks <= 0) this.time.delayedCall(400, () => this.finish(this.progress() >= 0.75 ? 1 : 0));
      },
    });
  }

  progress() { return (BASE_Y - this.topY) / (BASE_Y - HIRE_Y); }

  topple() {
    this.shake(0.03);
    this.pop(W / 2, 300, 'TIMBERRR!', '#e63946', 40);
    this.tower.forEach((b, i) => this.tweens.add({ targets: b, x: b.x + (i % 2 ? 140 : -140), y: H + 80, angle: 90, duration: 700, delay: i * 40 }));
    this.time.delayedCall(800, () => this.finish(0));
  }

  update(t: number, dt: number) {
    if (this.ended) return;
    if (this.pressed('LEFT')) this.drop(false);
    if (this.pressed('RIGHT')) this.drop(true);
    this.swingT += dt / 1000;
    const speed = 1.6 + (10 - this.blocks) * 0.12 + this.stress * 0.9 + this.windT;
    this.windT = Math.max(0, this.windT - dt / 1500);
    this.hanger.x = W / 2 + Math.sin(this.swingT * speed) * 120;
    const sway = Math.sin(t / 220) * this.wobble * 7;
    this.tower.forEach((b, i) => (b.angle = sway * (i / Math.max(1, this.tower.length))));
  }
}
