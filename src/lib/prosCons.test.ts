import { describe, expect, it } from "vitest";
import { parseProsConsMarkdown } from "./prosCons";

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
});
