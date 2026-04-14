import { createContext, useContext, useState } from "react";
import type {
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  RowSelectionState,
  VisibilityState,
} from "@tanstack/react-table";

/**
 * Custom filters object for application-level filters (e.g., server-side filters).
 * Use this to hold arbitrary filter values like `{ status: "active", search: "query" }`.
 */
export type DataTableFilters = Record<string, unknown>;

/**
 * DataTable state interface that extends TanStack Table built-in types where possible.
 *
 * The searchValue, filters, and setSearchValue/setFilters are custom (not part of TanStack's TableState),
 * while columnVisibility, columnFilters, pagination, and rowSelection align with TanStack's types.
 *
 * @see https://tanstack.com/table/latest/docs/api/core/table-state
 */
export interface DataTableState
  extends Pick<
    // Pick the state properties from TanStack's conceptual TableState
    // (Note: we define them inline since TableState itself is a generic type)
    {
      columnVisibility: VisibilityState;
      columnFilters: ColumnFiltersState;
      pagination: PaginationState;
      rowSelection: RowSelectionState;
    },
    "columnVisibility" | "columnFilters" | "pagination" | "rowSelection"
  > {
  // Custom search (not in TanStack TableState)
  searchValue: string;
  setSearchValue: OnChangeFn<string>;

  // Custom filters for application-level filtering (e.g., server-side filters)
  filters: DataTableFilters;
  setFilters: OnChangeFn<DataTableFilters>;

  // State setters using TanStack's OnChangeFn type for consistency
  setColumnVisibility: OnChangeFn<VisibilityState>;
  setColumnFilters: OnChangeFn<ColumnFiltersState>;
  setPagination: OnChangeFn<PaginationState>;
  setRowSelection: OnChangeFn<RowSelectionState>;
}

const DataTableContext = createContext<DataTableState | null>(null);

export function useDataTableContext() {
  const context = useContext(DataTableContext);
  if (!context) {
    throw new Error(
      "useDataTableContext must be used within DataTableProvider",
    );
  }
  return context;
}

export function useDataTableState(options?: {
  defaultPageSize?: number;
  defaultColumnVisibility?: Record<string, boolean>;
  defaultFilters?: DataTableFilters;
}): DataTableState {
  const [searchValue, setSearchValue] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(options?.defaultColumnVisibility ?? {});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [filters, setFilters] = useState<DataTableFilters>(
    options?.defaultFilters ?? {},
  );
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: options?.defaultPageSize ?? 25,
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  return {
    searchValue,
    setSearchValue,
    columnVisibility,
    setColumnVisibility,
    columnFilters,
    setColumnFilters,
    filters,
    setFilters,
    pagination,
    setPagination,
    rowSelection,
    setRowSelection,
  };
}

export { DataTableContext };
