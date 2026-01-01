import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

type BlogPageProps = {
    searchParams: Promise<{ tag?: string; q?: string }>;
};

export default async function BlogIndex({ searchParams }: BlogPageProps) {
    const sp = await searchParams;

    const tag = sp.tag?.trim() || "";
    const q = sp.q?.trim().toLowerCase() || "";

    const posts = getAllPosts();

    const filtered = posts.filter((p) => {
        const matchesTag = tag ? (p.tags || []).includes(tag) : true;
        const haystack = `${p.title} ${p.description} ${(p.tags || []).join(
            " "
        )}`.toLowerCase();
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
                    {q ? ` • “${q}”` : ""}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((post) => (
                    <article
                        key={post.slug}
                        className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition"
                    >
                        <Link href={`/blog/${post.slug}`}>
                            <h2 className="text-xl font-semibold mb-2">
                                {post.title}
                            </h2>
                        </Link>

                        <p className="text-sm text-slate-500 mb-3">
                            {post.date}
                        </p>
                        <p className="text-slate-700 mb-4">
                            {post.description}
                        </p>

                        <div className="flex flex-wrap gap-2">
                            {(post.tags || []).map((t: string) => (
                                <span
                                    key={t}
                                    className="text-xs font-medium bg-slate-100 text-slate-700 px-2 py-1 rounded"
                                >
                                    #{t}
                                </span>
                            ))}
                        </div>
                    </article>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="mt-10 rounded-xl border bg-white p-8 text-slate-600">
                    No posts match your filters. Try clearing the tag or search.
                </div>
            )}
        </main>
    );
}
