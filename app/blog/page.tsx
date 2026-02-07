import Link from "next/link";
import Image from "next/image";
import { getAllPosts } from "@/lib/posts";

type BlogPageProps = {
    searchParams: Promise<{ tag?: string; q?: string }>;
};

function getCategory(tags: string[]): { label: string; color: string } {
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

export default async function BlogIndex({ searchParams }: BlogPageProps) {
    const sp = await searchParams;

    const tag = sp.tag?.trim() || "";
    const q = sp.q?.trim().toLowerCase() || "";

    const posts = await getAllPosts();

    const filtered = posts.filter((p) => {
        const matchesTag = tag ? (p.tags || []).includes(tag) : true;
        const haystack = `${p.title} ${p.description} ${(p.tags || []).join(
            " "
        )} ${p.searchContent || ""}`.toLowerCase();
        const matchesQ = q ? haystack.includes(q) : true;
        return matchesTag && matchesQ;
    });

    return (
        <main className="max-w-7xl mx-auto px-6 py-10">
            <div className="flex items-baseline justify-between gap-4 mb-6">
                <h1 className="text-3xl font-bold">Blog</h1>
                <div className="text-sm text-slate-500">
                    {filtered.length} post{filtered.length === 1 ? "" : "s"}
                    {tag ? ` • #${tag}` : ""}
                    {q ? ` • "${q}"` : ""}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((post) => {
                    const category = getCategory(post.tags);
                    return (
                        <Link
                            key={post.slug}
                            href={`/blog/${post.slug}`}
                            className="group"
                        >
                            <article className="rounded-xl border bg-white shadow-sm hover:shadow-lg transition-shadow overflow-hidden h-full flex flex-col">
                                {/* Hero Image with Category Badge */}
                                <div className="relative aspect-[16/9] bg-slate-200">
                                    {post.heroImage ? (
                                        <Image
                                            src={post.heroImage}
                                            alt={post.heroAlt || post.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                                            <span className="text-5xl">🏈</span>
                                        </div>
                                    )}
                                    {/* Category Badge */}
                                    <span
                                        className={`absolute top-3 left-3 ${category.color} text-white text-xs font-semibold px-3 py-1 rounded-full shadow`}
                                    >
                                        {category.label}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <p className="text-sm text-slate-500 mb-2">
                                        {post.date}
                                    </p>
                                    <h2 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                                        {post.title}
                                    </h2>
                                    <p className="text-slate-600 text-sm line-clamp-2 flex-1">
                                        {post.description}
                                    </p>
                                </div>
                            </article>
                        </Link>
                    );
                })}
            </div>

            {filtered.length === 0 && (
                <div className="mt-10 rounded-xl border bg-white p-8 text-slate-600">
                    No posts match your filters. Try clearing the tag or search.
                </div>
            )}
        </main>
    );
}
