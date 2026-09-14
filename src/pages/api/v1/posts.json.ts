import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import {
  buildPostsFeed,
  entryToApiSource,
  jsonResponse,
  siteOrigin,
} from "../../../lib/api";
import { sortPostsByDate } from "../../../lib/posts";

export const GET: APIRoute = async () => {
  const site = siteOrigin(import.meta.env.PUBLIC_SITE_URL);
  const collection = await getCollection("blog");
  const posts = sortPostsByDate(collection.map(entryToApiSource));
  const feed = buildPostsFeed(posts, site);
  return jsonResponse(feed);
};
