import { useLiveQuery } from "@tanstack/react-db";
import { usersCollection } from "@/query-collections/built-in/users";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Users as UsersIcon, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { selectUsersSchema } from "@template/db/schema";
import type { z } from "zod/v4";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import {
  SchemaValidationError,
  DuplicateKeyError,
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
import { DataTable } from "@/components/ui/data-table";
import { UsersDialog, columns } from "@/components/ui/data-table/custom/users";
import { useDataTableState } from "@/components/ui/data-table/context";

type User = z.infer<typeof selectUsersSchema>;

type CreateUserData = {
  email: string;
  firstName?: string;
  lastName?: string;
  password?: string;
};

type UpdateUserData = {
  id: string;
  firstName?: string;
  lastName?: string;
};

export default function UsersPage() {
  const navigate = useNavigate();

  // Use the custom hook for all table state
  const tableState = useDataTableState({
    defaultPageSize: 25,
  });

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | undefined>(undefined);

  // Use live query with server-side pagination
  const pageSize = tableState.pagination.pageSize;
  const pageIndex = tableState.pagination.pageIndex;
  const { data: rawData, isLoading } = useLiveQuery((q) =>
    q
      .from({ users: usersCollection })
      .orderBy(({ users }) => users.email, "asc")
      .limit(pageSize + 1) // Fetch one extra to determine if there are more pages
      .offset(pageIndex * pageSize),
  );

  // Check collection error state
  const collectionIsError = usersCollection.utils?.isError ?? false;
  const collectionErrorCount = usersCollection.utils?.errorCount ?? 0;

  // Derive selected users from rowSelection state
  const selectedUsers = Object.keys(tableState.rowSelection)
    .filter((index) => tableState.rowSelection[index])
    .map((index) => rawData?.[parseInt(index)])
    .filter(Boolean) as User[];

  // Plain function handlers - React Compiler memoizes automatically
  const handleCreate = async (data: CreateUserData) => {
    try {
      // Create using the collection
      const tx = usersCollection.insert([
        { id: crypto.randomUUID() as string, ...data },
      ]);

      // Wait for persistence if transaction is available
      if (tx?.isPersisted?.promise) {
        await tx.isPersisted.promise;
      }

      setDialogOpen(false);
      toast.success("User created successfully");
    } catch (error) {
      // Handle specific error types
      if (error instanceof SchemaValidationError) {
        const firstIssue = error.issues[0];
        toast.error("Validation error", {
          description: firstIssue?.message ?? "Invalid data format",
        });
      } else if (error instanceof DuplicateKeyError) {
        toast.error("Duplicate user", {
          description: "A user with this ID already exists",
        });
      } else {
        toast.error("Failed to create user", {
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred",
        });
      }
    }
  };

  const handleUpdate = async (data: UpdateUserData) => {
    if (!editingUser) return;
    try {
      // Update using the collection
      const tx = usersCollection.update(editingUser.id, (draft) => {
        Object.assign(draft, data);
      });

      // Wait for persistence if transaction is available
      if (tx?.isPersisted?.promise) {
        await tx.isPersisted.promise;
      }

      setDialogOpen(false);
      setEditingUser(undefined);
      toast.success("User updated successfully");
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
        // Close dialog and refresh to show current state
        setDialogOpen(false);
        setEditingUser(undefined);
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

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  const handleCreateNew = () => {
    setEditingUser(undefined);
    setDialogOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      try {
        // Delete using the collection
        const tx = usersCollection.delete([userToDelete.id]);

        // Wait for persistence if transaction is available
        if (tx?.isPersisted?.promise) {
          await tx.isPersisted.promise;
        }

        setDeleteDialogOpen(false);
        setUserToDelete(undefined);
        toast.success("User deleted successfully");
      } catch (error) {
        // Handle specific error types
        if (error instanceof DeleteKeyNotFoundError) {
          toast.warning("User already deleted", {
            description: "The user was already deleted by another process",
          });
          setDeleteDialogOpen(false);
          setUserToDelete(undefined);
        } else {
          toast.error("Failed to delete user", {
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
    if (selectedUsers.length > 0) {
      try {
        // Delete using the collection
        const tx = usersCollection.delete(selectedUsers.map((u) => u.id));

        // Wait for persistence if transaction is available
        if (tx?.isPersisted?.promise) {
          await tx.isPersisted.promise;
        }

        tableState.setRowSelection({});
        setDeleteDialogOpen(false);
        toast.success(
          `${selectedUsers.length} user${selectedUsers.length > 1 ? "s" : ""} deleted successfully`,
        );
      } catch (error) {
        // Handle specific error types
        if (error instanceof DeleteKeyNotFoundError) {
          toast.warning("Some users already deleted", {
            description:
              "One or more users were already deleted by another process",
          });
          tableState.setRowSelection({});
          setDeleteDialogOpen(false);
        } else {
          toast.error("Failed to delete users", {
            description:
              error instanceof Error
                ? error.message
                : "An unexpected error occurred",
          });
        }
      }
    }
  };

  const handleRowDoubleClick = (user: User) => {
    void navigate(`/users/${user.id}`);
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
          <UsersIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Users</h1>
            <p className="text-muted-foreground">Manage your users</p>
          </div>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Data Table with meta prop for action handlers */}
      <DataTable
        data={rawData?.map((row) => row).filter(Boolean) ?? []}
        columns={columns}
        tableState={tableState}
        meta={{
          onUpdate: handleEdit,
          onDelete: handleDeleteClick,
        }}
        onBulkDelete={() => setDeleteDialogOpen(true)}
        onRowDoubleClick={handleRowDoubleClick}
        searchColumn="email"
        searchPlaceholder="Search by email..."
        defaultSortColumn="email"
      />

      {/* Create/Edit Dialog */}
      <UsersDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={(data) =>
          editingUser
            ? handleUpdate(data as UpdateUserData)
            : handleCreate(data as CreateUserData)
        }
        defaultValues={editingUser}
        mode={editingUser ? "edit" : "create"}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {userToDelete
                ? `This will permanently delete the user "${userToDelete.email}".`
                : `This will permanently delete ${selectedUsers.length} user${selectedUsers.length > 1 ? "s" : ""}.`}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={userToDelete ? handleConfirmDelete : handleBulkDelete}
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
