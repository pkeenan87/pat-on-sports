import { PostMeta } from "@/lib/posts";

export const meta: PostMeta = {
  slug: "week-02-pros-cons-pats-vs-dolphins",
  title: "Week 2 Pros & Cons: Patriots 33 Dolphins 27",
  date: "2025-09-14",
  description: "Pros & cons recap for Week 2. Miami Dolphins",
  tags: ["NFL", "Pros & Cons", "New England Patriots", "Miami Dolphins"],
  heroImage: "/images/2025/prosandcons/week-02/pats-vs-dolphins-hero.jpg",
  heroAlt: "Patriots vs Dolphins Week 2 action",
};

export default function Post() {
  return (
    <>
      <h2>Pros</h2>

      <ul>
        <li>The Patriots were able to run the ball and Stevenson looked great.</li>
        <li>The passing game was very efficient and pass protection looked good.</li>
        <li>Drake Maye’s athleticism is a weapon. On his TD, Judon had a clear path at full speed and Maye simply reversed field for the score—most QBs take a sack there.</li>
        <li>Through two weeks, the Patriots pass rush is up there with the best in the NFL. Landry and Williams are studs.</li>
      </ul>

      <h2>Cons</h2>

      <ul>
        <li>Pass coverage is very bad. I don’t know why we don’t play Dugger more, and we need Gonzalez back ASAP. Austin got torched.</li>
        <li>Linebackers have been rough and there may not be a clean solution. Spillane and Ellis have struggled. Mapu had a good INT but missed a tackle that nearly cost the game.</li>
        <li>Too many penalties, especially pre-snap penalties.</li>
      </ul>
    </>
  );
}
