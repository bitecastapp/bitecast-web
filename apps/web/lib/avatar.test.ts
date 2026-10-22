import { describe, expect, it } from "vitest";
import { avatarTraits, encodeAvatar, traitsFromHandle } from "./avatar";

describe("avatar traits", () => {
  it("gives the same handle the same face every time", () => {
    expect(traitsFromHandle("dosa_devotee")).toEqual(traitsFromHandle("dosa_devotee"));
  });

  it("gives different handles different faces (usually)", () => {
    const faces = new Set(["asha", "ravi", "idkg", "dosa_devotee", "hot_takes", "kaapi"].map((h) => encodeAvatar(traitsFromHandle(h))));
    expect(faces.size).toBeGreaterThan(4);
  });

  it("round-trips a stored code", () => {
    const t = { shape: 2, colour: 7, eyes: 5, mouth: 3 };
    expect(avatarTraits(encodeAvatar(t), "anyone")).toEqual(t);
  });

  it.each([null, "", "zzzz", "12", "1234567", "9999"])("falls back to the handle's face for %j", (code) => {
    expect(avatarTraits(code, "asha")).toEqual(traitsFromHandle("asha"));
  });
});
