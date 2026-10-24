// The Nomrank mark: the scalloped "Must try" badge, upright, with a Suez One "n" in the middle. One outline, used as a
// CSS mask in the app and as an image in generated icons.

// Badge: a centre circle and 14 scallops (the same geometry as the Score sticker), on a 100×100 box.
const SCALLOPS = [
  [90, 50], [86.04, 67.36], [74.94, 81.27], [58.9, 89], [41.1, 89], [25.06, 81.27], [13.96, 67.36],
  [10, 50], [13.96, 32.64], [25.06, 18.73], [41.1, 11], [58.9, 11], [74.94, 18.73], [86.04, 32.64],
];

const shape = `<circle cx="50" cy="50" r="41"/>${SCALLOPS.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9.5"/>`).join("")}`;

// The badge in one colour, with the dashed ring when `ring` is set.
export function badgeSvg(fill: string, ring?: string) {
  const dashes = ring
    ? `<circle cx="50" cy="50" r="31" fill="none" stroke="${ring}" stroke-opacity="0.35" stroke-width="1.5" stroke-dasharray="4 3"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g fill="${fill}">${shape}</g>${dashes}</svg>`;
}

export const badgeUri = (fill: string, ring?: string) => `data:image/svg+xml,${encodeURIComponent(badgeSvg(fill, ring))}`;
