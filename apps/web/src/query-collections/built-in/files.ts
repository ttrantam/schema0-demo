import { client, queryClient } from "@/utils/orpc";
import {
  parseLoadSubsetOptions,
  queryCollectionOptions,
} from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/db";
import { z } from "zod/v4";

const FileMetadataItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  file: z.any().optional(),
  metadata: z.record(z.string(), z.any()).default({}),
});

export const filesCollection = createCollection(
  queryCollectionOptions({
    id: "filesMetadata",
    queryKey: ["filesMetadata"],
    syncMode: "eager",
    schema: FileMetadataItemSchema,
    getKey: (item) => item.id,
    queryFn: async (ctx) => {
      const options = parseLoadSubsetOptions(ctx.meta?.loadSubsetOptions);
      const files = await client.files.selectAll(options);
      console.log("files");
      console.log(files);
      return files;
    },
    queryClient,
    onInsert: async ({ transaction }) => {
      const inserts = transaction.mutations.map((m) => ({
        id: m.key,
        changes: m.modified,
      }));

      // Handle single or multiple file uploads
      if (inserts.length === 1) {
        // Single file upload
        const insert = inserts[0];
        const file = insert.changes.file;
        if (!file) {
          throw new Error("File is required for upload");
        }

        // Convert File to base64 for transmission via ORPC
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Data = btoa(binary);

        // Use ORPC client to upload file
        const res = await client.files.upload({
          id: insert.id,
          fileName: insert.changes?.name,
          fileData: base64Data,
        });

        // Return the full file metadata object
        return [
          {
            id: res.id,
            name: insert.changes?.name ?? file.name,
            metadata: insert.changes.metadata ?? {},
          },
        ];
      }

      // Multiple file uploads - use uploadMany for better performance
      const filesToUpload = await Promise.all(
        inserts.map(async (insert) => {
          const file = insert.changes.file;
          if (!file) {
            throw new Error("File is required for upload");
          }

          // Convert File to base64 for transmission via ORPC
          const arrayBuffer = await file.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          let binary = "";
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64Data = btoa(binary);

          return {
            id: insert.id,
            fileName: insert.changes?.name ?? file.name,
            fileData: base64Data,
          };
        }),
      );

      // Use uploadMany for bulk upload
      const result = await client.files.uploadMany({
        files: filesToUpload,
      });

      // Combine uploaded and failed results
      const insertedItems = result.uploaded.map((upload) => ({
        id: upload.id,
        name: inserts.find((i) => i.id === upload.id)?.changes?.name ?? "",
        metadata: inserts.find((i) => i.id === upload.id)?.changes?.metadata ?? {},
      }));

      // If any uploads failed, throw an error with details
      if (result.failed.length > 0) {
        const failedIds = result.failed.map((f) => f.id).join(", ");
        throw new Error(
          `Failed to upload ${result.failed.length} file(s): ${failedIds}`,
        );
      }

      return insertedItems;
    },

    onUpdate: async ({ transaction }) => {
      const updates = transaction.mutations.map((m) => ({
        key: m.key,
        changes: m.changes,
      }));

      const updatedItems = await Promise.all(
        updates.map(async (update) => {
          // For now, updates are not fully implemented in the ORPC router
          // Return the updated item from local state
          return {
            id: update.key,
            name: update.changes.name ?? "",
            metadata: update.changes.metadata,
          };
        }),
      );

      return updatedItems;
    },

    onDelete: async ({ transaction }) => {
      const deletions = transaction.mutations.map((m) => ({
        key: m.key,
      }));

      // Use deleteMany for batch deletions
      if (deletions.length > 1) {
        const keys = deletions
          .map((d) => d.key)
          .filter((k): k is string => !!k);
        if (keys.length > 0) {
          const result = await client.files.deleteMany({ keys });
          return result.deleted;
        }
        return [];
      } else if (deletions.length === 1 && deletions[0].key) {
        // Use single delete for one file
        await client.files.delete({ id: deletions[0].key });
        return [deletions[0].key];
      }

      return deletions.map((d) => d.key);
    },
  }),
);
