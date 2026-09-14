import { describe, expect, it } from "vitest";
import { audioEnclosure, escapeXml } from "./rss";
import type { PostMeta } from "./posts";

const base: PostMeta = {
  slug: "recap",
  title: "Recap",
  tags: [],
};

describe("escapeXml", () => {
  it("escapes reserved characters", () => {
    expect(escapeXml(`a&b<"'>`)).toBe("a&amp;b&lt;&quot;&apos;&gt;");
  });
});

describe("audioEnclosure", () => {
  it("returns empty when the post has no audio", () => {
    expect(audioEnclosure(base)).toBe("");
  });

  it("uses the Blob URL, bytes, and type from front matter", () => {
    const xml = audioEnclosure({
      ...base,
      audio: "https://example.public.blob.vercel-storage.com/audio/recap.m4a",
      audioBytes: 6_600_000,
      audioType: "audio/mp4",
      audioDurationSeconds: 842,
    });
    expect(xml).toContain(
      'url="https://example.public.blob.vercel-storage.com/audio/recap.m4a"'
    );
    expect(xml).toContain('length="6600000"');
    expect(xml).toContain('type="audio/mp4"');
    expect(xml).toContain("<itunes:duration>842</itunes:duration>");
  });

  it("infers audio/mpeg when audioType is missing and the URL is an mp3", () => {
    const xml = audioEnclosure({
      ...base,
      audio: "https://cdn.example.com/audio/recap.mp3",
      audioBytes: 100,
    });
    expect(xml).toContain('type="audio/mpeg"');
    expect(xml).not.toContain("itunes:duration");
  });

  it("escapes special characters in the audio URL", () => {
    const xml = audioEnclosure({
      ...base,
      audio: "https://cdn.example.com/a&b.m4a",
      audioBytes: 1,
      audioType: "audio/mp4",
    });
    expect(xml).toContain('url="https://cdn.example.com/a&amp;b.m4a"');
  });
});
