import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Pre-launch: with COMING_SOON=1 (set on Vercel for Production only), the main domain shows the waitlist page and
// everything else stays closed, apart from these pages. Locally and on preview deployments the full app runs.
const OPEN_BEFORE_LAUNCH = ["/coming-soon", "/about", "/terms", "/privacy", "/credits", "/opengraph-image", "/icon", "/apple-icon"];

export function proxy(request: NextRequest) {
  if (process.env.COMING_SOON === "1") {
    const { pathname } = request.nextUrl;
    if (pathname === "/") return NextResponse.rewrite(new URL("/coming-soon", request.url));
    if (OPEN_BEFORE_LAUNCH.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return NextResponse.next();
    return NextResponse.redirect(new URL("/", request.url));
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|webmanifest)$).*)",
  ],
};
