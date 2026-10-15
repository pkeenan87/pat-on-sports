/**
 * Coarse check for crawlers that should not wake the database just to read
 * comments. Real browsers fall through and use the shared CDN cache.
 *
 * False positives hide the thread, so device names that merely end in "bot"
 * (CUBOT phones) are ignored unless another crawler token is also present.
 */
const CRAWLER_UA =
  /(?:(?<!cu)bot|crawler|spider|slurp)\b|headlesschrome|phantomjs|lighthouse|pagespeed|wget\/|curl\/|python-requests|go-http-client|scrapy|httpie\/|facebookexternalhit|embedly|ia_archiver|google-inspectiontool/i;

const DEVICE_ONLY_BOT = /\bcubot\b/i;

export function isObviousBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  const ua = userAgent.trim();
  if (!ua) return false;
  if (DEVICE_ONLY_BOT.test(ua)) {
    const scrubbed = ua.replace(/cubot/gi, "");
    return CRAWLER_UA.test(scrubbed);
  }
  return CRAWLER_UA.test(ua);
}
