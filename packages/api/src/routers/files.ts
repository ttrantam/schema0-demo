import { z } from "zod/v4";
import { protectedProcedure } from "../index";
import { fetchCustomResources } from "./utils";
import { ORPCError } from "@orpc/client";
import {
  selectFilesSchema,
  filesUploadResponseSchema,
} from "@template/db/schema";

import { type SelectAllOptions } from "../utils";

export const filesRouter = {
  selectAll: protectedProcedure
    .output(z.array(selectFilesSchema))
    .handler(async ({ input }) => {
      const queryParams = new URLSearchParams();
      const options = input as SelectAllOptions;
      if (options) {
        queryParams.set("loadSubsetOption", JSON.stringify(options));
      }
      const path = queryParams.toString()
        ? `files/metadata?${queryParams.toString()}`
        : "files/metadata";
      const res = await fetchCustomResources(path, {
        method: "GET",
      });

      console.log(
        `[files.selectAll] Response status: ${res.status} ${res.statusText}`,
      );

      const rawData = await res.json();
      console.log(
        "[files.selectAll] Raw data:",
        JSON.stringify(rawData, null, 2),
      );

      try {
        const data = z.array(selectFilesSchema).parse(rawData);
        return data;
      } catch (error) {
        console.error("[files.selectAll] Validation error:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          status: 500,
          message: "Server returned invalid data",
        });
      }
    }),

  upload: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        fileName: z.string().min(1),
        fileData: z.string(), // base64 encoded string
      }),
    )
    // .output(filesUploadResponseSchema)
    .handler(async ({ input }) => {
      // Decode base64 to binary
      const binaryString = atob(input.fileData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const formData = new FormData();
      formData.append("file", new Blob([bytes]), input.fileName);
      formData.append("fileName", input.fileName);
      formData.append("id", input.id);
      const res = await fetchCustomResources(
        "files",
        {
          method: "POST",
          body: formData,
        },
        false,
      );

      const rawData = await res.json();

      try {
        const data = filesUploadResponseSchema.parse(rawData);
        return data;
      } catch {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          status: 500,
          message: "Server returned invalid data",
        });
      }
    }),

  uploadMany: protectedProcedure
    .input(
      z.object({
        files: z.array(
          z.object({
            id: z.string().min(1),
            fileName: z.string().min(1),
            fileData: z.string(), // base64 encoded string
          }),
        ),
      }),
    )
    .output(
      z.object({
        uploaded: z.array(
          z.object({
            id: z.string(),
            success: z.boolean(),
            message: z.string(),
          }),
        ),
        failed: z.array(
          z.object({
            id: z.string(),
            error: z.string(),
          }),
        ),
      }),
    )
    .handler(async ({ input }) => {
      const results = {
        uploaded: [] as Array<{
          id: string;
          success: boolean;
          message: string;
        }>,
        failed: [] as Array<{ id: string; error: string }>,
      };

      // Process files in parallel with Promise.allSettled
      const uploadPromises = input.files.map(async (file) => {
        try {
          // Decode base64 to binary
          const binaryString = atob(file.fileData);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const formData = new FormData();
          formData.append("file", new Blob([bytes]), file.fileName);
          formData.append("fileName", file.fileName);
          formData.append("id", file.id);

          const res = await fetchCustomResources(
            "files",
            {
              method: "POST",
              body: formData,
            },
            false,
          );

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }

          const rawData = await res.json();
          const data = filesUploadResponseSchema.parse(rawData);
          return { id: file.id, success: data.success, message: data.message };
        } catch (error) {
          throw {
            id: file.id,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      });

      const settled = await Promise.allSettled(uploadPromises);

      for (const result of settled) {
        if (result.status === "fulfilled") {
          results.uploaded.push(result.value);
        } else {
          results.failed.push(result.reason);
        }
      }

      return results;
    }),

  selectMetadataById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(selectFilesSchema)
    .handler(async ({ input }) => {
      const res = await fetchCustomResources(`files/${input.id}/metadata`, {
        method: "GET",
      });
      return res.json();
    }),

  download: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(z.object({ file: z.instanceof(File) }))
    .handler(async ({ input }) => {
      const res = await fetchCustomResources(`files/${input.id}/download`, {
        method: "GET",
      });

      const arrayBuffer = await res.arrayBuffer();
      const contentType =
        res.headers.get("Content-Type") || "application/octet-stream";

      // Get filename from Content-Disposition header or use a default
      const contentDisposition = res.headers.get("Content-Disposition");
      let fileName = "download";
      if (contentDisposition) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(
          contentDisposition,
        );
        if (matches?.[1]) {
          fileName = matches[1].replace(/['"]/g, "");
        }
      }

      // Create File object from ArrayBuffer
      const file = new File([arrayBuffer], fileName, { type: contentType });

      return { file };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(z.object({ message: z.string() }))
    .handler(async ({ input }) => {
      const res = await fetchCustomResources(`files/${input.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(
          // @ts-ignore
          error?.error || "Failed to delete file",
        );
      }

      return res.json();
    }),

  deleteMany: protectedProcedure
    .input(z.object({ keys: z.array(z.string()).min(1) }))
    .output(
      z.object({
        deleted: z.array(z.string()),
        failed: z.array(z.object({ id: z.string(), error: z.string() })),
      }),
    )
    .handler(async ({ input }) => {
      const results = {
        deleted: [] as string[],
        failed: [] as Array<{ id: string; error: string }>,
      };

      const deletePromises = input.keys.map(async (key) => {
        try {
          const res = await fetchCustomResources(`files/${key}`, {
            method: "DELETE",
          });

          if (!res.ok) {
            const error = await res.json();
            throw new Error(
              // @ts-ignore
              error.error || "Failed to delete file",
            );
          }

          return key;
        } catch (error) {
          throw {
            id: key,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      });

      const settled = await Promise.allSettled(deletePromises);

      for (const result of settled) {
        if (result.status === "fulfilled") {
          results.deleted.push(result.value);
        } else {
          results.failed.push(result.reason);
        }
      }

      return results;
    }),
};
