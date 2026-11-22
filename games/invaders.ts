// L14 · Reply-All Storm: mute the descending "All the best!!" replies. Then the 40 MB GIF. Then Captain Quick-Call.
import * as Phaser from 'phaser';
import { MiniGame, W, H, C, INK, pick } from './kit';

type Inv = { o: Phaser.GameObjects.Container; hp: number; w: number; kind: 'basic' | 'fast' | 'split' | 'boss' | 'captain'; vx: number; vy: number };
type Shot = { o: Phaser.GameObjects.Rectangle };
const TEXT = { basic: 'All the best!! 👍', fast: 'Who is this?', split: 'Remove me pls', boss: '40 MB FAREWELL.GIF', captain: '"One last quick call?"' };

export default class Invaders extends MiniGame {
  ship!: Phaser.GameObjects.Container;
  invs: Inv[] = [];
  shots: Shot[] = [];
  bombs: Phaser.GameObjects.Text[] = [];
  damage = 0;
  wave = 0;
  dir = 1;

  create() {
    this.invs = []; this.shots = []; this.bombs = []; this.damage = 0; this.wave = 0; this.dir = 1;
    this.paper(0x101828);
    this.hud('REPLY-ALL STORM');
    this.add.line(0, 0, 0, H - 110, W, H - 110, C.red).setOrigin(0).setLineWidth(2);
    this.body(W / 2, H - 100, 'YOUR INBOX', 11, '#e63946');
    const s = this.add.rectangle(0, 0, 70, 24, C.yellow).setStrokeStyle(3, INK);
    this.ship = this.add.container(W / 2, H - 60, [s, this.body(0, 0, '🔇 MUTE', 11)]);
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => (this.ship.x = Phaser.Math.Clamp(p.x, 40, W - 40)));
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { this.ship.x = Phaser.Math.Clamp(p.x, 40, W - 40); this.fire(); });
    this.time.addEvent({ delay: 330, loop: true, callback: () => this.fire() });
    this.time.addEvent({ delay: 1400, loop: true, callback: () => this.bossBomb() });
    this.startTimer(60, () => this.end());
    this.nextWave();
  }

  mk(kind: Inv['kind'], x: number, y: number, hp = 1) {
    const w = kind === 'boss' ? 200 : kind === 'captain' ? 180 : kind === 'split' ? 100 : 108;
    const r = this.add.rectangle(0, 0, w, kind === 'boss' ? 60 : 26, kind === 'boss' ? C.purple : kind === 'captain' ? C.blue : kind === 'fast' ? C.orange : 0xffffff).setStrokeStyle(2, INK);
    const t = this.body(0, 0, TEXT[kind], kind === 'boss' ? 14 : 10, kind === 'basic' || kind === 'split' ? '#141414' : '#ffffff');
    this.invs.push({ o: this.add.container(x, y, [r, t]), hp, w, kind, vx: 0, vy: 0 });
  }

  nextWave() {
    this.wave++;
    if (this.wave === 1) for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) this.mk(r === 1 && c === 1 ? 'split' : 'basic', 80 + c * 120, 80 + r * 40);
    else if (this.wave === 2) { for (let c = 0; c < 3; c++) this.mk(pick(['fast', 'split', 'basic'] as const), 80 + c * 120, 80); this.mk('boss', W / 2, 150, 14); }
    else if (this.wave === 3) { this.mk('captain', W / 2, 90, 6); this.pop(W / 2, 200, 'CAPTAIN QUICK-CALL APPROACHES', '#3d7be0', 16); }
    else this.end();
  }

  fire() {
    if (this.ended) return;
    this.shots.push({ o: this.add.rectangle(this.ship.x, this.ship.y - 18, 5, 14, C.yellow) });
  }

  bossBomb() {
    const b = this.invs.find((i) => i.kind === 'boss' || i.kind === 'captain');
    if (!b || this.ended) return;
    this.bombs.push(this.label(b.o.x + Phaser.Math.Between(-60, 60), b.o.y + 30, b.kind === 'boss' ? '👍' : '📞', 22));
  }

  update(_: number, dt: number) {
    if (this.ended) return;
    const s = dt / 1000;
    const kx = (this.down('RIGHT') ? 1 : 0) - (this.down('LEFT') ? 1 : 0);
    if (kx) this.ship.x = Phaser.Math.Clamp(this.ship.x + kx * 380 * s, 40, W - 40);
    let edge = false;
    const speed = 40 + this.wave * 12 + this.stress * 20;
    for (const i of this.invs) {
      if (i.kind === 'fast' && Math.random() < s * 0.4 && i.vy === 0) i.vy = 140;
      i.o.x += (i.vx || this.dir * speed) * s;
      i.o.y += (i.vy + 6) * s;
      if (i.o.x > W - i.w / 2 || i.o.x < i.w / 2) edge = true;
      if (i.o.y > H - 120) { this.damage++; i.hp = 0; i.o.destroy(); this.shake(0.012); this.pop(W / 2, H - 140, 'INBOX HIT', '#e63946', 18); }
    }
    if (edge) this.dir *= -1;
    for (const sh of this.shots) {
      sh.o.y -= 520 * s;
      for (const i of this.invs) {
        if (i.hp > 0 && sh.o.active && Math.abs(sh.o.x - i.o.x) < i.w / 2 && Math.abs(sh.o.y - i.o.y) < (i.kind === 'boss' ? 30 : 14)) {
          i.hp--; sh.o.destroy();
          if (i.hp <= 0) {
            this.pop(i.o.x, i.o.y, i.kind === 'captain' ? 'CALL DECLINED!' : 'MUTED', '#7CFC9A', i.kind === 'captain' ? 26 : 16);
            if (i.kind === 'split') { this.mk('basic', i.o.x - 40, i.o.y); this.mk('basic', i.o.x + 40, i.o.y); }
            i.o.destroy();
          }
        }
      }
    }
    for (const b of this.bombs) {
      b.y += 180 * s;
      if (b.active && Math.abs(b.x - this.ship.x) < 40 && Math.abs(b.y - this.ship.y) < 20) { this.damage++; b.destroy(); this.shake(0.01); }
      if (b.y > H) b.destroy();
    }
    this.bombs = this.bombs.filter((b) => b.active);
    this.shots = this.shots.filter((x) => x.o.active && x.o.y > 40);
    this.invs = this.invs.filter((i) => i.hp > 0);
    this.setScore(`Inbox damage: ${this.damage}`);
    if (this.damage >= 10) return this.end();
    if (!this.invs.length) this.nextWave();
  }

  end() {
    const cleared = this.wave > 3 || (this.wave === 3 && !this.invs.length);
    const d = this.damage;
    this.finish(cleared && d === 0 ? 3 : cleared && d <= 3 ? 2 : cleared || d <= 6 ? 1 : 0);
  }
}
