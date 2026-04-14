import { z } from "zod/v4";
import { protectedProcedure } from "../index";
import { fetchCustomResources } from "./utils";
import {
  selectTrainersSchema,
  insertTrainersSchema,
  updateTrainersSchema,
} from "@template/db/schema";
import type { SelectAllOptions } from "../utils";

// Type guards for error handling
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

export const trainersRouter = {
  selectAll: protectedProcedure
    .output(z.array(selectTrainersSchema))
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
        ? `trainers?${queryParams.toString()}`
        : "trainers";
      const res = await fetchCustomResources(path, {
        method: "GET",
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch trainers: ${res.status}`);
      }
      return await res.json();
    }),

  selectById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(selectTrainersSchema)
    .handler(async ({ input }) => {
      const res = await fetchCustomResources(`trainers/${input.id}`, {
        method: "GET",
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch trainer: ${res.status}`);
      }
      return res.json();
    }),

  insertMany: protectedProcedure
    .input(z.object({ trainers: z.array(insertTrainersSchema) }))
    .handler(async ({ input }) => {
      const results = await Promise.allSettled(
        input.trainers.map(async (trainerData) => {
          const res = await fetchCustomResources("trainers", {
            method: "POST",
            body: JSON.stringify(trainerData),
          });

          if (res.status === 200) {
            return await res.json();
          } else {
            const errorData = await res.json();
            const errorMessage =
              (hasErrors(errorData) && errorData.errors?.[0]?.message) ||
              (hasMessage(errorData) && errorData.message) ||
              "Could not create trainer profile.";
            throw new Error(errorMessage);
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
    .input(z.object({ trainers: z.array(updateTrainersSchema) }))
    .handler(async ({ input }) => {
      const results = await Promise.allSettled(
        input.trainers.map(async (trainerData) => {
          const { id, ...updateData } = trainerData;
          const res = await fetchCustomResources(`trainers/${id}`, {
            method: "PATCH",
            body: JSON.stringify(updateData),
          });

          if (res.status === 200) {
            return await res.json();
          } else if (res.status === 404) {
            throw new Error("Trainer not found");
          } else {
            throw new Error("Trainer update failed");
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
          const res = await fetchCustomResources(`trainers/${id}`, {
            method: "DELETE",
          });

          if (res.status === 200) {
            return { id };
          } else if (res.status === 404) {
            throw new Error("Trainer not found");
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
