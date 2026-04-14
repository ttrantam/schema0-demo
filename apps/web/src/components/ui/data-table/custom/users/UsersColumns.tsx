import { type ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/ui/data-table/column-header";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import type { Outputs } from "@template/api/types";

type User = Outputs["users"]["selectAll"][0];

// Action cell component - reads actions from table meta
function ActionsCell({ user, table }: { user: User; table: any }) {
  const onEdit = table.options.meta?.onUpdate;
  const onDelete = table.options.meta?.onDelete;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onEdit?.(user);
        }}
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.(user);
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Static columns - no factory function needed with React 19 + Compiler
export const columns: ColumnDef<User>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "profilePictureUrl",
    header: "",
    cell: ({ row }) => {
      const user = row.original;
      const initials =
        `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();
      return (
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.profilePictureUrl ?? undefined} />
          <AvatarFallback>
            {initials || user.email[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row, table }) => {
      const onEdit = table.options.meta?.onUpdate;
      return (
        <Button
          variant="link"
          onClick={() => onEdit?.(row.original)}
          className="font-medium text-blue-600 p-0 h-auto"
        >
          {row.getValue("email")}
        </Button>
      );
    },
  },
  {
    accessorKey: "firstName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="First Name" />
    ),
    cell: ({ row }) => (
      <div className="text-sm">{row.getValue("firstName") ?? "-"}</div>
    ),
  },
  {
    accessorKey: "lastName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Name" />
    ),
    cell: ({ row }) => (
      <div className="text-sm">{row.getValue("lastName") ?? "-"}</div>
    ),
  },
  {
    accessorKey: "emailVerified",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Verified" />
    ),
    cell: ({ row }) => {
      const verified = row.getValue("emailVerified");
      return (
        <Badge variant={verified ? "default" : "secondary"}>
          {verified ? "Verified" : "Pending"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => {
      const dateValue = row.getValue("createdAt");
      if (!dateValue)
        return <div className="text-sm text-muted-foreground">-</div>;
      const date = new Date(dateValue as string);
      return (
        <div className="text-sm text-muted-foreground">
          {date.toLocaleDateString()}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => <ActionsCell user={row.original} table={table} />,
  },
];
