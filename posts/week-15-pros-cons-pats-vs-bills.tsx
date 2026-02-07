import { PostMeta } from "@/lib/posts";

export const meta: PostMeta = {
  slug: "week-15-pros-cons-pats-vs-bills",
  title: "Week 15 Pros & Cons: Patriots 31 Bills 35",
  date: "2025-12-14",
  description: "Weekly Patriots pros & cons recap (Week 15).",
  tags: ["NFL", "Pro & Cons", "New England Patriots", "Buffalo Bills"],
  heroImage: "/images/2025/prosandcons/week-15/pats-vs-bills-hero.jpg",
  heroAlt: "Patriots vs Bills Week 15 action",
};

export default function Post() {
  return (
    <>
      <h2>Pros</h2>

      <ul>
        <li>The Patriots showed their ceiling: when they’re at their best they can compete with anyone.</li>
        <li>Best run game of the year: Henderson was a weapon, Stevenson ran well, and Maye ran effectively in the red zone.</li>
        <li>Found part of the red zone solution: run Drake Maye.</li>
        <li>Offensive line performed decently; the extra OL package was extremely effective in the first half.</li>
        <li>Snowblower “bad gas” fix felt like a metaphor—maybe this was the Pats letting out their “bad gas.” Time will tell.</li>
      </ul>

      <h2>Cons</h2>

      <ul>
        <li>Worst collapse of the year. Losing when you’re up 21 is awful.</li>
        <li>Worst passing game of the year (especially the second half). Maye wasn’t in rhythm and Henry dropped a key pass.</li>
        <li>Defense gave up a run of TDs; run defense hasn’t been the same since Milton Williams got hurt.</li>
        <li>Vederian Lowe had another offsides penalty that kicked off a drive. Still watching him closely.</li>
      </ul>
    </>
  );
}
