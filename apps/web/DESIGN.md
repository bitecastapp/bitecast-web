---
name: Bitecast
description: Bengaluru's dish-by-dish scoreboard.
colors:
  pitch-board: "oklch(0.32 0.06 165)"
  board-seam: "oklch(0.4 0.06 165)"
  board-ink: "oklch(0.86 0.03 160)"
  chalk-plate: "oklch(0.97 0.008 160)"
  plate-ink: "oklch(0.2 0.025 165)"
  marigold: "oklch(0.83 0.16 85)"
  marigold-ink: "oklch(0.25 0.05 80)"
  scorecard-sheet: "oklch(0.985 0.004 160)"
  ink: "oklch(0.2 0.025 165)"
  muted-ink: "oklch(0.44 0.025 165)"
  hairline: "oklch(0.88 0.012 160)"
  field-border: "oklch(0.8 0.015 160)"
  wash: "oklch(0.94 0.012 160)"
  error: "oklch(0.53 0.19 27)"
typography:
  plate:
    fontFamily: "Big Shoulders, sans-serif"
    fontSize: "clamp(2.75rem, 13.5vw, 5.25rem)"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.01em"
  board-label:
    fontFamily: "Big Shoulders, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    letterSpacing: "0.2em"
  headline:
    fontFamily: "Hanken Grotesk, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Hanken Grotesk, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Hanken Grotesk, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
rounded:
  plate: "6px"
  control: "6px"
  sheet: "20px"
spacing:
  gutter: "20px"
  gutter-desktop: "48px"
  stack: "24px"
components:
  plate:
    backgroundColor: "{colors.chalk-plate}"
    textColor: "{colors.plate-ink}"
    typography: "{typography.plate}"
    rounded: "{rounded.plate}"
  plate-live:
    backgroundColor: "{colors.marigold}"
    textColor: "{colors.marigold-ink}"
    rounded: "{rounded.plate}"
  button-primary:
    backgroundColor: "{colors.pitch-board}"
    textColor: "{colors.scorecard-sheet}"
    rounded: "{rounded.control}"
    height: "52px"
    padding: "0 20px"
  button-ghost:
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "52px"
  input:
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "52px"
    padding: "0 14px"
---

# Design System: Bitecast

> Written from the first build (auth + onboarding) while the owner was away. The direction was chosen unattended; confirm or re-roll it before more screens inherit it.

## Overview

**Creative North Star: "The Manual Scoreboard"**

Bitecast's interface is the old hand-hung cricket scoreboard: a pitch-green board with chalk-white tin plates that someone slides into slots. Every name and number that matters is a plate: the headline, your handle, your home, and later every dish score. Below the board sits the scorecard sheet, a cool off-white surface where the work happens (forms, lists, actions) in a plain, legible UI face.

The board is loud and the sheet is calm. Expression lives in the plates and the swap; the sheet uses standard controls everyone already knows.

**Key Characteristics:**
- Pitch-green board on top (left on desktop), scorecard sheet below (right).
- Uppercase condensed plates; one marigold plate marks what's live.
- Flat: no shadows, no gradients, no glass.
- Motion is one move: the tin-plate swap.

## Colors

A committed green shell, chalk plates, and one marigold for live state.

### Primary
- **Pitch Board** (oklch(0.32 0.06 165)): the board ground and primary buttons. Also the browser theme color (#0b3c2b).

### Secondary
- **Marigold** (oklch(0.83 0.16 85)): only the live plate: the thing just changed, being edited, or being emphasised. Text on it is Marigold Ink.

### Neutral
- **Chalk Plate** / **Plate Ink**: tin plates and their lettering.
- **Board Ink** (oklch(0.86 0.03 160)): secondary text and labels on the board.
- **Board Seam** (oklch(0.4 0.06 165)): 1px rules between board rows.
- **Scorecard Sheet** (oklch(0.985 0.004 160)): the work surface.
- **Ink** / **Muted Ink**: sheet text; muted is for supporting copy (passes 4.5:1 on the sheet).
- **Hairline**, **Field Border**, **Wash**: dividers, input borders, quiet fills.

### Named Rules
**The One Marigold Rule.** At most one marigold plate per board. It means "live", never decoration.
**The Green Shell Rule.** The board is always pitch green; never swap it for white or black on a screen.

## Typography

**Display Font:** Big Shoulders (variable, self-hosted via next/font)
**Body Font:** Hanken Grotesk

**Character:** stadium signage over a calm workhorse sans.

### Hierarchy
- **Plate** (800, clamp(2.75rem, 13.5vw, 5.25rem), 0.95): board plates only, uppercase.
- **Board label** (700, 0.875rem, tracking 0.2em, uppercase): row labels on the board (Handle, Home).
- **Headline** (600, 1.5rem): one per sheet.
- **Body** (400, 1rem, 1.5): sheet copy, max about 40ch on phones.
- **Label** (500, 0.875rem): field labels.

### Named Rules
**The Plates-Only Display Rule.** Big Shoulders appears only on the board (plates, labels, wordmark). The sheet is Hanken Grotesk.

## Layout

Phone: the board stacks above the sheet, and the sheet overlaps the board by 20px with a 20px top radius. Primary actions sit at the bottom of the sheet in thumb reach (`mt-auto`). Gutters are 20px with safe-area insets. From the `md` breakpoint the screen splits into two columns (board 1.15fr, sheet 1fr with a 400px minimum), and the sheet content is centered at max 384px. Stack rhythm is 24px between groups and 8px inside a group.

## Elevation & Depth

Flat. Depth comes from the board/sheet split and the sheet's overlap, never shadows.

## Shapes

6px corners on plates, buttons and inputs; 20px on the sheet's top edge. 1px seams between board rows.

## Components

- **Plate / SwapPlate** (`components/plate.tsx`): the tin plate. SwapPlate drops the old plate out (260ms ease-in) and the new one in (360ms, cubic-bezier(0.16,1,0.3,1)), staggered 45ms across a line.
- **Screen / PlateLine** (`components/screen.tsx`): the board + sheet shell every screen uses.
- **Buttons:** shadcn Button with the `xl` size (52px). Primary is pitch green; secondary is wash; ghost is for back and cancel.
- **Inputs:** shadcn Input at 52px and 16px text (no iOS zoom).
- **Choice rows:** 56px rows with a check icon and a primary border when selected.

## Do's and Don'ts

- Do put the one changing value on a plate and swap it.
- Do keep sheet controls standard shadcn components.
- Don't add shadows, gradients, glass, or food photography as chrome.
- Don't put a label or kicker above a sheet headline.
- Don't frame regions against each other on the board (no "vs").
