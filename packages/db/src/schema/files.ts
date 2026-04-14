import { z } from "zod/v4";

export const selectFilesSchema = z.object({
  id: z.string(),
  name: z.string(),
  metadata: z.record(z.string(), z.any()).optional().default({}),
});

export const filesUploadResponseSchema = z.object({
  id: z.string(),
  success: z.boolean(),
  message: z.string(),
});

export const filesLoadSubsetSchema = z.any();
