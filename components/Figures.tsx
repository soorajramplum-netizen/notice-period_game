// Flat comic-style characters, drawn in SVG with bold ink outlines.
// Placeholder art until hand-drawn characters replace them; each character keeps one consistent silhouette.
import type { HeroLook } from '@/lib/rules';

export type CharId =
  | 'hero' | 'captain' | 'policy' | 'yesman' | 'overlord' | 'chai' | 'escapee'
  | 'recruiter' | 'phantom' | 'panel' | 'pinto' | 'newmgr' | 'it' | 'phone';

const INK = '#141414';
const S = { stroke: INK, strokeWidth: 3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

type Mood = 'calm' | 'shout' | 'smug' | 'worried';

function Mouth({ mood, wide }: { mood: Mood; wide?: boolean }) {
  if (mood === 'shout') return <ellipse cx="60" cy="74" rx="9" ry="7" fill="#7a1d1d" {...S} />;
  if (mood === 'worried') return <path d="M50 77 Q60 70 70 77" fill="none" {...S} />;
  if (wide || mood === 'smug')
    return (
      <g>
        <path d="M44 70 Q60 86 76 70 Z" fill="#fff" {...S} />
        <path d="M48 72 L72 72" stroke={INK} strokeWidth="1.5" />
      </g>
    );
  return <path d="M50 72 Q60 79 70 72" fill="none" {...S} />;
}

function Eyes({ glasses, glow }: { glasses?: boolean; glow?: string }) {
  return (
    <g>
      <circle cx="49" cy="58" r="3.2" fill={glow ?? INK} />
      <circle cx="71" cy="58" r="3.2" fill={glow ?? INK} />
      {glasses && (
        <g fill="none" {...S} strokeWidth={2.5}>
          <circle cx="49" cy="58" r="8" />
          <circle cx="71" cy="58" r="8" />
          <path d="M57 58 L63 58" />
        </g>
      )}
    </g>
  );
}

function Bust(p: {
  skin: string; shirt: string; hair: string; hairStyle?: string; mood: Mood; glasses?: boolean;
  tie?: string; lanyard?: boolean; moustache?: boolean; children?: React.ReactNode; wide?: boolean; glow?: string;
}) {
  return (
    <g>
      {/* shoulders */}
      <path d="M14 140 Q16 104 44 98 L76 98 Q104 104 106 140 Z" fill={p.shirt} {...S} />
      {p.tie && <path d="M56 99 L64 99 L66 124 L60 132 L54 124 Z" fill={p.tie} {...S} strokeWidth={2.5} />}
      {p.lanyard && <path d="M46 99 L60 126 L74 99" fill="none" stroke="#d61f3c" strokeWidth="4" />}
      {p.lanyard && <rect x="53" y="122" width="14" height="12" rx="2" fill="#fff" {...S} strokeWidth={2} />}
      {/* neck + head */}
      <rect x="52" y="84" width="16" height="16" fill={p.skin} {...S} />
      <ellipse cx="60" cy="60" rx="26" ry="29" fill={p.skin} {...S} />
      {/* hair */}
      {p.hairStyle === 'long' && <path d="M32 58 Q30 24 60 26 Q90 24 88 58 L92 96 L80 92 L84 50 Q60 40 36 50 L40 92 L28 96 Z" fill={p.hair} {...S} />}
      {p.hairStyle === 'curly' && <path d="M34 52 Q28 30 44 28 Q50 18 62 24 Q74 16 82 28 Q94 32 86 52 Q76 40 60 42 Q44 40 34 52 Z" fill={p.hair} {...S} />}
      {p.hairStyle === 'bun' && <g><circle cx="60" cy="24" r="10" fill={p.hair} {...S} /><path d="M34 52 Q36 30 60 30 Q84 30 86 52 Q72 40 60 42 Q46 40 34 52 Z" fill={p.hair} {...S} /></g>}
      {p.hairStyle === 'slick' && <path d="M34 50 Q38 26 64 28 Q88 30 86 48 Q70 34 44 46 Z" fill={p.hair} {...S} />}
      {p.hairStyle === 'bald' ? null : (!p.hairStyle || p.hairStyle === 'short') && <path d="M34 52 Q34 28 60 29 Q86 28 86 52 Q76 38 60 40 Q44 38 34 52 Z" fill={p.hair} {...S} />}
      <Eyes glasses={p.glasses} glow={p.glow} />
      {p.moustache && <path d="M44 68 Q52 62 60 67 Q68 62 76 68 Q68 72 60 70 Q52 72 44 68 Z" fill="#3a2a1e" {...S} strokeWidth={2} />}
      <Mouth mood={p.mood} wide={p.wide} />
      {p.children}
    </g>
  );
}

export function Figure({ id, mood = 'calm', look }: { id: CharId; mood?: Mood; look?: HeroLook }) {
  switch (id) {
    case 'hero': {
      const l = look ?? { skin: '#c68863', hair: '#1d1d1d', shirt: '#3d7be0', hairStyle: 'short' };
      return <Bust skin={l.skin} hair={l.hair} hairStyle={l.hairStyle} shirt={l.shirt} mood={mood} lanyard />;
    }
    case 'captain':
      return (
        <Bust skin="#d9a27a" hair="#2a2a2a" hairStyle="slick" shirt="#e8eef8" tie="#1f4fa8" mood={mood === 'calm' ? 'smug' : mood} wide>
          <rect x="88" y="104" width="16" height="28" rx="3" fill="#222" {...S} strokeWidth={2} />
          <rect x="91" y="108" width="10" height="16" fill="#7fd3ff" />
        </Bust>
      );
    case 'policy':
      return (
        <Bust skin="#e8bf9a" hair="#4b4b4b" hairStyle="bun" shirt="#7b3fa0" mood={mood === 'calm' ? 'worried' : mood} glasses>
          <path d="M41 62 Q30 90 40 100" fill="none" stroke="#c9a227" strokeWidth="1.5" />
          <rect x="84" y="112" width="20" height="16" fill="#c0392b" {...S} strokeWidth={2} />
        </Bust>
      );
    case 'yesman':
      return <Bust skin="#d2a07c" hair="#222" hairStyle="short" shirt="#6aa7e6" mood="smug" />;
    case 'overlord':
      return (
        <g opacity="0.92">
          <Bust skin="#7fe9ff" hair="#7fe9ff" hairStyle="bald" shirt="#2bb5d6" mood={mood === 'calm' ? 'shout' : mood} glow="#ffffff" />
          {[30, 50, 70, 90, 110].map((y) => <line key={y} x1="10" x2="110" y1={y} y2={y} stroke="#fff" strokeOpacity="0.35" strokeWidth="2" />)}
        </g>
      );
    case 'chai':
      return (
        <Bust skin="#b07a52" hair="#d9d9d9" hairStyle="short" shirt="#f1e3c6" mood={mood} moustache>
          <path d="M84 110 L102 110 L98 132 L88 132 Z" fill="#b5651d" {...S} strokeWidth={2} />
        </Bust>
      );
    case 'escapee':
      return (
        <g>
          <circle cx="60" cy="60" r="52" fill="#fff6b0" opacity="0.8" />
          <Bust skin="#c98d68" hair="#3a2414" hairStyle="curly" shirt="#ffffff" mood="smug" wide />
        </g>
      );
    case 'recruiter':
      return (
        <g>
          <path d="M8 140 Q12 96 40 92 L80 92 Q108 96 112 140 Z" fill="#1b1b1b" {...S} />
          <path d="M40 92 L52 120 L60 98 L68 120 L80 92" fill="#2c2c2c" {...S} strokeWidth={2} />
          <ellipse cx="60" cy="58" rx="26" ry="29" fill="#111" {...S} />
          <circle cx="49" cy="58" r="3.5" fill="#ffe14d" />
          <circle cx="71" cy="58" r="3.5" fill="#ffe14d" />
          <path d="M34 56 Q34 30 60 30 Q86 30 86 56" fill="none" stroke="#444" strokeWidth="4" />
          <path d="M86 60 Q86 76 70 78" fill="none" stroke="#444" strokeWidth="3" />
        </g>
      );
    case 'phantom':
      return (
        <g opacity="0.55">
          <Bust skin="#d7b39a" hair="#111" hairStyle="slick" shirt="#2f3542" tie="#8e44ad" mood="smug" />
        </g>
      );
    case 'panel':
      return (
        <g transform="scale(0.5) translate(0 60)">
          <g transform="translate(-60 0)"><Bust skin="#c98d68" hair="#222" shirt="#16a085" mood="smug" wide /></g>
          <g transform="translate(60 0)"><Bust skin="#e0b08a" hair="#555" hairStyle="bun" shirt="#34495e" mood="calm" /></g>
          <g transform="translate(180 0)"><Bust skin="#a8714f" hair="#111" shirt="#7f8c8d" mood="worried" glasses /></g>
        </g>
      );
    case 'pinto':
      return (
        <Bust skin="#e4b896" hair="#6b4a2b" hairStyle="curly" shirt="#f39c12" mood="worried" glasses lanyard>
          <path d="M88 44 Q92 52 88 56 Q84 52 88 44 Z" fill="#7fd3ff" {...S} strokeWidth={1.5} />
        </Bust>
      );
    case 'newmgr':
    case 'it':
      return <Bust skin="#c68863" hair="#333" shirt={id === 'it' ? '#95a5a6' : '#1abc9c'} mood={mood} />;
    case 'phone':
      return (
        <g>
          <rect x="34" y="14" width="52" height="100" rx="8" fill="#222" {...S} />
          <rect x="39" y="24" width="42" height="78" rx="3" fill="#cfefff" />
          <circle cx="60" cy="108" r="3" fill="#555" />
        </g>
      );
  }
}

/** Map a balloon speaker or a description to the characters present. */
export function charsFor(text: string): CharId[] {
  const t = text.toUpperCase();
  const out: CharId[] = [];
  const add = (c: CharId, ...keys: string[]) => { if (keys.some((k) => t.includes(k)) && !out.includes(c)) out.push(c); };
  add('captain', 'CAPTAIN QUICK-CALL');
  add('policy', 'MADAME POLICY');
  add('phantom', 'CREDIT PHANTOM');
  add('overlord', 'OVERLORD');
  add('yesman', 'YES-MAN', 'YES-MEN');
  add('chai', 'CHAI UNCLE');
  add('recruiter', 'RECRUITER');
  add('escapee', 'ESCAPEE');
  add('panel', 'THE PANEL');
  add('pinto', 'PINTO');
  add('newmgr', 'NEW MANAGER');
  add('it', 'IT GUY');
  add('hero', '{HERO}', 'HERO');
  return out;
}
