import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const audioType = z.enum(["audio/mp4", "audio/mpeg"]);

const blog = defineCollection({
  loader: glob({ pattern: "*.md", base: "./posts" }),
  schema: z
    .object({
      title: z.string(),
      date: z.coerce.date(),
      description: z.string(),
      tags: z.array(z.string()).default([]),
      heroImage: z.string().optional(),
      heroAlt: z.string().optional(),
      heroCaption: z.string().optional(),
      audio: z.string().url().optional(),
      audioBytes: z.number().int().positive().optional(),
      audioDurationSeconds: z.number().int().positive().optional(),
      audioType: audioType.optional(),
      season: z.number().int().optional(),
      week: z.number().int().optional(),
      opponent: z.string().optional(),
      scoreUs: z.number().int().optional(),
      scoreThem: z.number().int().optional(),
      result: z.enum(["W", "L", "T"]).optional(),
      round: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (!data.audio) return;
      if (data.audioBytes == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["audioBytes"],
          message: "audioBytes is required when audio is set",
        });
      }
      if (data.audioType == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["audioType"],
          message: "audioType is required when audio is set",
        });
      }
    }),
});

export const collections = { blog };
