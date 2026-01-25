// lib/posts.ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import html from "remark-html";

const postsDirectory = path.join(process.cwd(), "posts");

export type PostMeta = {
  slug: string;
  title: string;
  date?: string;
  description?: string;
  tags: string[];
  content: string; // raw markdown content for search

  // ✅ for sharing + hero display
  heroImage?: string;
  heroAlt?: string;
  heroCaption?: string;
};

export type Post = PostMeta & {
  contentHtml: string;
};

function normalizeMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // "-text" -> "- text"
    const listNoSpace = /^(\s*[-*+])([^\s].*)$/.exec(line);
    if (listNoSpace) {
      out.push(`${listNoSpace[1]} ${listNoSpace[2]}`);
      continue;
    }

    // Blank line after heading if next line is a list item
    const isHeading = /^(#{1,6})\s+.+$/.test(line.trim());
    if (isHeading) {
      out.push(line);
      const next = lines[i + 1] ?? "";
      const nextTrim = next.trim();
      if (nextTrim.startsWith("- ") || nextTrim.startsWith("* ") || nextTrim.startsWith("+ ")) {
        out.push("");
      }
      continue;
    }

    out.push(line);
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(postsDirectory)) return [];

  return fs
    .readdirSync(postsDirectory)
    .filter((fileName) => fileName.toLowerCase().endsWith(".md"))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/i, "");
      const fullPath = path.join(postsDirectory, fileName);
      const raw = fs.readFileSync(fullPath, "utf8");
      const { data, content } = matter(raw);

      const tags = Array.isArray(data.tags)
        ? data.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
        : [];

      return {
        slug,
        title: data.title ?? "Untitled",
        date: data.date ?? "",
        description: data.description ?? "",
        tags,
        content,
        heroImage: data.heroImage ?? "",
        heroAlt: data.heroAlt ?? "",
        heroCaption: data.heroCaption ?? "",
      };
    })
    .sort((a, b) => (a.date && b.date ? (a.date < b.date ? 1 : -1) : 0));
}

export async function getPostBySlug(slug: string): Promise<Post> {
  if (!slug) throw new Error("getPostBySlug: slug is missing");

  const fullPath = path.join(postsDirectory, `${slug}.md`);
  if (!fs.existsSync(fullPath)) throw new Error(`Post not found: ${slug}`);

  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);

  const tags = Array.isArray(data.tags)
    ? data.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
    : [];

  const normalized = normalizeMarkdown(content);

  const processed = await remark()
    .use(remarkGfm)
    .use(remarkBreaks) // ✅ honors single newlines
    .use(html, { sanitize: false })
    .process(normalized);

  return {
    slug,
    title: data.title ?? "Untitled",
    date: data.date ?? "",
    description: data.description ?? "",
    tags,
    heroImage: data.heroImage ?? "",
    heroAlt: data.heroAlt ?? "",
    heroCaption: data.heroCaption ?? "",
    contentHtml: processed.toString(),
  };
}

export function getAllTags(): string[] {
  const set = new Set<string>();
  for (const post of getAllPosts()) {
    for (const tag of post.tags || []) {
      const cleaned = String(tag).trim();
      if (cleaned) set.add(cleaned);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}