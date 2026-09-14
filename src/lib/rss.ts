import type { PostMeta } from "./posts";

export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/** Build RSS enclosure (+ optional iTunes duration) from post front matter. */
export function audioEnclosure(post: PostMeta): string {
  const audio = post.audio?.trim();
  if (!audio) return "";

  const type =
    post.audioType ??
    (audio.endsWith(".m4a") || audio.includes(".m4a?")
      ? "audio/mp4"
      : "audio/mpeg");
  const length = post.audioBytes ?? 0;
  const lines = [
    `      <enclosure url="${escapeXml(audio)}" length="${length}" type="${type}" />`,
  ];
  if (post.audioDurationSeconds && post.audioDurationSeconds > 0) {
    lines.push(
      `      <itunes:duration>${post.audioDurationSeconds}</itunes:duration>`
    );
  }
  return lines.join("\n");
}
