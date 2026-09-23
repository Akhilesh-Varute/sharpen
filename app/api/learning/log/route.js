import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/db";

export async function POST(req) {
  const { learning_item_id, date, note } = await req.json();
  if (!date || !note || !note.trim()) {
    return NextResponse.json({ error: "date and note required" }, { status: 400 });
  }
  const db = getDb();
  await db.execute({
    sql: "INSERT INTO learning_log (learning_item_id, log_date, note) VALUES (?, ?, ?)",
    args: [learning_item_id || null, date, note.trim()],
  });
  return NextResponse.json({ ok: true });
}

// Recent learning entries across every track — this is what powers "on
// this day" style recall (and the Today page's compact learning log).
//
// Pass `date` to get just that day's entries (indexed lookup on log_date —
// this is what the Today page uses when you page prev/next, instead of
// pulling a big `limit` window and filtering client-side, which used to
// get slower every time you added a log entry).
export async function GET(req) {
  const date = req.nextUrl.searchParams.get("date");
  const db = getDb();

  if (date) {
    const { rows } = await db.execute({
      sql: `
        SELECT learning_log.*, learning_items.title as item_title
        FROM learning_log
        LEFT JOIN learning_items ON learning_items.id = learning_log.learning_item_id
        WHERE log_date = ?
        ORDER BY learning_log.id DESC
      `,
      args: [date],
    });
    return NextResponse.json({ logs: rows });
  }

  const limit = Number(req.nextUrl.searchParams.get("limit") || 30);
  const { rows } = await db.execute({
    sql: `
      SELECT learning_log.*, learning_items.title as item_title
      FROM learning_log
      LEFT JOIN learning_items ON learning_items.id = learning_log.learning_item_id
      ORDER BY log_date DESC, learning_log.id DESC
      LIMIT ?
    `,
    args: [limit],
  });
  return NextResponse.json({ logs: rows });
}
