---
version: 1
slug: "app"
primary_target: "app"
related_targets: []
---

# Surface: auth + onboarding (login, onboarding, home placeholder)

Mode: operate. Phone-first (390 wide), works to desktop. Audience: young Bengaluru eaters, many from elsewhere. Task: get in with an email link, claim a handle and a home region, land on home. Success: under a minute, no confusion about the magic link.

Constraints: magic link (no code entry; free-tier email templates locked). One home region today (Bengaluru), more later. Never region-vs-region framing. No invented counts or dishes.

Owner chose this direction on 2026-10-21 over Metro Line, Kolam, Dish Mascots and Filter Coffee, replacing the earlier scoreboard world: "more refreshing and minimal but more interesting".

## Direction contract

THESIS: Bitecast is a glasshouse: a light hairline arch over a calm mint ground, where each step you finish leaves a small flower in its own pane. Refuses the food-app default of photos, white cards and an orange accent, and the loud poster board it replaces.

OWN-WORLD: Mint-white ground (#f2f6f1), glass-white panes (#fbfdfb), leaf-green hairline lattice (#2f6b3a), deep leaf ink (#173322), pale mint for the live pane (#d6eed9), and one bloom red (#d9412b) used only for flowers and the single emphasised word. Manrope at 800 for display and 400–700 for UI. 12px corners, 1.5px hairlines, no shadows, no gradients.

STORY: The visitor sees the glasshouse with one lit pane and a sprout, reads "Rate the dish, not the place", sends their email link, then watches a flower bloom in each pane as they pick a handle and a home; home shows the full row in bloom.

FIRST VIEWPORT: Login at 390x844: wordmark left, "Bengaluru" right; the arch at 342x280 under the header with pane 1 lit; 44px two-line headline with "dish" in bloom red; one-line subcopy; email field and dark leaf button pinned to the bottom in thumb reach.

FORM: Lalbagh glasshouse, candidate 7 of 7 in re-roll 2 (1 filter coffee, 2 jasmine string, 3 darshini order chit, 4 auto-rickshaw meter, 5 steel thali, 6 Mysore silk border, 7 Lalbagh glasshouse). seed:377b743a9998681e. Signature move: the bloom: when a step completes, its pane's sprout draws itself and a red flower pops, and the next pane lights. Raises: from the Saville catalog sleeve, vast quiet ground with one element owning the field (the arch); from the star atlas, size carries hierarchy; from the botanical folio, every stage uses the same arch at the same scale; from the split-flap board, the one changing word swaps in place; from the midnight transit diagram, the live pane is emphasised while the others keep their context.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Browse screens (restaurants + dishes)

Layout chosen by the owner on 2026-10-21 from a dealt round (menu cards / by neighbourhood / search first): **by neighbourhood, with the search field from search-first on top**. Home: wordmark header, "Where to eat", a search field that matches dishes and places as you type, then restaurants grouped under area headings with dish counts. Restaurant page: back link, name, area, dish rows, "Add a dish". Dish page: name, restaurant link, "ratings open soon". The glasshouse arch stays on sign-up screens only.
