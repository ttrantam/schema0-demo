import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Outputs } from "@template/api/types";
import { UsersForm } from "./UsersForm";
import type { z } from "zod/v4";
import { userFormSchema } from "@template/db/schema";

type User = Outputs["users"]["selectAll"][0];

// Type definitions matching the bulk API but for single user
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

type UserFormData = z.infer<typeof userFormSchema>;

type UsersDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateUserData | UpdateUserData) => void | Promise<void>;
  defaultValues?: User;
  mode: "create" | "edit";
};

export function UsersDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  mode,
}: UsersDialogProps) {
  const handleSubmit = (data: UserFormData) => {
    if (mode === "create") {
      onSubmit({
        email: data.email!,
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
        password: data.password || undefined,
      } as CreateUserData);
    } else {
      onSubmit({
        id: defaultValues?.id || "",
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
      } as UpdateUserData);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New User" : "Edit User"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new user to your organization."
              : "Update user information."}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[80vh] overflow-y-auto px-1">
          <UsersForm
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            initialData={defaultValues as Partial<UserFormData>}
            submitLabel={mode === "create" ? "Create" : "Save"}
            mode={mode}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
