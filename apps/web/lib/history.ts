// The in-app path stack: going back to the previous page pops, anything else pushes.
// A repeat of the current path (React dev re-running effects) changes nothing.
export function visit(stack: string[], path: string): string[] {
  if (stack.at(-1) === path) return stack;
  if (stack.at(-2) === path) return stack.slice(0, -1);
  return [...stack, path];
}
