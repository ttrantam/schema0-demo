import { client, queryClient } from "@/utils/orpc";
import {
  parseLoadSubsetOptions,
  queryCollectionOptions,
} from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/db";
import type { Inputs } from "@template/api/types";
import { z } from "zod/v4";

const SessionItemSchema = z.object({
  id: z.string(),
  trainerId: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  schedule: z.object({
    dayOfWeek: z.string(),
    startTime: z.string(),
    endTime: z.string(),
  }),
  maxParticipants: z.number().nullable().optional(),
  currentParticipants: z.number().nullable().optional(),
  pricePerSession: z.number().nullable().optional(),
  sessionType: z.enum(["one-on-one", "group"]),
  status: z.enum(["active", "inactive", "full"]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

interface SessionWithChanges {
  id: string | number | bigint;
  changes: Partial<Inputs["sessions"]["updateMany"]["sessions"][number]>;
}

export const sessionsCollection = createCollection(
  queryCollectionOptions({
    id: "sessionsMetadata",
    queryKey: ["sessionsMetadata"],
    syncMode: "eager",
    schema: SessionItemSchema,
    queryFn: async (ctx) => {
      const options = parseLoadSubsetOptions(ctx.meta?.loadSubsetOptions);
      const sessions = await client.sessions.selectAll(options);
      return sessions;
    },
    queryClient,
    getKey: (session) => session.id,

    onInsert: async ({ transaction }) => {
      const newItems = transaction.mutations.map((m) => m.modified);

      const result = await client.sessions.insertMany({
        sessions: newItems.map((session) => ({
          trainerId: session.trainerId,
          title: session.title,
          description: session.description || undefined,
          schedule: session.schedule,
          maxParticipants: session.maxParticipants || undefined,
          pricePerSession: session.pricePerSession || undefined,
          sessionType: session.sessionType || "one-on-one",
        })),
      });

      if (result.failed.length > 0) {
        throw new Error(
          `Failed to create ${result.failed.length} session(s): ${result.failed.map((f) => f.error).join(", ")}`,
        );
      }

      return result.created;
    },

    onUpdate: async ({ transaction }) => {
      const updates = transaction.mutations.map((m) => ({
        id: m.key,
        changes: m.changes as Partial<SessionWithChanges["changes"]>,
      }));

      const result = await client.sessions.updateMany({
        sessions: updates.map((update) => ({
          id: update.id as string,
          ...update.changes,
        })),
      });

      if (result.failed.length > 0) {
        throw new Error(
          `Failed to update ${result.failed.length} session(s): ${result.failed.map((f) => f.error).join(", ")}`,
        );
      }

      return result.updated;
    },

    onDelete: async ({ transaction }) => {
      const ids = transaction.mutations.map((m) => m.key as string);

      const result = await client.sessions.deleteMany({
        ids,
      });

      if (result.failed.length > 0) {
        throw new Error(
          `Failed to delete ${result.failed.length} session(s): ${result.failed.map((f) => f.error).join(", ")}`,
        );
      }

      return result.deleted as string[];
    },
  }),
);
