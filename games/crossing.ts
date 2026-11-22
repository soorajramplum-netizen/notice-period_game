// L13 · No-Dues Crossing: hop across moving office lanes to collect six desk signatures. Admin's shutter opens rarely.
import * as Phaser from 'phaser';
import { MiniGame, W, H, C, INK, pick } from './kit';

const T = 50, COLS = 8, ROWS = 11, OY = 60;
type Desk = { name: string; c: number; r: number; got: boolean; g: Phaser.GameObjects.Rectangle; t: Phaser.GameObjects.Text };
type Mover = { o: Phaser.GameObjects.Container; row: number; v: number; w: number };
const LANES: Record<number, { v: number; label: string[]; color: number }> = {
  1: { v: 90, label: ['🛒 trolley'], color: C.orange }, 2: { v: -120, label: ['🤖 robot'], color: C.grey },
  3: { v: 70, label: ['💃 conga line'], color: C.pink }, 4: { v: -100, label: ['🙂🙂 Yes-Men'], color: 0x6aa7e6 },
  6: { v: 110, label: ['🛒 trolley'], color: C.orange }, 7: { v: -80, label: ['💃 conga line'], color: C.pink },
  8: { v: 130, label: ['🤖 robot'], color: C.grey }, 9: { v: -95, label: ['🙂🙂 Yes-Men'], color: 0x6aa7e6 },
};

export default class Crossing extends MiniGame {
  pos = { c: 4, r: 10 };
  me!: Phaser.GameObjects.Container;
  desks: Desk[] = [];
  movers: Mover[] = [];
  hits = 0;
  adminOpen = true;
  invuln = 0;

  create() {
    this.pos = { c: 4, r: 10 }; this.desks = []; this.movers = []; this.hits = 0; this.adminOpen = true; this.invuln = 0;
    this.paper(0xeef1f4);
    this.hud('NO-DUES CROSSING');
    for (let r = 0; r < ROWS; r++) {
      const lane = LANES[r];
      this.add.rectangle(W / 2, OY + r * T + T / 2, W, T, lane ? 0xd5dbe3 : 0xf7f3e8).setStrokeStyle(1, 0xb0b8c4);
    }
    const spots: [string, number, number][] = [['IT', 0, 0], ['ADMIN', 3, 0], ['FINANCE', 7, 0], ['FACILITIES', 0, 5], ['LIBRARY?', 7, 5], ['HR', 4, 5]];
    for (const [name, c, r] of spots) {
      const g = this.add.rectangle(c * T + T / 2, OY + r * T + T / 2, T - 4, T - 6, 0xffffff).setStrokeStyle(3, INK);
      const t = this.body(c * T + T / 2, OY + r * T + T / 2, name, 9);
      this.desks.push({ name, c, r, got: false, g, t });
    }
    for (const [rowS, lane] of Object.entries(LANES)) {
      const row = Number(rowS);
      for (let i = 0; i < 2; i++) {
        const w = lane.label[0].includes('conga') ? 110 : 70;
        const rect = this.add.rectangle(0, 0, w, T - 14, lane.color).setStrokeStyle(3, INK);
        const txt = this.body(0, 0, pick(lane.label), 10);
        const o = this.add.container(i * 220 + Phaser.Math.Between(0, 80), OY + row * T + T / 2, [rect, txt]);
        this.movers.push({ o, row, v: lane.v * 0.85 * (1 + this.stress * 0.4), w });
      }
    }
    const body = this.add.rectangle(0, 0, 30, 30, C.yellow).setStrokeStyle(3, INK);
    this.me = this.add.container(0, 0, [body, this.body(0, 0, '💻', 14)]);
    this.place();
    this.setScore('Signed: 0/6');
    this.startTimer(75, () => this.end());
    this.time.addEvent({ delay: 1800, loop: true, callback: () => { this.adminOpen = !this.adminOpen; const d = this.desks[1]; d.g.setFillStyle(d.got ? C.green : this.adminOpen ? 0xffffff : 0x555555); d.t.setText(this.adminOpen ? 'ADMIN' : 'CLOSED'); } });
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      const m: Record<string, [number, number]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
      if (m[e.key]) this.move(...m[e.key]);
    });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const dx = p.x - this.me.x, dy = p.y - this.me.y;
      if (Math.abs(dx) > Math.abs(dy)) this.move(Math.sign(dx), 0); else this.move(0, Math.sign(dy));
    });
    this.body(W / 2, H - 16, this.hint('Tap beside your laptop to hop that way', 'Arrow keys to hop'), 12);
  }

  place() { this.me.setPosition(this.pos.c * T + T / 2, OY + this.pos.r * T + T / 2); }

  move(dc: number, dr: number) {
    if (this.ended) return;
    this.pos = { c: Phaser.Math.Clamp(this.pos.c + dc, 0, COLS - 1), r: Phaser.Math.Clamp(this.pos.r + dr, 0, ROWS - 1) };
    this.place();
    const d = this.desks.find((k) => k.c === this.pos.c && k.r === this.pos.r && !k.got);
    if (d) {
      if (d.name === 'ADMIN' && !this.adminOpen) return void this.pop(this.me.x, this.me.y - 30, 'OPEN 11:00–11:15 ONLY', '#e63946', 14);
      d.got = true;
      d.g.setFillStyle(C.green);
      this.pop(this.me.x, this.me.y - 30, d.name === 'FINANCE' ? 'PENDING (system down)' : 'STAMPED!', '#2fa36b', 16);
      const n = this.desks.filter((k) => k.got).length;
      this.setScore(`Signed: ${n}/6`);
      if (n === 6) this.end();
    }
  }

  update(_: number, dt: number) {
    if (this.ended) return;
    const s = dt / 1000;
    this.invuln = Math.max(0, this.invuln - dt);
    for (const m of this.movers) {
      m.o.x += m.v * s;
      if (m.v > 0 && m.o.x > W + m.w) m.o.x = -m.w;
      if (m.v < 0 && m.o.x < -m.w) m.o.x = W + m.w;
      if (this.invuln <= 0 && m.row === this.pos.r && Math.abs(m.o.x - this.me.x) < m.w / 2 + 12) {
        this.hits++;
        this.invuln = 900;
        this.shake(0.015);
        this.pop(this.me.x, this.me.y - 30, 'DROPPED THE DONGLE!', '#e63946', 16);
        this.pos = { c: 4, r: 10 };
        this.place();
      }
    }
  }

  end() {
    const n = this.desks.filter((k) => k.got).length;
    this.finish(n === 6 && this.hits <= 3 ? 3 : n >= 5 ? 2 : n >= 3 ? 1 : 0);
  }
}
