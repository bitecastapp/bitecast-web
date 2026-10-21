// Mirrors the dishes.name_key column in Postgres: lowercase, then whitespace and punctuation runs become one space.
// The database's unique index is the real duplicate check; this only powers the "already on the menu" hint.
const SEPARATORS = /[\s!-/:-@[-`{-~’‘“”–—…·]+/g;

export function dishKey(name: string) {
  return name.toLowerCase().replace(SEPARATORS, " ").trim();
}

// URL segment for a dish: its key with spaces as hyphens. Keys never contain hyphens, so this reverses exactly.
export function dishSlug(name: string) {
  return dishKey(name).replaceAll(" ", "-");
}

export function keyFromDishSlug(slug: string) {
  return slug.replaceAll("-", " ");
}

export function dishHref(restaurantSlug: string, dishName: string) {
  return `/r/${restaurantSlug}/${encodeURIComponent(dishSlug(dishName))}`;
}
