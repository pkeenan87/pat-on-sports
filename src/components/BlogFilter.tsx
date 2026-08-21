import { useEffect } from "react";
import { filterPosts, type PostMeta } from "../lib/posts";

type Props = {
  posts: PostMeta[];
};

export default function BlogFilter({ posts }: Props) {
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const q = sp.get("q") || "";
    const tag = sp.get("tag") || "";
    const filtered = filterPosts(posts, q, tag);
    const visible = new Set(filtered.map((p) => p.slug));

    document.querySelectorAll<HTMLElement>("[data-post-slug]").forEach((el) => {
      const slug = el.dataset.postSlug;
      el.hidden = slug ? !visible.has(slug) : false;
    });

    const countEl = document.getElementById("blog-count");
    if (countEl) {
      const n = filtered.length;
      const tagLabel = tag ? ` • #${tag}` : "";
      const qLabel = q ? ` • "${q}"` : "";
      countEl.textContent = `${n} post${n === 1 ? "" : "s"}${tagLabel}${qLabel}`;
    }

    const empty = document.getElementById("blog-empty");
    if (empty) {
      empty.hidden = filtered.length !== 0;
    }
  }, [posts]);

  return null;
}
