import { describe as group, expect, it } from "vitest";
import { describe, type Notification } from "./notifications";

const base: Notification = {
  id: "n1",
  kind: "agree",
  created_at: "2026-10-23T10:00:00Z",
  read_at: null,
  detail: null,
  actor: { username: "asha", avatar: null, avatar_path: null },
  rating: { id: "r1", dish: { name: "Masala Dosa" } },
  comment: null,
  dish: null,
};

group("describe", () => {
  it("says who did what and links to the take", () => {
    expect(describe(base)).toEqual({ who: "@asha", text: "agreed with your take on Masala Dosa", quote: null, href: "/review/r1" });
  });

  it("quotes comments, shortened, and links to the comments", () => {
    const n = describe({ ...base, kind: "comment", comment: { body: "x".repeat(100) } });
    expect(n.href).toBe("/review/r1#comments");
    expect(n.quote?.endsWith("…")).toBe(true);
    expect(n.quote!.length).toBeLessThanOrEqual(70);
  });

  it("links follows to the follower and approved dishes to the dish", () => {
    expect(describe({ ...base, kind: "follow", rating: null }).href).toBe("/u/asha");
    expect(describe({ ...base, kind: "dish_approved", actor: null, rating: null, dish: { name: "Set Dosa", restaurant: { slug: "ctr" } } })).toMatchObject({
      who: null,
      href: "/r/ctr/set-dosa",
    });
  });

  it("names the dish of a removed take from the stored detail", () => {
    expect(describe({ ...base, kind: "take_removed", actor: null, rating: null, detail: "Rava Idli" }).text).toContain("Rava Idli");
  });
});
