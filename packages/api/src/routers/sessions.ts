import { z } from "zod/v4";
import { protectedProcedure } from "../index";
import { fetchCustomResources } from "./utils";
import {
  selectSessionsSchema,
  insertSessionsSchema,
  updateSessionsSchema,
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

export const sessionsRouter = {
  selectAll: protectedProcedure
    .output(z.array(selectSessionsSchema))
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
        ? `sessions?${queryParams.toString()}`
        : "sessions";
      const res = await fetchCustomResources(path, {
        method: "GET",
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch sessions: ${res.status}`);
      }
      return await res.json();
    }),

  selectById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(selectSessionsSchema)
    .handler(async ({ input }) => {
      const res = await fetchCustomResources(`sessions/${input.id}`, {
        method: "GET",
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch session: ${res.status}`);
      }
      return res.json();
    }),

  selectByTrainerId: protectedProcedure
    .input(z.object({ trainerId: z.string() }))
    .output(z.array(selectSessionsSchema))
    .handler(async ({ input }) => {
      const res = await fetchCustomResources(
        `sessions?trainerId=${input.trainerId}`,
        { method: "GET" },
      );
      return await res.json();
    }),

  insertMany: protectedProcedure
    .input(z.object({ sessions: z.array(insertSessionsSchema) }))
    .handler(async ({ input }) => {
      const results = await Promise.allSettled(
        input.sessions.map(async (sessionData) => {
          const res = await fetchCustomResources("sessions", {
            method: "POST",
            body: JSON.stringify(sessionData),
          });

          if (res.status === 200) {
            return await res.json();
          } else if (res.status === 400) {
            const errorData = await res.json();
            const errorMessage =
              (hasErrors(errorData) && errorData.errors?.[0]?.message) ||
              (hasMessage(errorData) && errorData.message) ||
              "Could not create session.";
            throw new Error(errorMessage);
          } else {
            throw new Error("Session creation failed");
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
    .input(z.object({ sessions: z.array(updateSessionsSchema) }))
    .handler(async ({ input }) => {
      const results = await Promise.allSettled(
        input.sessions.map(async (sessionData) => {
          const { id, ...updateData } = sessionData;
          const res = await fetchCustomResources(`sessions/${id}`, {
            method: "PATCH",
            body: JSON.stringify(updateData),
          });

          if (res.status === 200) {
            return await res.json();
          } else if (res.status === 404) {
            throw new Error("Session not found");
          } else {
            throw new Error("Session update failed");
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
          const res = await fetchCustomResources(`sessions/${id}`, {
            method: "DELETE",
          });

          if (res.status === 200) {
            return { id };
          } else if (res.status === 404) {
            throw new Error("Session not found");
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
