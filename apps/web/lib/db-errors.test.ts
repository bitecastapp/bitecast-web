import { describe, expect, it } from "vitest";
import { friendlyError } from "./db-errors";

describe("friendlyError", () => {
  it("names rate limits and suspensions, and falls back for the rest", () => {
    expect(friendlyError({ code: "54000", message: "rate limited" }, "x")).toMatch(/too fast|going a bit fast/);
    expect(friendlyError({ code: "42501", message: "account suspended" }, "x")).toMatch(/suspended/);
    expect(friendlyError({ code: "42501", message: "new row violates row-level security" }, "fallback")).toBe("fallback");
    expect(friendlyError(null, "fallback")).toBe("fallback");
  });
});
