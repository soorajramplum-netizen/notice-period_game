// Shared toolkit for every mini game: comic-style drawing helpers, timer, HUD and finish().
import * as Phaser from 'phaser';
import type { GameCtx } from '@/lib/types';

export const W = 400;
export const H = 640;
export const INK = 0x141414;
export const PAPER = 0xfff6e0;
export const C = {
  red: 0xe63946, blue: 0x3d7be0, yellow: 0xffd23f, green: 0x2fa36b, purple: 0x7b3fa0,
  orange: 0xf39c12, teal: 0x16a085, grey: 0x9aa3ad, white: 0xffffff, sky: 0x1b2a4a, pink: 0xff5fa2,
};

export abstract class MiniGame extends Phaser.Scene {
  ctx!: GameCtx;
  ended = false;
  /** Stars from the last finish() (read by the bot lab). */
  lastStars = -1;
  private keyMap?: Record<string, Phaser.Input.Keyboard.Key>;
  timeLeft = 0;
  private timerText?: Phaser.GameObjects.Text;
  scoreText?: Phaser.GameObjects.Text;
  private tick?: Phaser.Time.TimerEvent;

  init() {
    this.ctx = this.registry.get('ctx') as GameCtx;
    this.ended = false;
    this.lastStars = -1;
    this.keyMap = undefined;
  }

  get mobile() { return this.ctx.device !== 'desktop'; }

  /** Pick the instruction for the player's device. */
  hint(touch: string, keys: string) { return this.mobile ? touch : keys; }

  /** True while a key is held (desktop controls). Keys: LEFT RIGHT UP DOWN SPACE ONE..FIVE. */
  down(name: string) {
    const kb = this.input.keyboard;
    if (!kb) return false;
    this.keyMap ??= kb.addKeys('LEFT,RIGHT,UP,DOWN,SPACE,ONE,TWO,THREE,FOUR,FIVE,Z,X,C') as Record<string, Phaser.Input.Keyboard.Key>;
    return !!this.keyMap[name]?.isDown;
  }

  /** True once per key press. */
  pressed(name: string) {
    if (!this.down(name)) return false;
    return Phaser.Input.Keyboard.JustDown(this.keyMap![name]);
  }

  /** Difficulty dial used by every game for speed and wobble. Story: from Sanity (0 calm .. 1 frazzled).
   *  Free Play: Easy -0.35 (gentler than the story), Medium 0.15, Hard 0.75. */
  get stress() {
    const d = this.ctx.difficulty;
    if (d) return (d === 'easy' ? -0.35 : d === 'medium' ? 0.15 : 0.75) + (this.ctx.hard ? 0.35 : 0);
    return Math.max(0, Math.min(1, (6 - this.ctx.sanity) / 6)) + (this.ctx.hard ? 0.35 : 0);
  }

  paper(color = PAPER) {
    this.add.rectangle(W / 2, H / 2, W, H, color);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.06);
    for (let y = 0; y < H; y += 12) for (let x = (y / 12) % 2 ? 6 : 0; x < W; x += 12) g.fillCircle(x, y, 1.6);
    return g;
  }

  label(x: number, y: number, s: string, size = 20, color = '#141414', opts: Partial<Phaser.Types.GameObjects.Text.TextStyle> = {}) {
    return this.add
      .text(x, y, s, { fontFamily: this.ctx.font, fontSize: `${size}px`, color, align: 'center', ...opts })
      .setOrigin(0.5);
  }

  body(x: number, y: number, s: string, size = 14, color = '#141414', opts: Partial<Phaser.Types.GameObjects.Text.TextStyle> = {}) {
    return this.add
      .text(x, y, s, { fontFamily: this.ctx.bodyFont, fontSize: `${size}px`, color, align: 'center', fontStyle: 'bold', ...opts })
      .setOrigin(0.5);
  }

  /** A comic box: flat fill, thick ink outline, offset shadow. */
  box(x: number, y: number, w: number, h: number, fill: number, r = 8) {
    const g = this.add.graphics();
    g.fillStyle(INK, 1).fillRoundedRect(x - w / 2 + 4, y - h / 2 + 4, w, h, r);
    g.fillStyle(fill, 1).fillRoundedRect(x - w / 2, y - h / 2, w, h, r);
    g.lineStyle(3, INK, 1).strokeRoundedRect(x - w / 2, y - h / 2, w, h, r);
    return g;
  }

  hud(title: string) {
    this.add.rectangle(W / 2, 22, W, 44, INK);
    this.label(12, 22, title, 20, '#ffd23f').setOrigin(0, 0.5);
    this.timerText = this.label(W - 12, 22, '', 20, '#ffffff').setOrigin(1, 0.5);
    this.scoreText = this.body(W / 2 + 40, 22, '', 14, '#ffffff');
  }

  setScore(s: string) {
    this.scoreText?.setText(s);
  }

  startTimer(seconds: number, onEnd: () => void, fmt?: (t: number) => string) {
    this.timeLeft = seconds;
    const show = () => this.timerText?.setText(fmt ? fmt(this.timeLeft) : `⏱ ${this.timeLeft}`);
    show();
    this.tick = this.time.addEvent({
      delay: 1000, loop: true,
      callback: () => {
        if (this.ended) return;
        this.timeLeft -= 1;
        show();
        if (this.timeLeft <= 0) onEnd();
      },
    });
  }

  pop(x: number, y: number, s: string, color = '#e63946', size = 26) {
    const t = this.label(x, y, s, size, color, { stroke: '#141414', strokeThickness: 5 });
    this.tweens.add({ targets: t, y: y - 40, alpha: 0, scale: 1.3, duration: 800, onComplete: () => t.destroy() });
  }

  shake(intensity = 0.01) {
    this.cameras.main.shake(180, intensity);
  }

  finish(stars: number) {
    if (this.ended) return;
    this.ended = true;
    this.tick?.remove();
    this.time.removeAllEvents();
    const s = Math.max(0, Math.min(3, Math.round(stars)));
    this.lastStars = s;
    this.add.rectangle(W / 2, H / 2, W, H, INK, 0.55);
    this.box(W / 2, H / 2, 300, 170, C.yellow, 12);
    this.label(W / 2, H / 2 - 40, s === 0 ? 'OOF.' : s === 3 ? 'KA-POW!' : 'NOT BAD!', 40, '#141414');
    this.label(W / 2, H / 2 + 20, '★'.repeat(s) + '☆'.repeat(3 - s), 46, '#e63946');
    this.time.delayedCall(1400, () => this.ctx.done(s));
  }
}

export const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(ax - bx, ay - by);
export const rand = (a: number, b: number) => a + Math.random() * (b - a);
export const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];

/** Segment (x1,y1)-(x2,y2) vs circle. */
export function segHitsCircle(x1: number, y1: number, x2: number, y2: number, cx: number, cy: number, r: number) {
  const dx = x2 - x1, dy = y2 - y1;
  const l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((cx - x1) * dx + (cy - y1) * dy) / l2));
  return dist(x1 + t * dx, y1 + t * dy, cx, cy) <= r;
}
