# Audio setup for a RUN.game project — looping music + sound effects

**Goal:** one background song that **loops and plays the whole time**, plus **two sound
effects** that fire at specific moments, working on **mobile and web**.

If the studio "can't connect" the audio after several prompts, it's almost always one of
these three things — this doc fixes all of them at once:

1. The audio files aren't where the build can find them (wrong folder / wrong path).
2. The music is being asked to **auto-play**, which browsers **block** — audio can only
   start on the player's **first tap/click**.
3. The second sound effect shares one audio object with the first, so it never fires.

Follow this exactly.

---

## Step 1 — Put the audio files in the project

Create a folder **`src/audio/`** and drop the three files in:

```
src/
  audio/
    song.mp3      <- background music
    sfx-1.mp3     <- first sound effect
    sfx-2.mp3     <- second sound effect
```

> Use `.mp3` (or `.m4a`). Keep filenames simple — no spaces.

We import them so the bundler resolves the correct URL automatically in **both** dev and
the deployed build. (This is the most reliable approach for a few small files. Do **not**
hardcode a path like `"/audio/song.mp3"` or `"/cdn-assets/song.mp3"` — those 404 in the
deployed game.)

---

## Step 2 — Add this audio module

Create **`src/audio.js`** and paste this whole file. It handles the browser autoplay rule,
the iOS quirk, looping, and per-effect playback:

```js
// audio.js — looping music that starts on the first user interaction, + sound effects.
import songUrl from './audio/song.mp3';
import sfx1Url from './audio/sfx-1.mp3';
import sfx2Url from './audio/sfx-2.mp3';

// --- background music (loops forever, starts on first tap/click) ---
const music = new Audio(songUrl);
music.loop = true;        // <- plays at all times
music.preload = 'auto';
music.volume = 0.6;       // 0..1, independent of the phone's volume

let musicStarted = false;
function startMusicOnce() {
  if (musicStarted) return;
  musicStarted = true;
  // IMPORTANT (iOS): call play() synchronously here, with NO await before it.
  music.play().catch(() => {
    musicStarted = false; // gesture was rejected; let the next tap try again
  });
}

// Browsers won't let audio start by itself — begin on the player's first interaction.
function armAutoStart() {
  const go = () => {
    startMusicOnce();
    window.removeEventListener('pointerdown', go);
    window.removeEventListener('keydown', go);
    window.removeEventListener('touchstart', go);
  };
  window.addEventListener('pointerdown', go);
  window.addEventListener('keydown', go);
  window.addEventListener('touchstart', go);
}
armAutoStart();

// --- sound effects (each gets its OWN element so they don't fight) ---
const sfx1 = new Audio(sfx1Url);
const sfx2 = new Audio(sfx2Url);
[sfx1, sfx2].forEach((s) => { s.preload = 'auto'; s.volume = 0.8; });

function playSfx(s) {
  s.currentTime = 0;            // rewind so it can fire again immediately
  s.play().catch(() => {});
}

export const audio = {
  playSfx1: () => playSfx(sfx1),
  playSfx2: () => playSfx(sfx2),
  startMusic: startMusicOnce,        // optional: call from your own "tap to start"
  setMusicVolume: (v) => { music.volume = Math.max(0, Math.min(1, v)); },
  pauseMusic: () => music.pause(),
  resumeMusic: () => music.play().catch(() => {}),
};
```

---

## Step 3 — Use it in the game

Import it once near the top of the app, then call the sfx helpers wherever those moments
happen:

```js
import { audio } from './audio';

// ...wherever the first effect should play:
audio.playSfx1();

// ...wherever the second effect should play:
audio.playSfx2();
```

That's it — the music starts looping the instant the player first touches the screen, and
both sound effects play on demand.

---

## Why it was failing before (so the studio doesn't repeat it)

- **"The song doesn't play."** Browsers (especially mobile Safari) **block autoplay**.
  Audio cannot start on page load — only after a user gesture. The fix is the
  first-interaction listener above; there is no other way to start it.
- **"It works in the editor preview but not on my phone."** Same autoplay rule, stricter on
  mobile, plus iOS rejects `play()` if anything is `await`-ed between the tap and the call.
  Keep `music.src` ready ahead of time and call `play()` directly in the listener.
- **"Only one sound effect works."** Two effects were sharing a single `Audio` object, or
  `currentTime` wasn't reset. Each effect needs its **own** `Audio` element and a
  `currentTime = 0` before `play()` — both handled above.
- **"The studio can't connect the files."** Hardcoded paths like `/audio/song.mp3` don't
  exist in the deployed build. **Importing** the files (`import songUrl from './audio/song.mp3'`)
  lets the bundler produce a URL that works in dev and production.

---

## Optional: a visible "Tap to start" (nice on mobile)

If you'd rather the player explicitly start audio (instead of any tap), show a button on
first load and call `audio.startMusic()` from its click handler — that click counts as the
required gesture:

```js
<button onClick={() => audio.startMusic()}>🔊 Tap to start</button>
```
