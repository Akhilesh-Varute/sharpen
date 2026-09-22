import { NextResponse } from "next/server";
import { getDb } from "../../../lib/db";

export async function GET() {
  const db = getDb();
  const { rows: items } = await db.execute(
    "SELECT * FROM learning_items ORDER BY (status = 'done') ASC, sort_order ASC, id ASC"
  );
  const results = [];
  for (const item of items) {
    const { rows: logs } = await db.execute({
      sql: "SELECT * FROM learning_log WHERE learning_item_id = ? ORDER BY log_date DESC, id DESC LIMIT 20",
      args: [item.id],
    });
    const { rows: countRows } = await db.execute({
      sql: "SELECT COUNT(*) as c FROM learning_log WHERE learning_item_id = ?",
      args: [item.id],
    });
    results.push({ ...item, logs, logCount: countRows[0].c });
  }
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
