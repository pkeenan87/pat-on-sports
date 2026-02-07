import fs from "fs";
import path from "path";
import readline from "readline";
import AdmZip from "adm-zip";
import { parse as parseHtml, HTMLElement } from "node-html-parser";

// ─── CLI argument parsing ────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const flags: Record<string, string> = {};
  let inputFile = "";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const value = args[i + 1] ?? "";
      flags[key] = value;
      i++;
    } else if (!inputFile) {
      inputFile = arg;
    }
  }

  return { inputFile, flags };
}

// ─── Interactive prompts ─────────────────────────────────────────────
function createPrompt() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return {
    ask(question: string, defaultValue?: string): Promise<string> {
      const suffix = defaultValue ? ` [${defaultValue}]` : "";
      return new Promise((resolve) => {
        rl.question(`${question}${suffix}: `, (answer) => {
          resolve(answer.trim() || defaultValue || "");
        });
      });
    },
    close() {
      rl.close();
    },
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapeJsx(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
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

// ─── Google Docs HTML parsing ────────────────────────────────────────
type ContentBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "image"; src: string; alt: string };

function getInlineText(node: HTMLElement): string {
  let result = "";

  for (const child of node.childNodes) {
    if (child.nodeType === 3) {
      // Text node
      result += child.text;
    } else if (child instanceof HTMLElement) {
      const tag = child.tagName?.toLowerCase();
      const style = child.getAttribute("style") || "";
      const isBold =
        tag === "b" ||
        tag === "strong" ||
        style.includes("font-weight:700") ||
        style.includes("font-weight:bold");
      const isItalic =
        tag === "i" ||
        tag === "em" ||
        style.includes("font-style:italic");

      const innerText = getInlineText(child);

      if (isBold && isItalic) {
        result += `<strong><em>${innerText}</em></strong>`;
      } else if (isBold) {
        result += `<strong>${innerText}</strong>`;
      } else if (isItalic) {
        result += `<em>${innerText}</em>`;
      } else if (tag === "a") {
        const href = child.getAttribute("href") || "#";
        result += `<a href="${href}">${innerText}</a>`;
      } else if (tag === "br") {
        result += "\n";
      } else {
        result += innerText;
      }
    }
  }

  return result;
}

function parseGoogleDocsHtml(
  html: string,
  imageMap: Map<string, string>
): ContentBlock[] {
  const root = parseHtml(html);
  const body = root.querySelector("body") || root;
  const blocks: ContentBlock[] = [];

  function processElement(el: HTMLElement) {
    const tag = el.tagName?.toLowerCase();

    if (!tag) return;

    // Headings
    if (/^h[1-6]$/.test(tag)) {
      const level = parseInt(tag[1], 10);
      const text = getInlineText(el).trim();
      if (text) {
        blocks.push({ type: "heading", level: Math.max(level, 2), text });
      }
      return;
    }

    // Lists
    if (tag === "ul" || tag === "ol") {
      const items: string[] = [];
      for (const li of el.querySelectorAll("li")) {
        const text = getInlineText(li).trim();
        if (text) items.push(text);
      }
      if (items.length > 0) {
        blocks.push({
          type: "list",
          ordered: tag === "ol",
          items,
        });
      }
      return;
    }

    // Images
    if (tag === "img") {
      const src = el.getAttribute("src") || "";
      const alt = el.getAttribute("alt") || "";
      if (src) {
        const mappedSrc = imageMap.get(src) || src;
        blocks.push({ type: "image", src: mappedSrc, alt });
      }
      return;
    }

    // Paragraphs
    if (tag === "p") {
      // Check for embedded images
      const img = el.querySelector("img");
      if (img) {
        const src = img.getAttribute("src") || "";
        const alt = img.getAttribute("alt") || "";
        if (src) {
          const mappedSrc = imageMap.get(src) || src;
          blocks.push({ type: "image", src: mappedSrc, alt });
        }
      }

      const text = getInlineText(el).trim();
      if (text) {
        blocks.push({ type: "paragraph", text });
      }
      return;
    }

    // Div or other containers: recurse
    if (tag === "div" || tag === "section" || tag === "article" || tag === "main") {
      for (const child of el.childNodes) {
        if (child instanceof HTMLElement) {
          processElement(child);
        }
      }
      return;
    }

    // Table, spans at top level, etc. - try to get text
    if (tag === "span" || tag === "table") {
      const text = getInlineText(el).trim();
      if (text) {
        blocks.push({ type: "paragraph", text });
      }
    }
  }

  for (const child of body.childNodes) {
    if (child instanceof HTMLElement) {
      processElement(child);
    }
  }

  return blocks;
}

// ─── JSX generation ──────────────────────────────────────────────────
function blocksToJsx(
  blocks: ContentBlock[],
  indent: string = "      "
): string {
  const parts: string[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case "heading": {
        const tag = `h${block.level}`;
        parts.push(`${indent}<${tag}>${escapeJsx(block.text)}</${tag}>`);
        break;
      }
      case "paragraph": {
        parts.push(`${indent}<p>${escapeJsx(block.text)}</p>`);
        break;
      }
      case "list": {
        const tag = block.ordered ? "ol" : "ul";
        const itemsJsx = block.items
          .map((item) => `${indent}  <li>${escapeJsx(item)}</li>`)
          .join("\n");
        parts.push(`${indent}<${tag}>\n${itemsJsx}\n${indent}</${tag}>`);
        break;
      }
      case "image": {
        parts.push(
          `${indent}<Image\n` +
          `${indent}  src="${block.src}"\n` +
          `${indent}  alt="${escapeJsx(block.alt)}"\n` +
          `${indent}  width={800}\n` +
          `${indent}  height={450}\n` +
          `${indent}  className="rounded-lg my-4"\n` +
          `${indent}/>`
        );
        break;
      }
    }
  }

  return parts.join("\n\n");
}

function blocksToSearchContent(blocks: ContentBlock[]): string {
  const parts: string[] = [];
  for (const block of blocks) {
    switch (block.type) {
      case "heading":
      case "paragraph":
        parts.push(block.text);
        break;
      case "list":
        for (const item of block.items) {
          parts.push(item);
        }
        break;
    }
  }
  return parts.join(" ");
}

function generatePostFile(
  meta: {
    slug: string;
    title: string;
    date: string;
    description: string;
    tags: string[];
    heroImage: string;
    heroAlt: string;
    heroCaption: string;
  },
  blocks: ContentBlock[],
  jsxContent: string,
  hasImages: boolean
): string {
  const tagsArray = meta.tags
    .map((t) => `"${escapeStringLiteral(t)}"`)
    .join(", ");

  const searchContent = blocksToSearchContent(blocks);

  const metaLines = [
    `  slug: "${escapeStringLiteral(meta.slug)}",`,
    `  title: "${escapeStringLiteral(meta.title)}",`,
    `  date: "${escapeStringLiteral(meta.date)}",`,
    `  description: "${escapeStringLiteral(meta.description)}",`,
    `  tags: [${tagsArray}],`,
    `  searchContent: "${escapeStringLiteral(searchContent)}",`,
  ];

  if (meta.heroImage) {
    metaLines.push(
      `  heroImage: "${escapeStringLiteral(meta.heroImage)}",`
    );
  }
  if (meta.heroAlt) {
    metaLines.push(`  heroAlt: "${escapeStringLiteral(meta.heroAlt)}",`);
  }
  if (meta.heroCaption) {
    metaLines.push(
      `  heroCaption: "${escapeStringLiteral(meta.heroCaption)}",`
    );
  }

  const imports = [
    `import { PostMeta } from "@/lib/posts";`,
  ];
  if (hasImages) {
    imports.push(`import Image from "next/image";`);
  }

  return `${imports.join("\n")}

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

// ─── Image extraction ────────────────────────────────────────────────
function extractImages(
  zipPath: string,
  slug: string,
  year: string
): { htmlContent: string; imageMap: Map<string, string> } {
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();

  let htmlContent = "";
  const imageMap = new Map<string, string>();
  const imageDir = path.join(
    process.cwd(),
    "public",
    "images",
    year,
    slug
  );

  // Find the HTML file and image files
  let htmlEntry: AdmZip.IZipEntry | null = null;
  const imageEntries: AdmZip.IZipEntry[] = [];

  for (const entry of entries) {
    const name = entry.entryName.toLowerCase();
    if (name.endsWith(".html") || name.endsWith(".htm")) {
      htmlEntry = entry;
    } else if (
      name.match(/\.(png|jpg|jpeg|gif|webp|svg|bmp)$/i) &&
      !entry.isDirectory
    ) {
      imageEntries.push(entry);
    }
  }

  if (!htmlEntry) {
    throw new Error("No HTML file found in the zip archive.");
  }

  htmlContent = htmlEntry.getData().toString("utf8");

  // Extract images
  if (imageEntries.length > 0) {
    fs.mkdirSync(imageDir, { recursive: true });

    let imageIndex = 1;
    for (const imgEntry of imageEntries) {
      const originalName = path.basename(imgEntry.entryName);
      const ext = path.extname(originalName).toLowerCase();
      const newName = `image-${String(imageIndex).padStart(2, "0")}${ext}`;
      const destPath = path.join(imageDir, newName);

      fs.writeFileSync(destPath, imgEntry.getData());

      // Map the original reference to the new public path
      const publicPath = `/images/${year}/${slug}/${newName}`;
      imageMap.set(imgEntry.entryName, publicPath);
      // Also map just the filename in case the HTML uses relative paths
      imageMap.set(originalName, publicPath);
      // And the images/ subfolder path
      imageMap.set(`images/${originalName}`, publicPath);

      console.log(`  Extracted image: ${originalName} -> ${newName}`);
      imageIndex++;
    }
  }

  return { htmlContent, imageMap };
}

function processHtmlFile(
  htmlPath: string,
  slug: string,
  year: string
): { htmlContent: string; imageMap: Map<string, string> } {
  const htmlContent = fs.readFileSync(htmlPath, "utf8");
  const imageMap = new Map<string, string>();

  // Check if there's a companion images directory
  const htmlDir = path.dirname(htmlPath);
  const baseName = path.basename(htmlPath, path.extname(htmlPath));
  const possibleImageDirs = [
    path.join(htmlDir, "images"),
    path.join(htmlDir, `${baseName}_files`),
    path.join(htmlDir, `${baseName}.fld`),
  ];

  const imageDir = path.join(
    process.cwd(),
    "public",
    "images",
    year,
    slug
  );

  for (const srcDir of possibleImageDirs) {
    if (fs.existsSync(srcDir) && fs.statSync(srcDir).isDirectory()) {
      fs.mkdirSync(imageDir, { recursive: true });
      const files = fs.readdirSync(srcDir);
      let imageIndex = 1;

      for (const file of files) {
        if (file.match(/\.(png|jpg|jpeg|gif|webp|svg|bmp)$/i)) {
          const ext = path.extname(file).toLowerCase();
          const newName = `image-${String(imageIndex).padStart(2, "0")}${ext}`;
          const srcPath = path.join(srcDir, file);
          const destPath = path.join(imageDir, newName);

          fs.copyFileSync(srcPath, destPath);

          const publicPath = `/images/${year}/${slug}/${newName}`;
          imageMap.set(file, publicPath);
          imageMap.set(`images/${file}`, publicPath);
          imageMap.set(`${baseName}_files/${file}`, publicPath);

          console.log(`  Extracted image: ${file} -> ${newName}`);
          imageIndex++;
        }
      }
      break;
    }
  }

  return { htmlContent, imageMap };
}

// ─── Registry update ─────────────────────────────────────────────────
function updateRegistry(slug: string) {
  const registryPath = path.join(process.cwd(), "posts", "index.ts");

  if (!fs.existsSync(registryPath)) {
    console.log("  Warning: posts/index.ts not found. Skipping registry update.");
    return;
  }

  let content = fs.readFileSync(registryPath, "utf8");

  // Check if slug is already registered
  if (content.includes(`"${slug}"`)) {
    console.log(`  Registry already contains "${slug}". Skipping.`);
    return;
  }

  // Insert before the closing of postModules
  const insertLine = `  "${slug}": () => import("./${slug}"),`;
  content = content.replace(
    /^(const postModules.*?= \{)\n/m,
    `$1\n${insertLine}\n`
  );

  fs.writeFileSync(registryPath, content, "utf8");
  console.log(`  Updated registry: posts/index.ts`);
}

// ─── Main ────────────────────────────────────────────────────────────
async function main() {
  const { inputFile, flags } = parseArgs();

  if (!inputFile) {
    console.log(
      "Usage: npx tsx scripts/gdoc-to-post.ts <file.html|file.zip> [options]\n"
    );
    console.log("Options:");
    console.log("  --title     Post title");
    console.log("  --slug      URL slug (auto-generated from title if omitted)");
    console.log("  --date      Publication date (YYYY-MM-DD, defaults to today)");
    console.log("  --tags      Comma-separated tags");
    console.log("  --description   Short description/excerpt");
    console.log("  --hero      Hero image filename (from extracted images)");
    console.log("  --hero-alt  Hero image alt text");
    console.log("  --hero-caption  Hero image caption");
    console.log("\nExamples:");
    console.log('  npx tsx scripts/gdoc-to-post.ts ./export.zip --title "My Post"');
    console.log("  npx tsx scripts/gdoc-to-post.ts ./export.html");
    process.exit(1);
  }

  const resolvedInput = path.resolve(inputFile);
  if (!fs.existsSync(resolvedInput)) {
    console.error(`Error: File not found: ${resolvedInput}`);
    process.exit(1);
  }

  const prompt = createPrompt();
  const today = new Date().toISOString().slice(0, 10);
  const currentYear = new Date().getFullYear().toString();

  try {
    // Collect metadata
    const title =
      flags.title || (await prompt.ask("Post title"));
    const suggestedSlug = slugify(title);
    const slug =
      flags.slug || (await prompt.ask("URL slug", suggestedSlug));
    const date =
      flags.date || (await prompt.ask("Publication date (YYYY-MM-DD)", today));
    const year = date.slice(0, 4) || currentYear;
    const description =
      flags.description || (await prompt.ask("Short description/excerpt"));
    const tagsInput =
      flags.tags || (await prompt.ask("Tags (comma-separated)", "NFL"));
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    console.log(`\nProcessing: ${path.basename(resolvedInput)}`);

    // Extract content and images
    let htmlContent: string;
    let imageMap: Map<string, string>;
    const ext = path.extname(resolvedInput).toLowerCase();

    if (ext === ".zip") {
      ({ htmlContent, imageMap } = extractImages(resolvedInput, slug, year));
    } else if (ext === ".html" || ext === ".htm") {
      ({ htmlContent, imageMap } = processHtmlFile(resolvedInput, slug, year));
    } else {
      console.error("Error: Input must be an .html or .zip file.");
      process.exit(1);
    }

    // Parse HTML to content blocks
    const blocks = parseGoogleDocsHtml(htmlContent, imageMap);
    const hasImages = blocks.some((b) => b.type === "image");

    // Determine hero image
    let heroImage = "";
    let heroAlt = "";
    let heroCaption = "";

    if (flags.hero) {
      // Find the hero image in the image map
      for (const [, publicPath] of imageMap) {
        if (publicPath.includes(flags.hero)) {
          heroImage = publicPath;
          break;
        }
      }
    } else if (imageMap.size > 0) {
      const imageList = Array.from(imageMap.values());
      const uniqueImages = [...new Set(imageList)];
      if (uniqueImages.length > 0) {
        console.log("\nExtracted images:");
        uniqueImages.forEach((img, i) =>
          console.log(`  ${i + 1}. ${img}`)
        );
        const heroChoice = await prompt.ask(
          "Hero image number (or press Enter to skip)",
          ""
        );
        if (heroChoice) {
          const idx = parseInt(heroChoice, 10) - 1;
          if (idx >= 0 && idx < uniqueImages.length) {
            heroImage = uniqueImages[idx];
          }
        }
      }
    }

    if (heroImage) {
      heroAlt =
        flags["hero-alt"] || (await prompt.ask("Hero image alt text"));
      heroCaption =
        flags["hero-caption"] || (await prompt.ask("Hero image caption", ""));
    }

    // Generate JSX content
    const jsxContent = blocksToJsx(blocks);

    // Generate the post file
    const postContent = generatePostFile(
      {
        slug,
        title,
        date,
        description,
        tags,
        heroImage,
        heroAlt,
        heroCaption,
      },
      blocks,
      jsxContent,
      hasImages
    );

    // Write the post file
    const postPath = path.join(process.cwd(), "posts", `${slug}.tsx`);
    fs.writeFileSync(postPath, postContent, "utf8");
    console.log(`\nCreated post: posts/${slug}.tsx`);

    // Update the registry
    updateRegistry(slug);

    console.log("\nDone! Next steps:");
    console.log(`  1. Review the generated file: posts/${slug}.tsx`);
    console.log("  2. Run 'npm run build' to verify");
    console.log(`  3. Preview with 'npm run dev' and visit /blog/${slug}`);
  } finally {
    prompt.close();
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
