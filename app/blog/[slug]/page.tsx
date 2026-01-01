import { getAllPosts, getPostBySlug } from "@/lib/posts";
import Breadcrumbs from "@/components/Breadcrumbs";

type PageProps = {
    params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
    const posts = getAllPosts();
    return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps) {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    return {
        title: post.title,
        description: post.description,
        openGraph: {
            title: post.title,
            description: post.description,
            type: "article",
        },
    };
}

export default async function PostPage({ params }: PageProps) {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    return (
        <main className="max-w-4xl mx-auto px-6 py-10">
            <Breadcrumbs
                items={[
                    { label: "Home", href: "/" },
                    { label: "Blog", href: "/blog" },
                    { label: post.title },
                ]}
            />

            <header className="mb-8">
                <h1 className="text-4xl font-bold tracking-tight">
                    {post.title}
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                    {post.date} · {post.author}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                    {(post.tags || []).map((tag: string) => (
                        <span
                            key={tag}
                            className="text-xs font-medium bg-slate-100 text-slate-700 px-2 py-1 rounded-full border"
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
            </header>

            <article className="prose prose-lg max-w-3xl prose-slate">
  <div dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
</article>


        </main>
    );
}
