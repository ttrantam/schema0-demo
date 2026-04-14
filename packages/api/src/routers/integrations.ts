import { z } from "zod/v4";
import { ORPCError } from "@orpc/server";
import { protectedProcedure } from "../index";
import { fetchCustomResources } from "./utils";

const connectionSchema = z.looseObject({
  key: z.string(),
  platform: z.string(),
});

const actionSchema = z.looseObject({
  systemId: z.string(),
  title: z.string(),
});

const actionDetailsSchema = z.looseObject({
  _id: z.string(),
  title: z.string(),
});

export const integrationsRouter = {
  listConnections: protectedProcedure
    .input(
      z
        .object({
          platform: z.string().optional(),
          page: z.number().optional(),
          limit: z.number().optional(),
        })
        .optional(),
    )
    .output(z.looseObject({ rows: z.array(connectionSchema) }))
    .handler(async ({ input }) => {
      const params = new URLSearchParams();
      if (input?.platform) params.set("platform", input.platform);
      if (input?.page != null) params.set("page", input.page.toString());
      if (input?.limit) params.set("limit", input.limit.toString());

      const path = params.toString()
        ? `integrations/connections?${params.toString()}`
        : "integrations/connections";

      const res = await fetchCustomResources(path, { method: "GET" });
      if (!res.ok) {
        throw new Error("Failed to fetch connections");
      }
      return res.json();
    }),

  listActions: protectedProcedure
    .input(
      z.object({
        platform: z.string(),
        query: z.string(),
        page: z.number().optional(),
        limit: z.number().optional(),
      }),
    )
    .output(z.array(actionSchema))
    .handler(async ({ input }) => {
      const params = new URLSearchParams();
      params.set("platform", input.platform);
      params.set("query", input.query);
      if (input.page != null) params.set("page", input.page.toString());
      if (input.limit) params.set("limit", input.limit.toString());

      const res = await fetchCustomResources(
        `integrations/actions?${params.toString()}`,
        { method: "GET" },
      );
      if (!res.ok) {
        throw new Error("Failed to fetch actions");
      }
      return res.json();
    }),

  getActionDetails: protectedProcedure
    .input(z.object({ _id: z.string() }))
    .output(z.looseObject({ rows: z.array(actionDetailsSchema) }))
    .handler(async ({ input }) => {
      const res = await fetchCustomResources(
        `integrations/actions/details?_id=${encodeURIComponent(input._id)}`,
        { method: "GET" },
      );
      if (!res.ok) {
        throw new Error("Failed to fetch action details");
      }
      return res.json();
    }),

  execute: protectedProcedure
    .input(
      z.object({
        platform: z.string(),
        path: z.string(),
        actionId: z.string().optional(),
        method: z.string().optional(),
        data: z.unknown().optional(),
        headers: z.record(z.string(), z.string()).optional(),
        queryParams: z.record(z.string(), z.string()).optional(),
        pathParams: z.record(z.string(), z.string()).optional(),
      }),
    )
    .handler(async ({ input }) => {
      const res = await fetchCustomResources("integrations/execute", {
        method: "POST",
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        const code = res.status === 400 ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR";
        throw new ORPCError(code, {
          message: error?.error || "Failed to execute action",
          data: error?.details,
        });
      }
      return res.json();
    }),
};
