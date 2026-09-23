import { NextResponse } from "next/server";
import { getDb } from "../../../lib/db";

export async function GET() {
  const db = getDb();
  const { rows: items } = await db.execute(
    "SELECT * FROM learning_items ORDER BY (status = 'done') ASC, sort_order ASC, id ASC"
  );

  if (items.length === 0) return NextResponse.json({ items: [] });

  // Used to be 1 + 2*N queries (a logs query and a count query per track,
  // every time this page loaded, every add, and every status change).
  // Now it's 3 total: items, all logs for those items, and grouped counts.
  const ids = items.map((i) => i.id);
  const placeholders = ids.map(() => "?").join(",");

  const { rows: allLogs } = await db.execute({
    sql: `
      SELECT * FROM learning_log
      WHERE learning_item_id IN (${placeholders})
      ORDER BY log_date DESC, id DESC
    `,
    args: ids,
  });

  const { rows: countRows } = await db.execute({
    sql: `
      SELECT learning_item_id, COUNT(*) as c FROM learning_log
      WHERE learning_item_id IN (${placeholders})
      GROUP BY learning_item_id
    `,
    args: ids,
  });
  const counts = new Map(countRows.map((r) => [r.learning_item_id, r.c]));

  const logsByItem = new Map(ids.map((id) => [id, []]));
  for (const row of allLogs) {
    const bucket = logsByItem.get(row.learning_item_id);
    // each item only needs its most recent 20 for this view (see the page's
    // "show all" expander for the rest) — allLogs is already sorted, so
    // this just caps what each item keeps.
    if (bucket && bucket.length < 20) bucket.push(row);
  }

  const results = items.map((item) => ({
    ...item,
    logs: logsByItem.get(item.id) || [],
    logCount: counts.get(item.id) || 0,
  }));

  return NextResponse.json({ items: results });
}

export async function POST(req) {
  const { title, category = "" } = await req.json();
  if (!title || !title.trim()) return NextResponse.json({ error: "title required" }, { status: 400 });
  const db = getDb();
  const { rows } = await db.execute("SELECT COALESCE(MAX(sort_order), -1) as m FROM learning_items");
  await db.execute({
    sql: "INSERT INTO learning_items (title, category, sort_order) VALUES (?, ?, ?)",
    args: [title.trim(), category.trim(), rows[0].m + 1],
  });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req) {
  const { id, status } = await req.json();
  const db = getDb();
  await db.execute({ sql: "UPDATE learning_items SET status = ? WHERE id = ?", args: [status, id] });
  return NextResponse.json({ ok: true });
}
