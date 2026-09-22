import { NextResponse } from "next/server";
import { getDb } from "../../../lib/db";

export async function GET(req) {
  const date = req.nextUrl.searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });
  const db = getDb();
  const { rows } = await db.execute({
    sql: "SELECT * FROM journal_entries WHERE entry_date = ?",
    args: [date],
  });
  return NextResponse.json({ entry: rows[0] || null });
}

export async function POST(req) {
  const body = await req.json();
  const { date, log = "", learned = "", reflection = "", mood = null, energy = null } = body;
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

  const db = getDb();
  await db.execute({
    sql: `
      INSERT INTO journal_entries (entry_date, log, learned, reflection, mood, energy, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(entry_date) DO UPDATE SET
        log = excluded.log,
        learned = excluded.learned,
        reflection = excluded.reflection,
        mood = excluded.mood,
        energy = excluded.energy,
        updated_at = CURRENT_TIMESTAMP
    `,
    args: [date, log, learned, reflection, mood, energy],
  });

  return NextResponse.json({ ok: true });
}
