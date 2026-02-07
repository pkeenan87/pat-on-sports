import fs from "fs";
import path from "path";
import matter from "gray-matter";

const postsDir = path.join(process.cwd(), "posts");

function escapeJsx(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/{/g, "&#123;")
    .replace(/}/g, "&#125;")
    .replace(/"/g, "&quot;");
}

function escapeStringLiteral(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

function convertInlineMarkdown(text: string): string {
  // Bold: **text** or __text__
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/__(.+?)__/g, "<strong>$1</strong>");
  // Italic: *text* or _text_ (but not inside bold)
  text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");
  text = text.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, "<em>$1</em>");
  return text;
}

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] };

function parseMarkdownToBlocks(content: string): Block[] {
  const lines = content.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      i++;
      continue;
    }

    // Unordered list item
    const ulMatch = line.match(/^\s*[-*+]\s+(.+)$/);
    if (ulMatch) {
      const items: string[] = [];
      while (i < lines.length) {
        const listLine = lines[i];
        const itemMatch = listLine.match(/^\s*[-*+]\s+(.+)$/);
        if (itemMatch) {
          items.push(itemMatch[1].trim());
          i++;
        } else if (listLine.trim() === "") {
          // Allow blank lines within a list
          // Check if next non-blank line is still a list item
          let j = i + 1;
          while (j < lines.length && lines[j].trim() === "") j++;
          if (j < lines.length && lines[j].match(/^\s*[-*+]\s+/)) {
            i = j;
            continue;
          }
          break;
        } else {
          break;
        }
      }
      blocks.push({ type: "list", ordered: false, items });
      continue;
    }

    // Ordered list item
    const olMatch = line.match(/^\s*\d+\.\s+(.+)$/);
    if (olMatch) {
      const items: string[] = [];
      while (i < lines.length) {
        const listLine = lines[i];
        const itemMatch = listLine.match(/^\s*\d+\.\s+(.+)$/);
        if (itemMatch) {
          items.push(itemMatch[1].trim());
          i++;
        } else if (listLine.trim() === "") {
          let j = i + 1;
          while (j < lines.length && lines[j].trim() === "") j++;
          if (j < lines.length && lines[j].match(/^\s*\d+\.\s+/)) {
            i = j;
            continue;
          }
          break;
        } else {
          break;
        }
      }
      blocks.push({ type: "list", ordered: true, items });
      continue;
    }

    // Paragraph: collect consecutive non-empty, non-special lines
    const paraLines: string[] = [];
    while (i < lines.length) {
      const pLine = lines[i];
      if (pLine.trim() === "") break;
      if (pLine.match(/^#{1,6}\s+/)) break;
      if (pLine.match(/^\s*[-*+]\s+/)) break;
      if (pLine.match(/^\s*\d+\.\s+/)) break;
      paraLines.push(pLine.trim());
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: "paragraph", text: paraLines.join(" ") });
    }
  }

  return blocks;
}

function blocksToJsx(blocks: Block[], indent: string = "      "): string {
  const jsxParts: string[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case "heading": {
        const tag = `h${block.level}`;
        const escapedText = escapeJsx(block.text);
        const inlineConverted = convertInlineMarkdown(escapedText);
        jsxParts.push(`${indent}<${tag}>${inlineConverted}</${tag}>`);
        break;
      }
      case "paragraph": {
        const escapedText = escapeJsx(block.text);
        const inlineConverted = convertInlineMarkdown(escapedText);
        jsxParts.push(`${indent}<p>${inlineConverted}</p>`);
        break;
      }
      case "list": {
        const tag = block.ordered ? "ol" : "ul";
        const itemsJsx = block.items
          .map((item) => {
            const escapedItem = escapeJsx(item);
            const inlineConverted = convertInlineMarkdown(escapedItem);
            return `${indent}  <li>${inlineConverted}</li>`;
          })
          .join("\n");
        jsxParts.push(`${indent}<${tag}>\n${itemsJsx}\n${indent}</${tag}>`);
        break;
      }
    }
  }

  return jsxParts.join("\n\n");
}

function generateTsxFile(
  slug: string,
  frontmatter: Record<string, unknown>,
  markdownContent: string
): string {
  const meta = {
    slug,
    title: (frontmatter.title as string) ?? "Untitled",
    date: (frontmatter.date as string) ?? "",
    description: (frontmatter.description as string) ?? "",
    tags: Array.isArray(frontmatter.tags)
      ? (frontmatter.tags as string[]).map((t) => String(t).trim()).filter(Boolean)
      : [],
    heroImage: (frontmatter.heroImage as string) ?? "",
    heroAlt: (frontmatter.heroAlt as string) ?? "",
    heroCaption: (frontmatter.heroCaption as string) ?? "",
  };

  const blocks = parseMarkdownToBlocks(markdownContent);
  const jsxContent = blocksToJsx(blocks);

  const tagsArray = meta.tags.map((t) => `"${escapeStringLiteral(t)}"`).join(", ");

  const metaLines = [
    `  slug: "${escapeStringLiteral(meta.slug)}",`,
    `  title: "${escapeStringLiteral(meta.title)}",`,
    `  date: "${escapeStringLiteral(meta.date)}",`,
    `  description: "${escapeStringLiteral(meta.description)}",`,
    `  tags: [${tagsArray}],`,
  ];

  if (meta.heroImage) {
    metaLines.push(`  heroImage: "${escapeStringLiteral(meta.heroImage)}",`);
  }
  if (meta.heroAlt) {
    metaLines.push(`  heroAlt: "${escapeStringLiteral(meta.heroAlt)}",`);
  }
  if (meta.heroCaption) {
    metaLines.push(`  heroCaption: "${escapeStringLiteral(meta.heroCaption)}",`);
  }

  return `import { PostMeta } from "@/lib/posts";

export const meta: PostMeta = {
${metaLines.join("\n")}
};

export default function Post() {
  return (
    <>
${jsxContent}
    </>
  );
}
`;
}

function generateRegistry(slugs: string[]): string {
  const imports = slugs
    .map(
      (slug) =>
        `  "${slug}": () => import("./${slug}"),`
    )
    .join("\n");

  return `import { PostMeta } from "@/lib/posts";
import { ComponentType } from "react";

export type PostModule = {
  meta: PostMeta;
  default: ComponentType;
};

const postModules: Record<string, () => Promise<PostModule>> = {
${imports}
};

export default postModules;
`;
}

// Main
function main() {
  const mdFiles = fs
    .readdirSync(postsDir)
    .filter((f) => f.toLowerCase().endsWith(".md"))
    .sort();

  console.log(`Found ${mdFiles.length} markdown files to migrate.\n`);

  const slugs: string[] = [];

  for (const file of mdFiles) {
    const slug = file.replace(/\.md$/i, "");
    slugs.push(slug);

    const fullPath = path.join(postsDir, file);
    const raw = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(raw);

    const tsx = generateTsxFile(slug, data, content);
    const outPath = path.join(postsDir, `${slug}.tsx`);
    fs.writeFileSync(outPath, tsx, "utf8");

    console.log(`  Migrated: ${file} -> ${slug}.tsx`);
  }

  // Generate registry
  const registry = generateRegistry(slugs);
  const registryPath = path.join(postsDir, "index.ts");
  fs.writeFileSync(registryPath, registry, "utf8");
  console.log(`\n  Generated registry: posts/index.ts (${slugs.length} posts)`);

  console.log(`\nMigration complete! ${slugs.length} posts converted.`);
  console.log("You can now delete the .md files after verifying the .tsx files are correct.");
}

main();
