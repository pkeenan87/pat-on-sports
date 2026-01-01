import Link from "next/link";

export default function Breadcrumbs({
    items,
}: {
    items: { label: string; href?: string }[];
}) {
    return (
        <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                {items.map((item, idx) => (
                    <li
                        key={`${item.label}-${idx}`}
                        className="flex items-center gap-2"
                    >
                        {item.href ? (
                            <Link
                                href={item.href}
                                className="hover:text-slate-700 hover:underline"
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <span className="text-slate-700 font-medium">
                                {item.label}
                            </span>
                        )}
                        {idx < items.length - 1 && (
                            <span className="text-slate-300">/</span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}
