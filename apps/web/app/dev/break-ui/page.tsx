import { Suspense } from "react";
import { notFound } from "next/navigation";
import { BreakUi } from "./break-ui";

// Dev-only: renders each screen with demo / worst-case / empty / one fixtures. Never ships.
export default function BreakUiPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <Suspense>
      <BreakUi />
    </Suspense>
  );
}
