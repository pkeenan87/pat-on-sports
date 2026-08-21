import { useEffect, useMemo, useState } from "react";

type HeaderProps = {
  tags: string[];
  pathname: string;
};

function readSearchParams(): { q: string; tag: string } {
  if (typeof window === "undefined") {
    return { q: "", tag: "" };
  }
  const sp = new URLSearchParams(window.location.search);
  return {
    q: sp.get("q") || "",
    tag: sp.get("tag") || "",
  };
}

export default function Header({ tags, pathname }: HeaderProps) {
  // Start empty so SSR/prerender HTML matches the first client render, then
  // apply ?q= / ?tag= after hydration.
  const [q, setQ] = useState("");
  const [activeTag, setActiveTag] = useState("");

  useEffect(() => {
    const next = readSearchParams();
    setQ(next.q);
    setActiveTag(next.tag);
  }, []);

  const showTagBar = useMemo(
    () => pathname === "/" || pathname === "/blog",
    [pathname]
  );

  function updateQuery(next: { q?: string; tag?: string }) {
    const sp = new URLSearchParams(
      typeof window === "undefined" ? "" : window.location.search
    );

    if (typeof next.q !== "undefined") {
      if (next.q.trim()) sp.set("q", next.q.trim());
      else sp.delete("q");
    }

    if (typeof next.tag !== "undefined") {
      if (next.tag) sp.set("tag", next.tag);
      else sp.delete("tag");
    }

    const qs = sp.toString();
    window.location.assign(qs ? `/blog?${qs}` : "/blog");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateQuery({ q });
  }

  return (
    <div className="sticky top-0 z-50">
      <header className="bg-slate-900 text-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <a href="/" className="flex items-center gap-3 shrink-0">
            <span className="text-2xl">🏈</span>
            <span className="text-xl font-bold tracking-tight">
              Pat on Sports
            </span>
          </a>

          <form onSubmit={onSubmit} className="flex-1">
            <div className="max-w-xl ml-auto">
              <div className="flex items-center gap-2 rounded-full bg-slate-800 border border-slate-700 p-1">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search posts…"
                  className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder:text-slate-400
                   focus:outline-none"
                />

                <button
                  type="submit"
                  className="shrink-0 rounded-full bg-white/10 px-3 py-2 text-sm font-medium
                   hover:bg-white/20 transition"
                >
                  <span className="hidden sm:inline">Search</span>
                  <span className="sm:hidden">Go</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </header>

      {showTagBar && (
        <div className="bg-white/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto px-6 py-2 flex items-center gap-3 overflow-x-auto">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide shrink-0">
              Filter:
            </span>

            <button
              onClick={() => updateQuery({ tag: "" })}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition
                ${
                  !activeTag
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
            >
              All
            </button>

            {tags.map((tag) => {
              const selected = activeTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => updateQuery({ tag })}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition
                    ${
                      selected
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
