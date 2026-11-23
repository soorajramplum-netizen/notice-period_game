'use client';
// Mounts one mini game (a Phaser scene) and reports its 0–3 stars back to the comic.
import { useEffect, useRef } from 'react';
import type { GameCtx } from '@/lib/types';

const LOADERS: Record<string, () => Promise<{ default: unknown }>> = {
  rage: () => import('./rage'), darts: () => import('./darts'), maze: () => import('./maze'),
  slice: () => import('./slice'), slingshot: () => import('./slingshot'), pong: () => import('./pong'),
  alttab: () => import('./alttab'), stealth: () => import('./stealth'), stack: () => import('./stack'),
  runner: () => import('./runner'), pour: () => import('./pour'), poker: () => import('./poker'),
  crossing: () => import('./crossing'), invaders: () => import('./invaders'), boss: () => import('./boss'),
  toss: () => import('./toss'), fight: () => import('./fight'), smash: () => import('./smash'),
};

export default function PhaserHost({ gameKey, ctx }: { gameKey: string; ctx: GameCtx }) {
  const ref = useRef<HTMLDivElement>(null);
  const ctxRef = useRef(ctx);
  useEffect(() => {
    ctxRef.current = ctx;
  });

  useEffect(() => {
    let game: { destroy: (b: boolean) => void } | null = null;
    let cancelled = false;
    (async () => {
      const Phaser = await import('phaser');
      const mod = await LOADERS[gameKey]();
      try { await document.fonts.load(`24px ${ctxRef.current.font}`); } catch { /* fonts are optional */ }
      if (cancelled || !ref.current) return;
      let reported = false;
      const sceneCtx = {
        ...ctxRef.current,
        done: (s: number) => { if (!reported) { reported = true; ctxRef.current.done(s); } },
      };
      const g = new Phaser.Game({
        callbacks: { preBoot: (gm) => { gm.registry.set('ctx', sceneCtx); } },
        type: Phaser.AUTO,
        parent: ref.current,
        width: 400,
        height: 640,
        backgroundColor: '#fff6e0',
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        scene: [mod.default as typeof Phaser.Scene],
        input: { activePointers: 2 },
        banner: false,
      });
      game = g;
      // Dev only: lets play-test bots read the running scene. Not included in production builds.
      if (process.env.NODE_ENV !== 'production') (window as unknown as { __npGame?: unknown }).__npGame = g;
    })();
    return () => {
      cancelled = true;
      game?.destroy(true);
    };
  }, [gameKey]);

  return <div ref={ref} className="phaser-host" />;
}
