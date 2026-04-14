import { useLiveQuery } from "@tanstack/react-db";
import { filesCollection } from "@/query-collections/built-in/files";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  ArrowLeft,
  FolderOpen,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router";
import { DeleteKeyNotFoundError } from "@tanstack/db";
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
import { FileDetailView } from "@/components/ui/data-table/custom/files";
import { client } from "@/utils/orpc";

export default function FileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileDataUrl, setFileDataUrl] = useState<string | undefined>(undefined);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Use live query to get all files with automatic updates
  const { data: rawData, isLoading } = useLiveQuery((q) =>
    q.from({ files: filesCollection }),
  );

  // Find the specific file from the collection - React Compiler handles memoization automatically
  const file = rawData && id ? rawData.find((f) => f.id === id) : undefined;

  // Check collection error state
  const collectionIsError = filesCollection.utils?.isError ?? false;
  const collectionErrorCount = filesCollection.utils?.errorCount ?? 0;

  // Fetch file data for preview
  // @ts-ignore
  // useEffect(() => {
  //   if (!file?.id) return;

  //   const fetchFileData = async () => {
  //     setIsLoadingPreview(true);
  //     try {
  //       const { file: downloadedFile } = await client.files.download({
  //         id: file.id,
  //       });
  //       const dataUrl = URL.createObjectURL(downloadedFile);
  //       setFileDataUrl(dataUrl);
  //     } catch (error) {
  //       console.error("Failed to fetch file preview:", error);
  //       // Don't show error toast - preview is optional
  //     } finally {
  //       setIsLoadingPreview(false);
  //     }
  //   };

  //   void fetchFileData();

  //   // Cleanup object URL on unmount
  //   return () => {
  //     if (fileDataUrl) {
  //       URL.revokeObjectURL(fileDataUrl);
  //     }
  //   };
  // }, [file?.id]);

  // Plain function handlers - React Compiler memoizes automatically
  const handleBack = () => {
    void navigate("/files");
  };

  const handleDownload = async () => {
    if (!file?.id) return;

    try {
      const { file: downloadedFile } = await client.files.download({
        id: file.id,
      });
      const url = URL.createObjectURL(downloadedFile);

      // Create a temporary link and trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = downloadedFile.name || file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("File downloaded successfully");
    } catch (error) {
      toast.error("Failed to download file", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    }
  };

  const handleDelete = async () => {
    if (!file) return;
    try {
      // Delete using the collection
      const tx = filesCollection.delete([file.id]);

      // Wait for persistence if transaction is available
      if (tx?.isPersisted?.promise) {
        await tx.isPersisted.promise;
      }

      toast.success("File deleted successfully");
      void navigate("/files");
    } catch (error) {
      // Handle specific error types
      if (error instanceof DeleteKeyNotFoundError) {
        toast.warning("File already deleted", {
          description: "The file was already deleted by another process",
        });
        void navigate("/files");
      } else {
        toast.error("Failed to delete file", {
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred",
        });
      }
    }
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

  if (!file) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">File Not Found</h1>
        </div>
        <p className="text-muted-foreground">
          The file you are looking for does not exist or has been deleted.
        </p>
        <Button onClick={handleBack}>Back to Files</Button>
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <FolderOpen className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">File Details</h1>
              <p className="text-muted-foreground">{file.name}</p>
            </div>
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDeleteDialogOpen(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

      {/* File Details */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>File Information</CardTitle>
          <CardDescription>View file details and metadata.</CardDescription>
        </CardHeader>
        <CardContent>
          <FileDetailView
            file={file}
            fileDataUrl={fileDataUrl}
            isLoadingPreview={isLoadingPreview}
            onBack={handleBack}
            onDownload={handleDownload}
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the file "{file.name}". This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
