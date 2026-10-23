import { InfoIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// A quiet "where this comes from" note: an info icon and one or two short lines in small, faint text.
export function Disclaimer({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-start gap-1.5 text-xs leading-relaxed text-faint", className)}>
      <InfoIcon aria-hidden className="mt-0.5 size-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
