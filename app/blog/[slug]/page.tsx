import Image from "next/image";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CommentBox from "@/components/CommentBox";


type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const post = await getPostBySlug(slug);

    const description =
      post.description?.trim() || "Weekly Patriots Pros & Cons from Pat on Sports.";

    const image = post.heroImage?.trim() || "/images/og-default.png";

    const publishedTime = post.date ? new Date(post.date).toISOString() : undefined;

    return {
      title: post.title,
      description,
      alternates: {
        canonical: `/blog/${slug}`,
      },
      openGraph: {
        type: "article",
        url: `/blog/${slug}`,
        title: post.title,
        description,
        siteName: "Pat on Sports",
        images: [
          {
            url: image,
            width: 1200,
            height: 630,
            alt: post.heroAlt || post.title,
          },
        ],
        ...(publishedTime ? { publishedTime } : {}),
        tags: post.tags?.length ? post.tags : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description,
        images: [image],
      },
    };
  } catch {
    return {
      title: "Post not found | Pat on Sports",
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
    notFound();
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {/* TITLE + DATE */}
      <header className="mb-4 sm:mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          {post.title}
        </h1>
        {post.date ? (
          <p className="mt-2 text-sm text-slate-500">{post.date}</p>
        ) : null}
      </header>

      {/* Divider */}
      <div className="mb-5 sm:mb-7 h-px bg-slate-200" />

      {/* HERO IMAGE (same width as content) */}
{post.heroImage ? (
  <figure className="mb-8 animate-fade-in-up">
    <div className="relative w-full aspect-[16/9] overflow-hidden rounded-xl bg-slate-100 shadow-sm ring-1 ring-slate-200">
      <Image
        src={post.heroImage}
        alt={post.heroAlt || post.title}
        fill
        priority
        sizes="(max-width: 768px) 100vw, 896px"
        className="object-cover"
      />
    </div>

    {post.heroCaption ? (
      <figcaption className="mt-2 text-sm text-slate-500 text-center">
        {post.heroCaption}
      </figcaption>
    ) : null}
  </figure>
) : null}


      {/* CONTENT */}
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
      <section className="mt-12 border-t border-slate-200 pt-8">
  <h2 className="text-xl font-semibold">Comments</h2>
  <CommentBox boxId={post.slug} />
</section>

    </main>
  );
}
