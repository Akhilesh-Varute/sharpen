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

  // Archiving used to be a one-way trip -- nothing in the UI could ever
  // query archived=1 rows back out. Send them along too (cheap: just the
  // habit rows, no per-habit log/streak work) so the page can offer restore.
  const { rows: archivedHabits } = await db.execute(
    "SELECT * FROM habits WHERE archived = 1 ORDER BY sort_order ASC, id ASC"
  );

  if (habits.length === 0) return NextResponse.json({ habits: [], archived: archivedHabits });

  // One query for every habit's log dates instead of one query per habit
  // (this used to be N+1 round-trips to Turso, hit on every page load AND
  // every single checkbox tap since the page reloads after each toggle).
  const ids = habits.map((h) => h.id);
  const placeholders = ids.map(() => "?").join(",");
  const { rows: allLogs } = await db.execute({
    sql: `
      SELECT habit_id, log_date FROM habit_logs
      WHERE habit_id IN (${placeholders}) AND done = 1
      ORDER BY log_date DESC
    `,
    args: ids,
  });

  const byHabit = new Map(ids.map((id) => [id, []]));
  for (const row of allLogs) byHabit.get(row.habit_id)?.push(row.log_date);

  const results = habits.map((habit) => {
    const logDates = byHabit.get(habit.id) || [];
    return {
      ...habit,
      doneToday: logDates.includes(today),
      streak: computeStreak(logDates, today),
      last30: logDates.filter((d) => d >= addDays(today, -29)),
    };
  });

  return NextResponse.json({ habits: results, archived: archivedHabits });
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

// The other half of archive: bring a habit back into the active list.
export async function PATCH(req) {
  const { id } = await req.json();
  const db = getDb();
  await db.execute({ sql: "UPDATE habits SET archived = 0 WHERE id = ?", args: [id] });
  return NextResponse.json({ ok: true });
}
