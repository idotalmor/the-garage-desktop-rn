# FocusControl — State & Behavior Map

Top-bar focus timer control (`FocusControl.tsx`). This document lists every
visual/interactive state and the rules that govern transitions.

## Layout

`[focus buttons] | separator | [chip 1] [chip 2] +N`

- Max **2 timer chips** render inline (`timers.slice(0, 2)`); the rest collapse
  into a `+N` indicator.
- The whole control lives inside the **centered** top bar
  (`absolute left-1/2 -translate-x-1/2` in `AppShell`) — nothing in it may change
  layout width, or the whole bar re-centers and the cursor target drifts
  (clicking `+` would move the button out from under the mouse on every added
  timer). All expansions therefore use overlays/transforms, never layout
  growth. With `chipsOverlay` (non-compact bar), the chips row itself is
  `absolute left-7 top-1/2 -translate-y-1/2` on the control's `relative`
  wrapper — separator, chips, and `+N` float to the right of the 24px button
  slot without contributing layout width, so adding/removing timers never
  moves the cluster. In the compact bar (left-aligned flex row, no
  centering) chips stay in normal flow; overlaying them there would cover
  the window buttons on the right.

## Timer chip states (`FocusChip`)

Resolved with explicit precedence (first match wins):

| Order | State        | Trigger                              | Look                                   | Click action                  |
| ----- | ------------ | ------------------------------------ | -------------------------------------- | ----------------------------- |
| 1     | `finished`   | `timer.state === 'finished'`         | red pill (`bg-danger`)                 | none                          |
| 2     | `scheduled`  | `timer.state === 'scheduled'`        | gray pill, clock icon + start time     | opens focus page              |
| 3     | `stopping`   | `timer.state === 'stopping'`         | black pill + green ring (`ring-success`) | cancels stop                |
| 4     | `urgent`     | `remainingSeconds <= 4`              | red pill + countdown                   | requestStop (→ `stopping`)    |
| 5     | `running`    | default                              | small green circle (14px)              | requestStop (→ `stopping`)    |

> `stopping` beats `urgent`: a chip in the confirm/edit state never becomes the
> red urgent chip even at ≤4s.

### `running` — the green dot

- Collapsed: `h-3.5 max-w-3.5` (14×14), `rounded-full`, `bg-success`,
  `overflow-hidden`, **no padding on the chip itself** (padding lives on the
  counter span — chip padding would force a min width and make an oval).
- Breathing: opacity oscillates 0.55 → 1.0 on a 2.4s cosine cycle computed from
  the shared `now` clock (250ms tick in `useFocusMode`) → all dots stay in
  sync. Disabled on hover/focus (opacity pinned to 1) and with
  `prefers-reduced-motion`.
- Hover / `focus-visible`: expands `h-6 max-w-48` left-to-right into the green
  pill; the counter fades/slides in with a 150ms delay. Plain tabular-nums
  text — no rolling digits.

### `urgent` — last 4 seconds

- Red pill (`bg-danger`) showing the countdown directly.
- Same 2.4s synchronized breathing as the running dot (not the old fast flicker).
- Click requests stop → `stopping`.

### `stopping` — confirm/edit

- Black pill + `ring-2 ring-success`; leading square button confirms the stop;
  countdown stays as plain text.
- Timer is **paused** while open (`pauseStop` on mount, `resumeStop` on unmount).
- `DurationMenu` dropdown opens below (rename via `EditableText`, duration
  presets). Clicking outside cancels (`document` pointerdown listener +
  `fixed inset-0 z-[-1]` backdrop). Wrapper goes `z-50` to float above siblings.

### `finished`

- Red pill: square = dismiss (`dismissTimer`), circular-arrow = rerun
  (`againTimer`), then name marquee or flickering `0:00`.
- New finishes while the window is visible play `playFinishSound` once.

### `scheduled`

- Gray pill with clock + `formatTime(startsAt)`. Click opens the focus page.

## Focus buttons cluster

### Not on focus page (`isFocusPage === false`)

- Collapsed: 24px circle, hourglass icon only.
- Hover or `focus-within`: overlay expands `w-6 → w-12` + `bg-success`. The
  inner row is `[hourglass][+]` and never translates — the hourglass stays
  under the cursor in place, and the `+` is revealed in the newly exposed
  right half as the pill's clip widens.
- Expansion is an **absolutely positioned overlay** (`z-10`) — fixed 24px
  layout slot, so the centered top bar never re-centers.
- Siblings (separator, chips, `+N`) slide right `translate-x-6` via
  `peer-hover` / `peer-focus-within` — a transform, not layout — so they appear
  pushed aside rather than overlapped.
- Buttons blur themselves on press, so the chip collapses on mouse-out even
  though `focus-within` is active after a click. Keyboard tab-in still opens it.
- Normal hover expansion transitions **width only** (`bg-success` snaps on
  instantly) so the green never fades in late behind the buttons; the color
  transition is enabled only in `isFocusPage` where it animates the morph.
- Per-button hover wash is overridden via HeroUI's `--button-bg-hover` CSS
  variable (not `hover:bg-*`, which left HeroUI's default `--default-hover`
  gray wash visible): `rgb(0 0 0 / 0.2)` — the darker wash on the green chip.
  (An earlier layout slid the row so the hourglass moved out from under the
  cursor and the plus moved in; that needed a ~320ms `buttonLock` on the hover
  wash. Now that no icon moves under the cursor, the lock is gone.)

### On focus page (`isFocusPage === true`)

- Same DOM structure, different look — the overlay is
  `w-6 bg-black ring-2 ring-success` showing the hourglass (the `+` sits in the
  clipped right half). Because the structure is unified, entering/leaving the
  focus page **animates as a morph**: `width`, `background-color`, and the
  ring's `box-shadow` transition over 300ms while the plus slides out under
  the clip. (A `clip-path` variant was tried and reverted — it desynced
  differently and looked worse.)
- Hover or `focus-within` expands `w-6 → w-12` just like the normal state, but
  the pill **stays black** (no `bg-success`) and the `+` button is a live
  control with the white-on-black hover wash. Sibling chips still shift
  `translate-x-6`.

## `+N` hidden-timers menu

- Renders only when `timers.length > 2`.
- Trigger: `+N` text (`role="button"`, `aria-haspopup="menu"`). While hovered
  or the menu is open, the trigger itself becomes a black pill
  (`bg-black text-white rounded-full`) matching the menu surface.
- Opens on hover/focus via JS state (`isMoreOpen`) with a **250ms close delay**
  — pure `group-hover` was unusable because moving diagonally to the menu
  crosses the chips and a `display:none` menu can't re-trigger hover.
- The `+N` block is its own `MoreTimers` component holding `isOpen` internally
  — when `hiddenTimers` reaches 0 it unmounts and the state dies with it, so a
  re-added `+N` always starts closed (a state-reset fix failed because the
  unmount happens without `mouseleave`, and any surviving parent-level flag
  reopened the menu instantly).
- Menu: right-aligned below `+N` (`right-0`, extends left), dark
  (`bg-black`, `border-white/15`), `z-50`.
- Rows: `EditableText` name (hover border → click to edit → `renameTimer`),
  remaining countdown (or scheduled start time), red `bg-danger` square =
  `dismissTimer`.

## Electron drag-region rule

The top bar is `-webkit-app-region: drag`. In Electron, **drag regions don't
deliver `:hover` to non-interactive elements** — only `no-drag` elements get
hover/click. Existing CSS gives `no-drag` to `button`, `a`, `input`,
`[role='button']`, `.window-prompt-bar`, and the `.hover-menu` class (which
also no-drags all descendants). Anything interactive added to this control that
isn't one of those must opt out of dragging or its hover will be dead.
