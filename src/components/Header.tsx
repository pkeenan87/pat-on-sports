import { useEffect, useState } from "react";
import {
  BLOG_FILTER_EVENT,
  blogFilterUrl,
  readFilterParams,
} from "../lib/posts";

type HeaderProps = {
  categories: string[];
  pathname: string;
};

export default function Header({ categories, pathname }: HeaderProps) {
  const [q, setQ] = useState("");
  const [activeCategory, setActiveCategory] = useState("");

  useEffect(() => {
    const next = readFilterParams(window.location.search);
    setQ(next.q);
    setActiveCategory(next.category);
  }, []);

  const isArchive = pathname === "/blog";
  const showCategoryBar = pathname === "/" || isArchive;

  function commit(nextQ: string, nextCategory: string) {
    const url = blogFilterUrl(nextQ, nextCategory);
    if (isArchive) {
      setQ(nextQ);
      setActiveCategory(nextCategory);
      window.history.replaceState({}, "", url);
      window.dispatchEvent(new Event(BLOG_FILTER_EVENT));
      return;
    }
    window.location.assign(url);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    commit(q, isArchive ? activeCategory : "");
  }

  return (
    <div className="sticky top-0 z-50">
      <header className="bg-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <a href="/" className="shrink-0">
            <span className="font-display text-xl sm:text-2xl font-bold tracking-[0.14em] uppercase">
              Pat on Sports
            </span>
          </a>

          <nav
            aria-label="Primary"
            className="order-3 sm:order-none flex items-center gap-4 w-full sm:w-auto font-display text-xs tracking-[0.18em] uppercase text-white/80"
          >
            <a
              href="/"
              className={`hover:text-white ${pathname === "/" ? "text-white" : ""}`}
              aria-current={pathname === "/" ? "page" : undefined}
            >
              Home
            </a>
            <a
              href="/blog"
              className={`hover:text-white ${isArchive ? "text-white" : ""}`}
              aria-current={isArchive ? "page" : undefined}
            >
              Archive
            </a>
            <a
              href="/about"
              className={`hover:text-white ${pathname === "/about" ? "text-white" : ""}`}
              aria-current={pathname === "/about" ? "page" : undefined}
            >
              About
            </a>
          </nav>

          <form onSubmit={onSubmit} className="flex-1 min-w-0">
            <div className="max-w-md ml-auto">
              <label htmlFor="site-search" className="sr-only">
                Search posts
              </label>
              <div className="flex items-center gap-2 rounded-full bg-navy-deep border border-white/15 p-1">
                <input
                  id="site-search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search posts…"
                  className="w-full bg-transparent px-3 py-1.5 text-sm text-white placeholder:text-white/45 focus:outline-none"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/20 transition"
                >
                  <span className="hidden sm:inline">Search</span>
                  <span className="sm:hidden">Go</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </header>

      {showCategoryBar && (
        <div className="bg-navy-deep border-b border-white/10">
          <div
            className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-2"
            role="group"
            aria-label="Filter by category"
          >
            <button
              type="button"
              onClick={() => commit(isArchive ? q : "", "")}
              aria-pressed={!activeCategory}
              className={`rounded-full px-3 py-1 text-xs font-semibold tracking-wide transition ${
                !activeCategory
                  ? "bg-white text-navy"
                  : "text-white/75 hover:text-white hover:bg-white/10"
              }`}
            >
              All
            </button>
            {categories.map((category) => {
              const selected = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() =>
                    commit(isArchive ? q : "", selected ? "" : category)
                  }
                  aria-pressed={selected}
                  className={`rounded-full px-3 py-1 text-xs font-semibold tracking-wide transition ${
                    selected
                      ? category === "Preview"
                        ? "bg-red text-white"
                        : "bg-white text-navy"
                      : "text-white/75 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
