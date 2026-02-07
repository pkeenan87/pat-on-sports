import { PostMeta } from "@/lib/posts";

export const meta: PostMeta = {
  slug: "week-05-pros-cons-pats-vs-bills",
  title: "Week 5 Pros & Cons: Patriots 23 Bills 20",
  date: "2025-10-05",
  description: "Weekly Patriots pros & cons recap (Week 5).",
  tags: ["NFL", "Pro & Cons", "New England Patriots", "Buffalo Bills"],
  heroImage: "/images/2025/prosandcons/week-05/pats-vs-bills-hero.jpg",
  heroAlt: "Patriots vs Bills Week 5 action",
};

export default function Post() {
  return (
    <>
      <h2>Pros</h2>

      <ul>
        <li>We beat the Buffalo Bills in Buffalo. Doesn’t matter how it happened—this is a legit win.</li>
        <li>Drake Maye put together a game-winning drive in a big moment. This will do wonders for his confidence.</li>
        <li>Stefon Diggs is the man. He always seems to catch the ball when targeted and displayed incredible footwork on sideline catches.</li>
        <li>Christian Gonzalez changes the Patriots’ entire defense. His breakup on that last pass from Allen was an unsung hero play.</li>
        <li>Defensive line continues to be the strongest unit on the team. Barmore, Williams, and Landry got great pressure, and the blitzes were some of the best I’ve seen since Flores.</li>
      </ul>

      <h2>Cons</h2>

      <ul>
        <li>We lost Antonio Gibson for the year and Stevenson won’t stop fumbling. We will need to sign an RB, but replacing Gibson won’t be easy.</li>
        <li>Patriots offensive line continues to struggle picking up stunts. Onwenu got killed on one that should have resulted in a sack if Maye didn’t escape.</li>
        <li>Maye wasn’t always sharp against the blitz. The “book” on the Pats will be blitzes and stunts going forward; they have to overcome it.</li>
        <li>Missed opportunities and dumb penalties almost cost us the game.</li>
      </ul>
    </>
  );
}
