import { type Row } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { selectFilesSchema } from "@template/db/schema";
import type { z } from "zod/v4";
import { Button } from "@/components/ui/button";
import { Copy, Download, MoreHorizontal, Trash2 } from "lucide-react";

type FileMetadata = z.infer<typeof selectFilesSchema>;

interface DataTableRowActionsProps {
  row: Row<FileMetadata>;
  onDownload: (file: FileMetadata) => void;
  onDelete: (file: FileMetadata) => void;
}

export function DataTableRowActions({
  row,
  onDownload,
  onDelete,
}: DataTableRowActionsProps) {
  const file = row.original;

  const handleCopyName = async () => {
    await navigator.clipboard.writeText(file.name);
  };

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(file.id);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="data-[state=open]:bg-muted size-8"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={() => onDownload(file)}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyName}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Name
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyId}>
          <Copy className="mr-2 h-4 w-4" />
          Copy ID
          <DropdownMenuShortcut>C</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(file)}
          className="text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
          <DropdownMenuShortcut>Del</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
