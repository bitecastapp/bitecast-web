"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Profile } from "@/lib/auth";
import type { LoginState } from "@/app/login/actions";
import { LoginScreen } from "@/app/login/login-screen";
import { OnboardingForm, type Region } from "@/app/onboarding/onboarding-form";
import { HomeView } from "@/app/home-view";

const LONG_EMAIL = "aleksandra.wisniewska-kowalczyk+bitecast@northwind-industries-holdings.example.com";

const FIXTURES = {
  demo: {
    login: { status: "sent", email: "jo@example.com" } as LoginState,
    regions: [{ slug: "bengaluru", name: "Bengaluru" }] as Region[],
    profile: { username: "dosa_devotee", home_region: "bengaluru", regions: { name: "Bengaluru", demonym: "Bengalureans" } } as Profile,
  },
  worst: {
    login: { status: "error", email: LONG_EMAIL, message: "Too many links in a row. Give it a minute, then try again." } as LoginState,
    // Real place names at the long end, as future seeds will have them.
    regions: [
      { slug: "chhatrapati-sambhajinagar", name: "Chhatrapati Sambhajinagar" },
      { slug: "thiruvananthapuram", name: "Thiruvananthapuram" },
      { slug: "bengaluru", name: "Bengaluru" },
      ...["Hyderabad", "Lucknow", "Kolkata", "Chennai", "Mumbai", "Delhi", "Kerala", "Punjab", "Goa", "Gujarat", "Rajasthan", "Odisha", "Assam", "Bihar", "Kashmir", "Mangaluru", "Mysuru", "Puducherry", "Visakhapatnam", "Kozhikode", "Madurai", "Indore", "Amritsar", "Nagaland", "Manipur", "Meghalaya", "Sikkim", "Tripura", "Mizoram", "Andaman & Nicobar Islands", "Dadra & Nagar Haveli and Daman & Diu"].map((name) => ({ slug: name.toLowerCase().replace(/\W+/g, "-"), name })),
    ] as Region[],
    profile: { username: "mohammed_abdulrahman", home_region: "chhatrapati-sambhajinagar", regions: { name: "Chhatrapati Sambhajinagar", demonym: "Sambhajinagarkars" } } as Profile,
  },
  empty: {
    login: { status: "idle" } as LoginState,
    regions: [] as Region[],
    profile: { username: "jo_", home_region: "bengaluru", regions: null } as Profile,
  },
  one: {
    login: { status: "sent", email: "a@b.co" } as LoginState,
    regions: [{ slug: "bengaluru", name: "Bengaluru" }] as Region[],
    profile: { username: "abc", home_region: "bengaluru", regions: { name: "Bengaluru", demonym: "Bengalureans" } } as Profile,
  },
};

type DataKey = keyof typeof FIXTURES;
const SCREENS = ["login", "onboarding", "home"] as const;

export function BreakUi() {
  const params = useSearchParams();
  const data = (params.get("data") as DataKey) in FIXTURES ? (params.get("data") as DataKey) : "demo";
  const screen = SCREENS.includes(params.get("screen") as never) ? params.get("screen") : "login";
  const f = FIXTURES[data];
  const key = `${screen}-${data}`;

  return (
    <>
      {screen === "login" && <LoginScreen key={key} initialState={f.login} />}
      {screen === "onboarding" && <OnboardingForm key={key} regions={f.regions} />}
      {screen === "home" && <HomeView profile={f.profile} />}
      <nav className="fixed bottom-3 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-1 rounded-lg bg-neutral-200 p-1 font-[system-ui] text-xs text-neutral-900 shadow">
        {[SCREENS, Object.keys(FIXTURES)].map((opts, row) => (
          <div key={row} className="flex gap-1">
            {opts.map((o) => {
              const next = new URLSearchParams(params);
              next.set(row === 0 ? "screen" : "data", o);
              const active = (row === 0 ? screen : data) === o;
              return (
                <Link key={o} href={`?${next}`} className={active ? "rounded-md bg-white px-2 py-1" : "px-2 py-1"}>
                  {o}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </>
  );
}
