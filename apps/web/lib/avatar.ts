// Bitecast avatars: little food characters built from four traits (shape, colour, eyes, mouth).
// Stored on the profile as a 4-character code, one base-36 digit per trait (e.g. "2a31").
// No code yet → a stable one generated from the handle, so everyone has a face from day one.

export const SHAPES = ["idli", "momo", "dosa", "barfi", "laddoo", "kulfi"] as const;
export const COLOURS = [
  { name: "Coconut", fill: "#f6e7c8", shade: "#d8c193" },
  { name: "Turmeric", fill: "#f7bc35", shade: "#cf8d14" },
  { name: "Ketchup", fill: "#ff6150", shade: "#d33b2b" },
  { name: "Mint", fill: "#62d18f", shade: "#2f9b5e" },
  { name: "Chai", fill: "#d09363", shade: "#9b6138" },
  { name: "Lassi", fill: "#f8aec0", shade: "#d97893" },
  { name: "Beet", fill: "#c25a98", shade: "#8e3368" },
  { name: "Sky", fill: "#7fb6f2", shade: "#4a82c4" },
] as const;
export const EYES = ["dots", "happy", "wink", "sleepy", "shiny", "hearts"] as const;
export const MOUTHS = ["smile", "grin", "yum", "ooh", "smirk", "flat"] as const;

export type Traits = { shape: number; colour: number; eyes: number; mouth: number };

const SIZES = [SHAPES.length, COLOURS.length, EYES.length, MOUTHS.length];

// FNV-1a: tiny, stable across runtimes, spreads similar handles apart.
function hash(text: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function traitsFromHandle(handle: string): Traits {
  let h = hash(handle);
  const pick = (n: number) => {
    const v = h % n;
    h = Math.floor(h / n);
    return v;
  };
  return { shape: pick(SIZES[0]), colour: pick(SIZES[1]), eyes: pick(SIZES[2]), mouth: pick(SIZES[3]) };
}

export function encodeAvatar(t: Traits) {
  return [t.shape, t.colour, t.eyes, t.mouth].map((n) => n.toString(36)).join("");
}

// A stored code, or the handle's generated face when there's none (or it's out of range).
export function avatarTraits(code: string | null | undefined, handle: string): Traits {
  if (code && /^[0-9a-z]{4}$/.test(code)) {
    const [shape, colour, eyes, mouth] = [...code].map((c) => parseInt(c, 36));
    if ([shape, colour, eyes, mouth].every((v, i) => v < SIZES[i])) return { shape, colour, eyes, mouth };
  }
  return traitsFromHandle(handle);
}

// Public URL for an uploaded profile photo (the avatars bucket is public-read).
export function avatarPhotoUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;
}
