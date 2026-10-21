import { describe, expect, it } from "vitest";
import { emailSchema, usernameSchema } from "./validation";

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
