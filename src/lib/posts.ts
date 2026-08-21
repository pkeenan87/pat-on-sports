export const CATEGORY_ORDER = ["Pros & Cons", "Preview", "NFL"] as const;

export type CategoryLabel = (typeof CATEGORY_ORDER)[number];

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
  };
};

export type Category = {
  label: CategoryLabel;
  color: string;
};

export type PatriotsResult = {
  pats: number;
  opp: number;
  result: "W" | "L" | "T";
};

export const BLOG_FILTER_EVENT = "pos-blog-filter";

const CATEGORY_COLORS: Record<CategoryLabel, string> = {
  "Pros & Cons": "bg-navy",
  Preview: "bg-red",
  NFL: "bg-navy-muted",
};

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

export function toPostMeta(entry: BlogEntry): PostMeta {
  return {
    slug: entry.id,
    title: entry.data.title,
    date: formatPostDate(entry.data.date),
    description: entry.data.description,
    tags: entry.data.tags ?? [],
    searchContent: entry.body ?? "",
    heroImage: entry.data.heroImage,
    heroAlt: entry.data.heroAlt,
    heroCaption: entry.data.heroCaption,
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

export function getCategory(tags: string[]): Category {
  const tagSet = new Set(tags.map((t) => t.toLowerCase()));
  if (tagSet.has("pros & cons") || tagSet.has("pro & cons")) {
    return { label: "Pros & Cons", color: CATEGORY_COLORS["Pros & Cons"] };
  }
  if (
    tagSet.has("preview") ||
    tags.some((t) => t.toLowerCase().includes("preview"))
  ) {
    return { label: "Preview", color: CATEGORY_COLORS.Preview };
  }
  return { label: "NFL", color: CATEGORY_COLORS.NFL };
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

export function filterPosts(
  posts: PostMeta[],
  q: string,
  category: string
): PostMeta[] {
  const query = q.trim().toLowerCase();
  const active = normalizeCategoryParam(category);

  return posts.filter((p) => {
    const matchesCategory = active
      ? getCategory(p.tags || []).label === active
      : true;
    const haystack = `${p.title} ${p.description} ${(p.tags || []).join(" ")} ${
      p.searchContent || ""
    }`.toLowerCase();
    const matchesQ = query ? haystack.includes(query) : true;
    return matchesCategory && matchesQ;
  });
}

export function parsePatriotsResult(title: string): PatriotsResult | null {
  const match = title.match(
    /Patriots\s+(\d+)\s*[–—-]?\s*[A-Za-z.][A-Za-z.'-]*(?:\s+[A-Za-z.][A-Za-z.'-]*)?\s+(\d+)/i
  );
  if (!match) return null;
  const pats = Number(match[1]);
  const opp = Number(match[2]);
  if (!Number.isFinite(pats) || !Number.isFinite(opp)) return null;
  const result = pats > opp ? "W" : pats < opp ? "L" : "T";
  return { pats, opp, result };
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

export function getRelatedPosts(
  posts: PostMeta[],
  current: PostMeta,
  limit = 3
): PostMeta[] {
  const category = getCategory(current.tags).label;
  return posts
    .filter(
      (post) =>
        post.slug !== current.slug &&
        getCategory(post.tags).label === category
    )
    .slice(0, limit);
}
