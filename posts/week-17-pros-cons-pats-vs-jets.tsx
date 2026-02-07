import { PostMeta } from "@/lib/posts";

export const meta: PostMeta = {
  slug: "week-17-pros-cons-pats-vs-jets",
  title: "Week 17 Pros & Cons: Patriots 42–Jets 10",
  date: "2025-12-28",
  description: "Weekly Patriots Pros & Cons recap (Week 17).",
  tags: ["NFL", "Pro & Cons", "New England Patriots", "New York Jets"],
  searchContent: "Pros This is the most dominant I have seen the Patriots offense in a very, very long time. It reminds me of the prime Brady and Welker era beatdown of the Titans in the snow. The Jets had no desire to play football and the Patriots rewarded their lack of motivation with a buttkicking of a lifetime. Drake Maye was 19 for 21 for 256 yards and 5 touchdowns in a little less than 3 quarters. That is absurd. When Drake Maye is on, he is really on. Maye benefitted from a Jets pass rush that did not care to rush the passer and a Patriots offensive line who was happy to block the lazy Jets defenders. Even Vederian Lowe only missed a couple blocks! Stevenson and Henderson were both running and catching the ball well. This is especially important for Stevenson — if he is on, it changes things for this offense. Diggs was back to his normal dominant self. Let's hope this continues and the recent news in the media is not true. It would really stink to lose him for the playoffs. Patriots defense was completely dominant against a Jets offense that has not played together much with the recent personnel shake-up. Cons After this week, we have to go back to playing legitimate NFL teams again.",
  heroImage: "/images/2025/prosandcons/week-17/pats-vs-jets-hero.png",
  heroAlt: "Patriots Defense against the Jets",
  heroCaption: "The Patriots dominate the Jets in Week 17.",
};

export default function Post() {
  return (
    <>
      <h2>Pros</h2>

      <ul>
        <li>This is the most dominant I have seen the Patriots offense in a very, very long time. It reminds me of the prime Brady and Welker era beatdown of the Titans in the snow. The Jets had no desire to play football and the Patriots rewarded their lack of motivation with a buttkicking of a lifetime.</li>
        <li>Drake Maye was 19 for 21 for 256 yards and 5 touchdowns in a little less than 3 quarters. That is absurd. When Drake Maye is on, he is really on.</li>
        <li>Maye benefitted from a Jets pass rush that did not care to rush the passer and a Patriots offensive line who was happy to block the lazy Jets defenders. Even Vederian Lowe only missed a couple blocks!</li>
        <li>Stevenson and Henderson were both running and catching the ball well. This is especially important for Stevenson — if he is on, it changes things for this offense.</li>
        <li>Diggs was back to his normal dominant self. Let's hope this continues and the recent news in the media is not true. It would really stink to lose him for the playoffs.</li>
        <li>Patriots defense was completely dominant against a Jets offense that has not played together much with the recent personnel shake-up.</li>
      </ul>

      <h2>Cons</h2>

      <ul>
        <li>After this week, we have to go back to playing legitimate NFL teams again.</li>
      </ul>
    </>
  );
}
