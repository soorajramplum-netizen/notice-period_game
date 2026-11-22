// L12 · Salary Poker: play cards to push the offer up. Read the Recruiter's tells. Push too far and they walk.
import * as Phaser from 'phaser';
import { MiniGame, W, H, C, INK } from './kit';

type Card = { id: string; name: string; raise: number; nerve: number; uses: number; color: number };

export default class Poker extends MiniGame {
  round = 1;
  offer = 18;
  base = 18;
  nerve = 0;
  cards: Card[] = [];
  offerTxt!: Phaser.GameObjects.Text;
  tellTxt!: Phaser.GameObjects.Text;
  roundTxt!: Phaser.GameObjects.Text;
  hand!: Phaser.GameObjects.Container;
  busy = false;

  create() {
    this.round = 1; this.offer = 18; this.base = 18; this.nerve = this.ctx.hard ? 15 : 0; this.busy = false;
    const chased = (this.ctx.stars[10] ?? 0) >= 2;
    this.cards = [
      { id: 'comp', name: 'Competing\nOffer', raise: 3, nerve: 42, uses: 1, color: C.red },
      { id: 'rare', name: 'Rare\nSkill', raise: 2, nerve: 22, uses: 1, color: C.purple },
      { id: 'res', name: 'Already\nResigned', raise: 1, nerve: 10, uses: 2, color: C.blue },
      ...(chased ? [{ id: 'phx', name: 'Phoenix\nSaviour', raise: 2, nerve: 12, uses: 1, color: C.orange }] : []),
      { id: 'hold', name: 'Hold\n(calm)', raise: 0, nerve: -26, uses: 99, color: C.green },
    ];
    this.add.rectangle(W / 2, H / 2, W, H, 0x0b6e3f);
    this.hud('THE NUMBER');
    // recruiter silhouette
    this.add.ellipse(W / 2, 175, 110, 120, 0x111111).setStrokeStyle(3, INK);
    this.add.rectangle(W / 2, 270, 200, 90, 0x1b1b1b).setStrokeStyle(3, INK);
    this.add.circle(W / 2 - 20, 170, 5, 0xffe14d); this.add.circle(W / 2 + 20, 170, 5, 0xffe14d);
    this.body(W / 2, 330, 'THE RECRUITER', 12, '#ffe14d');
    this.tellTxt = this.label(W / 2, 92, '', 22, '#ffe14d');
    this.box(W / 2, 384, 260, 56, 0xffffff, 10);
    this.offerTxt = this.label(W / 2, 384, '', 30);
    this.roundTxt = this.body(W / 2, 424, '', 13, '#ffffff');
    this.hand = this.add.container(0, 0);
    this.draw();
  }

  draw() {
    this.offerTxt.setText(`Offer: ₹${this.offer} LPA`);
    this.roundTxt.setText(`Round ${Math.min(this.round, 5)} of 5`);
    const n = this.nerve + Phaser.Math.Between(-6, 6);
    this.tellTxt.setText([n > 40 ? '💧 sweat' : '', n > 65 ? '😑 blink' : '', n > 85 ? '🖊 tap-tap-tap' : ''].filter(Boolean).join('   ') || '😐 poker face');
    this.hand.removeAll(true);
    const live = this.cards.filter((c) => c.uses > 0);
    const cw = Math.min(76, (W - 20) / live.length - 6);
    live.forEach((c, i) => {
      const x = 10 + cw / 2 + i * (cw + 6), y = 530;
      const r = this.add.rectangle(x, y, cw, 110, c.color).setStrokeStyle(3, INK).setInteractive({ useHandCursor: true });
      const t = this.body(x, y - 10, c.name, 12, '#ffffff');
      const u = this.body(x, y + 38, c.raise ? `+₹${c.raise}` : 'calm', 12, '#ffffff');
      r.on('pointerdown', () => this.play(c));
      this.hand.add([r, t, u]);
    });
  }

  update() {
    if (this.ended || this.busy) return;
    const live = this.cards.filter((c) => c.uses > 0);
    ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'].forEach((k, i) => { if (live[i] && this.pressed(k)) this.play(live[i]); });
  }

  play(c: Card) {
    if (this.busy || this.ended) return;
    this.busy = true;
    c.uses--;
    this.nerve = Math.max(0, this.nerve + c.nerve + Phaser.Math.Between(-8, 8));
    if (this.nerve >= 100) {
      this.pop(W / 2, 220, '"We\'ll keep you on file."', '#e63946', 22);
      this.time.delayedCall(900, () => this.finish(0));
      return;
    }
    this.offer += c.raise;
    if (c.raise) this.pop(W / 2, 360, `+₹${c.raise} LPA`, '#ffd23f', 26);
    else this.pop(W / 2, 360, 'You sip water. Calmly.', '#ffffff', 18);
    this.round++;
    this.time.delayedCall(600, () => {
      this.busy = false;
      if (this.round > 5) {
        const gain = this.offer - this.base;
        this.finish(gain >= 8 ? 3 : gain >= 5 ? 2 : 1);
      } else this.draw();
    });
  }
}
