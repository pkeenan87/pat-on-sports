import "./globals.css";
import Header from "@/components/Header";
import { getAllTags } from "@/lib/posts";

export const metadata = {
    title: {
        default: "Pat’s Sports Blog",
        template: "%s | Pat’s Sports Blog",
    },
    description:
        "In-depth analysis, previews, and opinions across the sports world.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const tags = getAllTags(); // ✅ server-side: reads markdown tags

    return (
        <html lang="en">
            <body className="bg-slate-50 text-slate-900">
                <Header tags={tags} />
                <main>{children}</main>
            </body>
        </html>
    );
}
