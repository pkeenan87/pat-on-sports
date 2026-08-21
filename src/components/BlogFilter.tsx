import { useEffect } from "react";
import {
  BLOG_FILTER_EVENT,
  filterPosts,
  readFilterParams,
  type PostMeta,
} from "../lib/posts";

type Props = {
  posts: PostMeta[];
};

export default function BlogFilter({ posts }: Props) {
  useEffect(() => {
    function apply() {
      const { q, category } = readFilterParams(window.location.search);
      const filtered = filterPosts(posts, q, category);
      const visible = new Set(filtered.map((p) => p.slug));

      document.querySelectorAll<HTMLElement>("[data-post-slug]").forEach((el) => {
        const slug = el.dataset.postSlug;
        el.hidden = slug ? !visible.has(slug) : false;
      });

      const countEl = document.getElementById("blog-count");
      if (countEl) {
        const n = filtered.length;
        const categoryLabel = category ? ` · ${category}` : "";
        const qLabel = q ? ` · “${q}”` : "";
        countEl.textContent = `${n} post${n === 1 ? "" : "s"}${categoryLabel}${qLabel}`;
      }

      const empty = document.getElementById("blog-empty");
      if (empty) {
        empty.hidden = filtered.length !== 0;
      }
    }

    apply();
    window.addEventListener(BLOG_FILTER_EVENT, apply);
    window.addEventListener("popstate", apply);
    return () => {
      window.removeEventListener(BLOG_FILTER_EVENT, apply);
      window.removeEventListener("popstate", apply);
    };
  }, [posts]);

  return null;
}
