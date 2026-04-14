import { useLiveQuery } from "@tanstack/react-db";
import { filesCollection } from "@/query-collections/built-in/files";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, FolderOpen, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { selectFilesSchema } from "@template/db/schema";
import type { z } from "zod/v4";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import {
  SchemaValidationError,
  DuplicateKeyError,
  DeleteKeyNotFoundError,
} from "@tanstack/db";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DataTable } from "@/components/ui/data-table";
import { FilesDialog, columns } from "@/components/ui/data-table/custom/files";
import { useDataTableState } from "@/components/ui/data-table/context";

type FileMetadata = z.infer<typeof selectFilesSchema>;

export default function FilesPage() {
  const navigate = useNavigate();

  // Use the custom hook for all table state
  const tableState = useDataTableState({
    defaultPageSize: 25,
  });

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileMetadata | undefined>(
    undefined,
  );

  // Use live query with server-side pagination
  const pageSize = tableState.pagination.pageSize;
  const pageIndex = tableState.pagination.pageIndex;
  const { data: rawData, isLoading } = useLiveQuery((q) =>
    q
      .from({ files: filesCollection })
      .orderBy(({ files }) => files.name, "asc")
      .limit(pageSize + 1) // Fetch one extra to determine if there are more pages
      .offset(pageIndex * pageSize),
  );

  // Check collection error state
  const collectionIsError = filesCollection.utils?.isError ?? false;
  const collectionErrorCount = filesCollection.utils?.errorCount ?? 0;

  // Derive selected files from rowSelection state
  const selectedFiles = Object.keys(tableState.rowSelection)
    .filter((index) => tableState.rowSelection[index])
    .map((index) => rawData?.[parseInt(index)])
    .filter(Boolean) as FileMetadata[];

  // Plain function handlers - React Compiler memoizes automatically
  const handleUpload = async (file: File) => {
    try {
      // Insert file metadata into the collection
      const tx = filesCollection.insert([
        {
          id: crypto.randomUUID() as string,
          name: file.name,
          file: file,
          metadata: {},
        },
      ]);

      // Wait for persistence
      if (tx?.isPersisted?.promise) {
        await tx.isPersisted.promise;
      }

      setDialogOpen(false);
      toast.success("File uploaded successfully");
    } catch (error) {
      // Handle specific error types
      if (error instanceof SchemaValidationError) {
        const firstIssue = error.issues[0];
        toast.error("Validation error", {
          description: firstIssue?.message ?? "Invalid file data",
        });
      } else if (error instanceof DuplicateKeyError) {
        toast.error("File already exists", {
          description: "A file with this ID already exists",
        });
      } else {
        toast.error("Failed to upload file", {
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred",
        });
      }
    }
  };

  const handleDownload = (_file: FileMetadata) => {
    // Placeholder for download functionality
    toast.info("Download feature coming soon");
  };

  const handleCreateNew = () => {
    setDialogOpen(true);
  };

  const handleDeleteClick = (file: FileMetadata) => {
    setFileToDelete(file);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (fileToDelete) {
      try {
        // Delete using the collection
        const tx = filesCollection.delete([fileToDelete.id]);

        // Wait for persistence if transaction is available
        if (tx?.isPersisted?.promise) {
          await tx.isPersisted.promise;
        }

        setDeleteDialogOpen(false);
        setFileToDelete(undefined);
        toast.success("File deleted successfully");
      } catch (error) {
        // Handle specific error types
        if (error instanceof DeleteKeyNotFoundError) {
          toast.warning("File already deleted", {
            description: "The file was already deleted by another process",
          });
          setDeleteDialogOpen(false);
          setFileToDelete(undefined);
        } else {
          toast.error("Failed to delete file", {
            description:
              error instanceof Error
                ? error.message
                : "An unexpected error occurred",
          });
        }
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.length > 0) {
      try {
        // Delete using the collection
        const tx = filesCollection.delete(selectedFiles.map((f) => f.id));

        // Wait for persistence if transaction is available
        if (tx?.isPersisted?.promise) {
          await tx.isPersisted.promise;
        }

        tableState.setRowSelection({});
        setDeleteDialogOpen(false);
        toast.success(
          `${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""} deleted successfully`,
        );
      } catch (error) {
        // Handle specific error types
        if (error instanceof DeleteKeyNotFoundError) {
          toast.warning("Some files already deleted", {
            description:
              "One or more files were already deleted by another process",
          });
          tableState.setRowSelection({});
          setDeleteDialogOpen(false);
        } else {
          toast.error("Failed to delete files", {
            description:
              error instanceof Error
                ? error.message
                : "An unexpected error occurred",
          });
        }
      }
    }
  };

  const handleRowDoubleClick = (file: FileMetadata) => {
    void navigate(`/files/${file.id}`);
  };

  // Handle collection cleanup
  const handleClearError = async () => {
    try {
      if (filesCollection.utils?.clearError) {
        void filesCollection.utils.clearError();
        toast.success("Retrying sync...");
      }
    } catch (error) {
      toast.error("Failed to clear error", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Collection Error Alert */}
      {collectionIsError && collectionErrorCount > 3 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                Sync Error
              </h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                Unable to sync with server. Showing cached data. You can still
                view and modify data locally.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearError}
              className="border-yellow-300 dark:border-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/40"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <FolderOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Files</h1>
            <p className="text-muted-foreground">Manage your files</p>
          </div>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Upload File
        </Button>
      </div>

      {/* Data Table with meta prop for action handlers */}
      <DataTable
        data={(rawData?.filter(Boolean) ?? []) as FileMetadata[]}
        columns={columns}
        tableState={tableState}
        meta={{
          onDownload: handleDownload,
          onDelete: handleDeleteClick,
        }}
        onBulkDelete={() => setDeleteDialogOpen(true)}
        onRowDoubleClick={handleRowDoubleClick}
        searchColumn="name"
        searchPlaceholder="Search by name..."
        defaultSortColumn="name"
      />

      {/* Upload Dialog */}
      <FilesDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleUpload}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {fileToDelete
                ? `This will permanently delete the file "${fileToDelete.name}".`
                : `This will permanently delete ${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""}.`}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={fileToDelete ? handleConfirmDelete : handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
