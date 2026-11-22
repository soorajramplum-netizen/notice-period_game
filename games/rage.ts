// L1 · Rage-to-Polite: tap angry words before they reach SEND; they flip to corporate-speak.
import * as Phaser from 'phaser';
import { MiniGame, W, H, C, pick, rand } from './kit';

const SWAPS: [string, string][] = [
  ['this circus', 'this organisation'], ['FINALLY FREE', 'excited for the next chapter'],
  ['your "quick calls"', 'our regular check-ins'], ['a 3% insult', 'my compensation journey'],
  ['toxic', 'fast-paced'], ["I'm DONE", "I'd like to resign"], ['midnight pings', 'flexible working culture'],
  ['clown', 'leader'], ['never again', 'grateful for the learnings'], ["you'll regret this", 'all the best to the team'],
  ['soul-crushing', 'challenging'], ['pointless meetings', 'alignment sessions'],
];
const FINE = ['Regards', 'team', 'Dear Sir', 'kindly', 'notice period', 'handover', 'Thank you'];
const LINE_Y = 560;

type Word = { t: Phaser.GameObjects.Text; angry: boolean; done: boolean; speed: number };

export default class Rage extends MiniGame {
  words: Word[] = [];
  leaks = 0;
  spawned = 0;

  create() {
    this.words = []; this.leaks = 0; this.spawned = 0;
    this.paper(0xfdfdfd);
    this.hud('THE DRAFT');
    this.add.rectangle(W / 2, 80, W - 24, 44, 0xeef3fb).setStrokeStyle(2, 0x141414);
    this.body(W / 2, 80, 'To: Captain Quick-Call   Cc: HR   Subject: Resignation', 12);
    this.add.rectangle(W / 2, LINE_Y + 30, W, 60, C.blue);
    this.label(W / 2, LINE_Y + 30, 'SEND ▶  (don\'t let RED through)', 22, '#ffffff');
    this.add.line(0, 0, 0, LINE_Y, W, LINE_Y, 0x141414).setOrigin(0).setLineWidth(3);
    this.setScore('Leaked: 0');
    const total = 46;
    this.startTimer(total, () => this.end());
    const spawn = () => {
      if (this.ended) return;
      const elapsed = total - this.timeLeft;
      this.add1(elapsed);
      if (elapsed > 32) this.time.delayedCall(260, () => this.add1(elapsed));
      this.time.delayedCall(Math.max(850, 1600 - elapsed * 18), spawn);
    };
    this.time.delayedCall(600, spawn);
  }

  add1(elapsed: number) {
    const angry = Math.random() < 0.72;
    const [bad] = angry ? pick(SWAPS) : [pick(FINE)];
    const t = this.body(rand(90, W - 90), 120, bad, angry ? 18 : 15, angry ? '#ffffff' : '#141414', {
      backgroundColor: angry ? '#e63946' : '#ffffff', padding: { x: 8, y: 5 },
    });
    t.setStroke('#141414', angry ? 0 : 0).setInteractive({ useHandCursor: true });
    const w: Word = { t, angry, done: false, speed: 55 + elapsed * 2.2 + this.stress * 25 };
    if (angry) this.spawned++;
    t.on('pointerdown', () => this.hit(w));
    this.words.push(w);
  }

  hit(w: Word) {
    if (w.done || this.ended) return;
    w.done = true;
    if (w.angry) {
      const good = SWAPS.find(([b]) => b === w.t.text)?.[1] ?? 'kindly';
      w.t.setText(good).setBackgroundColor('#2fa36b');
      this.tweens.add({ targets: w.t, alpha: 0, y: w.t.y - 30, duration: 700, delay: 300, onComplete: () => w.t.destroy() });
      this.pop(w.t.x, w.t.y - 20, 'CORPORATE!', '#2fa36b', 18);
    } else {
      this.pop(w.t.x, w.t.y - 20, '? HR is confused', '#7b3fa0', 16);
      this.timeLeft = Math.max(1, this.timeLeft - 2);
      w.t.destroy();
    }
  }

  update(_: number, dt: number) {
    if (this.ended) return;
    for (const w of this.words) {
      if (w.done) continue;
      w.t.y += (w.speed * dt) / 1000;
      if (w.t.y > LINE_Y) {
        w.done = true;
        if (w.angry) {
          this.leaks++;
          this.setScore(`Leaked: ${this.leaks}`);
          this.shake(0.012);
          this.pop(w.t.x, LINE_Y - 30, 'HR READ THAT', '#e63946', 18);
        }
        w.t.destroy();
      }
    }
    this.words = this.words.filter((w) => !w.done || w.t.active);
  }

  end() {
    const s = this.leaks <= 1 ? 3 : this.leaks <= 3 ? 2 : this.leaks <= 6 ? 1 : 0;
    this.finish(s);
  }
}
void H;
