"use client";

import { useEffect } from "react";
import { markAllRead } from "./actions";

// Marks everything read once the list has been shown. The page keeps its "New" highlights until you leave.
export function MarkRead({ unread }: { unread: number }) {
  useEffect(() => {
    if (unread > 0) void markAllRead();
  }, [unread]);
  return null;
}
