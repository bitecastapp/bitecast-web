// Pages you fill in and submit. Going "back" into one after saving is never what you want.
const FORMS = ["/settings", "/rate", "/login", "/onboarding"];
const isForm = (path: string) => FORMS.some((f) => path === f || path.startsWith(`${f}/`));

// The in-app path stack: going back to the previous page pops, anything else pushes.
// Leaving a form for the page before it is a save that redirected (the browser pushed it), so that pushes too.
// A repeat of the current path (React dev re-running effects) changes nothing.
export function visit(stack: string[], path: string): string[] {
  const current = stack.at(-1);
  if (current === path) return stack;
  if (stack.at(-2) === path && !(current && isForm(current))) return stack.slice(0, -1);
  return [...stack, path];
}

// Back follows your in-app history when the page before this one is a real page; otherwise
// (opened from a link, or you came from a form) the caller sends you to the page's logical parent.
export function canGoBack(stack: string[]) {
  const previous = stack.at(-2);
  return previous !== undefined && !isForm(previous);
}
