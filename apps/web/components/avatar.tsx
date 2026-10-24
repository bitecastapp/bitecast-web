import Link from "next/link";
import { avatarPhotoUrl, avatarTraits, COLOURS, EYES, MOUTHS, SHAPES } from "@/lib/avatar";
import { cn } from "@/lib/utils";

const INK = "#2a1a22";
const TONGUE = "#ff7a8a";

type Shape = {
  body: (fill: string, shade: string) => React.ReactNode;
  shine: [cx: number, cy: number, rx: number, ry: number];
  face: [cx: number, cy: number, scale: number];
};

// Each food on a 64px grid: its body, a soft highlight, and where its face sits.
const SHAPE_ART: Record<(typeof SHAPES)[number], Shape> = {
  idli: {
    body: (f) => <ellipse cx="32" cy="35" rx="25" ry="20" fill={f} />,
    shine: [22, 25, 8, 4.5],
    face: [32, 35, 1],
  },
  momo: {
    body: (f, s) => (
      <>
        <path d="M9 41C9 28 19 19 32 19s23 9 23 22c0 9-10 15-23 15S9 50 9 41Z" fill={f} />
        <path d="M27 20.5c.6-4.5 9.4-4.5 10 0" fill={f} stroke={s} strokeWidth="2" strokeLinecap="round" />
        <path d="M24 23c-1.4-1.8-1.7-3.6-1-5.4M40 23c1.4-1.8 1.7-3.6 1-5.4" fill="none" stroke={s} strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    shine: [20, 30, 6, 3.5],
    face: [32, 40, 1],
  },
  dosa: {
    body: (f, s) => (
      <>
        <path d="M10 50Q8 47 10 44L29 11Q32 6 35 11L54 44Q56 47 54 50Q32 58 10 50Z" fill={f} />
        <path d="M32 14 22 47" fill="none" stroke={s} strokeWidth="1.8" strokeLinecap="round" opacity=".55" />
      </>
    ),
    shine: [27, 24, 3, 6],
    face: [33, 40, 0.86],
  },
  barfi: {
    body: (f, s) => (
      <>
        <rect x="11" y="13" width="42" height="42" rx="12" fill={f} />
        <path d="M18 18h28" stroke={s} strokeWidth="2" strokeLinecap="round" opacity=".5" />
      </>
    ),
    shine: [22, 25, 5, 3],
    face: [32, 37, 1],
  },
  laddoo: {
    body: (f, s) => (
      <>
        <circle cx="32" cy="34" r="23" fill={f} />
        {[
          [20, 21],
          [44, 19],
          [50, 33],
          [14, 36],
          [21, 48],
          [44, 49],
          [33, 14],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" fill={s} />
        ))}
      </>
    ),
    shine: [24, 22, 6, 3.5],
    face: [32, 35, 1],
  },
  kulfi: {
    body: (f) => (
      <>
        <rect x="29" y="47" width="6" height="14" rx="3" fill="#e8c48c" />
        <path d="M15 27a17 17 0 0 1 34 0v19a5 5 0 0 1-5 5H20a5 5 0 0 1-5-5Z" fill={f} />
      </>
    ),
    shine: [23, 20, 5, 3],
    face: [32, 33, 0.95],
  },
};

const EYE_GAP = 8;

function Eye({ kind, x, side }: { kind: (typeof EYES)[number]; x: number; side: "left" | "right" }) {
  const stroke = { fill: "none", stroke: INK, strokeWidth: 2.4, strokeLinecap: "round" as const };
  switch (kind) {
    case "dots":
      return <circle cx={x} cy={0} r="2.7" fill={INK} />;
    case "happy":
      return <path d={`M${x - 3} 1q3-4 6 0`} {...stroke} />;
    case "wink":
      return side === "left" ? <circle cx={x} cy={0} r="2.7" fill={INK} /> : <path d={`M${x - 3} 0q3 2.4 6 0`} {...stroke} />;
    case "sleepy":
      return <path d={`M${x - 3} 0q3 2.4 6 0`} {...stroke} />;
    case "shiny":
      return (
        <>
          <circle cx={x} cy={0} r="3.6" fill={INK} />
          <circle cx={x + 1.1} cy={-1.2} r="1.3" fill="#fff" />
        </>
      );
    case "hearts":
      return <path d={`M${x} 2.6c-2.5-1.6-3.8-2.9-3.8-4.4a1.9 1.9 0 0 1 3.8-.5 1.9 1.9 0 0 1 3.8.5c0 1.5-1.3 2.8-3.8 4.4Z`} fill={INK} />;
  }
}

function Mouth({ kind }: { kind: (typeof MOUTHS)[number] }) {
  const y = 7;
  const stroke = { fill: "none", stroke: INK, strokeWidth: 2.4, strokeLinecap: "round" as const };
  switch (kind) {
    case "smile":
      return <path d={`M-5 ${y}q5 4.5 10 0`} {...stroke} />;
    case "grin":
      return (
        <>
          <path d={`M-5.5 ${y - 1}h11a5.5 5.5 0 0 1-11 0Z`} fill={INK} />
          <path d={`M-2.6 ${y + 3.6}a2.6 1.8 0 0 1 5.2 0Z`} fill={TONGUE} />
        </>
      );
    case "yum":
      return (
        <>
          <path d={`M-5 ${y}q5 4.5 10 0`} {...stroke} />
          <path d={`M.6 ${y + 2}v2.2a2.2 2.2 0 0 0 4.4 0v-3.3`} fill={TONGUE} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
        </>
      );
    case "ooh":
      return <ellipse cx="0" cy={y + 1} rx="2.4" ry="3" fill={INK} />;
    case "smirk":
      return <path d={`M-4.5 ${y + 1.5}q4.5 2 9-2.5`} {...stroke} />;
    case "flat":
      return <path d={`M-4 ${y + 1}h8`} {...stroke} />;
  }
}

type Props = {
  handle: string;
  code?: string | null; // the profile's stored avatar; missing → the handle's generated face
  photo?: string | null; // an uploaded profile photo; when set it replaces the character
  size?: number;
  className?: string;
  label?: string; // give it a name for screen readers; otherwise it's decorative (the handle sits next to it)
};

// A person's Nomrank character, drawn from four traits.
export function Avatar({ handle, code, photo, size = 28, className, label }: Props) {
  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- profile photo from Supabase Storage, cropped and resized on upload
      <img
        src={avatarPhotoUrl(photo)}
        alt={label ?? ""}
        aria-hidden={label ? undefined : true}
        width={size}
        height={size}
        loading="lazy"
        className={cn("shrink-0 rounded-full bg-raised object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  const t = avatarTraits(code, handle);
  const shape = SHAPE_ART[SHAPES[t.shape]];
  const { fill, shade } = COLOURS[t.colour];
  const [cx, cy, scale] = shape.face;
  const [sx, sy, srx, sry] = shape.shine;
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("shrink-0", className)}
    >
      {shape.body(fill, shade)}
      <ellipse cx={sx} cy={sy} rx={srx} ry={sry} fill="#fff" opacity=".32" transform={`rotate(-25 ${sx} ${sy})`} />
      <g transform={`translate(${cx} ${cy}) scale(${scale})`}>
        <ellipse cx={-EYE_GAP - 5} cy="4.5" rx="3.2" ry="2" fill="#ff7f8f" opacity=".45" />
        <ellipse cx={EYE_GAP + 5} cy="4.5" rx="3.2" ry="2" fill="#ff7f8f" opacity=".45" />
        <Eye kind={EYES[t.eyes]} x={-EYE_GAP} side="left" />
        <Eye kind={EYES[t.eyes]} x={EYE_GAP} side="right" />
        <Mouth kind={MOUTHS[t.mouth]} />
      </g>
    </svg>
  );
}

// Someone's avatar and @handle, linking to their profile. Sits above a card's stretched link (z-10).
type PersonLinkProps = { handle: string; avatar: string | null; photo: string | null; size?: number; className?: string };

export function PersonLink({ handle, avatar, photo, size = 24, className }: PersonLinkProps) {
  return (
    <Link
      href={`/u/${handle}`}
      className={cn(
        "relative z-10 inline-flex min-w-0 items-center gap-2 rounded-md font-semibold underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
    >
      <Avatar handle={handle} code={avatar} photo={photo} size={size} />
      <span className="truncate">@{handle}</span>
    </Link>
  );
}
