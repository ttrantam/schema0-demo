import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import type { Outputs } from "@template/api/types";
import { userEditFormSchema } from "@template/db/schema";
import type { z } from "zod/v4";

type User = Outputs["users"]["selectAll"][0];

type UserFormData = z.infer<typeof userEditFormSchema>;

type UserUpdateData = {
  firstName?: string;
  lastName?: string;
};

type UserDetailViewProps = {
  user: User;
  onSubmit: (data: UserUpdateData) => void;
  onCancel: () => void;
};

export function UserDetailView({
  user,
  onSubmit,
  onCancel,
}: UserDetailViewProps) {
  const form = useForm<UserFormData>({
    resolver: zodResolver(userEditFormSchema),
    defaultValues: {
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
    },
  });

  const handleSubmit = (data: UserFormData) => {
    onSubmit({
      firstName: data.firstName || undefined,
      lastName: data.lastName || undefined,
    } as UserUpdateData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Email - Read only */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={user.email}
            disabled
            className="bg-muted"
          />
          <p className="text-sm text-muted-foreground">
            Email cannot be changed
          </p>
        </div>

        {/* First Name */}
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="firstName">First Name</Label>
              <FormControl>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Last Name */}
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="lastName">Last Name</Label>
              <FormControl>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Metadata - Read only */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Email Verified</Label>
            <p className="text-sm">
              {user.emailVerified ? "Verified" : "Not Verified"}
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">User ID</Label>
            <p className="text-sm font-mono text-muted-foreground">
              {user.id}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Changes
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={form.formState.isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
