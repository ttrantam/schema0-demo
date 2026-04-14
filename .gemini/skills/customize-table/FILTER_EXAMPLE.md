# Filters: @tanstack/react-table with TanStack DB Where Clauses

This guide demonstrates how to implement filters using @tanstack/react-table column filters synchronized with TanStack DB server-side filtering via where clauses.

## Architecture Overview

The filtering system spans three layers:

```
Frontend (@tanstack/react-table)
    ↓ columnFilters state
useDataTableState hook
    ↓ passes to useLiveQuery
TanStack DB Collection (queryFn)
    ↓ where clauses → loadSubsetOptions
ORPC Backend (selectAll)
    ↓ buildSelectQuery with filters
Drizzle ORM
    ↓ SQL with WHERE conditions
Database
```

## Supported Where Clause Operators

The backend's `buildSelectQuery` utility (in `packages/api/src/utils.ts`) supports these operators:

| Operator | Purpose | Example |
|----------|---------|---------|
| `eq` | Equals | `where(({ todos }) => todos.status, "eq", "active")` |
| `gt` | Greater than | `where(({ todos }) => todos.priority, "gt", 5)` |
| `gte` | Greater than or equal | `where(({ todos }) => todos.priority, "gte", 5)` |
| `lt` | Less than | `where(({ todos }) => todos.priority, "lt", 3)` |
| `lte` | Less than or equal | `where(({ todos }) => todos.priority, "lte", 3)` |
| `like` | Pattern match (case-sensitive) | `where(({ todos }) => todos.text, "like", "%urgent%")` |
| `ilike` | Pattern match (case-insensitive) | `where(({ todos }) => todos.text, "ilike", "%urgent%")` |
| `in` | Array contains | `where(({ todos }) => todos.status, "in", ["active", "pending"])` |
| `isNull` | Is NULL | `where(({ todos }) => todos.dueDate, "isNull")` |
| `notNull` | Is NOT NULL | `where(({ todos }) => todos.dueDate, "notNull")` |
| `not` | Not equals | `where(({ todos }) => todos.status, "not", "archived")` |

## Pattern 1: Client-Side Filtering

The current default uses `getFilteredRowModel()` for in-memory filtering. This is fast for small datasets but loads all data into memory.

```typescript
import { getFilteredRowModel } from '@tanstack/react-table';

export function TodosPage() {
  const tableState = useDataTableState();

  // Load ALL data (no server-side filtering)
  const { data: allTodos } = useLiveQuery((q) =>
    q.from({ todos: todosCollection })
      .limit(10000) // Large limit to fetch everything
  );

  const table = useReactTable({
    data: allTodos || [],
    columns: todoColumns,
    state: {
      columnFilters: tableState.columnFilters,
    },
    onColumnFiltersChange: tableState.setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(), // Client-side filtering
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <DataTable
      data={allTodos || []}
      columns={todoColumns}
      tableState={tableState}
      searchColumn="text"
    />
  );
}
```

**Pros:** Simple, no backend changes needed
**Cons:** Poor performance with large datasets, all data in memory

## Pattern 2: Server-Side Filtering

Sync `columnFilters` state to `useLiveQuery` where clauses for server-side execution. This is recommended for production.

### Step 1: Define Filter Configuration

```typescript
// Define which columns support filtering and their operators
type FilterConfig = {
  [columnId: string]: {
    operator: 'eq' | 'like' | 'ilike' | 'in' | 'gt' | 'lt' | 'gte' | 'lte' | 'isNull' | 'notNull' | 'not';
    dbField: string; // Map column ID to database field
  };
};

const todoFilterConfig: FilterConfig = {
  status: { operator: 'eq', dbField: 'status' },
  text: { operator: 'ilike', dbField: 'text' },
  priority: { operator: 'gte', dbField: 'priority' },
  completed: { operator: 'eq', dbField: 'completed' },
};
```

### Step 2: Build Where Clauses from Column Filters

```typescript
// Convert TanStack Table columnFilters to TanStack DB where clauses
function buildWhereClausesFromFilters(
  columnFilters: ColumnFiltersState,
  config: FilterConfig,
) {
  return columnFilters.filter((filter) => {
    const cfg = config[filter.id];
    return cfg && filter.value !== null && filter.value !== '';
  });
}
```

### Step 3: Sync Filters to useLiveQuery

```typescript
import { ColumnFiltersState } from '@tanstack/react-table';
import { useLiveQuery } from '@tanstack/react-db';
import { useDataTableState } from '@/components/ui/data-table/context';

export function TodosPage() {
  const tableState = useDataTableState({
    defaultPageSize: 25,
  });

  const pageSize = tableState.pagination.pageSize;
  const pageIndex = tableState.pagination.pageIndex;
  const columnFilters = tableState.columnFilters;

  // Convert columnFilters to where clauses
  const buildQuery = (q: any) => {
    let query = q.from({ todos: todosCollection });

    // Apply column filters to where clause
    for (const filter of columnFilters) {
      if (filter.id === 'status' && filter.value) {
        query = query.where(({ todos }: any) => todos.status, 'eq', filter.value);
      }
      
      if (filter.id === 'text' && filter.value) {
        // Use ilike for case-insensitive search
        const searchTerm = `%${filter.value}%`;
        query = query.where(({ todos }: any) => todos.text, 'ilike', searchTerm);
      }
      
      if (filter.id === 'priority' && filter.value) {
        query = query.where(({ todos }: any) => todos.priority, 'gte', filter.value);
      }
      
      if (filter.id === 'completed' && filter.value !== undefined) {
        query = query.where(({ todos }: any) => todos.completed, 'eq', filter.value);
      }
    }

    // Add sorting and pagination
    return query
      .orderBy(({ todos }: any) => todos.createdAt, 'desc')
      .limit(pageSize + 1)
      .offset(pageIndex * pageSize);
  };

  // Execute query with filters
  const { data: todos, isLoading } = useLiveQuery(buildQuery);

  // Rest of component...
  return (
    <DataTable
      data={todos?.filter(Boolean) ?? []}
      columns={todoColumns}
      tableState={tableState}
      searchColumn="text"
    />
  );
}
```

## Pattern 3: Custom Filter TableFeature

Create a reusable filter feature like the DensityFeature example in the provided code.

```typescript
import {
  TableFeature,
  Table,
  RowData,
  OnChangeFn,
  Updater,
  functionalUpdate,
  makeStateUpdater,
} from '@tanstack/react-table';
import type { ColumnFiltersState } from '@tanstack/react-table';

// Define custom filter state
export interface FilterTableState {
  customFilters: Record<string, any>;
}

// Define table options for the feature
export interface FilterOptions {
  enableCustomFilters?: boolean;
  onCustomFiltersChange?: OnChangeFn<Record<string, any>>;
}

// Define instance APIs
export interface FilterInstance {
  setCustomFilters: (updater: Updater<Record<string, any>>) => void;
  toggleFilter: (name: string, value: any) => void;
  clearFilters: () => void;
}

// Module augmentation
declare module '@tanstack/react-table' {
  interface TableState extends FilterTableState {}
  interface TableOptionsResolved<TData extends RowData> extends FilterOptions {}
  interface Table<TData extends RowData> extends FilterInstance {}
}

// Feature implementation
export const FilterFeature: TableFeature<any> = {
  getInitialState: (state): FilterTableState => {
    return {
      customFilters: {},
      ...state,
    };
  },

  getDefaultOptions: <TData extends RowData>(
    table: Table<TData>,
  ): FilterOptions => {
    return {
      enableCustomFilters: true,
      onCustomFiltersChange: makeStateUpdater('customFilters', table),
    };
  },

  createTable: <TData extends RowData>(table: Table<TData>): void => {
    table.setCustomFilters = (updater) => {
      const safeUpdater: Updater<Record<string, any>> = (old) =>
        functionalUpdate(updater, old);
      return table.options.onCustomFiltersChange?.(safeUpdater);
    };

    table.toggleFilter = (name: string, value: any) => {
      table.setCustomFilters((old) => ({
        ...old,
        [name]: value,
      }));
    };

    table.clearFilters = () => {
      table.setCustomFilters({});
    };
  },
};
```

Usage:

```typescript
const [customFilters, setCustomFilters] = useState({});

const table = useReactTable({
  _features: [FilterFeature],
  data: todos,
  columns: todoColumns,
  state: {
    customFilters,
  },
  onCustomFiltersChange: setCustomFilters,
});

// Use the feature
table.toggleFilter('status', 'active');
table.clearFilters();
```

## Complete Example: Search + Status Filter + Server-Side Pagination

Here's a production-ready component combining search, multi-column filtering, and server-side pagination:

```typescript
import { useState } from 'react';
import { useLiveQuery } from '@tanstack/react-db';
import { ColumnFiltersState } from '@tanstack/react-table';
import { useDataTableState } from '@/components/ui/data-table/context';
import { DataTable } from '@/components/ui/data-table';
import { todoColumns } from '@/components/ui/data-table/custom/todos/TodosColumn';
import { todosCollection } from '@/sync-collections/custom/todos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function TodosFilteredPage() {
  const tableState = useDataTableState({
    defaultPageSize: 25,
  });

  const pageSize = tableState.pagination.pageSize;
  const pageIndex = tableState.pagination.pageIndex;
  const columnFilters = tableState.columnFilters;

  // Build where clauses from column filters
  const { data: todos, isLoading } = useLiveQuery((q) => {
    let query = q.from({ todos: todosCollection });

    // Filter by status
    const statusFilter = columnFilters.find((f) => f.id === 'status');
    if (statusFilter?.value) {
      query = query.where(
        ({ todos }: any) => todos.status,
        'eq',
        statusFilter.value,
      );
    }

    // Filter by search text
    const textFilter = columnFilters.find((f) => f.id === 'text');
    if (textFilter?.value) {
      query = query.where(
        ({ todos }: any) => todos.text,
        'ilike',
        `%${textFilter.value}%`,
      );
    }

    // Filter by completion status
    const completedFilter = columnFilters.find((f) => f.id === 'completed');
    if (completedFilter?.value !== undefined) {
      query = query.where(
        ({ todos }: any) => todos.completed,
        'eq',
        completedFilter.value === 'true',
      );
    }

    // Filter by priority
    const priorityFilter = columnFilters.find((f) => f.id === 'priority');
    if (priorityFilter?.value) {
      query = query.where(
        ({ todos }: any) => todos.priority,
        'gte',
        parseInt(priorityFilter.value),
      );
    }

    return query
      .orderBy(({ todos }: any) => todos.createdAt, 'desc')
      .limit(pageSize + 1)
      .offset(pageIndex * pageSize);
  });

  // Handle filter changes
  const handleStatusFilterChange = (value: string) => {
    tableState.setColumnFilters((old) => [
      ...old.filter((f) => f.id !== 'status'),
      { id: 'status', value: value || undefined },
    ]);
    // Reset to first page
    tableState.setPagination({ pageIndex: 0, pageSize });
  };

  const handleTextSearchChange = (value: string) => {
    tableState.setColumnFilters((old) => [
      ...old.filter((f) => f.id !== 'text'),
      { id: 'text', value: value || undefined },
    ]);
    tableState.setPagination({ pageIndex: 0, pageSize });
  };

  const handleClearFilters = () => {
    tableState.setColumnFilters([]);
    tableState.setPagination({ pageIndex: 0, pageSize });
  };

  const statusFilter = columnFilters.find((f) => f.id === 'status')?.value;
  const textFilter = columnFilters.find((f) => f.id === 'text')?.value;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Search</label>
          <Input
            placeholder="Search todos..."
            value={textFilter || ''}
            onChange={(e) => handleTextSearchChange(e.target.value)}
          />
        </div>

        <div className="w-40">
          <label className="text-sm font-medium mb-2 block">Status</label>
          <Select value={statusFilter || ''} onValueChange={handleStatusFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(statusFilter || textFilter) && (
          <Button variant="outline" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Data Table */}
      <DataTable
        data={todos?.filter(Boolean) ?? []}
        columns={todoColumns}
        tableState={tableState}
      />

      {/* Active Filters Display */}
      {columnFilters.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Active filters: {columnFilters.map((f) => `${f.id}=${f.value}`).join(', ')}
        </div>
      )}
    </div>
  );
}
```

## Best Practices

1. **Reset pagination when filters change** - Always reset `pageIndex` to 0 when filters update to avoid showing empty pages

2. **Debounce search input** - For text search, debounce the input to avoid excessive backend queries:
   ```typescript
   const [searchValue, setSearchValue] = useState('');
   const [debouncedSearch, setDebouncedSearch] = useState('');

   useEffect(() => {
     const timer = setTimeout(() => setDebouncedSearch(searchValue), 300);
     return () => clearTimeout(timer);
   }, [searchValue]);

   // Use debouncedSearch in where clause
   ```

3. **Validate filter values** - Only apply filters with non-null, non-empty values to avoid unnecessary queries

4. **Cache filter state** - Use `localStorage` to persist filters across page reloads:
   ```typescript
   const [filters, setFilters] = useState(() =>
     JSON.parse(localStorage.getItem('todoFilters') || '{}')
   );

   useEffect(() => {
     localStorage.setItem('todoFilters', JSON.stringify(tableState.columnFilters));
   }, [tableState.columnFilters]);
   ```

5. **Show filter indicators** - Display active filter badges or icons to make filtering visible:
   ```typescript
   {columnFilters.length > 0 && (
     <Badge variant="secondary">
       {columnFilters.length} active filter{columnFilters.length > 1 ? 's' : ''}
     </Badge>
   )}
   ```

## Reference Files

| File | Pattern |
|------|---------|
| `apps/web/src/routes/_auth.todos.tsx` | useLiveQuery with sorting and pagination |
| `packages/api/src/utils.ts` | buildSelectQuery and where operator support |
| `apps/web/src/sync-collections/custom/todos.ts` | Collection queryFn with parseLoadSubsetOptions |
| `apps/web/src/components/ui/data-table/context.tsx` | useDataTableState filter state management |

## Testing Filters

```typescript
describe('Todo Filters', () => {
  it('should filter todos by status', async () => {
    // Set status filter
    tableState.setColumnFilters([{ id: 'status', value: 'active' }]);

    // Wait for useLiveQuery
    await waitFor(() => {
      expect(todos).toHaveLength(expectedCount);
    });

    // Verify all returned todos have status='active'
    todos.forEach((todo) => {
      expect(todo.status).toBe('active');
    });
  });

  it('should reset pagination when filters change', () => {
    tableState.setColumnFilters([{ id: 'text', value: 'urgent' }]);
    expect(tableState.pagination.pageIndex).toBe(0);
  });

  it('should combine multiple filters with AND logic', async () => {
    tableState.setColumnFilters([
      { id: 'status', value: 'active' },
      { id: 'priority', value: '5' },
    ]);

    await waitFor(() => {
      todos.forEach((todo) => {
        expect(todo.status).toBe('active');
        expect(todo.priority).toBeGreaterThanOrEqual(5);
      });
    });
  });
});
```
