// lib/posts.ts
import type { ComponentType } from "react";
import postModules from "@/posts";

export type PostMeta = {
  slug: string;
  title: string;
  date?: string;
  description?: string;
  tags: string[];
  heroImage?: string;
  heroAlt?: string;
  heroCaption?: string;
};

export type Post = PostMeta & {
  Content: ComponentType;
};

let cachedMetas: PostMeta[] | null = null;

export async function getAllPosts(): Promise<PostMeta[]> {
  if (cachedMetas) return cachedMetas;

  const entries = Object.entries(postModules);
  const metas: PostMeta[] = [];

  for (const [, loader] of entries) {
    const mod = await loader();
    metas.push(mod.meta);
  }

  metas.sort((a, b) => {
    if (a.date && b.date) return a.date < b.date ? 1 : -1;
    return 0;
  });

  cachedMetas = metas;
  return metas;
}

export async function getPostBySlug(slug: string): Promise<Post> {
  if (!slug) throw new Error("getPostBySlug: slug is missing");

  const loader = postModules[slug];
  if (!loader) throw new Error(`Post not found: ${slug}`);

  const mod = await loader();
  return {
    ...mod.meta,
    Content: mod.default,
  };
}

export async function getAllTags(): Promise<string[]> {
  const posts = await getAllPosts();
  const set = new Set<string>();
  for (const post of posts) {
    for (const tag of post.tags || []) {
      const cleaned = String(tag).trim();
      if (cleaned) set.add(cleaned);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
