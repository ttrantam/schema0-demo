import { z } from "zod/v4";
import { protectedProcedure } from "../index";
import { fetchCustomResources } from "./utils";
import {
  selectBookingsSchema,
  insertBookingsSchema,
  updateBookingsSchema,
} from "@template/db/schema";
import type { SelectAllOptions } from "../utils";

function hasErrors(
  value: unknown,
): value is { errors: Array<{ message?: string }> } {
  return (
    typeof value === "object" &&
    value !== null &&
    "errors" in value &&
    Array.isArray((value as { errors: unknown }).errors)
  );
}

function hasMessage(value: unknown): value is { message: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof (value as { message: unknown }).message === "string"
  );
}

export const bookingsRouter = {
  selectAll: protectedProcedure
    .output(z.array(selectBookingsSchema))
    .handler(async ({ input }) => {
      const queryParams = new URLSearchParams();
      const castInput = input as SelectAllOptions;
      if (castInput) {
        if (castInput.limit)
          queryParams.set("limit", castInput.limit.toString());
        if (castInput.offset)
          queryParams.set("offset", castInput.offset.toString());
      }
      const path = queryParams.toString()
        ? `bookings?${queryParams.toString()}`
        : "bookings";
      const res = await fetchCustomResources(path, {
        method: "GET",
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch bookings: ${res.status}`);
      }
      return await res.json();
    }),

  selectById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(selectBookingsSchema)
    .handler(async ({ input }) => {
      const res = await fetchCustomResources(`bookings/${input.id}`, {
        method: "GET",
      });      if (!res.ok) {
        throw new Error(`Failed to fetch booking: ${res.status}`);
      }      return res.json();
    }),

  selectByUserId: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .output(z.array(selectBookingsSchema))
    .handler(async ({ input }) => {
      const res = await fetchCustomResources(
        `bookings?userId=${input.userId}`,
        { method: "GET" },
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch bookings by user: ${res.status}`);
      }
      return await res.json();
    }),

  selectByTrainerId: protectedProcedure
    .input(z.object({ trainerId: z.string() }))
    .output(z.array(selectBookingsSchema))
    .handler(async ({ input }) => {
      const res = await fetchCustomResources(
        `bookings?trainerId=${input.trainerId}`,
        { method: "GET" },
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch bookings by trainer: ${res.status}`);
      }
      return await res.json();
    }),

  insertMany: protectedProcedure
    .input(z.object({ bookings: z.array(insertBookingsSchema) }))
    .handler(async ({ input }) => {
      const results = await Promise.allSettled(
        input.bookings.map(async (bookingData) => {
          const res = await fetchCustomResources("bookings", {
            method: "POST",
            body: JSON.stringify(bookingData),
          });

          if (res.status === 200) {
            return await res.json();
          } else if (res.status === 400) {
            const errorData = await res.json();
            const errorMessage =
              (hasErrors(errorData) && errorData.errors?.[0]?.message) ||
              (hasMessage(errorData) && errorData.message) ||
              "Could not create booking.";
            throw new Error(errorMessage);
          } else {
            throw new Error("Booking creation failed");
          }
        }),
      );

      const created = [];
      const failed = [];

      for (const result of results) {
        if (result.status === "fulfilled") {
          created.push(result.value);
        } else {
          failed.push({
            error:
              result.reason instanceof Error
                ? result.reason.message
                : "Unknown error",
          });
        }
      }

      return { created, failed };
    }),

  updateMany: protectedProcedure
    .input(z.object({ bookings: z.array(updateBookingsSchema) }))
    .handler(async ({ input }) => {
      const results = await Promise.allSettled(
        input.bookings.map(async (bookingData) => {
          const { id, ...updateData } = bookingData;
          const res = await fetchCustomResources(`bookings/${id}`, {
            method: "PATCH",
            body: JSON.stringify(updateData),
          });

          if (res.status === 200) {
            return await res.json();
          } else if (res.status === 404) {
            throw new Error("Booking not found");
          } else {
            throw new Error("Booking update failed");
          }
        }),
      );

      const updated = [];
      const failed = [];

      for (const result of results) {
        if (result.status === "fulfilled") {
          updated.push(result.value);
        } else {
          failed.push({
            error:
              result.reason instanceof Error
                ? result.reason.message
                : "Unknown error",
          });
        }
      }

      return { updated, failed };
    }),

  deleteMany: protectedProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .handler(async ({ input }) => {
      const results = await Promise.allSettled(
        input.ids.map(async (id) => {
          const res = await fetchCustomResources(`bookings/${id}`, {
            method: "DELETE",
          });

          if (res.status === 200) {
            return { id };
          } else if (res.status === 404) {
            throw new Error("Booking not found");
          } else {
            throw new Error("Delete failed");
          }
        }),
      );

      const deleted = [];
      const failed = [];

      for (const result of results) {
        if (result.status === "fulfilled") {
          deleted.push(result.value.id);
        } else {
          failed.push({
            error:
              result.reason instanceof Error
                ? result.reason.message
                : "Unknown error",
          });
        }
      }

      return { deleted, failed };
    }),
};
