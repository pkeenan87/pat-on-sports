import { describe, expect, it } from "vitest";
import { isObviousBot } from "./bots";

describe("isObviousBot", () => {
  it("flags crawlers and scripted clients", () => {
    const bots = [
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
      "Mozilla/5.0 (compatible; Yahoo! Slurp; http://help.yahoo.com/help/us/ysearch/slurp)",
      "facebookexternalhit/1.1",
      "Mozilla/5.0 (compatible; Bytespider; https://zhanzhang.toutiao.com/)",
      "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1)",
      "curl/8.7.1",
      "python-requests/2.32.3",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 HeadlessChrome/120.0.0.0 Safari/537.36",
    ];
    for (const ua of bots) {
      expect(isObviousBot(ua), ua).toBe(true);
    }
  });

  it("allows ordinary browsers, including CUBOT phones", () => {
    const people = [
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Linux; Android 11; CUBOT NOTE 20) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
      "",
    ];
    for (const ua of people) {
      expect(isObviousBot(ua), ua).toBe(false);
    }
    expect(isObviousBot(null)).toBe(false);
    expect(isObviousBot(undefined)).toBe(false);
  });
});
