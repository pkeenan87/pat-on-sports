"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type HeaderProps = {
    tags: string[];
};

export default function Header({ tags }: HeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const activeTag = searchParams.get("tag") || "";
    const activeQ = searchParams.get("q") || "";

    const [q, setQ] = useState(activeQ);
    useEffect(() => setQ(activeQ), [activeQ]);

    const showTagBar = useMemo(
        () => pathname === "/" || pathname === "/blog",
        [pathname]
    );

    function updateQuery(next: { q?: string; tag?: string }) {
        const sp = new URLSearchParams(searchParams.toString());

        if (typeof next.q !== "undefined") {
            if (next.q.trim()) sp.set("q", next.q.trim());
            else sp.delete("q");
        }

        if (typeof next.tag !== "undefined") {
            if (next.tag) sp.set("tag", next.tag);
            else sp.delete("tag");
        }

        router.push(`/blog?${sp.toString()}`);
    }

    function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        updateQuery({ q });
    }

    return (
        <div className="sticky top-0 z-50">
            {/* Banner */}
            <header className="bg-slate-900 text-white shadow">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-3 shrink-0">
                        <span className="text-2xl">🏈</span>
                        <span className="text-xl font-bold tracking-tight">
                            Pat on Sports
                        </span>
                    </Link>

                    {/* Search */}
                    <form onSubmit={onSubmit} className="flex-1">
                        <div className="relative max-w-xl ml-auto">
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Search posts (e.g., NFL, Patriots, Matchups)…"
                                className="w-full rounded-full bg-slate-800 border border-slate-700 px-4 py-2 text-sm
                           placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
                            />
                            <button
                                type="submit"
                                className="absolute right-1 top-1 rounded-full bg-white/10 px-4 py-1.5 text-sm
                           hover:bg-white/20 transition"
                            >
                                Search
                            </button>
                        </div>
                    </form>
                </div>
            </header>

            {/* Sticky Tag Filter Bar */}
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
