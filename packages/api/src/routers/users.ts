import { z } from "zod/v4";
import { protectedProcedure } from "../index";
import { fetchCustomResources } from "./utils";
import {
  selectUsersSchema,
  insertUsersSchema,
  updateUsersSchema,
} from "@template/db/schema";

// Type guard for error data
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

import { type SelectAllOptions } from "../utils";

export const usersRouter = {
  selectAll: protectedProcedure
    .output(z.array(selectUsersSchema))
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
        ? `users?${queryParams.toString()}`
        : "users";
      const res = await fetchCustomResources(path, {
        method: "GET",
      });
      return await res.json();
    }),

  selectById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(selectUsersSchema)
    .handler(async ({ input }) => {
      const res = await fetchCustomResources(`users/${input.id}`, {
        method: "GET",
      });
      return res.json();
    }),

  insertMany: protectedProcedure
    .input(z.object({ users: z.array(insertUsersSchema) }))
    .handler(async ({ input }) => {
      // Process all users in parallel for better performance
      const results = await Promise.allSettled(
        input.users.map(async (userData) => {
          const res = await fetchCustomResources("users", {
            method: "POST",
            body: JSON.stringify(userData),
          });

          if (res.status === 200) {
            return await res.json();
          } else if (res.status === 400) {
            const errorData = await res.json();
            const errorMessage =
              (hasErrors(errorData) && errorData.errors?.[0]?.message) ||
              (hasMessage(errorData) && errorData.message) ||
              "Could not create user.";
            throw new Error(errorMessage);
          } else {
            throw new Error("User creation failed");
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
    .input(z.object({ users: z.array(updateUsersSchema) }))
    .handler(async ({ input }) => {
      // Process all updates in parallel
      const results = await Promise.allSettled(
        input.users.map(async (userData) => {
          const { id, ...updateData } = userData;
          const res = await fetchCustomResources(`users/${id}`, {
            method: "PATCH",
            body: JSON.stringify(updateData),
          });

          if (!res.ok) {
            throw new Error(`Failed to update user ${id}`);
          }

          return await res.json();
        }),
      );

      const updated = [];
      const failed = [];

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const user = input.users[i];
        if (result?.status === "fulfilled") {
          updated.push(result.value);
        } else if (user) {
          const reason =
            result?.status === "rejected" ? result.reason : undefined;
          failed.push({
            id: user.id,
            error: reason instanceof Error ? reason.message : "Unknown error",
          });
        }
      }

      return { updated, failed };
    }),

  deleteMany: protectedProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .handler(async ({ input }) => {
      // Process all deletions in parallel
      const results = await Promise.allSettled(
        input.ids.map(async (id) => {
          const res = await fetchCustomResources(`users/${id}`, {
            method: "DELETE",
          });

          if (!res.ok) {
            throw new Error(`Failed to delete user ${id}`);
          }

          return id;
        }),
      );

      const deleted = [];
      const failed = [];

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const id = input.ids[i];
        if (result?.status === "fulfilled") {
          deleted.push(result.value);
        } else {
          const reason =
            result?.status === "rejected" ? result.reason : undefined;
          failed.push({
            id,
            error: reason instanceof Error ? reason.message : "Unknown error",
          });
        }
      }

      return { deleted, failed };
    }),
};
