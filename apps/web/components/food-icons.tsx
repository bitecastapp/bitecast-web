// Vote icons drawn for Nomrank, in the same 24px / 2px-stroke grid as lucide so they sit beside its icons.
// The pair must read apart without colour, so they differ three ways: solid heart vs open cross,
// upright bowl vs bowl tipped away, soft shape vs sharp shape.
type IconProps = { className?: string };

const BOWL = "M4 14h16a8 7 0 0 1-16 0Z";

// Agree: a bowl with a solid heart rising off it. "Loved it, same."
export function AgreeIcon({ className }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={BOWL} />
      <path fill="currentColor" stroke="none" d="M12 11.6c-2.9-1.8-4.6-3.4-4.6-5.4A2.3 2.3 0 0 1 12 5.1a2.3 2.3 0 0 1 4.6 1.1c0 2-1.7 3.6-4.6 5.4Z" />
    </svg>
  );
}

// Disagree: the same bowl tipped away, a bold cross over it. "Not for me."
export function DisagreeIcon({ className }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={BOWL} transform="rotate(-14 12 17)" />
      <path strokeWidth={2.4} d="m9 4.5 6 6m0-6-6 6" />
    </svg>
  );
}
