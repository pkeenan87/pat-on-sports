import { PostMeta } from "@/lib/posts";

export const meta: PostMeta = {
  slug: "week-07-pros-cons-pats-vs-titans",
  title: "Week 7 Pros & Cons: Patriots 31 Titans 13",
  date: "2025-10-19",
  description: "Weekly Patriots pros & cons recap (Week 7).",
  tags: ["NFL", "Pro & Cons", "New England Patriots", "Tennessee Titans"],
  searchContent: "Pros Drake Maye had a Patriots record 91% completion percentage. And he’s doing it with high-difficulty throws (sideline fades, deep balls, hole shots). Stevenson ran the ball pretty well and powered the offense on the first two drives. He finally looked like he was running again instead of trying not to fumble. Defensive line dominated. They held the Titans to less than 40 yards rushing and it felt like everyone made a play (Williams, Landry, Chaisson). Cons Offensive line continues to struggle against blitzes and stunts. Jared Wilson is the weak link; communication on twist stunts is a problem. Defense off to another slow start, making another young QB look really good early before locking it down. Carlton Davis seems to get beat on a couple big passes every week. Drake Maye takes way too many hits. The biggest risk to this team is Maye’s health; he has to be smarter when on the move.",
  heroImage: "/images/2025/prosandcons/week-07/pats-vs-titans-hero.jpg",
  heroAlt: "Patriots vs Titans Week 7 action",
};

export default function Post() {
  return (
    <>
      <h2>Pros</h2>

      <ul>
        <li>Drake Maye had a Patriots record 91% completion percentage. And he’s doing it with high-difficulty throws (sideline fades, deep balls, hole shots).</li>
        <li>Stevenson ran the ball pretty well and powered the offense on the first two drives. He finally looked like he was running again instead of trying not to fumble.</li>
        <li>Defensive line dominated. They held the Titans to less than 40 yards rushing and it felt like everyone made a play (Williams, Landry, Chaisson).</li>
      </ul>

      <h2>Cons</h2>

      <ul>
        <li>Offensive line continues to struggle against blitzes and stunts. Jared Wilson is the weak link; communication on twist stunts is a problem.</li>
        <li>Defense off to another slow start, making another young QB look really good early before locking it down.</li>
        <li>Carlton Davis seems to get beat on a couple big passes every week.</li>
        <li>Drake Maye takes way too many hits. The biggest risk to this team is Maye’s health; he has to be smarter when on the move.</li>
      </ul>
    </>
  );
}
