export type IntroBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

export type ProsConsSections = {
  intro: IntroBlock[];
  pros: string[];
  cons: string[];
  hasPanels: boolean;
};

function cleanBullet(line: string): string {
  return line.replace(/^[-*+]\s+/, "").trim();
}

/** Parse a Pros & Cons markdown body into intro blocks + bullet lists. */
export function parseProsConsMarkdown(body: string): ProsConsSections {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const intro: IntroBlock[] = [];
  const pros: string[] = [];
  const cons: string[] = [];
  let section: "intro" | "pros" | "cons" | "other" = "intro";
  let pendingList: string[] = [];

  function flushList() {
    if (pendingList.length === 0) return;
    intro.push({ type: "list", items: pendingList });
    pendingList = [];
  }

  for (const raw of lines) {
    const line = raw.trimEnd();
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      const label = heading[1].trim().toLowerCase();
      if (label === "pros") {
        flushList();
        section = "pros";
        continue;
      }
      if (label === "cons") {
        flushList();
        section = "cons";
        continue;
      }
      flushList();
      section = "other";
      intro.push({ type: "heading", text: heading[1].trim() });
      continue;
    }

    if (!line.trim()) {
      if (section === "intro" || section === "other") flushList();
      continue;
    }

    if (section === "pros" && /^[-*+]\s+/.test(line.trim())) {
      pros.push(cleanBullet(line.trim()));
      continue;
    }
    if (section === "cons" && /^[-*+]\s+/.test(line.trim())) {
      cons.push(cleanBullet(line.trim()));
      continue;
    }

    if (section === "intro" || section === "other") {
      if (/^[-*+]\s+/.test(line.trim())) {
        pendingList.push(cleanBullet(line.trim()));
      } else {
        flushList();
        intro.push({ type: "paragraph", text: line.trim() });
      }
    }
  }

  flushList();

  return {
    intro,
    pros,
    cons,
    hasPanels: pros.length > 0 || cons.length > 0,
  };
}
