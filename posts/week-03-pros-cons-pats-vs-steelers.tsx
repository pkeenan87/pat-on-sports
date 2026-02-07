import { PostMeta } from "@/lib/posts";

export const meta: PostMeta = {
  slug: "week-03-pros-cons-pats-vs-steelers",
  title: "Week 3 Pros & Cons: Patriots 14 Steelers 14",
  date: "2025-09-21",
  description: "Pros & cons recap for Week 3 vs the Pittsburgh Steelers.",
  tags: ["NFL", "Pros & Cons", "New England Patriots", "Pittsburgh Steelers"],
  searchContent: "Pros Robert Spillane had his best game of the year: 10+ tackles and an INT that put them on the 10-yard line (they ended up fumbling). Hunter Henry played great: leading receiver and 2 TDs. The passing game moved the ball well overall, despite some issues picking up blitzes. Big conversions: 3rd down (6/13) and 4th down (4/5). Aside from turnovers, we dominated nearly every statistical category. It’s wild we lost. Cons Turnovers lost the game. Five turnovers (four fumbles!) is insane, including two in the end zone. Stevenson is basically unplayable right now, which is brutal because we need him. Drake Maye struggled vs the blitz and could’ve had more interceptions if not for bad Steelers drops. Inexperience showed. Alex Austin continues to be a problem (PI + getting beat). We need Gonzalez back. Worst day for pass blocking: blitzes/stunts got home, and Moses’ slow feet got exposed by T.J. Watt. Drake Maye’s scrambles made the rushing stats look better than the RB run game actually was. Demario Douglas made a costly situational mistake on a 4th down (running backward instead of securing the line to gain).",
  heroImage: "/images/2025/prosandcons/week-03/pats-vs-steelers-hero.jpg",
  heroAlt: "Patriots vs Steelers Week 3 action",
};

export default function Post() {
  return (
    <>
      <h2>Pros</h2>

      <ul>
        <li>Robert Spillane had his best game of the year: 10+ tackles and an INT that put them on the 10-yard line (they ended up fumbling).</li>
        <li>Hunter Henry played great: leading receiver and 2 TDs.</li>
        <li>The passing game moved the ball well overall, despite some issues picking up blitzes.</li>
        <li>Big conversions: 3rd down (6/13) and 4th down (4/5).</li>
        <li>Aside from turnovers, we dominated nearly every statistical category. It’s wild we lost.</li>
      </ul>

      <h2>Cons</h2>

      <ul>
        <li>Turnovers lost the game. Five turnovers (four fumbles!) is insane, including two in the end zone. Stevenson is basically unplayable right now, which is brutal because we need him.</li>
        <li>Drake Maye struggled vs the blitz and could’ve had more interceptions if not for bad Steelers drops. Inexperience showed.</li>
        <li>Alex Austin continues to be a problem (PI + getting beat). We need Gonzalez back.</li>
        <li>Worst day for pass blocking: blitzes/stunts got home, and Moses’ slow feet got exposed by T.J. Watt.</li>
        <li>Drake Maye’s scrambles made the rushing stats look better than the RB run game actually was.</li>
        <li>Demario Douglas made a costly situational mistake on a 4th down (running backward instead of securing the line to gain).</li>
      </ul>
    </>
  );
}
