// Dumps every table to a single timestamped JSON file. Plain JSON (not a
// SQLite binary dump) on purpose — it's human-readable, diffable in git,
// and doesn't need the Turso CLI to restore from, just this script's
// counterpart logic or manual inspection.
//
// Run with: npm run db:backup
// Intended to be run on a schedule (see README's "Backups" section for the
// GitHub Actions cron that runs this automatically and commits the result).

import { createClient } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";

function loadEnvLocal() {
  const p = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnvLocal();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const TABLES = [
  "journal_entries",
  "todos",
  "habits",
  "habit_logs",
  "learning_items",
  "learning_log",
];

async function main() {
  const out = {};
  for (const table of TABLES) {
    const { rows } = await db.execute(`SELECT * FROM ${table}`);
    out[table] = rows;
  }

  const dir = path.join(process.cwd(), "backups");
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(dir, `sharpen-backup-${stamp}.json`);
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  console.log(`Backup written to ${file}`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
