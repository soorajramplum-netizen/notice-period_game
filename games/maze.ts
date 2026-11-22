// L3 · HR Portal Maze: reach "Initiate Separation (beta)". Pop-ups block corridors; the Session Timeout ghost chases you.
import * as Phaser from 'phaser';
import { MiniGame, W, C, INK, pick } from './kit';

const MAP = [
  '#########',
  '#S..#...#',
  '##.##.#.#',
  '#..#..#.#',
  '#.##.##.#',
  '#....#..#',
  '###.##.##',
  '#...#...#',
  '#.#.#.#.#',
  '#.#...#.#',
  '#.#####.#',
  '#......G#',
  '#########',
];
const T = 40, OX = 20, OY = 70;
const LABELS: Record<string, string> = {
  '1,1': 'Self Service', '1,5': 'My Journey', '3,7': 'Life Events', '1,9': 'New Horizons',
  '6,5': 'Marriage 🎉', '6,7': 'Apply Leave?', '2,3': 'Jobs (0)', '7,1': 'Wellbeing', '7,11': 'SEPARATE',
};
const POPUPS = ['Rate us! ⭐', 'Password expires!', 'Fire Safety (overdue)', 'Update profile pic'];
type P = { x: number; y: number };
const key = (p: P) => `${p.x},${p.y}`;

export default class Maze extends MiniGame {
  player: P = { x: 1, y: 1 };
  ghost: P = { x: 7, y: 1 };
  path: P[] = [];
  blocked = new Map<string, Phaser.GameObjects.GameObject[]>();
  pSprite!: Phaser.GameObjects.Container;
  gSprite!: Phaser.GameObjects.Text;
  catches = 0;
  ghostOn = false;
  stepAcc = 0;
  ghostAcc = 0;

  create() {
    this.player = { x: 1, y: 1 }; this.ghost = { x: 7, y: 1 }; this.path = []; this.blocked = new Map();
    this.catches = 0; this.ghostOn = false; this.stepAcc = 0; this.ghostAcc = 0;
    this.paper(0xe9eef5);
    this.hud('THE PORTAL');
    const g = this.add.graphics();
    MAP.forEach((row, y) => [...row].forEach((ch, x) => {
      const px = OX + x * T, py = OY + y * T;
      if (ch === '#') { g.fillStyle(0x4a5568).fillRect(px, py, T, T); g.lineStyle(2, INK).strokeRect(px, py, T, T); }
      else if (ch === 'G') { g.fillStyle(C.green).fillRect(px, py, T, T); }
      else g.fillStyle(0xffffff).fillRect(px, py, T, T);
      const lab = LABELS[`${x},${y}`];
      if (lab) this.body(px + T / 2, py + T / 2, lab, 8, ch === 'G' ? '#ffffff' : '#3d7be0', { wordWrap: { width: T - 4 } });
    }));
    this.body(W / 2, 612, this.hint('Tap beside yourself to slide that way. Avoid the ⌛ ghost.', 'Arrow keys to slide. Avoid the ⌛ ghost.'), 13);
    const me = this.add.circle(0, 0, 13, C.yellow).setStrokeStyle(3, INK);
    this.pSprite = this.add.container(0, 0, [me, this.label(0, 0, '🙂', 16)]);
    this.gSprite = this.label(0, 0, '⌛', 26).setVisible(false);
    this.place();
    this.setScore('Caught: 0');
    this.startTimer(75, () => this.finish(0));
    this.time.delayedCall(5000, () => { this.ghostOn = true; this.gSprite.setVisible(true); this.pop(W / 2, 120, 'SESSION TIMEOUT IS AWAKE', '#e63946', 18); });
    this.time.addEvent({ delay: 3200, loop: true, callback: () => this.popup() });
    // Tap beside the hero (or use arrow keys): they slide that way until a wall, a pop-up or a junction.
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const px = OX + this.player.x * T + T / 2, py = OY + this.player.y * T + T / 2;
      const dx = p.x - px, dy = p.y - py;
      if (Math.abs(dx) > Math.abs(dy)) this.slide(Math.sign(dx), 0); else this.slide(0, Math.sign(dy));
    });
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      const m: Record<string, [number, number]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
      if (m[e.key]) this.slide(...m[e.key]);
    });
  }

  slide(dx: number, dy: number) {
    if (this.ended || (!dx && !dy)) return;
    const out: P[] = [];
    let c = { ...this.player };
    for (;;) {
      const n = { x: c.x + dx, y: c.y + dy };
      if (!this.open(n)) break;
      out.push(n);
      c = n;
      // stop at junctions so the player makes the choice
      const side = dx ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]];
      if (side.some(([sx, sy]) => this.open({ x: c.x + sx, y: c.y + sy }))) break;
    }
    this.path = out;
  }

  open(p: P) { return MAP[p.y]?.[p.x] !== undefined && MAP[p.y][p.x] !== '#' && !this.blocked.has(key(p)); }

  bfs(from: P, to: P, ignoreBlocks = false): P[] | null {
    const q: P[] = [from];
    const prev = new Map<string, P | null>([[key(from), null]]);
    while (q.length) {
      const c = q.shift()!;
      if (c.x === to.x && c.y === to.y) {
        const out: P[] = [];
        let n: P | null = c;
        while (n && key(n) !== key(from)) { out.unshift(n); n = prev.get(key(n)) ?? null; }
        return out;
      }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = { x: c.x + dx, y: c.y + dy };
        const ok = MAP[n.y]?.[n.x] !== undefined && MAP[n.y][n.x] !== '#' && (ignoreBlocks || !this.blocked.has(key(n)));
        if (ok && !prev.has(key(n))) { prev.set(key(n), c); q.push(n); }
      }
    }
    return null;
  }

  popup() {
    if (this.ended) return;
    const cells: P[] = [];
    MAP.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '.' && !(x === this.player.x && y === this.player.y)) cells.push({ x, y }); }));
    const c = pick(cells);
    const px = OX + c.x * T + T / 2, py = OY + c.y * T + T / 2;
    const r = this.add.rectangle(px, py, T + 26, T - 4, C.red).setStrokeStyle(3, INK);
    const t = this.body(px, py, pick(POPUPS), 9, '#ffffff', { wordWrap: { width: T + 20 } });
    this.blocked.set(key(c), [r, t]);
    this.time.delayedCall(3000, () => { r.destroy(); t.destroy(); this.blocked.delete(key(c)); });
  }

  place() {
    this.pSprite.setPosition(OX + this.player.x * T + T / 2, OY + this.player.y * T + T / 2);
    this.gSprite.setPosition(OX + this.ghost.x * T + T / 2, OY + this.ghost.y * T + T / 2);
  }

  update(_: number, dt: number) {
    if (this.ended) return;
    this.stepAcc += dt;
    if (this.stepAcc > 120 && this.path.length) {
      this.stepAcc = 0;
      const n = this.path[0];
      if (this.open(n)) { this.player = this.path.shift()!; } else this.path = [];
      if (MAP[this.player.y][this.player.x] === 'G') {
        const used = 75 - this.timeLeft;
        this.finish(this.catches === 0 && used < 35 ? 3 : this.catches <= 1 ? 2 : 1);
      }
    }
    // The ghost half-chases, half-wanders (a perfect chaser camps the one corridor every route needs).
    this.ghostAcc += dt;
    if (this.ghostOn && this.ghostAcc > 820 - this.stress * 180) {
      this.ghostAcc = 0;
      if (Math.random() < 0.6) {
        const p = this.bfs(this.ghost, this.player, true);
        if (p && p.length) this.ghost = p[0];
      } else {
        const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]]
          .map(([dx, dy]) => ({ x: this.ghost.x + dx, y: this.ghost.y + dy }))
          .filter((n) => MAP[n.y]?.[n.x] !== undefined && MAP[n.y][n.x] !== '#');
        if (opts.length) this.ghost = opts[Math.floor(Math.random() * opts.length)];
      }
    }
    if (this.ghostOn && this.ghost.x === this.player.x && this.ghost.y === this.player.y) {
      this.catches++;
      this.setScore(`Caught: ${this.catches}`);
      this.shake(0.015);
      this.pop(W / 2, 300, 'SESSION TIMED OUT!', '#e63946');
      this.player = { x: 1, y: 1 }; this.ghost = { x: 7, y: 1 }; this.path = [];
      this.ghostOn = false;
      this.time.delayedCall(2500, () => (this.ghostOn = true));
    }
    this.place();
  }
}
