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
import { RateAnother } from "@/components/rate-another";
import { ProfileView } from "@/app/u/[handle]/profile-view";
import { ProfileForm } from "@/app/settings/profile/profile-form";
import { PreferencesForm } from "@/app/settings/preferences-form";
import { FeedSkeleton, PageLoader } from "@/components/loader";
import { DeleteAccount } from "@/app/settings/delete-account";
import { Comments } from "@/components/comments";
import { ReviewCard } from "@/components/review-card";
import type { Thread } from "@/lib/comments";
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
  dishes: dishes.map((d, i) => ({
    id: id(),
    name: d,
    diet: /egg/i.test(d) ? ("egg" as const) : /chicken|mutton|kebab|fish|burger/i.test(d) ? ("non_veg" as const) : ("veg" as const),
    rating_count: i * 7,
    avg_score: i ? 6.5 + i : null,
  })),
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
  comments_count: 3,
  created_at: "2026-10-21T10:00:00Z",
  author: { username: author, avatar: null, avatar_path: null },
  dish: { id: p.dishes[0]?.id ?? "fixture-dish", name: p.dishes[0]?.name ?? "Dish", diet: p.dishes[0]?.diet ?? ("veg" as const), rating_count: 12, avg_score: 8.3, restaurant: p },
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

const comment = (id: string, username: string, body: string, parent_id: string | null = null, like_count = 0, dislike_count = 0) => ({
  id,
  body,
  parent_id,
  like_count,
  dislike_count,
  created_at: "2026-10-22T05:00:00Z",
  author: { username, avatar: null, avatar_path: null },
});
// Sample threads (fixtures). Worst: a 500-character comment, long handles, many replies.
const THREADS: Record<string, Thread[]> = {
  demo: [
    { ...comment("c1", "dosa_devotee", "Agreed. I go there just for this.", null, 12, 1), replies: [comment("c2", "idli_insider", "Same, every Sunday.", "c1", 3)] },
    { ...comment("c3", "hot_takes_hari", "Disagree, the coffee is the real star.", null, 2, 5), replies: [] },
  ],
  worst: [
    {
      ...comment("w1", "mohammed_abdulrahman", "word ".repeat(100).trim(), null, 123456, 98765),
      replies: Array.from({ length: 6 }, (_, i) => comment(`w1r${i}`, i % 2 ? "jo" : "aleksandra_wisniewska", "ಮಸಾಲೆ ದೋಸೆ ".repeat(i + 1).trim(), "w1")),
    },
  ],
};

// One agreed, one disagreed, so both chosen states are visible.
const FIXTURE_VOTES: Record<string, Record<string, "facts" | "cap">> = {
  demo: Object.fromEntries(REVIEWS.demo.slice(0, 2).map((r, i) => [r.id, i ? "cap" : "facts"])),
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
const SCREENS = ["login", "onboarding", "home", "restaurant", "dish", "rate", "review", "profile", "edit", "settings", "loading"] as const;

// Profile fixtures: worst case has a 40-character name, a 160-character bio and negative trust.
const fixtureProfile = (data: DataKey, f: (typeof FIXTURES)[DataKey]) => ({
  id: "fixture",
  username: f.profile.username,
  display_name: data === "worst" ? "Mohammed Abdulrahman Al-Hashimi Sultan K" : data === "demo" ? "Dosa Devotee" : null,
  bio: data === "worst" ? "x".repeat(160) : data === "demo" ? "Crisp edges or nothing. Will queue for ghee." : null,
  avatar: null,
  avatar_path: null,
  diet: data === "demo" ? ("eggetarian" as const) : null,
  instagram: data === "demo" ? "dosa.devotee" : data === "worst" ? "a".repeat(30) : null,
  created_at: "2026-10-01T05:00:00Z",
  regions: f.profile.regions && { name: f.profile.regions.name },
});
const fixtureStats = { demo: { rated: 23, average: 7.8, trust: 214, followers: 48, following: 12 }, worst: { rated: 12345, average: 1, trust: -9876, followers: 1234567, following: 0 } } as Record<string, { rated: number; average: number | null; trust: number; followers: number; following: number }>;

// "Want to try" for the fixture feed: the first dish already saved, the rest not.
const fixtureSaves = (list: { dish: { id: string } }[] | undefined) => Object.fromEntries((list ?? []).map((r, i) => [r.dish.id, i === 0]));

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
      {screen === "home" && <HomeView profile={f.profile} restaurants={f.places} feed={{ sort: "top", reviews: REVIEWS[data] ?? [], votes: FIXTURE_VOTES[data] ?? {} }} />}
      {screen === "restaurant" && (f.places[0] ? <RestaurantView restaurant={f.places[0]} /> : <p className="p-6">No place in this fixture.</p>)}
      {screen === "review" && REVIEWS[data]?.[0] && (
        <div className="mx-auto w-full max-w-xl p-5">
          <ReviewCard review={REVIEWS[data][0]} saved={false} viewer={f.profile.username} full />
          {f.places[0] && (
            <div className="mb-6">
              <RateAnother restaurant={f.places[0]} dishes={f.places[0].dishes} />
            </div>
          )}
          <Comments ratingId="fixture" threads={THREADS[data] ?? []} votes={data === "demo" ? { c1: "like", c3: "dislike" } : {}} viewer={f.profile.username} />
        </div>
      )}
      {screen === "rate" && f.places[0]?.dishes[0] && (
        <div className="mx-auto w-full max-w-xl p-5">
          <RateForm dish={{ ...f.places[0].dishes[0], restaurant: f.places[0] }} userId="fixture" existing={null} />
        </div>
      )}
      {screen === "profile" && (
        <ProfileView
          profile={fixtureProfile(data, f)}
          stats={fixtureStats[data] ?? { rated: 0, average: null, trust: 0, followers: 0, following: 0 }}
          favourites={(REVIEWS[data] ?? []).slice(0, 3).map((r, i) => ({ position: i + 1, rating: r }))}
          ratings={REVIEWS[data] ?? []}
          votes={FIXTURE_VOTES[data] ?? {}}
          saveStates={fixtureSaves(REVIEWS[data])}
          viewer={f.profile.username}
          tab={params.get("tab") === "diary" || params.get("tab") === "saved" ? (params.get("tab") as "diary" | "saved") : "takes"}
          saves={(f.places[0]?.dishes ?? []).map((d) => ({ created_at: "2026-10-20T10:00:00Z", dish: { ...d, restaurant: f.places[0] } }))}
          following={data === "demo"}
          match={data === "demo" ? { common: 4, percent: 82, split: { dish: "Masala Dosa", place: "Vidyarthi Bhavan", mine: 9, theirs: 4.5 } } : { common: 1, percent: null }}
        />
      )}
      {screen === "edit" && (
        <div className="mx-auto w-full max-w-xl p-5">
          <ProfileForm
            userId="00000000-0000-0000-0000-000000000000"
            handle={f.profile.username}
            initial={{
              display_name: fixtureProfile(data, f).display_name ?? "",
              bio: fixtureProfile(data, f).bio ?? "",
              avatar: null,
              avatar_path: null,
              diet: fixtureProfile(data, f).diet ?? "",
              instagram: fixtureProfile(data, f).instagram ?? "",
              date_of_birth: data === "demo" ? "2001-05-04" : "",
              gender: data === "demo" ? "female" : "",
            }}
          />
        </div>
      )}
      {screen === "loading" && (
        <div className="mx-auto flex w-full max-w-xl flex-col p-5">
          <PageLoader />
          <FeedSkeleton />
        </div>
      )}
      {screen === "settings" && (
        <div className="mx-auto w-full max-w-xl p-5">
          <PreferencesForm initial={{ show_diet: data === "demo" ? "egg" : "all", feed_default: "top" }} />
          <div className="mt-8">
            <DeleteAccount handle={f.profile.username} />
          </div>
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
