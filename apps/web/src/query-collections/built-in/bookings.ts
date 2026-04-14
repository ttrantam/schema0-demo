import { client, queryClient } from "@/utils/orpc";
import {
  parseLoadSubsetOptions,
  queryCollectionOptions,
} from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/db";
import type { Inputs } from "@template/api/types";
import { z } from "zod/v4";

const BookingItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  sessionId: z.string(),
  trainerId: z.string(),
  bookingDate: z.string(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
  notes: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

interface BookingWithChanges {
  id: string | number | bigint;
  changes: Partial<Inputs["bookings"]["updateMany"]["bookings"][number]>;
}

export const bookingsCollection = createCollection(
  queryCollectionOptions({
    id: "bookingsMetadata",
    queryKey: ["bookingsMetadata"],
    syncMode: "eager",
    schema: BookingItemSchema,
    queryFn: async (ctx) => {
      const options = parseLoadSubsetOptions(ctx.meta?.loadSubsetOptions);
      const bookings = await client.bookings.selectAll(options);
      return bookings;
    },
    queryClient,
    getKey: (booking) => booking.id,

    onInsert: async ({ transaction }) => {
      const newItems = transaction.mutations.map((m) => m.modified);

      const result = await client.bookings.insertMany({
        bookings: newItems.map((booking) => ({
          userId: booking.userId,
          sessionId: booking.sessionId,
          trainerId: booking.trainerId,
          bookingDate: booking.bookingDate,
          notes: booking.notes || undefined,
        })),
      });

      if (result.failed.length > 0) {
        throw new Error(
          `Failed to create ${result.failed.length} booking(s): ${result.failed.map((f) => f.error).join(", ")}`,
        );
      }

      return result.created;
    },

    onUpdate: async ({ transaction }) => {
      const updates = transaction.mutations.map((m) => ({
        id: m.key,
        changes: m.changes as Partial<BookingWithChanges["changes"]>,
      }));

      const result = await client.bookings.updateMany({
        bookings: updates.map((update) => ({
          id: update.id as string,
          ...update.changes,
        })),
      });

      if (result.failed.length > 0) {
        throw new Error(
          `Failed to update ${result.failed.length} booking(s): ${result.failed.map((f) => f.error).join(", ")}`,
        );
      }

      return result.updated;
    },

    onDelete: async ({ transaction }) => {
      const ids = transaction.mutations.map((m) => m.key as string);

      const result = await client.bookings.deleteMany({
        ids,
      });

      if (result.failed.length > 0) {
        throw new Error(
          `Failed to delete ${result.failed.length} booking(s): ${result.failed.map((f) => f.error).join(", ")}`,
        );
      }

      return result.deleted as string[];
    },
  }),
);
