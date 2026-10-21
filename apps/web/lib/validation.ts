import { z } from "zod";

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
