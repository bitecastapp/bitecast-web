---
name: Bitecast
description: Bengaluru's dish-by-dish guide to what's worth eating.
colors:
  mint-ground: "oklch(0.97 0.008 150)"
  glass: "oklch(0.99 0.004 150)"
  lattice: "oklch(0.46 0.09 148)"
  pane-live: "oklch(0.93 0.04 150)"
  bloom: "oklch(0.58 0.19 33)"
  leaf-ink: "oklch(0.29 0.045 155)"
  muted-ink: "oklch(0.45 0.03 155)"
  field-border: "oklch(0.6 0.03 150)"
  hairline: "oklch(0.86 0.02 150)"
  wash: "oklch(0.93 0.02 150)"
  error: "oklch(0.52 0.19 28)"
typography:
  display:
    fontFamily: "Manrope, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Manrope, sans-serif"
    fontSize: "2rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Manrope, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
rounded:
  control: "12px"
spacing:
  gutter: "24px"
  gutter-desktop: "48px"
  stack: "24px"
components:
  button-primary:
    backgroundColor: "{colors.leaf-ink}"
    textColor: "{colors.mint-ground}"
    rounded: "{rounded.control}"
    height: "52px"
    padding: "12px 20px"
  button-secondary:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.leaf-ink}"
    rounded: "{rounded.control}"
    height: "52px"
  button-ghost:
    textColor: "{colors.leaf-ink}"
    rounded: "{rounded.control}"
    height: "52px"
  input:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.leaf-ink}"
    rounded: "{rounded.control}"
    height: "52px"
    padding: "0 14px"
  choice-row:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.leaf-ink}"
    rounded: "{rounded.control}"
    height: "56px"
  choice-row-selected:
    backgroundColor: "{colors.pane-live}"
    textColor: "{colors.leaf-ink}"
---

# Design System: Bitecast

## Overview

**Creative North Star: "The Glasshouse"**

Bitecast is a Lalbagh-style glasshouse on a calm mint ground. A thin leaf-green arch with window panes sits at the top of every screen. Each step you finish leaves a small red flower in its own pane, and the pane you're on glows pale mint with a fresh sprout. Everything else is quiet: one typeface, one dark leaf ink, generous space, standard controls.

The glasshouse is the one thing on the screen with character. Copy and controls stay plain so it can be.

Chosen by the owner on 2026-10-21 for being "more refreshing and minimal but more interesting". It replaced an earlier cricket-scoreboard system.

**Key Characteristics:**
- Mint ground, glass-white surfaces, dark leaf ink.
- One arch, the same size and position on every screen.
- Bloom red only for flowers and one emphasised word.
- Flat: no shadows, no gradients.
- One motion: the bloom.

## Colors

Fresh greens with a single red.

### Primary
- **Leaf Ink** (oklch(0.29 0.045 155)): all text, primary buttons, focus rings.

### Secondary
- **Bloom** (oklch(0.58 0.19 33)): flowers in the glasshouse and one emphasised word per screen (like "dish"). 4.31:1 on the ground, so **large text only** (24px+ or bold 18.66px+).

### Neutral
- **Mint Ground** (oklch(0.97 0.008 150)): page background. Also the browser theme color (#f2f6f1).
- **Glass** (oklch(0.99 0.004 150)): inside the arch, inputs, choice rows.
- **Lattice** (oklch(0.46 0.09 148)): the arch's lines and the city label.
- **Pane Live** (oklch(0.93 0.04 150)): the current step's pane and the selected choice row.
- **Muted Ink** (oklch(0.45 0.03 155)): supporting copy, 6.3:1 or better.
- **Field Border** (oklch(0.6 0.03 150)): input and choice-row borders, 3.57:1 against the ground.

### Named Rules
**The One Bloom Rule.** Red is for flowers and at most one word per screen. Never for buttons, links, or errors.

## Typography

**Font:** Manrope, self-hosted via next/font.

**Character:** a friendly geometric sans, heavy at the top and light in the body.

### Hierarchy
- **Display** (800, 2.75rem; 3.75rem on desktop; 1.02 line height): the login tagline only.
- **Headline** (800, 2rem): one per screen ("Check your inbox", "Where's home?").
- **Title** (800, 1.5rem): the handle on home.
- **Body** (400, 1rem, 1.5): supporting copy.
- **Label** (500, 0.875rem): field labels, hints, secondary notes.

## Layout

On phones: a 24px gutter with safe-area insets. The header (wordmark left, "Bengaluru" right) sits above the arch, which scales to the width but never grows taller than 34% of the screen height. Content follows with a 28px gap, and the main action sits at the bottom in thumb reach. From the `md` breakpoint it becomes two equal columns, with header and arch on the left and content (max 384px) on the right, vertically centred.

## Elevation & Depth

Flat. Depth comes only from the arch framing the glass.

## Shapes

12px corners on all controls. The arch is a 1.5px hairline; the inner lattice draws at 50% opacity. Focus is a 2px leaf-ink ring with a 2px ground-coloured gap.

## Components

- **Glasshouse** (`components/glasshouse.tsx`): the arch with four lower panes, one per sign-up step (email, inbox, handle, home). `step` marks the live pane; panes before it are in bloom; `step={5}` blooms all four.
- **Screen** (`components/screen.tsx`): header + glasshouse + content, the shell for every screen.
- **Buttons:** shadcn Button, `xl` size (52px minimum, and the label wraps if text is enlarged). Primary is leaf ink, secondary is wash, ghost is for back and cancel.
- **Inputs:** 52px tall, glass fill, 16px text (no iOS zoom).
- **Choice rows:** 56px minimum, glass fill, field border; selected rows fill pane-live with a check icon.

### Motion: the bloom
- The live pane fills in (400ms ease-out).
- A sprout draws itself up (700ms, cubic-bezier(0.16,1,0.3,1)).
- Finished panes pop their flower (420ms, small overshoot), staggered 90ms per pane.
- Content rises 12px on step change (420–500ms).
- Everything collapses to near-instant under reduced motion.

## Do's and Don'ts

- Do keep the arch the same size and place on every screen.
- Do mark progress with a pane, never a progress bar.
- Don't add food photography, cards, shadows or gradients as chrome.
- Don't use bloom red for small text, buttons or errors.
- Don't put a label or kicker above a headline.
- Don't frame regions against each other.
