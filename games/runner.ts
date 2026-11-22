// L10 · The Chase: sprint to the boardroom before the Phantom finishes presenting your deck. Tap = jump, swipe down = slide.
import * as Phaser from 'phaser';
import { MiniGame, W, H, C, INK, pick } from './kit';

const GROUND = 470;
type Ob = { o: Phaser.GameObjects.Container; kind: 'low' | 'high'; w: number; hit: boolean };
const LOW = ['🪑 chair', '🎂 cake crowd', '⚠ wet floor', '🙂 Yes-Man'];

export default class Runner extends MiniGame {
  me!: Phaser.GameObjects.Container;
  vy = 0;
  y = GROUND;
  sliding = 0;
  obs: Ob[] = [];
  progress = 0;
  slides = 12;
  bar!: Phaser.GameObjects.Rectangle;
  slideTxt!: Phaser.GameObjects.Text;
  stumble = 0;
  downY: number | null = null;
  speed = 260;

  create() {
    this.vy = 0; this.y = GROUND; this.sliding = 0; this.obs = []; this.progress = 0; this.slides = 12; this.stumble = 0; this.speed = 260;
    this.paper(0xf5efe6);
    this.hud('THE CHASE');
    this.add.rectangle(W / 2, GROUND + 60, W, 100, 0x8d99ae).setStrokeStyle(3, INK);
    for (let x = 0; x < W; x += 80) this.add.rectangle(x, 200, 50, 120, 0xcfd8e3).setStrokeStyle(2, INK);
    this.add.rectangle(W / 2, 80, W - 40, 16, 0xffffff).setStrokeStyle(2, INK);
    this.bar = this.add.rectangle(22, 80, 0, 10, C.green).setOrigin(0, 0.5);
    this.body(W / 2, 100, 'You → BOARDROOM', 12);
    this.slideTxt = this.label(W / 2, 140, '', 22, '#7b3fa0');
    const body = this.add.rectangle(0, -26, 30, 50, C.yellow).setStrokeStyle(3, INK);
    const head = this.add.circle(0, -62, 14, 0xc68863).setStrokeStyle(3, INK);
    this.me = this.add.container(80, GROUND, [body, head]);
    this.body(W / 2, 600, this.hint('TAP = jump · SWIPE DOWN = slide', 'SPACE / ↑ = jump · ↓ = slide'), 14);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => (this.downY = p.y));
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (this.downY !== null && p.y - this.downY > 30) this.slide();
      else this.jump();
      this.downY = null;
    });
    this.time.addEvent({ delay: 4200, loop: true, callback: () => this.phantomTick() });
    this.spawnLoop();
    this.updateSlides();
  }

  updateSlides() { this.slideTxt.setText(`Phantom: ${this.slides} slides left`); }

  phantomTick() {
    if (this.ended) return;
    this.slides--;
    this.updateSlides();
    if (this.slides <= 0) this.finish(this.progress >= 85 ? 1 : 0);
  }

  spawnLoop() {
    if (this.ended) return;
    const kind = Math.random() < 0.3 ? 'high' : 'low';
    const label = kind === 'high' ? '🖨 PRINTER JAM' : pick(LOW);
    const w = label.includes('cake') ? 80 : 46;
    const r = kind === 'high'
      ? this.add.rectangle(0, -86, 90, 40, C.grey).setStrokeStyle(3, INK)
      : this.add.rectangle(0, -20, w, 40, C.orange).setStrokeStyle(3, INK);
    const t = this.body(0, kind === 'high' ? -86 : -20, label, 10);
    this.obs.push({ o: this.add.container(W + 60, GROUND, [r, t]), kind, w: kind === 'high' ? 90 : w, hit: false });
    this.time.delayedCall(Phaser.Math.Between(900, 1500) - this.stress * 200, () => this.spawnLoop());
  }

  jump() { if (this.y >= GROUND && this.sliding <= 0) this.vy = -620; }
  slide() { if (this.y >= GROUND) { this.sliding = 650; this.me.setScale(1, 0.5); } }

  update(_: number, dt: number) {
    if (this.ended) return;
    if (this.pressed('SPACE') || this.pressed('UP')) this.jump();
    if (this.pressed('DOWN')) this.slide();
    const s = dt / 1000;
    this.vy += 1700 * s;
    this.y = Math.min(GROUND, this.y + this.vy * s);
    if (this.y >= GROUND) this.vy = 0;
    this.me.y = this.y;
    if (this.sliding > 0) { this.sliding -= dt; if (this.sliding <= 0) this.me.setScale(1, 1); }
    const sp = this.stumble > 0 ? this.speed * 0.3 : this.speed;
    this.stumble = Math.max(0, this.stumble - dt);
    this.progress = Math.min(100, this.progress + (sp / this.speed) * s * 2.6);
    this.bar.width = (this.progress / 100) * (W - 44);
    for (const ob of this.obs) {
      ob.o.x -= sp * s;
      if (ob.hit || Math.abs(ob.o.x - 80) > ob.w / 2 + 12) continue;
      const hitLow = ob.kind === 'low' && this.y > GROUND - 40;
      const hitHigh = ob.kind === 'high' && this.sliding <= 0;
      if (hitLow || hitHigh) {
        ob.hit = true;
        this.stumble = 1300;
        this.shake(0.012);
        this.pop(110, GROUND - 120, 'OOF!', '#e63946');
      }
    }
    this.obs = this.obs.filter((o) => { if (o.o.x < -80) { o.o.destroy(); return false; } return true; });
    if (this.progress >= 100) this.finish(this.slides >= 3 ? 3 : this.slides >= 1 ? 2 : 1);
  }
}
void H;
