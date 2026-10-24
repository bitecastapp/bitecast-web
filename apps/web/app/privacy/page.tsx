import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/legal-page";

export const metadata: Metadata = { title: "Privacy Policy · Nomrank", description: "What Nomrank collects, why, and your choices." };

const SETTINGS = (
  <Link href="/settings" className="font-semibold text-foreground underline-offset-4 hover:underline">
    Settings
  </Link>
);

const SECTIONS: LegalSection[] = [
  {
    id: "collect",
    title: "What we collect",
    body: (
      <ul>
        <li>
          <strong>Waitlist:</strong> if you join before launch, your email address, only to tell you when Nomrank opens.
        </li>
        <li>
          <strong>Account:</strong> your email address (to sign you in), handle and name.
        </li>
        <li>
          <strong>Profile:</strong> picture, bio, food preference, home region and Instagram handle, if you add them.
        </li>
        <li>
          <strong>Private details:</strong> date of birth (to check you&apos;re 13 or older) and gender, if you give it.
        </li>
        <li>
          <strong>What you do:</strong> ratings, takes, photos, comments, votes, follows, saved dishes, favourites and reports.
        </li>
        <li>
          <strong>Technical:</strong> the sign-in cookie that keeps you signed in. We don&apos;t use advertising trackers.
        </li>
      </ul>
    ),
  },
  {
    id: "use",
    title: "How we use it",
    body: (
      <ul>
        <li>to run Nomrank: show your posts, work out scores, rankings and Tastes like home;</li>
        <li>to keep it fair and safe: check ages, review new dishes, handle reports, limit spam;</li>
        <li>to sign you in and keep your account secure.</li>
      </ul>
    ),
  },
  {
    id: "public",
    title: "What others can see",
    body: (
      <>
        <p>
          <strong>Public:</strong> your handle, name, picture, bio, food preference, home region, Instagram handle, ratings, takes, photos and
          comments.
        </p>
        <p>
          <strong>Only you:</strong> your email, date of birth, gender and settings. Your Want to try list and Diary can be limited to your
          followers or to just you in {SETTINGS}.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Who we share it with",
    body: (
      <>
        <p>
          We don&apos;t sell your data. We use Supabase to store data and sign you in, in their Mumbai (India) region. Our team sees reports
          and moderation details only to keep Nomrank safe. We share data with authorities only when the law requires it.
        </p>
      </>
    ),
  },
  {
    id: "keep",
    title: "How long we keep it",
    body: (
      <>
        <p>
          We keep your data while your account exists. When you delete your account, your profile, posts and photos are deleted. Records of
          moderation actions may be kept longer where we need them to keep Nomrank safe.
        </p>
      </>
    ),
  },
  {
    id: "rights",
    title: "Your choices and rights",
    body: (
      <>
        <p>
          You can see and change your details, download all your data, and delete your account in {SETTINGS}. Under India&apos;s data
          protection law you can also ask us to correct or erase your data and raise a grievance.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <>
        <p>Nomrank isn&apos;t for anyone under 13, and we ask for a date of birth to check this.</p>
      </>
    ),
  },
  {
    id: "contact",
    title: "Changes and contact",
    body: (
      <>
        <p>If this policy changes in a way that matters, we&apos;ll tell you in the app first.</p>
        <p>A contact address for privacy questions and grievances will be listed here before launch.</p>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="23 October 2026"
      intro={<p>This explains what Nomrank collects, why, who can see it, and what you can do about it.</p>}
      sections={SECTIONS}
    />
  );
}
