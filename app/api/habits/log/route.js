import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/db";

export async function POST(req) {
  const { habit_id, date, done } = await req.json();
  if (!habit_id || !date) {
    return NextResponse.json({ error: "habit_id and date required" }, { status: 400 });
  }
  const db = getDb();
  if (done) {
    await db.execute({
      sql: `INSERT INTO habit_logs (habit_id, log_date, done) VALUES (?, ?, 1)
            ON CONFLICT(habit_id, log_date) DO UPDATE SET done = 1`,
      args: [habit_id, date],
    });
  } else {
    await db.execute({
      sql: "DELETE FROM habit_logs WHERE habit_id = ? AND log_date = ?",
      args: [habit_id, date],
    });
  }
  return NextResponse.json({ ok: true });
}
