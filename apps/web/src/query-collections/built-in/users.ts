import { client, queryClient } from "@/utils/orpc";
import {
  parseLoadSubsetOptions,
  queryCollectionOptions,
} from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/db";
import type { Inputs } from "@template/api/types";
import { z } from "zod/v4";

const UserItemSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  emailVerified: z.boolean().optional(),
  profilePictureUrl: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

interface UserWithChanges {
  id: string | number | bigint;
  changes: Partial<Inputs["users"]["updateMany"]["users"][number]>;
}

export const usersCollection = createCollection(
  queryCollectionOptions({
    id: "usersMetadata",
    queryKey: ["usersMetadata"],
    syncMode: "eager",
    schema: UserItemSchema,
    queryFn: async (ctx) => {
      const options = parseLoadSubsetOptions(ctx.meta?.loadSubsetOptions);
      const users = await client.users.selectAll(options);
      return users;
    },
    queryClient,
    getKey: (user) => user.id,

    onInsert: async ({ transaction }) => {
      const newItems = transaction.mutations.map((m) => m.modified);

      // Use insertMany for bulk inserts
      const result = await client.users.insertMany({
        users: newItems.map((user) => ({
          email: user.email,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
        })),
      });

      // If any creations failed, throw an error
      if (result.failed.length > 0) {
        throw new Error(
          `Failed to create ${result.failed.length} user(s): ${result.failed.map((f) => f.error).join(", ")}`,
        );
      }

      return result.created;
    },

    onUpdate: async ({ transaction }) => {
      const updates = transaction.mutations.map((m) => ({
        id: m.key,
        changes: m.changes as Partial<UserWithChanges["changes"]>,
      }));

      // Use updateMany for bulk updates
      const result = await client.users.updateMany({
        users: updates.map((update) => ({
          id: update.id,
          ...update.changes,
        })),
      });

      // If any updates failed, throw an error
      if (result.failed.length > 0) {
        throw new Error(
          `Failed to update ${result.failed.length} user(s): ${result.failed.map((f) => f.error).join(", ")}`,
        );
      }

      return result.updated;
    },

    onDelete: async ({ transaction }) => {
      const ids = transaction.mutations.map((m) => m.key);

      // Use deleteMany for bulk deletions
      const result = await client.users.deleteMany({
        ids: ids as Inputs["users"]["deleteMany"]["ids"],
      });

      return result.deleted;
    },
  }),
);
