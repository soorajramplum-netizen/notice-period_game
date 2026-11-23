// Office Brawl: a 2D one-on-one fight against Captain Quick-Call, who blocks the exit for "one last quick call".
// Touch: on-screen pad. Keyboard: ← → move, ↓ block, Z punch, X kick, C special.
import * as Phaser from 'phaser';
import { MiniGame, W, C, INK, pick } from './kit';

const FLOOR = 430;
type Act = 'idle' | 'punch' | 'kick' | 'block' | 'hurt' | 'windup' | 'grab';
type Fighter = {
  x: number; hp: number; act: Act; t: number; cd: number; face: 1 | -1;
  c: Phaser.GameObjects.Container; arm: Phaser.GameObjects.Rectangle; leg: Phaser.GameObjects.Rectangle;
  shield: Phaser.GameObjects.Rectangle; mark: Phaser.GameObjects.Text; body: Phaser.GameObjects.Rectangle;
  move?: string;
};
type Proj = { o: Phaser.GameObjects.Text; vx: number; dmg: number; fromHero: boolean };

const HERO_QUIPS = ['Per my last email!', 'OUT OF OFFICE!', 'Noted. 👍', 'Not my KPI!'];
const BOSS_QUIPS = ['Got 5 mins?', "Let's take this offline!", 'Think about Q4!', "We're a FAMILY!", 'Circle back!'];

export default class Fight extends MiniGame {
  hero!: Fighter;
  boss!: Fighter;
  meter = 0;
  projs: Proj[] = [];
  held: Record<string, boolean> = {};
  think = 0;
  heroBar!: Phaser.GameObjects.Rectangle;
  bossBar!: Phaser.GameObjects.Rectangle;
  meterBar!: Phaser.GameObjects.Rectangle;
  phoneCd = 0;
  ending = false;

  create() {
    this.meter = 0; this.projs = []; this.held = {}; this.think = 0; this.phoneCd = 2000; this.ending = false;
    this.paper(0xf3e9dc);
    this.hud('ONE LAST QUICK CALL');
    // arena: the office exit
    this.add.rectangle(W / 2, 270, W, 320, 0xdfe6ee);
    this.add.rectangle(W - 30, 330, 50, 190, C.green).setStrokeStyle(3, INK);
    this.body(W - 30, 250, 'EXIT', 14, '#ffffff');
    this.add.rectangle(W / 2, FLOOR + 22, W, 44, 0x8d99ae).setStrokeStyle(3, INK);
    // HP bars
    this.body(12, 62, 'YOU', 13).setOrigin(0, 0.5);
    this.body(W - 12, 62, 'CAPTAIN QUICK-CALL', 13).setOrigin(1, 0.5);
    this.add.rectangle(12, 80, 170, 14, 0x555555).setOrigin(0, 0.5).setStrokeStyle(2, INK);
    this.add.rectangle(W - 12, 80, 170, 14, 0x555555).setOrigin(1, 0.5).setStrokeStyle(2, INK);
    this.heroBar = this.add.rectangle(13, 80, 168, 12, C.yellow).setOrigin(0, 0.5);
    this.bossBar = this.add.rectangle(W - 13, 80, 168, 12, C.red).setOrigin(1, 0.5);
    this.add.rectangle(12, 98, 120, 8, 0x555555).setOrigin(0, 0.5);
    this.meterBar = this.add.rectangle(12, 98, 0, 8, C.blue).setOrigin(0, 0.5);
    this.body(140, 98, 'special', 10).setOrigin(0, 0.5);
    this.hero = this.makeFighter(110, 1, C.yellow, 0xc68863);
    this.boss = this.makeFighter(290, -1, 0xe8eef8, 0xd9a27a, true);
    const round = this.label(W / 2, 170, 'ROUND 1 · FIGHT!', 34, '#e63946', { stroke: '#141414', strokeThickness: 6 });
    this.time.delayedCall(900, () => round.destroy());
    this.makePad();
    this.startTimer(60, () => this.end());
    this.redrawBars();
  }

  makeFighter(x: number, face: 1 | -1, shirt: number, skin: number, boss = false): Fighter {
    const legs = this.add.rectangle(0, -22, 30, 44, 0x2c3e50).setStrokeStyle(3, INK);
    const leg = this.add.rectangle(10, -44, 12, 40, 0x2c3e50).setStrokeStyle(2, INK).setOrigin(0.5, 0);
    const body = this.add.rectangle(0, -72, 42, 56, shirt).setStrokeStyle(3, INK);
    const tie = this.add.rectangle(0, -70, 8, 34, boss ? 0x1f4fa8 : C.red);
    const arm = this.add.rectangle(14, -78, 30, 12, skin).setStrokeStyle(2, INK).setOrigin(0, 0.5);
    const head = this.add.circle(0, -116, 20, skin).setStrokeStyle(3, INK);
    const hair = this.add.ellipse(0, -132, 40, 14, boss ? 0x2a2a2a : 0x1d1d1d);
    const eye = this.add.circle(8, -118, 3, INK);
    const mouth = boss ? this.add.rectangle(6, -106, 16, 5, 0xffffff).setStrokeStyle(1, INK) : this.add.rectangle(6, -106, 10, 2, INK);
    const shield = this.add.rectangle(26, -80, 10, 60, C.blue, 0.8).setStrokeStyle(2, INK).setVisible(false);
    const parts: Phaser.GameObjects.GameObject[] = [legs, leg, body, tie, arm, head, hair, eye, mouth, shield];
    if (boss) parts.push(this.add.rectangle(-22, -70, 10, 18, 0x222222).setStrokeStyle(1, INK));
    const c = this.add.container(x, FLOOR, parts).setScale(face, 1);
    const mark = this.label(x, FLOOR - 165, '', 26, '#e63946', { stroke: '#141414', strokeThickness: 4 });
    return { x, hp: 100, act: 'idle', t: 0, cd: 0, face, c, arm, leg, shield, mark, body };
  }

  makePad() {
    const y1 = 510, y2 = 585;
    this.add.rectangle(W / 2, 565, W, 150, 0x22252b);
    const btn = (x: number, y: number, w: number, label: string, key: string, color: number, onPress?: () => void) => {
      const r = this.add.rectangle(x, y, w, 58, color).setStrokeStyle(3, INK).setInteractive();
      this.label(x, y, label, label.length > 6 ? 16 : 22, '#141414');
      r.on('pointerdown', () => { this.held[key] = true; onPress?.(); });
      r.on('pointerup', () => (this.held[key] = false));
      r.on('pointerout', () => (this.held[key] = false));
    };
    btn(45, y1, 70, '◀', 'left', 0xffffff);
    btn(125, y1, 70, '▶', 'right', 0xffffff);
    btn(85, y2, 150, '🛡 BLOCK', 'block', C.blue);
    btn(235, y1, 90, 'PUNCH', 'punch', C.yellow, () => this.heroAttack('punch'));
    btn(335, y1, 90, 'KICK', 'kick', C.orange, () => this.heroAttack('kick'));
    btn(285, y2, 190, '📄 RESIGNATION', 'special', C.pink, () => this.heroSpecial());
    if (!this.mobile) this.body(W / 2, 630, '← → move · ↓ block · Z punch · X kick · C special', 11, '#ffffff');
  }

  heroAttack(kind: 'punch' | 'kick') {
    const h = this.hero;
    if (this.ended || h.cd > 0 || h.act === 'hurt' || h.act === 'block') return;
    h.act = kind; h.t = 0; h.cd = kind === 'punch' ? 380 : 700;
    h.move = pick(HERO_QUIPS);
  }

  heroSpecial() {
    if (this.ended || this.meter < 100 || this.hero.act === 'hurt') return;
    this.meter = 0;
    const o = this.label(this.hero.x + 30, FLOOR - 90, '📄 I RESIGN', 18, '#141414', { backgroundColor: '#ffffff', padding: { x: 4, y: 2 } });
    this.projs.push({ o, vx: 380, dmg: 18, fromHero: true });
    this.pop(this.hero.x, FLOOR - 190, 'RESIGNATION LETTER!', '#ff5fa2', 20);
    this.redrawBars();
  }

  /** Apply a hit to `v`. Blocking cuts damage by 80% (grabs can't be blocked). */
  hit(v: Fighter, dmg: number, unblockable = false, label?: string) {
    const blocked = v.act === 'block' && !unblockable;
    const d = Math.round(blocked ? dmg * 0.2 : dmg);
    v.hp = Math.max(0, v.hp - d);
    if (!blocked) { v.act = 'hurt'; v.t = 0; v.x += (v === this.hero ? -1 : 1) * 22; }
    this.pop(v.x, FLOOR - 150, blocked ? 'BLOCKED' : label ?? `-${d}`, blocked ? '#3d7be0' : '#e63946', blocked ? 18 : 24);
    if (!blocked) this.shake(0.008);
    if (v === this.boss && !blocked) this.meter = Math.min(100, this.meter + 14);
    if (v === this.hero) this.meter = Math.min(100, this.meter + 5);
    this.redrawBars();
    if (v.hp <= 0) this.time.delayedCall(250, () => this.end());
  }

  redrawBars() {
    this.heroBar.width = 168 * (this.hero.hp / 100);
    this.bossBar.width = 168 * (this.boss.hp / 100);
    this.meterBar.width = 120 * (this.meter / 100);
    this.meterBar.setFillStyle(this.meter >= 100 ? C.pink : C.blue);
  }

  bossThink() {
    const b = this.boss, h = this.hero;
    if (b.act !== 'idle') return;
    const dist = Math.abs(b.x - h.x);
    const aggro = 0.6 + this.stress * 0.3;
    const incoming = this.projs.some((p) => p.fromHero && p.o.x < b.x && b.x - p.o.x < 160);
    if (incoming && Math.random() < 0.55 + this.stress * 0.2) { b.act = 'block'; b.t = 0; return; }
    if (h.act === 'punch' || h.act === 'kick') { if (dist < 95 && Math.random() < 0.4 + this.stress * 0.2) { b.act = 'block'; b.t = 0; return; } }
    if (dist > 150) {
      if (this.phoneCd <= 0 && Math.random() < 0.4) {
        this.phoneCd = 3200 - this.stress * 900;
        b.act = 'windup'; b.t = 0; b.move = 'phone'; b.mark.setText('📱!');
      } else b.move = 'walk';
      return;
    }
    if (dist > 85) { b.move = 'walk'; return; }
    if (Math.random() > aggro) { b.move = Math.random() < 0.5 ? 'back' : 'idle'; return; }
    b.act = 'windup'; b.t = 0;
    b.move = Math.random() < 0.28 ? 'grab' : 'punch';
    b.mark.setText(b.move === 'grab' ? '‼' : '!');
  }

  update(_: number, dt: number) {
    if (this.ended || this.ending) return;
    const s = dt / 1000;
    const h = this.hero, b = this.boss;
    // --- input (touch pad + keys)
    const left = this.held.left || this.down('LEFT'), right = this.held.right || this.down('RIGHT');
    const block = this.held.block || this.down('DOWN');
    if (this.pressed('Z')) this.heroAttack('punch');
    if (this.pressed('X')) this.heroAttack('kick');
    if (this.pressed('C')) this.heroSpecial();
    h.cd = Math.max(0, h.cd - dt); b.cd = Math.max(0, b.cd - dt); this.phoneCd -= dt;
    if (h.act === 'idle' || h.act === 'block') h.act = block ? 'block' : 'idle';
    if (h.act === 'idle') h.x += ((right ? 1 : 0) - (left ? 1 : 0)) * 190 * s;
    // --- hero attacks resolve
    h.t += dt;
    if ((h.act === 'punch' && h.t >= 120 && h.t - dt < 120) || (h.act === 'kick' && h.t >= 220 && h.t - dt < 220)) {
      const reach = h.act === 'punch' ? 78 : 95;
      if (Math.abs(b.x - h.x) <= reach) this.hit(b, h.act === 'punch' ? 6 : 10, false, h.move);
    }
    if ((h.act === 'punch' && h.t > 260) || (h.act === 'kick' && h.t > 420) || (h.act === 'hurt' && h.t > 320)) h.act = 'idle';
    // --- boss brain
    this.think += dt;
    if (this.think > 220 - this.stress * 50) { this.think = 0; this.bossThink(); }
    b.t += dt;
    const bdmg = 1 + this.stress * 0.25;
    if (b.act === 'idle') {
      if (b.move === 'walk') b.x -= Math.sign(b.x - h.x) * (120 + this.stress * 40) * s;
      if (b.move === 'back') b.x += Math.sign(b.x - h.x) * 90 * s;
    }
    const wind = (b.move === 'grab' ? 520 : b.move === 'phone' ? 450 : 330) * (1 - Math.max(0, this.stress) * 0.12) * (this.stress < 0 ? 1.3 : 1);
    if (b.act === 'windup' && b.t >= wind) {
      const dist = Math.abs(b.x - h.x);
      if (b.move === 'phone') {
        const o = this.label(b.x - 30, FLOOR - 95, '📱', 26);
        this.projs.push({ o, vx: -300 * Math.sign(b.x - h.x), dmg: 10 * bdmg, fromHero: false });
        this.pop(b.x, FLOOR - 190, '"Quick call!"', '#3d7be0', 18);
      } else if (b.move === 'grab') {
        if (dist <= 62) this.hit(h, 13 * bdmg, true, 'GUILT TRIP!');
        else this.pop(b.x, FLOOR - 190, 'whiffed', '#9aa3ad', 16);
      } else if (dist <= 82) this.hit(h, 7 * bdmg, false, pick(BOSS_QUIPS));
      b.act = 'punch'; b.t = 0; b.mark.setText('');
    }
    if ((b.act === 'punch' && b.t > 260) || (b.act === 'hurt' && b.t > 340) || (b.act === 'block' && b.t > 650)) { b.act = 'idle'; b.mark.setText(''); }
    // --- projectiles
    for (const p of this.projs) {
      p.o.x += p.vx * s;
      const tgt = p.fromHero ? b : h;
      if (p.o.active && Math.abs(p.o.x - tgt.x) < 28) { this.hit(tgt, p.dmg, false, p.fromHero ? 'RESIGNED AT!' : 'CALL CONNECTED'); p.o.destroy(); }
      if (p.o.x < -40 || p.o.x > W + 40) p.o.destroy();
    }
    this.projs = this.projs.filter((p) => p.o.active);
    // --- spacing, bounds, facing, poses
    h.x = Phaser.Math.Clamp(h.x, 30, W - 30); b.x = Phaser.Math.Clamp(b.x, 30, W - 30);
    if (Math.abs(h.x - b.x) < 44) { const m = (h.x + b.x) / 2, side = h.x < b.x ? -1 : 1; h.x = m + side * 22; b.x = m - side * 22; }
    h.face = h.x < b.x ? 1 : -1; b.face = b.x < h.x ? 1 : -1;
    for (const f of [h, b]) {
      f.c.setPosition(f.x, FLOOR).setScale(f.face, 1);
      f.mark.setPosition(f.x, FLOOR - 165);
      const swing = f.act === 'punch' ? 1 : 0;
      f.arm.width = 30 + swing * 26;
      f.leg.setAngle(f.act === 'kick' ? -80 : 0);
      f.shield.setVisible(f.act === 'block');
      f.c.setAngle(f.act === 'hurt' ? -8 * f.face : 0);
      f.body.setFillStyle(f === b && f.act === 'windup' ? 0xffd0d0 : f === h ? C.yellow : 0xe8eef8);
    }
  }

  end() {
    if (this.ended || this.ending) return;
    this.ending = true;
    const win = this.boss.hp <= 0 || (this.hero.hp > 0 && this.hero.hp >= this.boss.hp);
    this.pop(W / 2, 220, win ? 'K.O.!' : 'YOU STAYED FOR Q4…', win ? '#2fa36b' : '#e63946', win ? 54 : 26);
    const hp = this.hero.hp;
    this.time.delayedCall(600, () => this.finish(!win ? 0 : hp >= 60 ? 3 : hp >= 30 ? 2 : 1));
  }
}
