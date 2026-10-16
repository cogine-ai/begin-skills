# DOWN TO THE MOON

An original static independent Apollo 11 educational reader. No install or build step is needed. Serve this directory with an existing static HTTP runner, for example:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/`. There is no runtime network dependency. NASA source links are ordinary external links.

## Page inventory

- `index.html`: title, four chapter anchors (`departure`, `lunar-orbit`, `landing`, `return`), chapter-following desktop diagram, static phone scenes with finite enhancement, crew record, reading note and source list.
- `guide.html`: primary sources, diagram scope, local draft/checkpoint/download instructions, font notices.

Important action IDs: `reading-note`, `keep-note`, `download-note`, `note-status`, `kept-summary`, `resume-link`, `journey-map`, `diagram-phase`. Chapter bookmark buttons use `data-keep` with the stable chapter ID. `note-chapter` is the explicit draft/export target; chapter-scoped note links use `data-note-chapter`. `data-replay="landing"` replays the finite phone descent.

## State and movement

`model.mjs` owns versioned state validation, local storage read/write results and current text exports. `reader.mjs` owns the browser controls and chapter observation. The draft and deliberate checkpoint use separate named storage keys. A Keep operation verifies its recovery path: when only the checkpoint write succeeds, it removes the stale draft and checks that removal before relying on the checkpoint fallback. If that check fails, the UI retains a warning and the current edit stays protected. The leave check compares the note and effective chapter, including empty edits; an unedited initial null chapter is equivalent to the displayed first chapter. No unrelated browser storage is touched. Downloads include the current note, chapter and primary source links. Notes are never treated as HTML.

The chapter observer changes only the desktop schematic and selected navigation. It does not change scrolling, chapter positions or the deliberately kept checkpoint. A separate figure observer starts Eagle’s finite phone descent when the Landing figure is sufficiently visible; a nearby replay control repeats it. Columbia stays fixed. Movement is finite; there is no animation loop. Reduced-motion changes and page visibility remove transitions/animations. The main prose and source links work without JavaScript. In that condition the note controls stay disabled and explain the boundary.

The drawings are conceptual and not to scale. They are not historical trajectories or a clocked flight simulation. See the readable source guide and `NOTICES.md`.

## Proportional source checks

```sh
node --check reader.mjs
node --check model.mjs
node --test model.test.mjs
```

The first source was preserved before its browser review. Refinement adds an explicit note chapter, keeps the saved checkpoint independent, repairs narrow heading word boundaries, and gives the phone Landing motion a visible trigger and replay. Actual maker browser observations are recorded in the trial’s REFINEMENT.md; they do not establish physical-device behavior.
