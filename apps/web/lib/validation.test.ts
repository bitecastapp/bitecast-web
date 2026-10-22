import { describe, expect, it } from "vitest";
import { dishNameSchema, emailSchema, ratingSchema, usernameSchema } from "./validation";

describe("usernameSchema", () => {
  it.each([
    ["biryani_bro", "biryani_bro"],
    ["  Dosa_Queen ", "dosa_queen"],
    ["@ghee_roast", "ghee_roast"],
    ["abc", "abc"],
    ["a".repeat(20), "a".repeat(20)],
  ])("accepts %j as %j", (input, expected) => {
    expect(usernameSchema.parse(input)).toBe(expected);
  });

  it.each(["ab", "a".repeat(21), "has space", "dash-name", "émile", "", "@"])("rejects %j", (input) => {
    expect(usernameSchema.safeParse(input).success).toBe(false);
  });
});

describe("emailSchema", () => {
  it("trims and lowercases", () => {
    expect(emailSchema.parse("  Me@Example.COM ")).toBe("me@example.com");
  });

  it("rejects junk", () => {
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
  });
});

describe("dishNameSchema", () => {
  it("tidies spacing", () => {
    expect(dishNameSchema.parse("  Set   Dosa ")).toBe("Set Dosa");
  });

  it.each(["a", " ", "x".repeat(61), "!!", "—"])("rejects %j", (input) => {
    expect(dishNameSchema.safeParse(input).success).toBe(false);
  });

  it("accepts non-Latin names", () => {
    expect(dishNameSchema.parse("ಮಸಾಲೆ ದೋಸೆ")).toBe("ಮಸಾಲೆ ದೋಸೆ");
  });
});

describe("ratingSchema", () => {
  it("accepts a bare score and empties the take to null", () => {
    expect(ratingSchema.parse({ score: "8", take: "   " })).toEqual({ score: 8, take: null });
  });

  it("trims takes", () => {
    expect(ratingSchema.parse({ score: 10, take: "  peak  " }).take).toBe("peak");
  });

  it.each([0, 11, 7.5, "x"])("rejects score %j", (score) => {
    expect(ratingSchema.safeParse({ score, take: "" }).success).toBe(false);
  });

  it("rejects takes over 500 characters", () => {
    expect(ratingSchema.safeParse({ score: 5, take: "x".repeat(501) }).success).toBe(false);
  });
});
