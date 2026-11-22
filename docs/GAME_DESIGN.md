# Notice Period: game design (v2, 22 Nov 2026)

> **One employee. One resignation. Ninety days. An entire company against them.**
> A motion-comic arcade game you finish in one sitting.

Status: **brainstorm and setup only. No code yet.** No AI, no API keys: every line, panel and game is hand-made.

---

## 1. The pitch
- You quit with no offer in hand. The comic follows your 90 days (story time, not real time; the whole game takes **25–30 minutes**).
- **Two fights at once:**
  - **The Hunt:** land a new job before the story reaches Day 90, or it's game over.
  - **The Company:** it dumps work on you, blames you for everything, steals your credit and leaks your job hunt.
- **Land an offer → the final Issue unlocks, *The Great Escape*:** the new company wants you in 15 days. Your notice says 45.
  Break out before the joining date.
- It plays like **reading a comic book**: covers, splash pages, panels that slide in, speech balloons and sound effects.
  Every few pages, the comic **becomes** a mini game.

### Why it can work
- **Real pain (RevProject need cards):** *Escape the notice-period trap* (49 posts) and *Quit without bond or notice trap* (33 posts, 100% emotional, trend 2.7x).
  Plus blame and PIP fear, calls during weddings, 600 applications for 2 interviews, and relieving letters held back. These are rewritten into story beats, never pasted.
- **Proven format, empty topic (Product Hunt):** office and startup satire does well (San Fran Sim 300 votes, Fake It Till You Make It 307,
  Cards Against Work 219), but "office satire" returns 0 launches.

---

## 2. The comic: five Issues, fifteen levels
Structured like a Marvel-style mini-series: **5 Issues × 3 levels.** Each Issue has a cover, a "Previously..." recap box, a villain splash page,
and ends on a **cliffhanger**. The finale has a **post-credits scene**.

### The cast
**Our hero:** *Employee #4471*. Everyperson, tired eyes, lanyard, a backpack that's seen things. You name them at the start.

| Character | Role | Comic-villain flavour |
|---|---|---|
| **Captain Quick-Call** | Your manager | Power: bends time (every "quick call" lasts 47 minutes). Catchphrase: *"Got 5 mins?"* |
| **Madame Policy** | HR head | Armoured in laminated policy PDFs from 2009. Weakness: being asked to show the actual clause |
| **The Credit Phantom** | Your rival | Invisible during work, materialises in front of leadership holding *your* slides |
| **The Overlord** | CEO | Appears only as a giant townhall hologram. *"We're not a company. We're a family."* |
| **The Yes-Men** | Henchmen | Identical, nodding, they travel in packs to meetings |
| **The Recruiter** | Neutral, mysterious | Appears in shadow, always asks *"Are you an immediate joiner?"* |
| **Chai Uncle** | Mentor | Runs the canteen, knows everything that's about to happen. Speaks in cryptic hints |
| **The Escapee** | Inspiration | A former colleague who made it out. Appears in flashbacks and on LinkedIn, glowing |

*Everything is fictional: the company (Synergex Solutions Pvt Ltd), the people and the portals. No real brands or logos.*

### Three meters (always on screen, comic-styled)
- 💼 **Job Hunt:** fills when you win Hunt levels. Too low at the end of Issue 4 = no offer.
- 🎯 **Blame:** fills when you lose Company levels. Full = *Terminated During Notice*, game over.
- 🔋 **Sanity:** stress-relief levels refill it. Low Sanity makes the next game harder (shaky aim, faster timers).

Between levels, a few **choice panels** ("Your phone buzzes. Saturday, 9:42 PM. *Got 5 mins?*" → Answer / Ignore) nudge the meters.
They keep the story personal without slowing it down.

---

### ISSUE #1: "THE LAST STRAW" (origin story)
*Cover: our hero at a desk, lightning outside, a laptop showing "Appraisal: Meets Expectations (3%)".*
**Opening pages:** Sunday 11:58 PM. *PING!* "Got 5 mins?" Monday: the 3% appraisal. The Escapee's LinkedIn glows: *"Thrilled to announce..."*
Something snaps. **SPLASH PAGE:** our hero stands up. *"I QUIT."* (Caption: *Day 1.*)

| Level | Mini game | How it plays | Why it's funny |
|---|---|---|---|
| **1. The Draft** | **Rage-to-Polite** | Your resignation email types itself with your real feelings: "THIS CIRCUS", "FINALLY FREE", "your 'quick calls'". Tap each angry word before it reaches the Send line to turn it corporate ("circus" → "organisation"). Miss one and HR reads it | The final email is shown in full: a masterpiece of polite fury |
| **2. The Quick Call** | **Darts** | Captain Quick-Call talks you out of quitting for 47 minutes. You're on mute, so you escape to an imaginary dartboard with his face. Flick to throw; your hand wobbles more as Sanity drops. His face dodges | Each hit pops a speech balloon ("We're a family!" → *POP*) |
| **3. The Portal** | **HR Portal Maze** | A top-down maze of drop-down menus. Self Service > My Journey > Life Events > Explore New Horizons > Initiate Separation *(beta)*. Pop-ups block the way ("Rate your experience!") | Madame Policy's first appearance: *"Form 7B. In triplicate."* |

**Cliffhanger:** Captain Quick-Call smiles a little too wide. *"Since you're leaving anyway... you won't mind owning Project Phoenix. Due Friday."*
**TO BE CONTINUED.**

### ISSUE #2: "THE SQUEEZE"
*Cover: our hero buried under a mountain of calendar invites, the Yes-Men nodding on top.*

| Level | Mini game | How it plays | Why it's funny |
|---|---|---|---|
| **4. Calendar Carnage** | **Slice the Invites** | Meeting invites fly up from the bottom of the screen. Swipe to slice them. Don't slice the Overlord's invite (it explodes into +Blame) | Invites read "Alignment on the alignment", "Pre-read for the pre-meeting", "Quick sync (2 hrs)" |
| **5. Apply-o-Matic** | **CV Slingshot** | Night-time job hunt: pull back and launch your CV into company mailboxes across a city skyline. Avoid the swirling **ATS Black Hole** that swallows CVs. Some mailboxes move; some say "Immediate joiners only" and bounce you back | Each landed CV lights a window in the skyline: a visual Job Hunt meter |
| **6. Blame Pong** | **Pong** | A bug from 2021 is now "yours". The blame ball flies at your paddle; deflect it onto the Yes-Men, the Credit Phantom or "The Vendor". Each miss stamps **BLAMED** on you | The ball speeds up every time someone says "Let's take this offline" |

**Cliffhanger:** a screenshot of your *Open to Work* badge lands in the team group chat. A shadow in the corner flickers: **the Credit Phantom.**

### ISSUE #3: "DOUBLE LIFE"
*Cover: split down the middle. Left: our hero at their desk, smiling. Right: the same hero in an interview, sweating.*

| Level | Mini game | How it plays | Why it's funny |
|---|---|---|---|
| **7. Boss Is Coming** | **Alt-Tab Reflex** | You're prepping for an interview at your desk. Footsteps, shadows and reflections in your screen give away who's approaching. Switch tabs in time, and only when someone is actually coming (false alarms waste time) | Your "work" tab is a spreadsheet titled "Q3_final_v7_REAL" |
| **8. The Great Sneak** | **Office Stealth** | Top-down sneak from your desk to the lift for a "doctor's appointment" (it's an interview). Avoid vision cones of Captain Quick-Call, the Yes-Men and the Credit Phantom. Hide behind plants and the coffee machine; Chai Uncle opens a shortcut | Getting spotted triggers a panel: *"Got 5 mins?"* and the clock jumps 47 minutes |
| **9. Tell Me About Yourself** | **Résumé Stack** | The interview. Drop achievement blocks onto a growing tower ("Led a team", "Saved ₹2 Cr", "Excel wizard"). Exaggerated blocks are bigger but wobblier. Build tall enough to impress the panel before it topples | If it topples: *"So... you were an intern?"* |

**Cliffhanger:** 4:55 PM. Chai Uncle slides over a cutting chai: *"Your deck. Boardroom. Five o'clock. Not you presenting."*

### ISSUE #4: "DARKEST HOUR"
*Cover: the Credit Phantom in the boardroom, holding up your slide, The Overlord's hologram applauding.*

| Level | Mini game | How it plays | Why it's funny |
|---|---|---|---|
| **10. The Chase** | **Office Runner** | Sprint across the floor to the boardroom before the Phantom hits "Present". Jump wheelie chairs, slide under jammed printers, dodge a birthday-cake crowd, take the stairs when the lift says "Out of order since 2019" | Make it in time and a splash page shows the Phantom frozen mid-slide |
| **11. The Brain Dump** | **Pour the KT** | Hand over your knowledge to your replacement. Pour glowing "knowledge" from your head into theirs, but their head leaks. Plug the holes with sticky notes while you keep pouring | Leaked knowledge forms puddles labelled "Where the passwords are", "Why the script is called test2.py" |
| **12. The Number** | **Salary Poker** | The Recruiter asks, *"Expected CTC?"* A bluffing card game: play your cards (*Competing offer*, *Rare skill*, *Already resigned*) while reading their tells (a sweat drop, a blink). Push too high and they fold | Win = **THE OFFER**. A full-page splash with an envelope glowing like an artefact |

**If Job Hunt is too low,** level 12 becomes a **second chance**: one more interview (a harder Résumé Stack). Lose that and it's game over.

**Cliffhanger:** the offer letter. *"Joining date: 15 days."* Your notice: **45 days left.** Madame Policy steps out of the shadows: *"Policy. Is. Policy."*

### ISSUE #5: "THE GREAT ESCAPE"
*Cover: our hero mid-leap through a window of red tape, the offer letter clutched to their chest.*

| Level | Mini game | How it plays | Why it's funny |
|---|---|---|---|
| **13. No-Dues Crossing** | **Laptop Run** (crossing game) | Carry your laptop, charger, ID card and "that dongle nobody explained" across the office floor in lanes: trolleys, a cleaning robot, a conga line for Fun Friday. Each desk (IT, Admin, Finance, the Library you never knew existed) signs off as you reach it | Admin's desk is only open 11:00–11:15 |
| **14. Reply-All Storm** | **Inbox Invaders** | Your farewell email triggers a wave of "All the best!! 👍" replies descending like invaders. Shoot them with Mute. Bosses: "Who is this?" and a 40 MB farewell GIF | The last invader is Captain Quick-Call: *"One last quick call?"* |
| **15. Final Boss: Madame Policy** | **Boss Fight** (three phases) | **1:** dodge flying policy PDFs. **2:** reflect "Policy is policy" back at her by asking for the clause. **3:** chase the pen to land the signature on your relieving letter | The letter arrives: *"Dear [FIRST_NAME]..."* |

**Epilogue splash:** first day at the new job. Sunlight. A plant on the desk. A real chair.
**POST-CREDITS SCENE:** a new message pops up from the new manager: *"Hey! Welcome! Got 5 mins?"* **THE END...?**

---

## 3. Endings
| Ending | How you get it |
|---|---|
| 🏆 **Relieved** | Beat the Escape with Blame under half |
| 😎 **The Clean Getaway** | Every level 3-starred. Unlocks a variant cover in the gallery |
| 🪃 **The Boomerang** | Win with very low Blame. A final panel: *"Door's always open!"* (It isn't) |
| ❌ **Exploring Opportunities** | No offer by the end of Issue 4. Your LinkedIn headline changes on its own |
| ❌ **Terminated During Notice** | Blame is full |
| ❌ **Offer Revoked** | You lose the final boss. *"We've decided to move ahead with another candidate."* |

A lose ending shows a dramatic "game over" comic page and lets you **replay from the start of that Issue**, not the whole game.

**The share card:** your own comic cover, with your name as the hero, your ending as the title, and a stats strip
("Quick calls survived: 23 · Blamed: 6 times · CVs sent: 212 · Darts on target: 14").

---

## 4. Making the comic look great (no 3D, no AI)
### The look
- **Classic printed-comic style:** bold black ink outlines, flat colours, **halftone (Ben-Day) dot shading**, slightly off-register colour,
  paper texture, yellow caption boxes ("MEANWHILE, ON THE 14TH FLOOR..."), jagged sound-effect lettering (*PING! KRAKA-CALL! SLAM!*).
- **Motion comic, not a static page:** panels slide in one by one, the camera pans across wide panels, speech balloons pop,
  and sound effects shake the frame. Tap to advance; swipe back to re-read.
- **Phone-first:** vertical page with 2–4 panels per screen, like a webtoon, plus the occasional full-screen splash page.

### Character art (the hardest part, so plan it early)
- **A modular 2D character rig, drawn in flat SVG:** each character is built from swappable parts
  (head, eyes, brows, mouth, arms, poses). About 8 expressions × 6 poses per main character covers the whole comic.
  Characters stay consistent from panel to panel, which is what makes a comic feel professional.
- **Starting points with open licences:**
  - **Open Peeps** (CC0): hand-drawn mix-and-match people, already close to comic ink. Recolour, add halftone, give the villains costumes.
  - **Kenney.nl asset packs** (CC0): game objects for the mini games (darts, paddles, office props).
- **Fonts (free, open licence):** *Bangers* for sound effects and titles, *Comic Neue* for balloons.
- **Sound:** free CC0 effect packs (e.g. Kenney audio) for pings and whooshes, plus our own made-up "incoming call" ringtone (no real app sounds).

### Writing it
- **Next step:** a full **comic script** (`docs/COMIC_SCRIPT.md`), panel by panel, written like a real comic script:
  `PAGE 3, PANEL 2. Wide. The open office at night... CAPTION: Day 1. 11:58 PM. SFX: PING!`
- It then becomes a simple data file (`content/issues/*.json`: pages → panels → art, captions, balloons, sound effects, camera moves).
  Writers can edit the comic without touching game code.

---

## 5. Tech: what to use
| Need | Pick | Why |
|---|---|---|
| **The arcade mini games** (darts, slingshot, runner, pong, invaders, stealth, physics stacking) | **Phaser** (MIT): the standard free 2D web-game engine, with built-in physics (Arcade + Matter.js) | These are real arcade games now. Phaser handles sprites, physics, input and touch on phones. Each level is one Phaser "scene" |
| **The comic reader** (panels, balloons, page turns) | React + CSS (halftone and ink effects in CSS/SVG) + `motion` for animations | Comic pages are layout and animation, which is web territory, not game-engine territory |
| **Menus, HUD, settings** | **Astryx** (Meta's design system) | Buttons, dialogs, progress bars and toasts, restyled with a comic theme |
| **Visual direction** | **Hallmark** (Nutlope, MIT), *optional* | A Claude design skill that generates HTML/CSS from material themes. Useful for exploring the cover look and building the landing page. It installs globally, so only with your OK |
| **Game balance** | One `rules.json` + a small test script | Meter changes and difficulty curves in one place |
| **AI / Hugging Face** | **Not used** | No keys, no models, no running cost. Everything is hand-written and hand-drawn |

- App: Next.js, installable on phones, works offline once loaded. Progress saves on the device.
- Folders (planned): `content/` (comic script data, card text), `art/` (SVG character parts, backgrounds), `games/` (one Phaser scene per level), `app/` (reader + HUD).

---

## 6. Build order (smallest version first)
1. **The comic script** for all 5 Issues (words before art).
2. **The character rig** for the hero + Captain Quick-Call, and the comic-panel reader.
3. **v0.1 = Issue #1 only:** cover → origin pages → Rage-to-Polite → Darts → HR Portal Maze → cliffhanger.
   If people hit "Next Issue", the format works.
4. Issues #2–#5, one at a time (each a natural "new issue out!" post).

**The one number:** % of players who finish Issue #1 and tap *Next Issue*. Second: share rate of the comic-cover card.

## 7. Open questions
1. Name: **Notice Period**, *Serving Notice*, *The Resigner*, or *Relieved*?
2. Hinglish in the balloons, or English only?
3. Hallmark: install globally to explore the cover look, or skip it?
4. Art: should I draw the character rig as SVG myself, starting from Open Peeps? Or do you have an illustrator friend for the five main faces?
