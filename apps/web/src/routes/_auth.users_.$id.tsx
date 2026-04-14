import { useLiveQuery } from "@tanstack/react-db";
import { usersCollection } from "@/query-collections/built-in/users";
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
  User as UserIcon,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import type { Inputs } from "@template/api/types";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router";
import { UserDetailView } from "@/components/ui/data-table/custom/users";
import {
  SchemaValidationError,
  UpdateKeyNotFoundError,
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

type UpdateUserInput = {
  firstName?: string;
  lastName?: string;
};

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Use live query to get the user with automatic updates
  const { data: rawData, isLoading } = useLiveQuery((q) =>
    q.from({ users: usersCollection }),
  );

  // Find the specific user from the collection - React Compiler handles memoization automatically
  const user = rawData && id ? rawData.find((u) => u.id === id) : undefined;

  // Check collection error state
  const collectionIsError = usersCollection.utils?.isError ?? false;
  const collectionErrorCount = usersCollection.utils?.errorCount ?? 0;

  // Plain function handlers - React Compiler memoizes automatically
  const handleUpdate = async (data: UpdateUserInput) => {
    if (!user) return;
    try {
      // Update using the collection
      const tx = usersCollection.update(user.id, (draft) => {
        Object.assign(draft, data);
      });

      // Wait for persistence if transaction is available
      if (tx?.isPersisted?.promise) {
        await tx.isPersisted.promise;
      }

      toast.success("User updated successfully");
      void navigate("/users");
    } catch (error) {
      // Handle specific error types
      if (error instanceof SchemaValidationError) {
        const firstIssue = error.issues[0];
        toast.error("Validation error", {
          description: firstIssue?.message ?? "Invalid data format",
        });
      } else if (error instanceof UpdateKeyNotFoundError) {
        toast.error("User not found", {
          description: "The user may have been deleted by another process",
        });
        void navigate("/users");
      } else {
        toast.error("Failed to update user", {
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred",
        });
      }
    }
  };

  const handleBack = () => {
    void navigate("/users");
  };

  const handleDelete = async () => {
    if (!user) return;
    try {
      // Delete using the collection
      const tx = usersCollection.delete([user.id]);

      // Wait for persistence if transaction is available
      if (tx?.isPersisted?.promise) {
        await tx.isPersisted.promise;
      }

      toast.success("User deleted successfully");
      void navigate("/users");
    } catch (error) {
      // Handle specific error types
      if (error instanceof DeleteKeyNotFoundError) {
        toast.warning("User already deleted", {
          description: "The user was already deleted by another process",
        });
        void navigate("/users");
      } else {
        toast.error("Failed to delete user", {
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
      if (usersCollection.utils?.clearError) {
        void usersCollection.utils.clearError();
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

  if (!user) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">User Not Found</h1>
        </div>
        <p className="text-muted-foreground">
          The user you are looking for does not exist or has been deleted.
        </p>
        <Button onClick={handleBack}>Back to Users</Button>
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
            <UserIcon className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Edit User</h1>
              <p className="text-muted-foreground">{user.email}</p>
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

      {/* Edit Form */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>User Details</CardTitle>
          <CardDescription>Update the user information below.</CardDescription>
        </CardHeader>
        <CardContent>
          <UserDetailView
            user={user}
            onSubmit={handleUpdate}
            onCancel={handleBack}
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user "{user.email}". This action
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
