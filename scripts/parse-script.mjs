// Turns docs/COMIC_SCRIPT.md (the single source of truth for the story) into content/comic.json.
// Runs before `dev` and `build`. Edit the script, not the JSON.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'docs', 'COMIC_SCRIPT.md'), 'utf8').replace(/\r\n/g, '\n');

const METER = { '💼': 'job', '🎯': 'blame', '🔋': 'sanity' };

/** Pull meter changes like **[🔋 −1] [🎯 +5]** out of a line. */
function effectsOf(text) {
  const fx = {};
  const re = /(💼|🎯|🔋)\s*([+−-])\s*(\d+)/g;
  let m;
  while ((m = re.exec(text))) fx[METER[m[1]]] = (fx[METER[m[1]]] || 0) + (m[2] === '+' ? 1 : -1) * Number(m[3]);
  return fx;
}
const stripEffects = (t) => t.replace(/\*\*\[[^\]]*\](\s*\[[^\]]*\])*\*\*/g, '').trim();
const clean = (t) => t.replace(/\*\*/g, '').replace(/(^|\s)\*([^*]+)\*/g, '$1$2').trim();

/** `NAME (mode):` text  ->  {who, mode, text} */
function parseLine(line) {
  const m = line.match(/^`([^`]+?):`\s*(.*)$/);
  if (!m) return null;
  const tag = m[1].trim();
  const mm = tag.match(/^(.+?)\s*\(([^)]+)\)$/);
  const who = mm ? mm[1].trim() : tag;
  let text = clean(m[2]);
  // Sound effects often carry a stage note in brackets ("SKRRRT (a record-scratch...)"); letter only the sound.
  if (who === 'SFX') text = text.replace(/\s*\([^)]*\)\s*$/, '');
  return { who, mode: mm ? mm[2].trim() : '', text };
}

/** Inline result text with `NAME:` segments -> caption + lines. */
function inlineLines(text) {
  const lines = [];
  const re = /`([^`]+?):`\s*([^`]*)/g;
  const first = text.indexOf('`');
  const lead = clean(first === -1 ? text : text.slice(0, first));
  if (lead) lines.push({ who: 'CAPTION', mode: '', text: lead });
  let m;
  while ((m = re.exec(text))) {
    const tag = m[1].trim();
    const mm = tag.match(/^(.+?)\s*\(([^)]+)\)$/);
    lines.push({ who: mm ? mm[1].trim() : tag, mode: mm ? mm[2].trim() : '', text: clean(m[2]) });
  }
  return lines;
}

const sequences = {};
let seq = null, item = null, panel = null, mode = null;

function newPanel(kind, label, desc) {
  panel = { kind, label, desc: desc ? clean(desc) : '', lines: [] };
  item.panels.push(panel);
}

// Join indented continuation lines onto the bullet above them.
const rawLines = [];
for (const l of src.split('\n')) {
  const prev = rawLines[rawLines.length - 1];
  if (/^ {2,}\S/.test(l) && prev !== undefined && /^- /.test(prev.trim())) rawLines[rawLines.length - 1] = prev + ' ' + l.trim();
  else rawLines.push(l);
}

for (const raw of rawLines) {
  const line = raw.trim();
  let m;
  // Top-level sequences
  if ((m = raw.match(/^# (ISSUE #(\d+): "([^"]+)"|BRANCH: (.+)|ENDING: (.+)|.+)$/))) {
    seq = null; item = null; panel = null; mode = null;
    if (m[2]) seq = { id: `issue${m[2]}`, kind: 'issue', num: Number(m[2]), title: m[3], items: [] };
    else if (m[4]) seq = { id: `branch:${m[4].trim()}`, kind: 'branch', title: m[4].trim(), items: [] };
    else if (m[5]) seq = { id: `ending:${m[5].trim()}`, kind: 'ending', title: m[5].trim(), items: [] };
    if (seq) sequences[seq.id] = seq;
    continue;
  }
  if (!seq) continue;
  if (line === '---') continue;

  if (line === '### COVER') { item = { type: 'cover', desc: '', tagline: '' }; seq.items.push(item); mode = 'cover'; panel = null; continue; }
  if ((m = line.match(/^### PAGE (\d+)(?::\s*(.+))?$/))) {
    item = { type: 'page', label: m[2] || '', panels: [] }; seq.items.push(item); mode = 'page'; panel = null;
    if (m[2]) newPanel(/POST-CREDITS/i.test(m[2]) ? 'panel' : /CLIFFHANGER/i.test(m[2]) ? 'panel' : 'splash', m[2], '');
    if (/CLIFFHANGER|POST-CREDITS/i.test(m[2] || '')) { item.panels.pop(); panel = null; }
    continue;
  }
  if ((m = line.match(/^### ▶ LEVEL (\d+): (.+?) \(mini game: (.+)\)$/))) {
    item = { type: 'level', n: Number(m[1]), title: clean(m[2]), game: m[3], intro: '', results: {} };
    seq.items.push(item); mode = 'level'; panel = null; continue;
  }
  if (line.startsWith('###')) { mode = null; continue; }

  if (mode === 'cover') {
    if (line.startsWith('Cover text:')) item.tagline = clean(line.replace('Cover text:', ''));
    else if (line) item.desc += (item.desc ? ' ' : '') + clean(line);
    continue;
  }

  if (mode === 'level') {
    if ((m = line.match(/^\*\*Intro card:\*\*\s*(.+)$/))) item.intro = clean(m[1]).replace(/^"|"$/g, '');
    else if ((m = line.match(/^- \*\*(★★★|★–★★|No stars)\*\*\s*(.+)$/))) {
      const key = m[1] === '★★★' ? '3' : m[1] === '★–★★' ? '2' : '0';
      item.results[key] = { lines: inlineLines(stripEffects(m[2])), fx: effectsOf(m[2]) };
    }
    continue;
  }

  if (mode === 'page') {
    if ((m = line.match(/^\*\*PANEL \d+(?: \(([^)]*)\))?\.\*\*\s*(.*)$/))) { newPanel('panel', m[1] || '', m[2]); continue; }
    if ((m = line.match(/^\*\*CHOICE PANEL\.\*\*\s*(.*)$/))) { newPanel('choice', '', m[1]); panel.options = []; continue; }
    if ((m = line.match(/^- \*\*\[([^\]]+)\]\*\*\s*→\s*(.+)$/)) && panel?.options) {
      panel.options.push({ label: m[1].replace(/^"(.*)"$/, '$1'), lines: inlineLines(stripEffects(m[2])), fx: effectsOf(m[2]) });
      continue;
    }
    if (line.startsWith('>')) {
      if (!panel) newPanel('splash', item.label, '');
      (panel.card ||= []).push(clean(line.replace(/^>\s*/, '')));
      continue;
    }
    const l = parseLine(line);
    if (l) { if (!panel) newPanel('splash', item.label, ''); panel.lines.push(l); continue; }
    if (line && !line.startsWith('|')) {
      if (!panel) newPanel('splash', item.label, '');
      const inl = line.match(/^(.*?)`SFX:`\s*(.+)$/);
      const text = inl ? inl[1] : line;
      if (inl) panel.lines.push({ who: 'SFX', mode: '', text: clean(inl[2]).replace(/\s*\([^)]*\)\s*$/, '') });
      if (text.trim()) panel.desc += (panel.desc ? ' ' : '') + clean(text);
    }
  }
}

const out = { generatedFrom: 'docs/COMIC_SCRIPT.md', sequences };
mkdirSync(join(root, 'content'), { recursive: true });
writeFileSync(join(root, 'content', 'comic.json'), JSON.stringify(out, null, 1));
const summary = Object.values(sequences).map((s) => `${s.id}: ${s.items.length} items, ${s.items.filter((i) => i.type === 'level').length} levels`);
console.log('comic.json written\n  ' + summary.join('\n  '));
