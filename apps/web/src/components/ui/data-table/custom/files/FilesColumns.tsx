import { type ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/ui/data-table/column-header";
import { Button } from "@/components/ui/button";
import {
  FileImage,
  FileText,
  FileVideo,
  FileAudio,
  File,
  Download,
  Trash2,
} from "lucide-react";
import type { Outputs } from "@template/api/types";

type FileMetadata = Outputs["files"]["selectAll"][0];

const getFileIcon = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"];
  const videoExtensions = ["mp4", "avi", "mov", "wmv", "webm"];
  const audioExtensions = ["mp3", "wav", "ogg", "m4a", "flac"];
  const textExtensions = ["txt", "md", "doc", "docx", "pdf"];

  if (imageExtensions.includes(extension)) {
    return <FileImage className="h-5 w-5 text-blue-500" />;
  }
  if (videoExtensions.includes(extension)) {
    return <FileVideo className="h-5 w-5 text-purple-500" />;
  }
  if (audioExtensions.includes(extension)) {
    return <FileAudio className="h-5 w-5 text-green-500" />;
  }
  if (textExtensions.includes(extension)) {
    return <FileText className="h-5 w-5 text-orange-500" />;
  }
  return <File className="h-5 w-5 text-gray-500" />;
};

// Action cell component - reads actions from table meta
function ActionsCell({ file, table }: { file: FileMetadata; table: any }) {
  const onDownload = table.options.meta?.onDownload;
  const onDelete = table.options.meta?.onDelete;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onDownload?.(file);
        }}
      >
        <Download className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.(file);
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Static columns - no factory function needed with React 19 + Compiler
export const columns: ColumnDef<FileMetadata>[] = [
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
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const file = row.original;
      return (
        <div className="flex items-center gap-3">
          {getFileIcon(file.name)}
          <span className="font-medium">{file.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="id" />
    ),
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground font-mono truncate max-w-[200px]">
        {row.getValue("id")}
      </div>
    ),
  },
  {
    accessorKey: "metadata",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Metadata" />
    ),
    cell: ({ row }) => {
      const metadata = row.getValue("metadata");
      return (
        <div className="text-sm text-muted-foreground">
          {metadata ? (
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
              {typeof metadata === "string"
                ? metadata
                : JSON.stringify(metadata)}
            </code>
          ) : (
            "-"
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => <ActionsCell file={row.original} table={table} />,
  },
];
