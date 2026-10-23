import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/legal-page";

export const metadata: Metadata = { title: "Terms of Service · Bitecast", description: "The rules for using Bitecast." };

const SECTIONS: LegalSection[] = [
  {
    id: "who",
    title: "Who can use Bitecast",
    body: (
      <>
        <p>You need to be at least 13 to use Bitecast, and old enough where you live to agree to these terms. One account per person.</p>
        <p>Keep your sign-in email secure. You&apos;re responsible for what happens on your account.</p>
      </>
    ),
  },
  {
    id: "content",
    title: "What you post",
    body: (
      <>
        <p>
          Your ratings, takes, comments, photos and dish suggestions stay yours. By posting them, you give Bitecast a free, worldwide licence
          to show, store and share them on Bitecast and when you share Bitecast links, for as long as they&apos;re on Bitecast.
        </p>
        <p>Only post photos you took or have the right to share, and no photos of other people without their consent.</p>
      </>
    ),
  },
  {
    id: "rules",
    title: "Playing fair",
    body: (
      <>
        <p>
          Follow our{" "}
          <Link href="/about#guidelines" className="font-semibold text-foreground underline-offset-4 hover:underline">
            community guidelines
          </Link>
          . In short, you agree not to:
        </p>
        <ul>
          <li>post fake, paid or incentivised ratings, or rate a place you own or work for;</li>
          <li>harass, threaten or attack people, or post hateful content;</li>
          <li>spam, advertise, or post links to scams or malware;</li>
          <li>create accounts or use bots to push rankings up or down;</li>
          <li>scrape Bitecast or try to get around its security or limits.</li>
        </ul>
      </>
    ),
  },
  {
    id: "moderation",
    title: "Moderation",
    body: (
      <>
        <p>
          New dishes are reviewed before everyone can see them. We may remove content that breaks these terms or the guidelines, and limit,
          suspend or close accounts that do. Anyone can report a take, comment or dish.
        </p>
      </>
    ),
  },
  {
    id: "opinions",
    title: "Opinions, not advice",
    body: (
      <>
        <p>
          Scores, rankings and takes are the personal opinions of people on Bitecast, not statements of fact by Bitecast. Bitecast isn&apos;t
          affiliated with, or paid by, the restaurants listed. Dish and menu details are added by the community and may be wrong or out of
          date: always check ingredients and allergens with the restaurant.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    title: "Bitecast as it is",
    body: (
      <>
        <p>
          We work to keep Bitecast running well, but we provide it as it is, without guarantees. To the extent the law allows, Bitecast
          isn&apos;t responsible for losses from using it or relying on what people post.
        </p>
      </>
    ),
  },
  {
    id: "leaving",
    title: "Leaving",
    body: (
      <>
        <p>
          You can download your data or delete your account at any time from{" "}
          <Link href="/settings#account" className="font-semibold text-foreground underline-offset-4 hover:underline">
            Settings
          </Link>
          . Deleting removes your profile and everything you posted.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes and contact",
    body: (
      <>
        <p>If these terms change in a way that matters, we&apos;ll tell you in the app before the change applies.</p>
        <p>These terms are governed by the laws of India. A contact address for questions and complaints will be listed here before launch.</p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="23 October 2026"
      intro={<p>These terms are the agreement between you and Bitecast when you use the app. We&apos;ve kept them short and plain.</p>}
      sections={SECTIONS}
    />
  );
}
