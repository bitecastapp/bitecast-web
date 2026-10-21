import { describe, expect, it } from "vitest";
import { dishHref, dishKey, dishSlug, keyFromDishSlug } from "./dishes";

// Same pairs as supabase/tests/restaurants-rls.sql, so app and DB agree.
const CASES: [string, string][] = [
  ["Masala Dosa", "masala dosa"],
  ["  Benne  Masala-Dosa ", "benne masala dosa"],
  ["Ghee Podi Idli!", "ghee podi idli"],
  ["Brahmin's Idli", "brahmin s idli"],
  ["Rava_Idli", "rava idli"],
  ["ಮಸಾಲೆ  ದೋಸೆ", "ಮಸಾಲೆ ದೋಸೆ"],
  ["Crème Brûlée", "crème brûlée"],
  ["Chicken 65 — “Spicy”", "chicken 65 spicy"],
  ["मसाला डोसा", "मसाला डोसा"],
];

describe("dishKey", () => {
  it.each(CASES)("%j → %j", (input, expected) => {
    expect(dishKey(input)).toBe(expected);
  });

  it("treats spacing and punctuation variants as the same dish", () => {
    expect(dishKey("masala   DOSA!")).toBe(dishKey("Masala Dosa"));
  });
});

describe("dish URLs", () => {
  it.each(CASES.map(([name]) => name))("%j round-trips through its slug", (name) => {
    expect(keyFromDishSlug(dishSlug(name))).toBe(dishKey(name));
  });

  it("builds readable links", () => {
    expect(dishHref("vidyarthi-bhavan", "Masala Dosa")).toBe("/r/vidyarthi-bhavan/masala-dosa");
    expect(dishHref("ctr", "  Benne  Masala-Dosa ")).toBe("/r/ctr/benne-masala-dosa");
  });
});
