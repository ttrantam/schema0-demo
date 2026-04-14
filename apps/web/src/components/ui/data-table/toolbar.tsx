import { type Table } from "@tanstack/react-table";
import { X, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./view-options";
import { DataTableFacetedFilter } from "./faceted-filter";
import { useDataTableContext } from "./context";

export interface FilterOption {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface FacetedFilterConfig {
  columnId: string;
  title: string;
  options: FilterOption[];
}

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  onBulkDelete?: () => void;
  searchColumn?: string;
  searchPlaceholder?: string;
  facetedFilters?: FacetedFilterConfig[];
}

export function DataTableToolbar<TData>({
  table,
  onBulkDelete,
  searchColumn,
  searchPlaceholder = "Search...",
  facetedFilters = [],
}: DataTableToolbarProps<TData>) {
  // Get state from context
  const { searchValue, setSearchValue, rowSelection } = useDataTableContext();
  const isFiltered = table.getState().columnFilters.length > 0;
  const searchColumnRef = searchColumn ? table.getColumn(searchColumn) : null;

  // Derive selected count from rowSelection
  const selectedCount = Object.values(rowSelection).filter(Boolean).length;

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchValue(value);
    // Also update column filter for TanStack Table filtering
    searchColumnRef?.setFilterValue(value || undefined);
  };

  const handleReset = () => {
    setSearchValue("");
    table.resetColumnFilters();
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center gap-2">
        {searchColumnRef && (
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={handleSearchChange}
            className="h-8 w-[150px] lg:w-[250px]"
          />
        )}
        {facetedFilters.map((filter) => {
          const column = table.getColumn(filter.columnId);
          return column ? (
            <DataTableFacetedFilter
              key={filter.columnId}
              column={column}
              title={filter.title}
              options={filter.options}
            />
          ) : null;
        })}
        {isFiltered && (
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {selectedCount > 0 && onBulkDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onBulkDelete}
            className="h-8"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete ({selectedCount})
          </Button>
        )}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
