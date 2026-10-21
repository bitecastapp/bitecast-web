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
