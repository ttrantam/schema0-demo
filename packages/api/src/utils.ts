// @ts-nocheck
import type { parseLoadSubsetOptions } from "@tanstack/query-db-collection";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import {
  eq,
  gt,
  gte,
  lt,
  lte,
  like,
  ilike,
  inArray,
  isNull,
  asc,
  desc,
  and,
  not,
  isNotNull,
  type SQL,
} from "drizzle-orm";

export type SelectAllOptions = ReturnType<typeof parseLoadSubsetOptions> & {
  offset?: number;
};

export const buildOrderBy = (table: PgTable, sort: any): SQL | undefined => {
  // Validate field path length - only support single-level fields for now
  if (sort.field.length > 1) {
    throw new Error("FieldPath with more than 1 level is not supported yet");
  }

  const fieldName = sort.field[0];
  if (!fieldName) return undefined;

  // @ts-ignore
  const column = table[fieldName] as PgColumn | undefined;
  if (!column) return undefined;

  return sort.direction === "asc" ? asc(column) : desc(column);
};

export const buildWhereCondition = (
  table: PgTable,
  filter: unknown,
): SQL | undefined => {
  // Validate field path length - only support single-level fields for now
  if (filter?.field?.length > 1) {
    throw new Error("FieldPath with more than 1 level is not supported yet");
  }

  const fieldName = filter?.field?.[0];
  if (!fieldName) return undefined;

  // @ts-ignore
  const column = table[fieldName] as PgColumn | undefined;
  if (!column) return undefined;

  switch (filter?.operator) {
    case "eq":
      return eq(column, filter?.value);
    case "gt":
      return gt(column, filter?.value);
    case "gte":
      return gte(column, filter?.value);
    case "lt":
      return lt(column, filter?.value);
    case "lte":
      return lte(column, filter?.value);
    case "like":
      return like(column, filter?.value);
    case "ilike":
      return ilike(column, filter?.value);
    case "in":
      return inArray(column, filter?.value);
    case "isNull":
      return isNull(column);
    case "notNull":
      return isNotNull(column);
    case "not":
      return not(eq(column, filter?.value));
    // case "isUndefined":
    //   return isUndefined(column);
    default:
      return undefined;
  }
};

import type { NeonDatabase } from "drizzle-orm/neon-serverless";

export const buildSelectQuery = <T extends PgTable>(
  db: NeonDatabase<any>,
  table: T,
  options: SelectAllOptions,
) => {
  const { filters, sorts, limit, offset } = options;

  const whereConditions = filters
    .map((filter) => buildWhereCondition(table, filter))
    .filter((c): c is SQL => c !== undefined);

  const orderByConditions = sorts
    .map((sort) => buildOrderBy(table, sort))
    .filter((o): o is SQL => o !== undefined);

  // @ts-ignore
  let query = db.select().from(table).$dynamic();

  if (whereConditions.length > 0) {
    query = query.where(and(...whereConditions));
  }

  if (orderByConditions.length > 0) {
    query = query.orderBy(...orderByConditions);
  }

  if (limit) {
    query = query.limit(limit);
  }

  if (offset) {
    query = query.offset(offset);
  }

  return query;
};
