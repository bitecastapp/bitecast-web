---
version: 1
slug: "app"
primary_target: "app"
related_targets: []
---

# Surface: auth + onboarding (login, onboarding, home placeholder)

Mode: operate. Phone-first (390 wide), works to desktop. Audience: young Bengaluru eaters, many from elsewhere. Task: get in with an email link, claim a handle and a home region, land on home. Success: under a minute, no confusion about the magic link.

Constraints: magic link (no code entry; free-tier email templates locked). One home region today (Bengaluru), more later. Never region-vs-region framing. No invented counts or dishes.

Unresolved: owner has not yet seen or approved the direction (chosen unattended from the roll).

## Direction contract

THESIS: Bitecast's shell is a manual cricket scoreboard: every number and name is a painted tin plate hung on a pitch-green board, so a dish's score reads like a score. Refuses the food-app default of white cards, food photos and an orange accent.

OWN-WORLD: Pitch-green board (#0E3B2C family) carries the top half of every screen; chalk-white tin plates with near-black numerals; marigold (#F2B705 family) only for the live/selected plate; forms sit on a cool off-white scorecard sheet that slides over the board. Big Shoulders Display (variable weight) for plates and numerals, uppercase, tight; Hanken Grotesk for UI text. Square-ish 6px plate corners, 1px hairline plate seams, no gradients, no glass.

STORY: The visitor sees "rate the dish, not the place" hung as plates, understands it's about dishes, enters email, is told plainly to open the link on this phone, then picks a handle that is painted onto the board live as they type, then picks home.

FIRST VIEWPORT: Login at 390x844: board 52% height, wordmark plate top-left, "BLR" plate top-right, three-line headline in plates at 56–64px; sheet below with one heading, email field (16px+), full-width primary button in thumb zone.

FORM: Chinnaswamy manual scoreboard, candidate 5 of 7 (1 darshini menu board, 2 banana-leaf meals, 3 sign-painter lettering, 4 story stickers, 5 manual scoreboard, 6 BMTC route board, 7 vintage packaging). seed:377b743a9998681e. Signature move: the tin-plate swap: when a value changes, the old plate slides down out of its slot and the new one drops in (200ms, exponential ease-out), used for the sent-link state, the live handle plate, and later scores. Raises: from variable-font-specimen, the handle plate's weight tracks input length live (one control drives the plate); from vertical-feed and terminal-wayfinding, one decision per sheet; from boarding-pass gate board, a changed plate holds marigold until the next interaction.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
