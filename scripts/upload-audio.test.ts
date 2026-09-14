import { describe, expect, it } from "vitest";
import {
  contentTypeForExtension,
  parseUploadAudioArgs,
  rewriteAudioFrontMatter,
} from "./upload-audio";

describe("parseUploadAudioArgs", () => {
  it("parses file path and --post slug", () => {
    expect(
      parseUploadAudioArgs(["./recap.m4a", "--post", "2025-season-recap"])
    ).toEqual({
      filePath: "./recap.m4a",
      postSlug: "2025-season-recap",
    });
  });

  it("rejects missing --post", () => {
    expect(() => parseUploadAudioArgs(["./recap.m4a"])).toThrow("--post");
  });

  it("rejects unknown flags", () => {
    expect(() =>
      parseUploadAudioArgs(["./recap.m4a", "--weird", "x"])
    ).toThrow("Unknown flag");
  });
});

describe("contentTypeForExtension", () => {
  it("maps m4a and mp3", () => {
    expect(contentTypeForExtension(".m4a")).toBe("audio/mp4");
    expect(contentTypeForExtension(".MP3")).toBe("audio/mpeg");
  });

  it("rejects other extensions", () => {
    expect(() => contentTypeForExtension(".wav")).toThrow("Unsupported");
  });
});

describe("rewriteAudioFrontMatter", () => {
  it("sets audio fields without mangling the body", () => {
    const input = `---
title: "Recap"
date: 2026-08-29
description: "A look back."
tags:
  - NFL
audio: "/audio/old.m4a"
---

Hello world.
`;
    const out = rewriteAudioFrontMatter(input, {
      audio: "https://cdn.example.com/audio/recap.m4a",
      audioBytes: 1234,
      audioDurationSeconds: 90,
      audioType: "audio/mp4",
    });
    expect(out).toContain(
      'audio: "https://cdn.example.com/audio/recap.m4a"'
    );
    expect(out).toContain("audioBytes: 1234");
    expect(out).toContain("audioDurationSeconds: 90");
    expect(out).toContain('audioType: "audio/mp4"');
    expect(out).toContain("Hello world.");
    expect(out).not.toContain("/audio/old.m4a");
  });
});
