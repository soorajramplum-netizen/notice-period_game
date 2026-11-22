// L7 · Boss Is Coming: prep on the secret tab, switch to the spreadsheet when someone is really coming.
import * as Phaser from 'phaser';
import { MiniGame, W, H, C, INK, pick } from './kit';

type Visitor = { name: string; threat: boolean; tell: string; warn: number };
const VISITORS: Visitor[] = [
  { name: 'CAPTAIN QUICK-CALL', threat: true, tell: '☕ steam… footsteps', warn: 1600 },
  { name: 'A YES-MAN', threat: true, tell: '👣 footsteps getting louder', warn: 1500 },
  { name: 'THE CREDIT PHANTOM', threat: true, tell: '〰 the air ripples…', warn: 900 },
  { name: 'THE CLEANER', threat: false, tell: '🧹 a mop squeaks', warn: 1500 },
  { name: 'A LOST INTERN', threat: false, tell: '👣 hesitant footsteps', warn: 1500 },
  { name: 'CHAI UNCLE', threat: false, tell: '🍵 chai smell. He winks.', warn: 1500 },
];

export default class AltTab extends MiniGame {
  onPrep = true;
  prep = 0;
  caught = 0;
  screen!: Phaser.GameObjects.Rectangle;
  screenText!: Phaser.GameObjects.Text;
  bar!: Phaser.GameObjects.Rectangle;
  tellText!: Phaser.GameObjects.Text;
  shadow!: Phaser.GameObjects.Ellipse;
  incoming: Visitor | null = null;

  create() {
    this.onPrep = true; this.prep = 0; this.caught = 0; this.incoming = null;
    this.paper(0xdfe6ee);
    this.hud('BOSS IS COMING');
    this.shadow = this.add.ellipse(W + 60, 250, 160, 360, 0x000000, 0.25);
    this.box(W / 2, 260, 340, 230, 0x222831, 10);
    this.screen = this.add.rectangle(W / 2, 255, 316, 196, 0xffffff);
    this.screenText = this.body(W / 2, 255, '', 15, '#141414', { wordWrap: { width: 290 } });
    this.add.rectangle(W / 2, 420, 300, 22, 0xffffff).setStrokeStyle(3, INK);
    this.bar = this.add.rectangle(W / 2 - 148, 420, 0, 16, C.green).setOrigin(0, 0.5);
    this.body(W / 2, 446, 'Interview prep', 13);
    this.tellText = this.label(W / 2, 110, '', 20, '#e63946');
    const btn = this.box(W / 2, 540, 300, 80, C.yellow, 12);
    void btn;
    this.label(W / 2, 540, 'ALT + TAB', 34);
    this.add.zone(W / 2, 540, 300, 80).setInteractive().on('pointerdown', () => this.toggle());
    this.body(W / 2, 610, this.hint('Tap to switch tabs. Prep only fills on the prep tab.', 'Click or SPACE to switch tabs. Prep only fills on the prep tab.'), 13);
    this.draw();
    this.setScore('Caught: 0');
    this.startTimer(45, () => this.end());
    this.schedule();
  }

  toggle() {
    if (this.ended) return;
    this.onPrep = !this.onPrep;
    this.draw();
  }

  draw() {
    this.screen.setFillStyle(this.onPrep ? 0xfffbe6 : 0xe8f5e9);
    this.screenText.setText(this.onPrep
      ? 'Interview_prep.docx\n\n"Tell me about yourself"\n"Why are you leaving?"\n"Biggest weakness?"'
      : 'Q3_final_v7_REAL.xlsx\n\n| Q1 | Q2 | Q3 |\n| 12 | 14 | ?? |\n(looking very busy)');
  }

  schedule() {
    if (this.ended) return;
    this.time.delayedCall(Phaser.Math.Between(1700, 3200) - this.stress * 500, () => {
      if (this.ended) return;
      const v = pick(VISITORS);
      this.incoming = v;
      this.tellText.setText(v.tell);
      this.tweens.add({ targets: this.shadow, x: W - 40, duration: v.warn });
      this.time.delayedCall(v.warn, () => this.arrive(v));
    });
  }

  arrive(v: Visitor) {
    if (this.ended) return;
    if (v.threat && this.onPrep) {
      this.caught++;
      this.prep = Math.max(0, this.prep - 10);
      this.shake(0.015);
      this.pop(W / 2, 200, `${v.name}: "What's that?"`, '#e63946', 16);
      this.setScore(`Caught: ${this.caught}`);
    } else if (!v.threat && !this.onPrep) {
      this.pop(W / 2, 200, `just ${v.name.toLowerCase()}…`, '#7b3fa0', 16);
    } else if (v.threat) this.pop(W / 2, 200, 'SAFE. Very busy spreadsheet.', '#2fa36b', 16);
    this.tellText.setText('');
    this.tweens.add({ targets: this.shadow, x: W + 60, duration: 600 });
    this.incoming = null;
    this.schedule();
  }

  update(_: number, dt: number) {
    if (this.ended) return;
    if (this.pressed('SPACE')) this.toggle();
    if (this.onPrep) this.prep = Math.min(100, this.prep + (dt / 1000) * 3.4);
    this.bar.width = (this.prep / 100) * 296;
    if (this.prep >= 100) this.end();
  }

  end() {
    const p = this.prep, c = this.caught;
    this.finish(p >= 100 && c === 0 ? 3 : p >= 70 && c <= 1 ? 2 : p >= 40 ? 1 : 0);
  }
}
void H;
