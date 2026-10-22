"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Profile } from "@/lib/auth";
import type { LoginState } from "@/app/login/actions";
import { LoginScreen } from "@/app/login/login-screen";
import { OnboardingForm, type Region } from "@/app/onboarding/onboarding-form";
import { HomeView } from "@/app/home-view";
import { RestaurantView } from "@/app/r/[slug]/restaurant-view";
import { DishView } from "@/app/r/[slug]/[dish]/dish-view";
import { RateForm } from "@/app/rate/rate-form";
import type { Restaurant } from "@/lib/restaurants";
import type { Review } from "@/lib/ratings";

let n = 0;
const id = () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;
const place = (name: string, area: string, dishes: string[]): Restaurant => ({
  id: id(),
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  name,
  area,
  city: "Bengaluru",
  dishes: dishes.map((d) => ({ id: id(), name: d })),
});
const DEMO_PLACES = [
  place("Vidyarthi Bhavan", "Basavanagudi", ["Kesari Bath", "Masala Dosa", "Rava Vada"]),
  place("Brahmin's Coffee Bar", "Basavanagudi", ["Filter Coffee", "Idli", "Kesari Bath", "Vada"]),
  place("Meghana Foods", "Koramangala", ["Boneless Chicken Biryani", "Chicken Biryani"]),
  place("Truffles", "Koramangala", ["All American Cheeseburger"]),
];
// Real-world long names at the schema limits (name 80, area 60, dish 60).
const WORST_PLACES = [
  place("Sri Udupi Krishna Bhavan Pure Vegetarian Family Restaurant & Sweets (Since 1952)", "Jeevan Bima Nagar Main Road, HAL 3rd Stage, New Thippasandra", [
    "Paneer Butter Masala with Butter Naan and Jeera Rice Combo",
    "ಮಸಾಲೆ ದೋಸೆ",
    ...Array.from({ length: 48 }, (_, i) => `Thali No. ${i + 1}`),
  ]),
  place("Café Noir", "Indiranagar", []),
  place("Jo", "HSR", ["Idli"]),
];

const review = (take: string, score: number, author: string, p: Restaurant, facts = 0, cap = 0): Review => ({
  id: id(),
  score,
  take,
  facts_count: facts,
  cap_count: cap,
  created_at: "2026-10-21T10:00:00Z",
  author: { username: author },
  dish: { name: p.dishes[0]?.name ?? "Dish", restaurant: p },
  photos: [],
});

// Sample takes (labelled fixtures, never real data).
function makeReviews(data: string, places: Restaurant[]): Review[] {
  if (!places.length || data === "empty") return [];
  if (data === "worst")
    return [
      review("x ".repeat(249).trim() + " Honestly, " + "this is a long one. ".repeat(10).trim().slice(0, 1), 10, "mohammed_abdulrahman", places[0], 12345, 9876),
      review("Mid.", 1, "jo", places[places.length - 1]),
    ];
  return [
    review("Ghee podi idli at 7am is a personality trait now.", 9, "idli_insider", places[0], 214, 12),
    review("Overrated. The chutney is carrying this dosa on its back.", 5, "hot_takes_hari", places[1] ?? places[0], 48, 96),
  ];
}

// Built once at module load so server and browser render the same ids (no hydration mismatch).
const REVIEWS: Record<string, Review[]> = {
  demo: makeReviews("demo", DEMO_PLACES),
  worst: makeReviews("worst", WORST_PLACES),
  one: [],
  empty: [],
};

const LONG_EMAIL = "aleksandra.wisniewska-kowalczyk+bitecast@northwind-industries-holdings.example.com";

const FIXTURES = {
  demo: {
    login: { status: "sent", email: "jo@example.com" } as LoginState,
    regions: [{ slug: "bengaluru", name: "Bengaluru" }] as Region[],
    profile: { username: "dosa_devotee", home_region: "bengaluru", regions: { name: "Bengaluru", demonym: "Bengalureans" } } as Profile,
    places: DEMO_PLACES,
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
    places: WORST_PLACES,
    profile: { username: "mohammed_abdulrahman", home_region: "chhatrapati-sambhajinagar", regions: { name: "Chhatrapati Sambhajinagar", demonym: "Sambhajinagarkars" } } as Profile,
  },
  empty: {
    login: { status: "idle" } as LoginState,
    regions: [] as Region[],
    profile: { username: "jo_", home_region: "bengaluru", regions: null } as Profile,
    places: [] as Restaurant[],
  },
  one: {
    login: { status: "sent", email: "a@b.co" } as LoginState,
    regions: [{ slug: "bengaluru", name: "Bengaluru" }] as Region[],
    profile: { username: "abc", home_region: "bengaluru", regions: { name: "Bengaluru", demonym: "Bengalureans" } } as Profile,
    places: [place("Truffles", "Koramangala", ["All American Cheeseburger"])],
  },
};

type DataKey = keyof typeof FIXTURES;
const SCREENS = ["login", "onboarding", "home", "restaurant", "dish", "rate"] as const;

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
      {screen === "home" && <HomeView profile={f.profile} restaurants={f.places} feed={{ sort: "top", reviews: REVIEWS[data] ?? [], votes: {} }} />}
      {screen === "restaurant" && (f.places[0] ? <RestaurantView restaurant={f.places[0]} /> : <p className="p-6">No place in this fixture.</p>)}
      {screen === "rate" && f.places[0]?.dishes[0] && (
        <div className="mx-auto max-w-xl p-5">
          <RateForm dish={{ ...f.places[0].dishes[0], restaurant: f.places[0] }} userId="fixture" existing={null} />
        </div>
      )}
      {screen === "dish" &&
        (f.places[0]?.dishes[0] ? (
          <DishView dish={{ ...f.places[0].dishes[0], restaurant: f.places[0] }} ratings={REVIEWS[data] ?? []} viewer={f.profile.username} />
        ) : (
          <p className="p-6">No dish in this fixture.</p>
        ))}
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
