import Link from "next/link";

export const dynamic = "force-static";

export default function NotFound() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-3 text-slate-600">
        Sorry — we couldn’t find that page.
      </p>

      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800"
        >
          Go home
        </Link>
        <Link
          href="/blog"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Browse blog
        </Link>
      </div>
    </main>
  );
}
