import { PostMeta } from "@/lib/posts";

export const meta: PostMeta = {
  slug: "week-11-pros-cons-pats-vs-jets",
  title: "Week 11 Pros & Cons: Patriots 27 Jets 14",
  date: "2025-11-13",
  description: "Weekly Patriots pros & cons recap (Week 11).",
  tags: ["NFL", "Pro & Cons", "New England Patriots", "New York Jets"],
  searchContent: "Pros Thursday night games are normally weird; a convincing divisional win where the team looked crisp is a big plus. This was my favorite offensive game so far: “death by a thousand cuts” like the McDaniels/Brady years—fullback looks, shotgun spread, mismatch hunting. Running game did the job. Henderson’s confidence is sky high with a 3-TD game, and he’s a great addition to the huddle. Best O-line game in a month: violent run blocking, zero sacks allowed by the offensive line, and Maye looked comfortable. Defense was solid; Barmore and Jennings flashed. Looked like the plan was to contain Fields and make him throw. Cons Death, taxes, and the opponent scoring a TD on their opening drive. Defense looked a little bored at times (Thursday vibes); the only other TD came when Woodson fell down on a blitz. Curious scheme choice: lots of man coverage vs a running QB, which allowed Fields to run for big yards. Would love to hear the reasoning.",
  heroImage: "/images/2025/prosandcons/week-11/pats-vs-jets-hero.jpg",
  heroAlt: "Patriots vs Jets Week 11 action",
};

export default function Post() {
  return (
    <>
      <h2>Pros</h2>

      <ul>
        <li>Thursday night games are normally weird; a convincing divisional win where the team looked crisp is a big plus.</li>
        <li>This was my favorite offensive game so far: “death by a thousand cuts” like the McDaniels/Brady years—fullback looks, shotgun spread, mismatch hunting.</li>
        <li>Running game did the job. Henderson’s confidence is sky high with a 3-TD game, and he’s a great addition to the huddle.</li>
        <li>Best O-line game in a month: violent run blocking, zero sacks allowed by the offensive line, and Maye looked comfortable.</li>
        <li>Defense was solid; Barmore and Jennings flashed. Looked like the plan was to contain Fields and make him throw.</li>
      </ul>

      <h2>Cons</h2>

      <ul>
        <li>Death, taxes, and the opponent scoring a TD on their opening drive.</li>
        <li>Defense looked a little bored at times (Thursday vibes); the only other TD came when Woodson fell down on a blitz.</li>
        <li>Curious scheme choice: lots of man coverage vs a running QB, which allowed Fields to run for big yards. Would love to hear the reasoning.</li>
      </ul>
    </>
  );
}
