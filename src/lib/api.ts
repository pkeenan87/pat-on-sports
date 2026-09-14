import { createHash } from "node:crypto";
import { z } from "astro/zod";
import {
  getCategory,
  getRelatedPosts,
  type BlogEntry,
  type CategoryLabel,
  type PostMeta,
  toPostMeta,
} from "./posts";
import {
  parseProsConsMarkdown,
  type ProsConsSections,
} from "./prosCons";

/** Bump when the JSON shape changes in a breaking way. */
export const API_SCHEMA_VERSION = 1;

export type CategoryColorToken = "navy" | "red" | "navy-muted" | "ucla";

const CATEGORY_COLOR_TOKENS: Record<CategoryLabel, CategoryColorToken> = {
  "Pros & Cons": "navy",
  Preview: "red",
  NFL: "navy-muted",
  UCLA: "ucla",
};

export const apiCategorySchema = z.object({
  label: z.enum(["Pros & Cons", "Preview", "NFL", "UCLA"]),
  slug: z.string(),
  color: z.enum(["navy", "red", "navy-muted", "ucla"]),
});

export const apiPostSummarySchema = z.object({
  slug: z.string(),
  title: z.string(),
  date: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  category: apiCategorySchema,
  heroImage: z.url().nullable(),
  heroAlt: z.string().nullable(),
  season: z.number().int().nullable(),
  week: z.number().int().nullable(),
  round: z.string().nullable(),
  opponent: z.string().nullable(),
  scoreUs: z.number().int().nullable(),
  scoreThem: z.number().int().nullable(),
  result: z.enum(["W", "L", "T"]).nullable(),
  readingTimeMinutes: z.number().int().positive(),
  audio: z.url().nullable(),
  audioDurationSeconds: z.number().int().positive().nullable(),
  bodyHash: z.string(),
});

export const apiPostDetailSchema = apiPostSummarySchema.extend({
  markdown: z.string(),
  prosCons: z
    .object({
      intro: z.array(
        z.union([
          z.object({ type: z.literal("heading"), text: z.string() }),
          z.object({ type: z.literal("paragraph"), text: z.string() }),
          z.object({
            type: z.literal("list"),
            items: z.array(z.string()),
          }),
        ])
      ),
      pros: z.array(z.string()),
      cons: z.array(z.string()),
      hasPanels: z.boolean(),
    })
    .nullable(),
  heroCaption: z.string().nullable(),
  related: z.array(z.string()).max(3),
});

export const apiPostsFeedSchema = z.object({
  schemaVersion: z.number().int().positive(),
  generatedAt: z.string(),
  site: z.url(),
  posts: z.array(apiPostSummarySchema),
});

export const apiManifestSchema = z.object({
  schemaVersion: z.number().int().positive(),
  minSupportedSchemaVersion: z.number().int().positive(),
  commentsApiBase: z.url().nullable(),
  message: z.string().nullable(),
  site: z.url(),
});

export type ApiCategory = z.infer<typeof apiCategorySchema>;
export type ApiPostSummary = z.infer<typeof apiPostSummarySchema>;
export type ApiPostDetail = z.infer<typeof apiPostDetailSchema>;
export type ApiPostsFeed = z.infer<typeof apiPostsFeedSchema>;
export type ApiManifest = z.infer<typeof apiManifestSchema>;

export function siteOrigin(site?: string): string {
  return (site ?? "https://patonsports.com").replace(/\/$/, "");
}

export function absoluteUrl(
  site: string,
  path: string | undefined | null
): string | null {
  if (!path?.trim()) return null;
  const trimmed = path.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const origin = siteOrigin(site);
  return `${origin}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}

export function hashBody(markdown: string): string {
  return createHash("sha256").update(markdown, "utf8").digest("hex");
}

export function categoryColorToken(label: CategoryLabel): CategoryColorToken {
  return CATEGORY_COLOR_TOKENS[label];
}

export function toApiCategory(tags: string[]): ApiCategory {
  const category = getCategory(tags);
  return {
    label: category.label,
    slug: category.slug,
    color: categoryColorToken(category.label),
  };
}

export type ApiPostSource = PostMeta & {
  body?: string;
  audioDurationSeconds?: number;
};

export function toApiPostSummary(
  post: ApiPostSource,
  site: string
): ApiPostSummary {
  const body = post.body ?? "";
  // Parse before return so a malformed post fails the static build.
  return apiPostSummarySchema.parse({
    slug: post.slug,
    title: post.title,
    date: post.date ?? "",
    description: post.description ?? "",
    tags: post.tags ?? [],
    category: toApiCategory(post.tags ?? []),
    heroImage: absoluteUrl(site, post.heroImage),
    heroAlt: post.heroAlt?.trim() || null,
    season: post.season ?? null,
    week: post.week ?? null,
    round: post.round ?? null,
    opponent: post.opponent ?? null,
    scoreUs: post.scoreUs ?? null,
    scoreThem: post.scoreThem ?? null,
    result: post.result ?? null,
    readingTimeMinutes: post.readingTimeMinutes ?? 1,
    audio: absoluteUrl(site, post.audio),
    audioDurationSeconds: post.audioDurationSeconds ?? null,
    bodyHash: hashBody(body),
  });
}

export function toApiPostDetail(
  post: ApiPostSource,
  allPosts: PostMeta[],
  site: string
): ApiPostDetail {
  const summary = toApiPostSummary(post, site);
  const markdown = post.body ?? "";
  const category = getCategory(post.tags ?? []);
  let prosCons: ProsConsSections | null = null;
  if (category.label === "Pros & Cons" && markdown) {
    const parsed = parseProsConsMarkdown(markdown);
    prosCons = parsed.hasPanels ? parsed : null;
  }

  return apiPostDetailSchema.parse({
    ...summary,
    markdown,
    prosCons,
    heroCaption: post.heroCaption?.trim() || null,
    related: getRelatedPosts(allPosts, post, 3).map((p) => p.slug),
  });
}

export function buildPostsFeed(
  posts: ApiPostSource[],
  site: string,
  generatedAt = new Date().toISOString()
): ApiPostsFeed {
  return apiPostsFeedSchema.parse({
    schemaVersion: API_SCHEMA_VERSION,
    generatedAt,
    site: siteOrigin(site),
    posts: posts.map((post) => toApiPostSummary(post, site)),
  });
}

export function buildManifest(options: {
  site: string;
  commentsApiBase?: string | null;
  message?: string | null;
  minSupportedSchemaVersion?: number;
}): ApiManifest {
  return apiManifestSchema.parse({
    schemaVersion: API_SCHEMA_VERSION,
    minSupportedSchemaVersion:
      options.minSupportedSchemaVersion ?? API_SCHEMA_VERSION,
    commentsApiBase: options.commentsApiBase?.trim() || null,
    message: options.message?.trim() || null,
    site: siteOrigin(options.site),
  });
}

/** Map a content-collection entry into the shape the API builders expect. */
export function entryToApiSource(entry: BlogEntry): ApiPostSource {
  return {
    ...toPostMeta(entry),
    body: entry.body ?? "",
  };
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
