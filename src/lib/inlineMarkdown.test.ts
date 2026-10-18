// satteri's native binding mis-reads buffers under the jsdom test environment.
// @vitest-environment node
import { describe, expect, it } from "vitest";
import { renderInlineMarkdown } from "./inlineMarkdown";

describe("renderInlineMarkdown", () => {
  it("renders bold, italic, and links", () => {
    expect(renderInlineMarkdown("**Result:** Patriots 26")).toBe(
      "<strong>Result:</strong> Patriots 26"
    );
    expect(renderInlineMarkdown("*italic* and **bold**")).toBe(
      "<em>italic</em> and <strong>bold</strong>"
    );
    expect(renderInlineMarkdown("__bold__ and _italic_")).toBe(
      "<strong>bold</strong> and <em>italic</em>"
    );
    expect(renderInlineMarkdown("[site](https://patonsports.com/blog)")).toBe(
      '<a href="https://patonsports.com/blog" target="_blank" rel="noopener noreferrer">site</a>'
    );
    expect(
      renderInlineMarkdown("[**bold link**](https://example.com)")
    ).toBe(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer"><strong>bold link</strong></a>'
    );
  });

  it("keeps ampersands escaped once", () => {
    expect(renderInlineMarkdown("AT&T and 5 < 6")).toBe(
      "AT&amp;T and 5 &lt; 6"
    );
  });

  it("escapes raw HTML instead of emitting it", () => {
    const html = renderInlineMarkdown(
      'hello <script>alert(1)</script> <img src=x onerror=alert(1)>'
    );
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/<img[\s>]/i);
  });

  it("drops javascript, data, and protocol-relative URLs", () => {
    expect(renderInlineMarkdown("[click](javascript:alert(1))")).toBe("click");
    expect(renderInlineMarkdown("[click](JaVaScRiPt:alert(1))")).toBe("click");
    expect(
      renderInlineMarkdown("[click](data:text/html,<script>alert(1)</script>)")
    ).toBe("click");
    expect(renderInlineMarkdown("[click](//evil.example)")).toBe("click");
    expect(renderInlineMarkdown("![x](javascript:alert(1))")).toBe("");
  });

  it("allows mailto and site-relative links", () => {
    expect(renderInlineMarkdown("[mail](mailto:pat@patonsports.com)")).toContain(
      'href="mailto:pat@patonsports.com"'
    );
    expect(renderInlineMarkdown("[about](/about)")).toContain('href="/about"');
  });
});