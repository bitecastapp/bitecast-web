import type { Vote } from "./ratings";

export type VoteState = { facts: number; cap: number; mine?: Vote };

// What a tap does: the same side again clears your vote; the other side moves it across.
// Works for any two-sided vote: Agree/Disagree on takes, Like/Dislike on comments.
export function toggleVote<K extends string>(counts: Record<K, number>, mine: NoInfer<K> | undefined, kind: NoInfer<K>) {
  const next = mine === kind ? undefined : kind;
  const out = { ...counts };
  if (mine) out[mine] -= 1;
  if (next) out[next] += 1;
  return { counts: out, mine: next };
}

export function applyVote(s: VoteState, kind: Vote): VoteState {
  const { counts, mine } = toggleVote({ facts: s.facts, cap: s.cap }, s.mine, kind);
  return { ...counts, mine };
}

// The winning side and its share, as a whole percent (null when nobody has voted). Ties read as agree.
export function leadingSide(facts: number, cap: number) {
  const total = facts + cap;
  if (!total) return null;
  return cap > facts
    ? ({ side: "disagree", percent: Math.round((cap / total) * 100) } as const)
    : ({ side: "agree", percent: Math.round((facts / total) * 100) } as const);
}
