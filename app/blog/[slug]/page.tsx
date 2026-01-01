import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;

  try {
    const post = await getPostBySlug(slug);
    return {
      title: post.title,
      description: post.description,
    };
  } catch {
    // ✅ don’t crash the build if metadata lookup fails
    return {
      title: "Post not found",
      description: "",
    };
  }
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;

  let post;
  try {
    post = await getPostBySlug(slug);
  } catch {
    // ✅ show 404 instead of failing export
    notFound();
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">{post.title}</h1>
        {post.date ? <p className="mt-2 text-sm text-slate-500">{post.date}</p> : null}
      </header>

      <article
        className="
          prose prose-lg max-w-none prose-slate
          prose-ul:list-disc prose-ol:list-decimal
          prose-ul:pl-6 prose-ol:pl-6
          prose-li:my-1.5
        "
      >
        <div dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
      </article>
    </main>
  );
}
