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

export function formatPostDate(date: Date | string | undefined): string | undefined {
  if (!date) return undefined;
  if (typeof date === "string") return date.slice(0, 10);
  return date.toISOString().slice(0, 10);
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

export function sortPostsByDate<T extends { date?: Date | string }>(posts: T[]): T[] {
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

export function getCategory(tags: string[]): { label: string; color: string } {
  const tagSet = new Set(tags.map((t) => t.toLowerCase()));
  if (tagSet.has("pros & cons") || tagSet.has("pro & cons")) {
    return { label: "Pros & Cons", color: "bg-blue-600" };
  }
  if (
    tagSet.has("preview") ||
    tags.some((t) => t.toLowerCase().includes("preview"))
  ) {
    return { label: "Preview", color: "bg-emerald-600" };
  }
  return { label: "NFL", color: "bg-slate-700" };
}

export function filterPosts(
  posts: PostMeta[],
  q: string,
  tag: string
): PostMeta[] {
  const query = q.trim().toLowerCase();
  const activeTag = tag.trim();

  return posts.filter((p) => {
    const matchesTag = activeTag ? (p.tags || []).includes(activeTag) : true;
    const haystack = `${p.title} ${p.description} ${(p.tags || []).join(" ")} ${
      p.searchContent || ""
    }`.toLowerCase();
    const matchesQ = query ? haystack.includes(query) : true;
    return matchesTag && matchesQ;
  });
}
