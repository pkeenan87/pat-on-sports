import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blog = defineCollection({
  loader: glob({ pattern: "*.md", base: "./posts" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    heroImage: z.string().optional(),
    heroAlt: z.string().optional(),
    heroCaption: z.string().optional(),
    audio: z.string().optional(),
    season: z.number().int().optional(),
    week: z.number().int().optional(),
    opponent: z.string().optional(),
    scoreUs: z.number().int().optional(),
    scoreThem: z.number().int().optional(),
    result: z.enum(["W", "L", "T"]).optional(),
    round: z.string().optional(),
  }),
});

export const collections = { blog };
