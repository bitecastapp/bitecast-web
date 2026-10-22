import { z } from "zod";
import { dishKey } from "./dishes";

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email("That email doesn't look right. Check for typos."));

// Mirrors the profiles.username check constraint in the database.
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .transform((s) => s.replace(/^@/, ""))
  .pipe(
    z
      .string()
      .min(3, "At least 3 characters.")
      .max(20, "20 characters max.")
      .regex(/^[a-z0-9_]+$/, "Only letters, numbers and _ work here."),
  );

// Mirrors the dishes.name checks in the database (trimmed, 2–60 chars, not just symbols).
export const dishNameSchema = z
  .string()
  .transform((s) => s.trim().replace(/\s+/g, " "))
  .pipe(
    z
      .string()
      .min(2, "Give the dish a name (at least 2 characters).")
      .max(60, "Keep it under 60 characters.")
      .refine((s) => dishKey(s) !== "", "Use letters, not just symbols."),
  );

// Mirrors public.ratings checks: score 1–10 in half steps, optional take (trimmed, ≤500).
export const ratingSchema = z.object({
  score: z.coerce
    .number()
    .min(1, "Pick a score from 1 to 10.")
    .max(10, "Pick a score from 1 to 10.")
    .refine((n) => Number.isInteger(n * 2), "Scores go in half steps, like 8.5."),
  take: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().max(500, "Keep the take under 500 characters."))
    .transform((s) => s || null),
});

// Mirrors public.comments.body: trimmed, 1–500 characters.
export const commentSchema = z
  .string()
  .transform((s) => s.trim())
  .pipe(z.string().min(1, "Write something first.").max(500, "Keep it under 500 characters."));

// Optional text: trimmed, and empty means "not set" (null). Mirrors the profiles checks.
const optionalText = (max: number, message: string) =>
  z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().max(max, message))
    .transform((s) => s || null);

// True when someone born on `dob` (YYYY-MM-DD) is at least 13 on `today`.
export function isAtLeast13(dob: string, today = new Date()) {
  const [y, m, d] = dob.split("-").map(Number);
  const cutoff = new Date(Date.UTC(today.getUTCFullYear() - 13, today.getUTCMonth(), today.getUTCDate()));
  return Date.UTC(y, m - 1, d) <= cutoff.getTime();
}

// Optional choice from a fixed list: "" means "not set" (null).
const optionalChoice = <T extends string>(values: readonly [T, ...T[]], message: string) =>
  z.union([z.literal("").transform(() => null), z.enum(values, message)]);

// Mirrors public.profiles and public.profile_private checks.
export const profileSchema = z.object({
  display_name: optionalText(40, "Keep your name under 40 characters."),
  bio: optionalText(160, "Keep your bio under 160 characters."),
  avatar: z.string().regex(/^[0-9a-z]{4}$/, "Pick your avatar again."),
  diet: optionalChoice(["veg", "eggetarian", "vegan", "non_veg"], "Pick a food preference from the list."),
  // People paste "@handle" or a profile URL; keep just the handle.
  instagram: z
    .string()
    .transform((s) => s.trim().replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/\/$/, ""))
    .pipe(z.union([z.literal(""), z.string().regex(/^[A-Za-z0-9._]{1,30}$/, "That doesn't look like an Instagram handle.")]))
    .transform((s) => s || null),
  date_of_birth: z
    .string()
    .transform((s) => s.trim())
    .pipe(
      z.union([
        z.literal(""),
        z.iso
          .date("Enter your date of birth as a full date.")
          .refine((d) => d >= "1900-01-01", "Check the year of your date of birth.")
          .refine((d) => isAtLeast13(d), "You need to be at least 13 to use Bitecast."),
      ]),
    )
    .transform((s) => s || null),
  gender: optionalChoice(["female", "male", "non_binary", "prefer_not_to_say"], "Pick a gender from the list."),
});

// Mirrors set_favourites: up to 4 of your own ratings, each once.
export const favouritesSchema = z
  .array(z.uuid())
  .max(4, "Pin up to 4 favourites.")
  .refine((ids) => new Set(ids).size === ids.length, "Each favourite can be pinned once.");

// Mirrors public.reports: what's being reported, why, and an optional note (≤300).
export const REPORT_REASONS = [
  { value: "spam", label: "Spam or ads" },
  { value: "offensive", label: "Offensive or hateful" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "misleading", label: "Fake or misleading" },
  { value: "other", label: "Something else" },
] as const;

export const reportSchema = z.object({
  target_type: z.enum(["rating", "comment", "dish"]),
  target_id: z.uuid(),
  reason: z.enum(["spam", "offensive", "harassment", "misleading", "other"], "Pick a reason."),
  note: optionalText(300, "Keep the note under 300 characters."),
});

// Mirrors public.profile_private preference checks.
export const preferencesSchema = z.object({
  show_diet: z.enum(["all", "vegan", "veg", "egg"], "Pick which dishes to show."),
  feed_default: z.enum(["top", "new", "following"], "Pick a default feed."),
});
