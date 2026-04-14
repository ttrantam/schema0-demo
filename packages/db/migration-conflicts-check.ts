import { generateDrizzleJson } from "drizzle-kit/api";
import * as fs from "node:fs";
import * as path from "node:path";

// Import your current schema
import * as schema from "./src/schema";

const MIGRATIONS_DIR = "./src/migrations";

function getLatestSnapshot(): object | null {
  const metaDir = path.join(MIGRATIONS_DIR, "meta");
  const journalPath = path.join(metaDir, "_journal.json");

  if (!fs.existsSync(journalPath)) return null;

  const journal = JSON.parse(fs.readFileSync(journalPath, "utf-8"));
  const lastEntry = journal.entries[journal.entries.length - 1];
  if (!lastEntry) return null;

  const snapshotPath = path.join(
    metaDir,
    `${lastEntry.idx.toString().padStart(4, "0")}_snapshot.json`,
  );
  return JSON.parse(fs.readFileSync(snapshotPath, "utf-8"));
}

function detectConflicts(prev: any, cur: any) {
  const conflicts: string[] = [];

  // Compare each entity type that has a resolver
  const checks = [
    { name: "tables", prevData: prev.tables, curData: cur.tables },
    { name: "enums", prevData: prev.enums, curData: cur.enums },
    { name: "schemas", prevData: prev.schemas, curData: cur.schemas },
    { name: "sequences", prevData: prev.sequences, curData: cur.sequences },
    { name: "roles", prevData: prev.roles, curData: cur.roles },
    { name: "policies", prevData: prev.policies, curData: cur.policies },
  ];

  for (const { name, prevData, curData } of checks) {
    if (!prevData || !curData) continue;

    const prevKeys = new Set(Object.keys(prevData));
    const curKeys = new Set(Object.keys(curData));

    const deleted = [...prevKeys].filter((k) => !curKeys.has(k));
    const created = [...curKeys].filter((k) => !prevKeys.has(k));

    if (deleted.length > 0 && created.length > 0) {
      conflicts.push(
        `⚠️  ${name}: deleted [${deleted.join(", ")}] and created [${created.join(", ")}] simultaneously.`,
      );
    }
  }

  // Check columns within tables that exist in both snapshots
  const commonTables = Object.keys(prev.tables || {}).filter(
    (t) => cur.tables?.[t],
  );
  for (const table of commonTables) {
    const prevCols = new Set(Object.keys(prev.tables[table].columns));
    const curCols = new Set(Object.keys(cur.tables[table].columns));

    const deleted = [...prevCols].filter((c) => !curCols.has(c));
    const created = [...curCols].filter((c) => !prevCols.has(c));

    if (deleted.length > 0 && created.length > 0) {
      conflicts.push(
        `⚠️  columns in "${table}": deleted [${deleted.join(", ")}] and created [${created.join(", ")}] simultaneously.`,
      );
    }
  }

  return conflicts;
}

async function main() {
  const prevSnapshot = getLatestSnapshot();
  if (!prevSnapshot) {
    console.log(
      "✅ No previous snapshot — first migration, no conflicts possible.",
    );
    process.exit(0);
  }

  const curSnapshot = generateDrizzleJson(schema);

  const conflicts = detectConflicts(prevSnapshot, curSnapshot);

  if (conflicts.length === 0) {
    console.log(
      "✅ Safe to run drizzle-kit generate — no ambiguities detected.",
    );
    process.exit(0);
  } else {
    conflicts.forEach((c) => console.error(c));
    console.error("\nSplit this into two separate migrations.");
    process.exit(1);
  }
}

main().catch(console.error);
