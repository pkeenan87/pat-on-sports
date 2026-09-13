import { describe, expect, it, vi } from "vitest";
import { newTabLinks } from "./newTabLinks";

describe("newTabLinks", () => {
  it("adds target and rel on every anchor", () => {
    const setProperty = vi.fn();
    const visitor = Array.isArray(newTabLinks.element)
      ? newTabLinks.element[0]
      : newTabLinks.element;
    visitor?.visit({} as never, { setProperty } as never);

    expect(setProperty).toHaveBeenCalledWith({}, "target", "_blank");
    expect(setProperty).toHaveBeenCalledWith(
      {},
      "rel",
      "noopener noreferrer"
    );
  });
});
