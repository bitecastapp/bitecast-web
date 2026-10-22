import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { COLOURS, encodeAvatar, EYES, MOUTHS, SHAPES } from "@/lib/avatar";

// Dev-only: every avatar trait side by side, plus faces generated from sample handles.
export default function AvatarsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const handles = ["idkg", "dosa_devotee", "hot_takes", "filter_kaapi", "biryani_brain", "asha", "ravi_k", "ghee_please", "late_night", "crispy_edges", "idli_insider", "mohammed_abdulrahman"];
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-xl font-bold">Avatars</h1>

      <h2 className="mt-8 text-xs font-semibold tracking-[0.08em] text-faint uppercase">Shapes × colours</h2>
      <div className="mt-3 grid gap-3" style={{ gridTemplateColumns: `repeat(${COLOURS.length}, minmax(0, 1fr))` }}>
        {SHAPES.flatMap((s, si) =>
          COLOURS.map((c, ci) => <Avatar key={`${s}-${c.name}`} handle="x" code={encodeAvatar({ shape: si, colour: ci, eyes: 0, mouth: 0 })} size={64} />),
        )}
      </div>

      <h2 className="mt-8 text-xs font-semibold tracking-[0.08em] text-faint uppercase">Eyes × mouths</h2>
      <div className="mt-3 grid gap-3" style={{ gridTemplateColumns: `repeat(${MOUTHS.length}, minmax(0, 1fr))` }}>
        {EYES.flatMap((e, ei) =>
          MOUTHS.map((m, mi) => <Avatar key={`${e}-${m}`} handle="x" code={encodeAvatar({ shape: 0, colour: (ei + mi) % COLOURS.length, eyes: ei, mouth: mi })} size={64} />),
        )}
      </div>

      <h2 className="mt-8 text-xs font-semibold tracking-[0.08em] text-faint uppercase">Generated from handles</h2>
      <div className="mt-3 flex flex-wrap gap-6">
        {handles.map((h) => (
          <div key={h} className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
            <Avatar handle={h} size={72} />@{h}
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-xs font-semibold tracking-[0.08em] text-faint uppercase">At byline size</h2>
      <div className="mt-3 flex flex-wrap gap-4">
        {handles.map((h) => (
          <span key={h} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Avatar handle={h} size={24} />@{h}
          </span>
        ))}
      </div>
    </main>
  );
}
