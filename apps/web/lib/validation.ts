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
