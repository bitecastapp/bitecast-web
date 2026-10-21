import { cn } from "@/lib/utils";

const PANES = [1, 86, 171, 256]; // x of each lower pane; one pane per sign-up step

type GlasshouseProps = {
  /** The step in progress (1–4). Panes before it are in bloom; 5 means every pane has bloomed. */
  step: number;
  className?: string;
};

// The glasshouse arch. Each finished step leaves a flower in its pane; the live pane glows and sprouts.
export function Glasshouse({ step, className }: GlasshouseProps) {
  return (
    <svg
      viewBox="0 0 342 280"
      aria-hidden
      className={cn("h-auto max-h-[34dvh] w-full text-lattice", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M1 279V150C1 66 80 1 171 1s170 65 170 149v129Z" className="fill-glass" />
      <path d="M171 1v278M86 22v257M256 22v257M1 150h340" strokeOpacity=".5" />
      <path d="M1 150c39-44 109-66 170-66s131 22 170 66" strokeOpacity=".5" />
      {PANES.map((x, i) => {
        const state = i + 1 < step ? "done" : i + 1 === step ? "live" : "idle";
        if (state === "idle") return null;
        const cx = x + 42.5;
        return (
          <g key={`${i}-${state}`}>
            {state === "live" && (
              <rect
                x={x - 0.25}
                y={150.75}
                width={85.5}
                height={127.5}
                stroke="none"
                className="animate-[pane-lit_400ms_ease-out_both] fill-pane-live"
                style={{ animationDelay: `${i * 90}ms` }}
              />
            )}
            <path
              d={`M${cx} 252v-52m0 14c-16-8-24-20-22-32 14 2 22 14 22 32m0-8c14-10 24-14 28-26-14 0-24 10-28 26`}
              pathLength={1}
              strokeDasharray={1}
              strokeWidth={2}
              strokeLinecap="round"
              className="animate-[sprout_700ms_var(--ease-out-expo)_both]"
              style={{ animationDelay: `${i * 90}ms` }}
            />
            {state === "done" && (
              <circle
                cx={cx}
                cy={192}
                r={9}
                stroke="none"
                className="origin-center animate-[bloom_420ms_var(--ease-out-expo)_both] fill-bloom [transform-box:fill-box]"
                style={{ animationDelay: `${i * 90 + 380}ms` }}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
