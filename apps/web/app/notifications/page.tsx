import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getNotifications } from "@/lib/notifications";
import { BackLink } from "@/components/back-link";
import { PageLoader } from "@/components/loader";
import { NotificationList } from "@/components/notification-list";
import { PageShell } from "@/components/page-shell";
import { MarkRead } from "./mark-read";

export const metadata: Metadata = { title: "Notifications · Nomrank" };

export default function NotificationsPage() {
  return (
    <PageShell>
      <Suspense fallback={<PageLoader />}>
        <Notifications />
      </Suspense>
    </PageShell>
  );
}

async function Notifications() {
  const { supabase, userId, profile } = await getCurrentUser();
  if (!profile) redirect("/onboarding");
  const list = await getNotifications(supabase, userId);

  return (
    <div className="pb-10">
      <BackLink href="/" />
      <h1 className="mt-2 text-2xl leading-tight font-bold tracking-tight">Notifications</h1>
      <MarkRead unread={list.filter((n) => !n.read_at).length} />
      <NotificationList items={list} />
    </div>
  );
}
