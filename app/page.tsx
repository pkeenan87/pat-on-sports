import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export default function HomePage() {
    const posts = getAllPosts();

    return (
        <main className="max-w-6xl mx-auto px-6 py-12">
            <h1 className="text-4xl font-bold mb-8">Pat on Sports</h1>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                    <article
                        key={post.slug}
                        className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition"
                    >
                        <Link href={`/blog/${post.slug}`}>
                            <h2 className="text-xl font-semibold mb-2">
                                {post.title}
                            </h2>
                        </Link>

                        <p className="text-sm text-gray-500 mb-3">
                            {post.date}
                        </p>

                        <p className="text-gray-700 mb-4">{post.description}</p>

                        <div className="flex flex-wrap gap-2">
                            {post.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="text-xs font-medium bg-slate-100 text-slate-700 px-2 py-1 rounded"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </article>
                ))}
            </div>
        </main>
    );
}
