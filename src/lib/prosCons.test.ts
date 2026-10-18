import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { renderInlineMarkdown } from "./inlineMarkdown";
import { parseProsConsMarkdown } from "./prosCons";

function markdownBody(file: string): string {
  const raw = readFileSync(file, "utf8");
  const end = raw.indexOf("\n---\n", 3);
  return end === -1 ? raw : raw.slice(end + 5);
}

describe("parseProsConsMarkdown", () => {
  it("splits pros and cons bullet lists", () => {
    const parsed = parseProsConsMarkdown(`## Pros

- Good pass rush
- Diggs

## Cons

- Bad mechanics
`);
    expect(parsed.hasPanels).toBe(true);
    expect(parsed.pros).toEqual(["Good pass rush", "Diggs"]);
    expect(parsed.cons).toEqual(["Bad mechanics"]);
    expect(parsed.intro).toEqual([]);
  });

  it("keeps an introduction section before the panels", () => {
    const parsed = parseProsConsMarkdown(`## Introduction

- We won a playoff game.

## Pros

- Defense

## Cons

- Offense
`);
    expect(parsed.intro).toEqual([
      { type: "heading", text: "Introduction" },
      { type: "list", items: ["We won a playoff game."] },
    ]);
    expect(parsed.pros).toEqual(["Defense"]);
    expect(parsed.cons).toEqual(["Offense"]);
  });

  it("keeps a Result line that sits on the line before the next heading", () => {
    const parsed = parseProsConsMarkdown(`**Result:** Patriots 26, Jets 19, at home.
## Introduction
This was a brutal game.
## Pros
- Drake Maye
## Cons
- Injuries
`);
    expect(parsed.intro).toEqual([
      {
        type: "paragraph",
        text: "**Result:** Patriots 26, Jets 19, at home.",
      },
      { type: "heading", text: "Introduction" },
      { type: "paragraph", text: "This was a brutal game." },
    ]);
    expect(parsed.pros).toEqual(["Drake Maye"]);
    expect(parsed.cons).toEqual(["Injuries"]);
  });

  it("renders Week 6's Result line, which has no blank line before Introduction", () => {
    const parsed = parseProsConsMarkdown(
      markdownBody("posts/week-06-pros-cons-pats-vs-jets.md")
    );
    const result = parsed.intro[0];
    expect(result).toMatchObject({ type: "paragraph" });
    if (result?.type !== "paragraph") return;
    expect(result.text.startsWith("**Result:**")).toBe(true);
    expect(parsed.intro[1]).toEqual({ type: "heading", text: "Introduction" });

    const html = renderInlineMarkdown(result.text);
    expect(html.startsWith("<strong>Result:</strong>")).toBe(true);
    expect(html).not.toContain("**");
  });
});
