// Turns the database's refusals into words for people. `fallback` covers everything else.
// 54000: a rate limit (too many posts too fast). 42501 "account suspended": a banned account.
export function friendlyError(error: { code?: string; message?: string } | null | undefined, fallback: string) {
  if (error?.code === "54000") return "You're going a bit fast. Take a breather and try again in a while.";
  if (error?.code === "42501" && error.message?.includes("suspended")) return "Your account is suspended, so you can't post right now.";
  return fallback;
}
