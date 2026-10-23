import Link from "next/link";
import { BellIcon, CircleCheckIcon, CircleXIcon, MessageCircleIcon, ReplyIcon, ShieldAlertIcon, UserPlusIcon } from "lucide-react";
import { describe, type Notification, type NotificationKind } from "@/lib/notifications";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/avatar";
import { AgreeIcon } from "@/components/food-icons";

// The notifications list: new ones first (highlighted), then earlier ones; a friendly empty state.
export function NotificationList({ items }: { items: Notification[] }) {
  const fresh = items.filter((n) => !n.read_at);
  const earlier = items.filter((n) => n.read_at);
  if (!items.length)
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-raised">
          <BellIcon aria-hidden className="size-5 text-mustard" />
        </span>
        <p className="font-semibold">Nothing yet</p>
        <p className="max-w-xs text-sm text-muted-foreground">When people agree with your takes, reply or follow you, it shows up here.</p>
      </div>
    );
  return (
    <>
      {fresh.length > 0 && <Group title="New" items={fresh} unread />}
      {earlier.length > 0 && <Group title="Earlier" items={earlier} />}
    </>
  );
}

function Group({ title, items, unread }: { title: string; items: Notification[]; unread?: boolean }) {
  return (
    <section aria-label={title} className="mt-6">
      <h2 className="text-xs font-semibold tracking-[0.08em] text-faint uppercase">{title}</h2>
      <ul className="stagger mt-1 divide-y divide-hairline">
        {items.map((n) => (
          <li key={n.id}>
            <Item n={n} unread={unread} />
          </li>
        ))}
      </ul>
    </section>
  );
}

// Each kind's badge on the avatar: what happened at a glance.
const BADGE: Record<NotificationKind, { icon: React.ElementType; tone: string }> = {
  agree: { icon: AgreeIcon, tone: "bg-mustard text-studio" },
  comment: { icon: MessageCircleIcon, tone: "bg-raised text-foreground" },
  reply: { icon: ReplyIcon, tone: "bg-raised text-foreground" },
  follow: { icon: UserPlusIcon, tone: "bg-mustard text-studio" },
  dish_approved: { icon: CircleCheckIcon, tone: "bg-[#3fb27f] text-studio" },
  dish_removed: { icon: CircleXIcon, tone: "bg-raised text-muted-foreground" },
  take_removed: { icon: ShieldAlertIcon, tone: "bg-destructive/20 text-destructive" },
  comment_removed: { icon: ShieldAlertIcon, tone: "bg-destructive/20 text-destructive" },
};

function Item({ n, unread }: { n: Notification; unread?: boolean }) {
  const { who, text, quote, href } = describe(n);
  const { icon: Icon, tone } = BADGE[n.kind];
  const body = (
    <>
      <span className="relative shrink-0">
        {n.actor ? (
          <Avatar handle={n.actor.username} code={n.actor.avatar} photo={n.actor.avatar_path} size={40} />
        ) : (
          <span className="grid size-10 place-items-center rounded-full bg-raised">
            <Icon aria-hidden className="size-5 text-mustard" />
          </span>
        )}
        {n.actor && (
          <span aria-hidden className={cn("absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full ring-2 ring-background", tone)}>
            <Icon className="size-3" />
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm leading-snug">
          {who && <span className="font-semibold">{who} </span>}
          <span className={who ? "text-muted-foreground" : "text-foreground"}>{text}</span>
        </span>
        {quote && <span className="mt-1 block truncate text-sm text-foreground/90">&ldquo;{quote}&rdquo;</span>}
        <time dateTime={n.created_at} className="mt-1 block text-xs text-faint">
          {timeAgo(n.created_at)}
        </time>
      </span>
      {unread && <span aria-label="New" className="mt-1.5 size-2 shrink-0 rounded-full bg-ketchup" />}
    </>
  );
  const cls = cn("-mx-2 flex items-start gap-3 rounded-lg px-2 py-3", unread && "bg-mustard/[0.04]");
  return href ? (
    <Link href={href} className={cn(cls, "transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
