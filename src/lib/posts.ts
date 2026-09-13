export const CATEGORY_ORDER = ["Pros & Cons", "Preview", "NFL", "UCLA"] as const;

export type CategoryLabel = (typeof CATEGORY_ORDER)[number];

export type GameResult = "W" | "L" | "T";

export type PostMeta = {
  slug: string;
  title: string;
  date?: string;
  description?: string;
  tags: string[];
  searchContent?: string;
  heroImage?: string;
  heroAlt?: string;
  heroCaption?: string;
  audio?: string;
  season?: number;
  week?: number;
  opponent?: string;
  scoreUs?: number;
  scoreThem?: number;
  result?: GameResult;
  round?: string;
  readingTimeMinutes?: number;
};

export type BlogEntry = {
  id: string;
  body?: string;
  data: {
    title: string;
    date: Date;
    description: string;
    tags: string[];
    heroImage?: string;
    heroAlt?: string;
    heroCaption?: string;
    audio?: string;
    season?: number;
    week?: number;
    opponent?: string;
    scoreUs?: number;
    scoreThem?: number;
    result?: GameResult;
    round?: string;
  };
};

export type Category = {
  label: CategoryLabel;
  color: string;
  slug: string;
};

export type PatriotsResult = {
  pats: number;
  opp: number;
  result: GameResult;
};

export const BLOG_FILTER_EVENT = "pos-blog-filter";

const CATEGORY_COLORS: Record<CategoryLabel, string> = {
  "Pros & Cons": "bg-navy",
  Preview: "bg-red",
  NFL: "bg-navy-muted",
  UCLA: "bg-ucla",
};

const CATEGORY_SLUGS: Record<CategoryLabel, string> = {
  "Pros & Cons": "pros-cons",
  Preview: "preview",
  NFL: "nfl",
  UCLA: "ucla",
};

const CATEGORY_TAG_NAMES = new Set([
  "nfl",
  "ncaaf",
  "pros & cons",
  "pro & cons",
  "preview",
  "ucla",
  "ucla bruins",
  "college football",
  "new england patriots",
]);

const WORDS_PER_MINUTE = 220;

export function formatPostDate(
  date: Date | string | undefined
): string | undefined {
  if (!date) return undefined;
  if (typeof date === "string") return date.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

export function formatDisplayDate(
  date: Date | string | undefined
): string | undefined {
  const iso = formatPostDate(date);
  if (!iso) return undefined;
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function stripMarkdown(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/[*_~]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function estimateReadingTimeMinutes(body: string | undefined): number {
  const text = stripMarkdown(body ?? "");
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

export function toSearchContent(body: string | undefined): string {
  const cleaned = stripMarkdown(body ?? "");
  if (cleaned.length <= 1200) return cleaned;
  return cleaned.slice(0, 1200);
}

export function toPostMeta(entry: BlogEntry): PostMeta {
  return {
    slug: entry.id,
    title: entry.data.title,
    date: formatPostDate(entry.data.date),
    description: entry.data.description,
    tags: entry.data.tags ?? [],
    searchContent: toSearchContent(entry.body),
    heroImage: entry.data.heroImage,
    heroAlt: entry.data.heroAlt,
    heroCaption: entry.data.heroCaption,
    audio: entry.data.audio,
    season: entry.data.season,
    week: entry.data.week,
    opponent: entry.data.opponent,
    scoreUs: entry.data.scoreUs,
    scoreThem: entry.data.scoreThem,
    result: entry.data.result,
    round: entry.data.round,
    readingTimeMinutes: estimateReadingTimeMinutes(entry.body),
  };
}

export function sortPostsByDate<T extends { date?: Date | string }>(
  posts: T[]
): T[] {
  return [...posts].sort((a, b) => {
    const aDate = formatPostDate(a.date) ?? "";
    const bDate = formatPostDate(b.date) ?? "";
    if (aDate && bDate) return aDate < bDate ? 1 : -1;
    return 0;
  });
}

export function getUniqueTags(posts: { tags?: string[] }[]): string[] {
  const set = new Set<string>();
  for (const post of posts) {
    for (const tag of post.tags || []) {
      const cleaned = String(tag).trim();
      if (cleaned) set.add(cleaned);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function getOpponentTags(tags: string[]): string[] {
  return tags.filter((tag) => !CATEGORY_TAG_NAMES.has(tag.toLowerCase()));
}

export function tagToSlug(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function findTagBySlug(tags: string[], slug: string): string | undefined {
  return tags.find((tag) => tagToSlug(tag) === slug);
}

export function getCategory(tags: string[]): Category {
  const tagSet = new Set(tags.map((t) => t.toLowerCase()));
  if (
    tagSet.has("ucla bruins") ||
    tagSet.has("ucla") ||
    tagSet.has("ncaaf") ||
    tagSet.has("college football")
  ) {
    return {
      label: "UCLA",
      color: CATEGORY_COLORS.UCLA,
      slug: CATEGORY_SLUGS.UCLA,
    };
  }
  if (tagSet.has("pros & cons") || tagSet.has("pro & cons")) {
    return {
      label: "Pros & Cons",
      color: CATEGORY_COLORS["Pros & Cons"],
      slug: CATEGORY_SLUGS["Pros & Cons"],
    };
  }
  if (
    tagSet.has("preview") ||
    tags.some((t) => t.toLowerCase().includes("preview"))
  ) {
    return {
      label: "Preview",
      color: CATEGORY_COLORS.Preview,
      slug: CATEGORY_SLUGS.Preview,
    };
  }
  return {
    label: "NFL",
    color: CATEGORY_COLORS.NFL,
    slug: CATEGORY_SLUGS.NFL,
  };
}

export function categoryToSlug(label: CategoryLabel): string {
  return CATEGORY_SLUGS[label];
}

export function slugToCategory(slug: string): CategoryLabel | "" {
  const normalized = slug.trim().toLowerCase();
  for (const label of CATEGORY_ORDER) {
    if (CATEGORY_SLUGS[label] === normalized) return label;
  }
  return normalizeCategoryParam(normalized);
}

export function getUniqueCategories(
  posts: { tags?: string[] }[]
): CategoryLabel[] {
  const present = new Set(posts.map((post) => getCategory(post.tags || []).label));
  return CATEGORY_ORDER.filter((label) => present.has(label));
}

export function normalizeCategoryParam(value: string): CategoryLabel | "" {
  const v = value.trim().toLowerCase();
  if (!v) return "";
  if (v === "pros & cons" || v === "pro & cons" || v === "pros-cons") {
    return "Pros & Cons";
  }
  if (v === "preview" || v.includes("preview")) return "Preview";
  if (v === "nfl") return "NFL";
  if (v === "ucla" || v === "ucla bruins" || v === "ncaaf") return "UCLA";
  return "";
}

export function readFilterParams(search: string): {
  q: string;
  category: CategoryLabel | "";
} {
  const sp = new URLSearchParams(search);
  const q = sp.get("q") || "";
  const categoryParam = sp.get("category");
  if (categoryParam) {
    return { q, category: normalizeCategoryParam(categoryParam) };
  }

  const tagParam = sp.get("tag");
  if (!tagParam) return { q, category: "" };

  const fromTag = normalizeCategoryParam(tagParam);
  // Old ?tag=NFL matched every post. Mapping it onto the NFL category now
  // empties the archive, because recaps classify as Pros & Cons or Preview.
  if (fromTag === "NFL") return { q, category: "" };
  return { q, category: fromTag };
}

export function blogFilterUrl(q: string, category: string): string {
  const sp = new URLSearchParams();
  if (q.trim()) sp.set("q", q.trim());
  if (category) sp.set("category", category);
  const qs = sp.toString();
  return qs ? `/blog?${qs}` : "/blog";
}

export function categoryUrl(category: CategoryLabel | ""): string {
  if (!category) return "/blog";
  return `/category/${categoryToSlug(category)}`;
}

export function matchesSearchQuery(
  haystack: string,
  query: string
): boolean {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) return true;
  const normalized = haystack.toLowerCase();
  return tokens.every((token) => normalized.includes(token));
}

export function filterPosts(
  posts: PostMeta[],
  q: string,
  category: string
): PostMeta[] {
  const active = normalizeCategoryParam(category);

  return posts.filter((p) => {
    const matchesCategory = active
      ? getCategory(p.tags || []).label === active
      : true;
    const haystack = `${p.title} ${p.description} ${(p.tags || []).join(" ")} ${
      p.searchContent || ""
    }`;
    const matchesQ = matchesSearchQuery(haystack, q);
    return matchesCategory && matchesQ;
  });
}

export function parsePatriotsResult(title: string): PatriotsResult | null {
  const match = title.match(
    /(?:Patriots|Bruins)\s+(\d+)\s*[–—-]?\s*[A-Za-z.][A-Za-z.'-]*(?:\s+[A-Za-z.][A-Za-z.'-]*)?\s+(\d+)/i
  );
  if (!match) return null;
  const pats = Number(match[1]);
  const opp = Number(match[2]);
  if (!Number.isFinite(pats) || !Number.isFinite(opp)) return null;
  const result = pats > opp ? "W" : pats < opp ? "L" : "T";
  return { pats, opp, result };
}

export function getPostResult(post: PostMeta): PatriotsResult | null {
  if (
    typeof post.scoreUs === "number" &&
    typeof post.scoreThem === "number" &&
    post.result
  ) {
    return {
      pats: post.scoreUs,
      opp: post.scoreThem,
      result: post.result,
    };
  }
  return parsePatriotsResult(post.title);
}

export function formatScoreline(result: PatriotsResult): string {
  return `${result.result} ${result.pats}–${result.opp}`;
}

export function getAdjacentPosts<T extends { slug: string }>(
  posts: T[],
  slug: string
): { newer?: T; older?: T } {
  const index = posts.findIndex((post) => post.slug === slug);
  if (index < 0) return {};
  return {
    newer: index > 0 ? posts[index - 1] : undefined,
    older: index < posts.length - 1 ? posts[index + 1] : undefined,
  };
}

function sharedOpponentCount(a: PostMeta, b: PostMeta): number {
  const aTags = new Set(
    [
      ...(a.opponent ? [a.opponent.toLowerCase()] : []),
      ...getOpponentTags(a.tags).map((t) => t.toLowerCase()),
    ]
  );
  const bTags = [
    ...(b.opponent ? [b.opponent.toLowerCase()] : []),
    ...getOpponentTags(b.tags).map((t) => t.toLowerCase()),
  ];
  return bTags.filter((tag) => aTags.has(tag)).length;
}

export function getRelatedPosts(
  posts: PostMeta[],
  current: PostMeta,
  limit = 3
): PostMeta[] {
  const category = getCategory(current.tags).label;
  const scored = posts
    .filter((post) => post.slug !== current.slug)
    .map((post) => {
      const sameCategory = getCategory(post.tags).label === category ? 1 : 0;
      const opponents = sharedOpponentCount(current, post);
      const sameSeason =
        current.season && post.season && current.season === post.season ? 1 : 0;
      const base = opponents * 10 + sameCategory * 3;
      return {
        post,
        score: base > 0 ? base + sameSeason : 0,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.post.date ?? "") < (a.post.date ?? "") ? -1 : 1;
    })
    .map((item) => item.post);

  if (scored.length > 0) return scored.slice(0, limit);

  // Fallback for singleton categories (Preview, NFL): nearby recent posts.
  return posts.filter((post) => post.slug !== current.slug).slice(0, limit);
}

/** Weekly/playoff recaps from the 2025 Super Bowl run (homepage shelf). */
export function is2025RunPost(post: PostMeta): boolean {
  if (post.season !== 2025) return false;
  const label = getCategory(post.tags).label;
  return label === "Pros & Cons" || label === "Preview";
}
