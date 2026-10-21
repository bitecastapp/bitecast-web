"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type PlateProps = React.ComponentProps<"span"> & { live?: boolean };

// A painted tin plate from the scoreboard. `live` paints it marigold.
export function Plate({ live, className, ...props }: PlateProps) {
  return (
    <span
      {...props}
      className={cn(
        "inline-block rounded-[6px] px-[0.14em] pt-[0.1em] pb-[0.06em] font-display leading-[0.95] font-extrabold tracking-[-0.01em] uppercase transition-[background-color,color,font-weight] duration-300 ease-(--ease-out-expo)",
        live ? "bg-marigold text-marigold-ink" : "bg-plate text-plate-ink",
        className,
      )}
    />
  );
}

type SwapPlateProps = Omit<PlateProps, "children"> & { value: string };

// The tin-plate swap: when `value` changes, the old plate drops out of the slot and the new one drops in.
export function SwapPlate({ value, live, className, style }: SwapPlateProps) {
  const [plates, setPlates] = useState([{ id: 0, value, leaving: false, entering: false }]);
  const [shown, setShown] = useState(value);

  if (value !== shown) {
    setShown(value);
    setPlates((current) => [
      ...current.filter((p) => !p.leaving).map((p) => ({ ...p, leaving: true })),
      { id: current[current.length - 1].id + 1, value, leaving: false, entering: true },
    ]);
  }

  return (
    <span className="inline-grid overflow-hidden rounded-[6px] align-bottom">
      {plates.map((p) => (
        <Plate
          key={p.id}
          live={live}
          style={style}
          className={cn(
            "[grid-area:1/1]",
            p.entering && "animate-[plate-in_360ms_var(--ease-out-expo)_both]",
            p.leaving && "animate-[plate-out_260ms_cubic-bezier(0.7,0,0.84,0)_both]",
            className,
          )}
          aria-hidden={p.leaving || undefined}
          onAnimationEnd={() =>
            p.leaving && setPlates((current) => current.filter((x) => x.id !== p.id))
          }
        >
          {p.value}
        </Plate>
      ))}
    </span>
  );
}
