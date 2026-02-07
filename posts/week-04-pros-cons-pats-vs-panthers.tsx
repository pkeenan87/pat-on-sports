import { PostMeta } from "@/lib/posts";

export const meta: PostMeta = {
  slug: "week-04-pros-cons-pats-vs-panthers",
  title: "Week 4 Pros & Cons: Patriots 42 Panthers 13",
  date: "2025-09-28",
  description: "Weekly Patriots pros & cons recap (Week 4).",
  tags: ["NFL", "Pro & Cons", "New England Patriots", "Carolina Panthers"],
  heroImage: "/images/2025/prosandcons/week-04/pats-vs-panthers-hero.jpg",
  heroAlt: "Patriots vs Panthers Week 4 action",
};

export default function Post() {
  return (
    <>
      <h2>Pros</h2>

      <ul>
        <li>Extremely efficient passing game. Drake Maye looked great.</li>
        <li>For the second time this year, special teams provided a big spark. Marcus Jones had two excellent returns, including one for a TD.</li>
        <li>No turnovers, much improved.</li>
        <li>Diggs had his first breakout game as a Patriot and looked great.</li>
        <li>Pass blocking was great even though Jared Wilson was out. Ben Brown filled in well.</li>
        <li>Spillane didn’t miss any tackles and Jack Gibbens seemed to provide an upgrade over Christian Ellis.</li>
        <li>Return of Christian Gonzalez made a huge impact on the pass defense.</li>
      </ul>

      <h2>Cons</h2>

      <ul>
        <li>Hard not to think “what if” after last week’s 5-turnover loss—this team could realistically be 3–1.</li>
      </ul>
    </>
  );
}
