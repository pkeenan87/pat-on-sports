import { PostMeta } from "@/lib/posts";

export const meta: PostMeta = {
  slug: "week-01-pros-cons-pats-vs-raiders",
  title: "Week 1 Pros & Cons: Patriots 13 Raiders 20",
  date: "2025-09-07",
  description: "Weekly Patriots pros & cons recap (Week 1).",
  tags: ["NFL", "Pro & Cons", "New England Patriots", "Las Vegas Raiders"],
  heroImage: "/images/2025/prosandcons/week-01/pats-vs-raiders-hero.jpg",
  heroAlt: "Patriots vs Raiders Week 1 action",
};

export default function Post() {
  return (
    <>
      <h2>Pros</h2>

      <ul>
        <li>Boutte looked really good.</li>
        <li>Diggs was decent and may improve as the year goes on. Coming off an ACL, that’s a strong Week 1.</li>
        <li>Pass rush was very good. Harold Landry can rush the passer.</li>
      </ul>

      <h2>Cons</h2>

      <ul>
        <li>Drake Maye’s mechanics looked bad.</li>
        <li>Run game was non-existent.</li>
        <li>Mental mistakes on the offensive line.</li>
        <li>Defense gave up ~10 plays of 20 yards or more.</li>
        <li>While we moved the ball, the offense still couldn’t score.</li>
      </ul>
    </>
  );
}
