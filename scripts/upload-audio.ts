#!/usr/bin/env node
import { createReadStream, existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import { put } from "@vercel/blob";
import { parseBuffer } from "music-metadata";

export type UploadAudioArgs = {
  filePath: string;
  postSlug: string;
};

export type AudioType = "audio/mp4" | "audio/mpeg";

const EXT_TO_TYPE: Record<string, AudioType> = {
  ".m4a": "audio/mp4",
  ".mp3": "audio/mpeg",
};

export function parseUploadAudioArgs(argv: string[]): UploadAudioArgs {
  const args = [...argv];
  let postSlug: string | undefined;
  const positionals: string[] = [];

  while (args.length > 0) {
    const token = args.shift()!;
    if (token === "--post") {
      postSlug = args.shift();
      if (!postSlug) throw new Error("--post requires a slug");
      continue;
    }
    if (token.startsWith("-")) {
      throw new Error(`Unknown flag: ${token}`);
    }
    positionals.push(token);
  }

  if (positionals.length !== 1) {
    throw new Error(
      "Usage: npm run upload-audio -- ./recording.m4a --post <slug>"
    );
  }
  if (!postSlug) {
    throw new Error("--post <slug> is required");
  }

  return { filePath: positionals[0]!, postSlug };
}

export function contentTypeForExtension(ext: string): AudioType {
  const type = EXT_TO_TYPE[ext.toLowerCase()];
  if (!type) {
    throw new Error(`Unsupported extension ${ext}; use .m4a or .mp3`);
  }
  return type;
}

export function rewriteAudioFrontMatter(
  markdown: string,
  fields: {
    audio: string;
    audioBytes: number;
    audioDurationSeconds: number;
    audioType: AudioType;
  }
): string {
  if (!markdown.startsWith("---\n")) {
    throw new Error("Post is missing YAML front matter");
  }
  const end = markdown.indexOf("\n---\n", 4);
  if (end < 0) {
    throw new Error("Post front matter is not closed");
  }
  const fm = markdown.slice(4, end);
  const body = markdown.slice(end + 5);
  const lines = fm.split("\n").filter((line) => {
    const key = line.split(":")[0]?.trim();
    return (
      key !== "audio" &&
      key !== "audioBytes" &&
      key !== "audioDurationSeconds" &&
      key !== "audioType"
    );
  });
  lines.push(`audio: "${fields.audio}"`);
  lines.push(`audioBytes: ${fields.audioBytes}`);
  lines.push(`audioDurationSeconds: ${fields.audioDurationSeconds}`);
  lines.push(`audioType: "${fields.audioType}"`);
  return `---\n${lines.join("\n")}\n---\n${body}`;
}

async function main() {
  const { filePath, postSlug } = parseUploadAudioArgs(process.argv.slice(2));
  const absFile = resolve(filePath);
  const ext = extname(absFile);
  const contentType = contentTypeForExtension(ext);

  if (!existsSync(absFile)) {
    throw new Error(`Audio file not found: ${absFile}`);
  }

  const postPath = resolve("posts", `${postSlug}.md`);
  if (!existsSync(postPath)) {
    throw new Error(`Post not found: posts/${postSlug}.md`);
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is missing. Run `vercel env pull .env.local` first."
    );
  }

  const buffer = readFileSync(absFile);
  const metadata = await parseBuffer(buffer, { mimeType: contentType });
  const durationSeconds = Math.max(
    1,
    Math.round(metadata.format.duration ?? 0)
  );
  const pathname = `audio/${postSlug}${ext.toLowerCase()}`;

  const blob = await put(pathname, createReadStream(absFile), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType,
    cacheControlMaxAge: 31_536_000,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  const updated = rewriteAudioFrontMatter(readFileSync(postPath, "utf8"), {
    audio: blob.url,
    audioBytes: buffer.byteLength,
    audioDurationSeconds: durationSeconds,
    audioType: contentType,
  });
  writeFileSync(postPath, updated);

  console.log(`Uploaded ${basename(absFile)} → ${blob.url}`);
  console.log(
    `Updated posts/${postSlug}.md (${buffer.byteLength} bytes, ${durationSeconds}s). Commit the post when ready.`
  );
}

const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith("upload-audio.ts") ||
    process.argv[1].endsWith("upload-audio.js"));

if (isDirectRun) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
