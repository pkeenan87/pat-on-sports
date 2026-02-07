import { PostMeta } from "@/lib/posts";
import { ComponentType } from "react";

export type PostModule = {
  meta: PostMeta;
  default: ComponentType;
};

const postModules: Record<string, () => Promise<PostModule>> = {
  "divisional-round-preview": () => import("./divisional-round-preview"),
  "week-01-pros-cons-pats-vs-raiders": () => import("./week-01-pros-cons-pats-vs-raiders"),
  "week-02-pros-cons-pats-vs-dolphins": () => import("./week-02-pros-cons-pats-vs-dolphins"),
  "week-03-pros-cons-pats-vs-steelers": () => import("./week-03-pros-cons-pats-vs-steelers"),
  "week-04-pros-cons-pats-vs-panthers": () => import("./week-04-pros-cons-pats-vs-panthers"),
  "week-05-pros-cons-pats-vs-bills": () => import("./week-05-pros-cons-pats-vs-bills"),
  "week-06-pros-cons-pats-vs-saints": () => import("./week-06-pros-cons-pats-vs-saints"),
  "week-07-pros-cons-pats-vs-titans": () => import("./week-07-pros-cons-pats-vs-titans"),
  "week-08-pros-cons-pats-vs-browns": () => import("./week-08-pros-cons-pats-vs-browns"),
  "week-09-pros-cons-pats-vs-falcons": () => import("./week-09-pros-cons-pats-vs-falcons"),
  "week-10-pros-cons-pats-vs-buccaneers": () => import("./week-10-pros-cons-pats-vs-buccaneers"),
  "week-11-pros-cons-pats-vs-jets": () => import("./week-11-pros-cons-pats-vs-jets"),
  "week-12-pros-cons-pats-vs-bengals": () => import("./week-12-pros-cons-pats-vs-bengals"),
  "week-13-pros-cons-pats-vs-giants": () => import("./week-13-pros-cons-pats-vs-giants"),
  "week-15-pros-cons-pats-vs-bills": () => import("./week-15-pros-cons-pats-vs-bills"),
  "week-16-pros-cons-pats-vs-ravens": () => import("./week-16-pros-cons-pats-vs-ravens"),
  "week-17-pros-cons-pats-vs-jets": () => import("./week-17-pros-cons-pats-vs-jets"),
  "week-18-pros-cons-pats-vs-dolphins": () => import("./week-18-pros-cons-pats-vs-dolphins"),
  "week-19-pros-cons-pats-vs-chargers": () => import("./week-19-pros-cons-pats-vs-chargers"),
  "week-20-pros-cons-pats-vs-texans": () => import("./week-20-pros-cons-pats-vs-texans"),
  "week-21-pros-cons-pats-vs-broncos": () => import("./week-21-pros-cons-pats-vs-broncos"),
};

export default postModules;
