'use client';
import { useEffect, useState } from 'react';
import { Button } from '@astryxdesign/core/Button';
import type { Effects, Line, Panel, PageItem, CoverItem } from '@/lib/types';
import type { HeroLook } from '@/lib/rules';
import { Figure, charsFor, type CharId } from './Figures';

export type Ctx = { name: string; look: HeroLook; notes: boolean };

const fill = (t: string, name: string) => t.replaceAll('{HERO}', name).replaceAll('{HERO}', name);

function sceneClass(desc: string, label: string): string {
  const d = (desc + ' ' + label).toLowerCase();
  if (/sepia|flashback/.test(d)) return 'scene-sepia';
  if (/screen goes black|black\./.test(d)) return 'scene-black';
  if (/red|alarm|weeoo|fortress|final boss/.test(d)) return 'scene-red';
  if (/brightline|sunlight|morning|epilogue|sunrise/.test(d)) return 'scene-bright';
  if (/canteen|chai/.test(d)) return 'scene-canteen';
  if (/boardroom|felt|card table/.test(d)) return 'scene-board';
  if (/night|dark|1:13|11:58|shadow|silhouette|rain/.test(d)) return 'scene-night';
  if (/flat|sofa|bed/.test(d)) return 'scene-flat';
  if (/phone|screen|email|notification|portal|calendar|message|laptop/.test(d)) return 'scene-screen';
  return 'scene-office';
}

function mood(text: string): 'calm' | 'shout' | 'smug' | 'worried' {
  if (/!|[A-Z]{4,}/.test(text)) return 'shout';
  if (/\.\.\.$|^\.\.\./.test(text)) return 'worried';
  return 'calm';
}

function Balloon({ line, name, side }: { line: Line; name: string; side: 'l' | 'r' }) {
  const text = fill(line.text, name);
  const who = fill(line.who, name);
  if (line.who.startsWith('CAPTION')) return <div className="cap">{text}</div>;
  if (line.who === 'SCREEN') return <div className="screen">{text}</div>;
  if (line.mode === 'thought') return <div className={`thought ${side}`}>{text}</div>;
  if (line.mode === 'message') return <div className={`msg ${side}`}><b>{who}</b>{text}</div>;
  return (
    <div className={`balloon ${side} ${line.mode === 'off-panel' ? 'off' : ''} ${text.length < 14 && /!|\.$/.test(text) ? 'big' : ''}`}>
      <span className="who">{who}</span>
      {text}
    </div>
  );
}

export function PanelView({ panel, ctx, delay = 0 }: { panel: Panel; ctx: Ctx; delay?: number }) {
  const spoken = panel.lines.filter((l) => !['CAPTION', 'SFX', 'CAMERA', 'SCREEN'].includes(l.who) && !l.who.startsWith('CAPTION'));
  const camera = panel.lines.filter((l) => l.who === 'CAMERA').map((l) => l.text).join(' ').toLowerCase();
  const sfx = panel.lines.filter((l) => l.who === 'SFX' && l.text.trim());
  let chars: CharId[] = [];
  for (const l of spoken) for (const c of charsFor(l.who)) if (!chars.includes(c)) chars.push(c);
  for (const c of charsFor(panel.desc)) if (!chars.includes(c)) chars.push(c);
  chars = chars.filter((c) => !(c === 'newmgr' && /message/.test(spoken.map((s) => s.mode).join())));
  if (!chars.length && /phone|screen|notification|message|email/i.test(panel.desc + spoken.map((s) => s.mode).join(' '))) chars = ['phone'];
  const shown = chars.slice(0, 3);
  const sadScene = /game over|no offer|rain|crumbles|cardboard box|terminated|drops their chai|shatters/i.test(
    panel.desc + ' ' + panel.lines.map((l) => l.text).join(' '),
  );
  const moodOf = (c: CharId) => {
    const l = spoken.find((s) => charsFor(s.who).includes(c));
    if (c === 'hero' && sadScene) return 'worried';
    return l ? mood(l.text) : 'calm';
  };
  const splash = panel.kind === 'splash';
  // Speech balloons alternate left/right; captions and screens don't count.
  const wordLines = panel.lines.filter((l) => !['SFX', 'CAMERA'].includes(l.who));
  const sides: ('l' | 'r')[] = [];
  let spokenCount = 0;
  for (const l of wordLines) {
    sides.push(spokenCount % 2 ? 'r' : 'l');
    if (!l.who.startsWith('CAPTION') && l.who !== 'SCREEN') spokenCount++;
  }
  return (
    <div
      className={`panel ${splash ? 'splash' : ''} ${sceneClass(panel.desc, panel.label)} ${camera.includes('shake') ? 'shake' : ''} ${camera.includes('zoom') ? 'zoom' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="art">
        <div className="figs">
          {shown.map((c, i) => (
            <svg key={c + i} viewBox="0 0 120 140" className={`fig fig-${shown.length}`}>
              {c === 'yesman' ? (
                <g>
                  <g transform="translate(-22 6) scale(0.85)"><Figure id="yesman" /></g>
                  <g transform="translate(40 6) scale(0.85)"><Figure id="yesman" /></g>
                  <Figure id="yesman" />
                </g>
              ) : (
                <Figure id={c} mood={moodOf(c)} look={ctx.look} />
              )}
            </svg>
          ))}
        </div>
        {sfx.map((s, i) => (
          <div key={i} className="sfx" style={{ top: `${18 + i * 22}%`, right: `${6 + i * 10}%`, rotate: `${i % 2 ? 8 : -10}deg` }}>
            {fill(s.text, ctx.name)}
          </div>
        ))}
        {ctx.notes && panel.desc && <div className="note">{fill(panel.desc, ctx.name)}</div>}
      </div>
      <div className="words">
        {wordLines.map((l, i) => <Balloon key={i} line={l} name={ctx.name} side={sides[i]} />)}
        {panel.card && (
          <div className="vcard">
            {panel.card.map((c, i) => <div key={i} className={i === 0 ? 'vtitle' : ''}>{fill(c, ctx.name)}</div>)}
          </div>
        )}
      </div>
    </div>
  );
}

/** One comic page: panels appear one tap at a time; choices block until picked. */
export function PageView({
  page, ctx, chosen, onChoose, onNext, onBack, canBack,
}: {
  page: PageItem; ctx: Ctx; chosen: Record<number, number>;
  onChoose: (panelIdx: number, optIdx: number, fx: Effects) => void;
  onNext: () => void; onBack: () => void; canBack: boolean;
}) {
  const [shown, setShown] = useState(1);
  const total = page.panels.length;
  const pendingChoice = page.panels.slice(0, shown).some((p, i) => p.kind === 'choice' && chosen[i] === undefined);
  const done = shown >= total && !pendingChoice;

  // A new page starts at the top; each newly revealed panel scrolls into view.
  useEffect(() => {
    if (shown === 1) window.scrollTo({ top: 0 });
    else window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }, [shown, chosen]);

  const advance = () => {
    if (pendingChoice) return;
    if (shown < total) setShown(shown + 1);
    else onNext();
  };

  return (
    <div className="page" onClick={advance}>
      {page.panels.slice(0, shown).map((p, i) => (
        <div key={i} className="pin">
          {p.kind === 'choice' ? (
            <div className="panel choice scene-office">
              <div className="words">
                <div className="cap">{fill(p.desc, ctx.name)}</div>
                <div className="choices" onClick={(e) => { if (chosen[i] === undefined) e.stopPropagation(); }}>
                  {p.options!.map((o, j) => (
                    <Button
                      key={j}
                      label={fill(o.label, ctx.name)}
                      variant={chosen[i] === j ? 'primary' : 'secondary'}
                      isDisabled={chosen[i] !== undefined && chosen[i] !== j}
                      onClick={() => chosen[i] === undefined && onChoose(i, j, o.fx)}
                    />
                  ))}
                </div>
                {chosen[i] !== undefined && (
                  <>
                    {p.options![chosen[i]].lines.map((l, k) => <Balloon key={k} line={l} name={ctx.name} side="l" />)}
                    <FxChips fx={p.options![chosen[i]].fx} />
                  </>
                )}
              </div>
            </div>
          ) : (
            <PanelView panel={p} ctx={ctx} />
          )}
        </div>
      ))}
      <div className="pager" onClick={(e) => e.stopPropagation()}>
        {canBack && <Button label="◀ Back" variant="ghost" onClick={onBack} />}
        <span className="hint">{pendingChoice ? 'Choose…' : done ? '' : 'Tap the page'}</span>
        <Button label={done ? 'Next ▶' : 'More ▼'} variant="primary" isDisabled={pendingChoice} onClick={advance} />
      </div>
    </div>
  );
}

export function FxChips({ fx }: { fx: Effects }) {
  const icon = { job: '💼', blame: '🎯', sanity: '🔋' } as const;
  const keys = Object.keys(fx) as (keyof typeof icon)[];
  if (!keys.length) return null;
  return (
    <div className="fx">
      {keys.map((k) => {
        const v = fx[k]!;
        const good = k === 'blame' ? v < 0 : v > 0;
        return <span key={k} className={good ? 'good' : 'bad'}>{icon[k]} {v > 0 ? '+' : ''}{v}</span>;
      })}
    </div>
  );
}

const COVER_VILLAIN: Record<number, CharId> = { 1: 'captain', 2: 'yesman', 3: 'phantom', 4: 'overlord', 5: 'policy' };

export function CoverView({ cover, num, title, ctx, onNext }: { cover: CoverItem; num: number; title: string; ctx: Ctx; onNext: () => void }) {
  const tagline = cover.tagline
    .split('·')
    .map((s) => s.trim())
    .find((s) => /^tagline:/i.test(s))
    ?.replace(/^tagline:\s*/i, '')
    .replace(/^"(.*)"$/, '$1');
  const tag = ['', '', tagline ?? (num === 1 ? '₹0 · NO HIKE' : '')];
  return (
    <div className={`cover cover-${num}`} onClick={onNext}>
      <div className="masthead">NOTICE<br />PERIOD</div>
      <div className="issue-no">#{num}</div>
      <div className="price">₹0</div>
      <div className="cover-art">
        <svg viewBox="0 0 120 140" className="cover-villain"><Figure id={COVER_VILLAIN[num] ?? 'captain'} mood="smug" /></svg>
        <svg viewBox="0 0 120 140" className="cover-hero"><Figure id="hero" mood={num === 5 ? 'shout' : 'worried'} look={ctx.look} /></svg>
      </div>
      <div className="cover-title">{title}</div>
      {tag[2] && <div className="cover-tag">{fill(tag[2], ctx.name)}</div>}
      {ctx.notes && <div className="note cover-note">{fill(cover.desc, ctx.name)}</div>}
      <div className="tap">Tap to open ▶</div>
    </div>
  );
}
