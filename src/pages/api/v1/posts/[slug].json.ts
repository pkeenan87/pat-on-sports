import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import {
  entryToApiSource,
  jsonResponse,
  siteOrigin,
  toApiPostDetail,
} from "../../../../lib/api";
import { sortPostsByDate, toPostMeta } from "../../../../lib/posts";

export const getStaticPaths = (async () => {
  const posts = await getCollection("blog");
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const site = siteOrigin(import.meta.env.PUBLIC_SITE_URL);
  const collection = await getCollection("blog");
  const allMeta = sortPostsByDate(collection.map(toPostMeta));
  const source = entryToApiSource(props.post);
  const detail = toApiPostDetail(source, allMeta, site);
  return jsonResponse(detail);
};
