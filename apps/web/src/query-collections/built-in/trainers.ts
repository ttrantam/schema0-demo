import { client, queryClient } from "@/utils/orpc";
import {
  parseLoadSubsetOptions,
  queryCollectionOptions,
} from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/db";
import type { Inputs } from "@template/api/types";
import { z } from "zod/v4";

const TrainerItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  profilePictureUrl: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  specialization: z.string().nullable().optional(),
  certifications: z.array(z.string()).nullable().optional(),
  rating: z.number().nullable().optional(),
  hourlyRate: z.number().nullable().optional(),
  yearsExperience: z.number().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

interface TrainerWithChanges {
  id: string | number | bigint;
  changes: Partial<Inputs["trainers"]["updateMany"]["trainers"][number]>;
}

export const trainersCollection = createCollection(
  queryCollectionOptions({
    id: "trainersMetadata",
    queryKey: ["trainersMetadata"],
    syncMode: "eager",
    schema: TrainerItemSchema,
    queryFn: async (ctx) => {
      const options = parseLoadSubsetOptions(ctx.meta?.loadSubsetOptions);
      const trainers = await client.trainers.selectAll(options);
      return trainers;
    },
    queryClient,
    getKey: (trainer) => trainer.id,

    onInsert: async ({ transaction }) => {
      const newItems = transaction.mutations.map((m) => m.modified);

      const result = await client.trainers.insertMany({
        trainers: newItems.map((trainer) => ({
          userId: trainer.userId,
          firstName: trainer.firstName,
          lastName: trainer.lastName,
          email: trainer.email,
          profilePictureUrl: trainer.profilePictureUrl || undefined,
          bio: trainer.bio || undefined,
          specialization: trainer.specialization || undefined,
          certifications: trainer.certifications || undefined,
          hourlyRate: trainer.hourlyRate || undefined,
          yearsExperience: trainer.yearsExperience || undefined,
        })),
      });

      if (result.failed.length > 0) {
        throw new Error(
          `Failed to create ${result.failed.length} trainer(s): ${result.failed.map((f) => f.error).join(", ")}`,
        );
      }

      return result.created;
    },

    onUpdate: async ({ transaction }) => {
      const updates = transaction.mutations.map((m) => ({
        id: m.key,
        changes: m.changes as Partial<TrainerWithChanges["changes"]>,
      }));

      const result = await client.trainers.updateMany({
        trainers: updates.map((update) => ({
          id: update.id as string,
          ...update.changes,
        })),
      });

      if (result.failed.length > 0) {
        throw new Error(
          `Failed to update ${result.failed.length} trainer(s): ${result.failed.map((f) => f.error).join(", ")}`,
        );
      }

      return result.updated;
    },

    onDelete: async ({ transaction }) => {
      const ids = transaction.mutations.map((m) => m.key as string);

      const result = await client.trainers.deleteMany({
        ids,
      });

      if (result.failed.length > 0) {
        throw new Error(
          `Failed to delete ${result.failed.length} trainer(s): ${result.failed.map((f) => f.error).join(", ")}`,
        );
      }

      return result.deleted as string[];
    },
  }),
);
