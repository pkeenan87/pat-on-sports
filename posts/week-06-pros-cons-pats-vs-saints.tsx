import { PostMeta } from "@/lib/posts";

export const meta: PostMeta = {
  slug: "week-06-pros-cons-pats-vs-saints",
  title: "Week 6 Pros & Cons: Patriots 25 Saints 19",
  date: "2025-10-12",
  description: "Weekly Patriots pros & cons recap (Week 6).",
  tags: ["NFL", "Pro & Cons", "New England Patriots", "New Orleans Saints"],
  searchContent: "Pros Drake Maye upped his game to another level showing explosive play potential. It seemed like he could hit a 30+ yard completion whenever he wanted. Defense showed good “bend but don’t break” signs. Rattler played well, but the Pats came up with stops when needed and only gave up 19 points. More guys got involved besides Diggs and Henry. Boutte, Douglas, and (to a lesser extent) Henderson (10 total touches) made an impact. The Patriots had some very well-timed blitzes that got to Rattler, who was tough to sack early. Cons The running game continues to stink. Stevenson looks hesitant, like he’s running scared of fumbling. Offensive line looked good on the stat sheet (1 sack allowed) but felt shaky. Campbell and Moses both had moments. Defense keeps giving up chunk plays. Olave was killing us early—whatever adjustment we made was key. General Thought Don’t let offseason takes slide. Offensive line upgrades have completely changed the left side of the line; OL is the most important position group on the team.",
  heroImage: "/images/2025/prosandcons/week-06/pats-vs-saints-hero.jpg",
  heroAlt: "Patriots vs Saints Week 6 action",
};

export default function Post() {
  return (
    <>
      <h2>Pros</h2>

      <ul>
        <li>Drake Maye upped his game to another level showing explosive play potential. It seemed like he could hit a 30+ yard completion whenever he wanted.</li>
        <li>Defense showed good “bend but don’t break” signs. Rattler played well, but the Pats came up with stops when needed and only gave up 19 points.</li>
        <li>More guys got involved besides Diggs and Henry. Boutte, Douglas, and (to a lesser extent) Henderson (10 total touches) made an impact.</li>
        <li>The Patriots had some very well-timed blitzes that got to Rattler, who was tough to sack early.</li>
      </ul>

      <h2>Cons</h2>

      <ul>
        <li>The running game continues to stink. Stevenson looks hesitant, like he’s running scared of fumbling.</li>
        <li>Offensive line looked good on the stat sheet (1 sack allowed) but felt shaky. Campbell and Moses both had moments.</li>
        <li>Defense keeps giving up chunk plays. Olave was killing us early—whatever adjustment we made was key.</li>
      </ul>

      <h2>General Thought</h2>

      <p>Don’t let offseason takes slide. Offensive line upgrades have completely changed the left side of the line; OL is the most important position group on the team.</p>
    </>
  );
}
