import { NextResponse } from "next/server";
import { getDb } from "../../../lib/db";

// Streak = consecutive done days ending today, or ending yesterday if today
// isn't logged yet (so the streak doesn't visibly "break" at midnight before
// you've had a chance to log today).
function computeStreak(logDates, todayStr) {
  const set = new Set(logDates);
  let cursor = new Date(todayStr + "T00:00:00");
  if (!set.has(todayStr)) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (true) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    const key = `${y}-${m}-${d}`;
    if (!set.has(key)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export async function GET(req) {
  const today = req.nextUrl.searchParams.get("today");
  if (!today) return NextResponse.json({ error: "today required" }, { status: 400 });

  const db = getDb();
  const { rows: habits } = await db.execute(
    "SELECT * FROM habits WHERE archived = 0 ORDER BY sort_order ASC, id ASC"
  );

  const results = [];
  for (const habit of habits) {
    const { rows: logs } = await db.execute({
      sql: "SELECT log_date FROM habit_logs WHERE habit_id = ? AND done = 1 ORDER BY log_date DESC LIMIT 400",
      args: [habit.id],
    });
    const logDates = logs.map((r) => r.log_date);
    results.push({
      ...habit,
      doneToday: logDates.includes(today),
      streak: computeStreak(logDates, today),
      last30: logDates.filter((d) => d >= addDays(today, -29)),
    });
  }

  return NextResponse.json({ habits: results });
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export async function POST(req) {
  const { name } = await req.json();
  if (!name || !name.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });
  const db = getDb();
  const { rows } = await db.execute("SELECT COALESCE(MAX(sort_order), -1) as m FROM habits");
  await db.execute({
    sql: "INSERT INTO habits (name, sort_order) VALUES (?, ?)",
    args: [name.trim(), rows[0].m + 1],
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const id = req.nextUrl.searchParams.get("id");
  const db = getDb();
  await db.execute({ sql: "UPDATE habits SET archived = 1 WHERE id = ?", args: [id] });
  return NextResponse.json({ ok: true });
}
