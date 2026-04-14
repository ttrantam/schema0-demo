import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowData,
  type TableMeta,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DataTablePagination } from "./pagination";
import { DataTableToolbar, type FacetedFilterConfig } from "./toolbar";
import { DataTableContext, type DataTableState } from "./context";

// Module augmentation for TableMeta to support action handlers
declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    onUpdate?: (item: TData) => void;
    onDelete?: (item: TData) => void;
    onDownload?: (item: TData) => void;
    onToggle?: (item: TData) => void;
  }
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  meta?: TableMeta<TData>;
  tableState: DataTableState;

  // Config
  defaultSortColumn?: string;
  autoResetPageIndex?: boolean;

  // UI callbacks
  onBulkDelete?: () => void;
  onRowDoubleClick?: (row: TData) => void;
  searchColumn?: string;
  searchPlaceholder?: string;
  facetedFilters?: FacetedFilterConfig[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
  meta,
  tableState,
  defaultSortColumn = "createdAt",
  autoResetPageIndex = false,
  onBulkDelete,
  onRowDoubleClick,
  searchColumn,
  searchPlaceholder,
  facetedFilters,
}: DataTableProps<TData, TValue>) {
  // Use tableState from context - always defined
  const table = useReactTable({
    data,
    columns,
    meta,
    initialState: {
      sorting: [{ id: defaultSortColumn, desc: true }],
    },
    state: {
      rowSelection: tableState.rowSelection,
      pagination: tableState.pagination,
      columnVisibility: tableState.columnVisibility,
      columnFilters: tableState.columnFilters,
    },
    onPaginationChange: tableState.setPagination,
    onRowSelectionChange: tableState.setRowSelection,
    onColumnVisibilityChange: tableState.setColumnVisibility,
    onColumnFiltersChange: tableState.setColumnFilters,
    enableRowSelection: true,
    autoResetPageIndex,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <DataTableContext.Provider value={tableState}>
      <div className="flex flex-col gap-4">
        <DataTableToolbar
          table={table}
          onBulkDelete={onBulkDelete}
          searchColumn={searchColumn}
          searchPlaceholder={searchPlaceholder}
          facetedFilters={facetedFilters}
        />
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    onDoubleClick={() => onRowDoubleClick?.(row.original)}
                    className={onRowDoubleClick ? "cursor-pointer" : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DataTablePagination table={table} />
      </div>
    </DataTableContext.Provider>
  );
}
