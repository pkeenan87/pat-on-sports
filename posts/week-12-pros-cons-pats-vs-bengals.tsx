import { PostMeta } from "@/lib/posts";

export const meta: PostMeta = {
  slug: "week-12-pros-cons-pats-vs-bengals",
  title: "Week 12 Pros & Cons: Patriots 26 Bengals 20",
  date: "2025-11-23",
  description: "Weekly Patriots pros & cons recap (Week 12).",
  tags: ["NFL", "Pro & Cons", "New England Patriots", "Cincinnati Bengals"],
  searchContent: "Pros Defense played very well against an opponent I was concerned about. Flacco had under 200 yards passing. Of the 20 points allowed: 7 was a defensive TD and 3 was a 63-yard field goal. Craig Woodson is mastering hard-hitting safety play without penalties. Carlton Davis had his best game as a Patriot with huge breakups in crunch time. Hunter Henry (Mr. Reliable) moved the chains all day. The offensive line, while battered, only allowed one sack for the second week in a row. Marcus Jones defensive TD flipped momentum. Cons Maye started slow and the early defensive TD put us in a hole, but he still hit a career high in passing yards—floor is improving. Injuries: Moses, Campbell, and Wilson left the game (Moses returned). Losing the left side for a month is very bad. Vederian Lowe entering/starting is a major concern. Goal-line offense was rough. Would like more throws to Henry/Diggs and better short-yardage answers. Bonus (Forward Looking) Next week feels riskier with pass rushers and the left side injuries.",
  heroImage: "/images/2025/prosandcons/week-12/pats-vs-bengals-hero.jpg",
  heroAlt: "Patriots vs Bengals Week 12 action",
};

export default function Post() {
  return (
    <>
      <h2>Pros</h2>

      <ul>
        <li>Defense played very well against an opponent I was concerned about. Flacco had under 200 yards passing. Of the 20 points allowed: 7 was a defensive TD and 3 was a 63-yard field goal.</li>
        <li>Craig Woodson is mastering hard-hitting safety play without penalties.</li>
        <li>Carlton Davis had his best game as a Patriot with huge breakups in crunch time.</li>
        <li>Hunter Henry (Mr. Reliable) moved the chains all day.</li>
        <li>The offensive line, while battered, only allowed one sack for the second week in a row.</li>
        <li>Marcus Jones defensive TD flipped momentum.</li>
      </ul>

      <h2>Cons</h2>

      <ul>
        <li>Maye started slow and the early defensive TD put us in a hole, but he still hit a career high in passing yards—floor is improving.</li>
        <li>Injuries: Moses, Campbell, and Wilson left the game (Moses returned). Losing the left side for a month is very bad.</li>
        <li>Vederian Lowe entering/starting is a major concern.</li>
        <li>Goal-line offense was rough. Would like more throws to Henry/Diggs and better short-yardage answers.</li>
      </ul>

      <h2>Bonus (Forward Looking)</h2>

      <p>Next week feels riskier with pass rushers and the left side injuries.</p>
    </>
  );
}
