import { NextResponse } from "next/server";
import { getDb } from "../../../lib/db";

// `today` (YYYY-MM-DD, the client's local date -- see lib/db.js) hides any
// todo deferred to a later day; once its defer_until date arrives it's back
// in the list automatically. Omitting `today` returns everything, deferred
// or not, so existing callers don't break.
//
// A done todo only stays in this "current" list for the day it was
// actually completed (completed_date = today) -- otherwise finished tasks
// would just pile up at the bottom of this list forever. Once the day
// passes, a completed todo drops out of here and is only visible via the
// `date` query below, on whichever day it happened.
export async function GET(req) {
  const today = req.nextUrl.searchParams.get("today");
  const date = req.nextUrl.searchParams.get("date");
  const db = getDb();

  // A specific past day's completed todos -- used when browsing back to a
  // previous day, so "what did I finish that day" is still visible instead
  // of just looking empty.
  if (date) {
    const { rows } = await db.execute({
      sql: `
        SELECT * FROM todos
        WHERE done = 1 AND completed_date = ?
        ORDER BY completed_at ASC
      `,
      args: [date],
    });
    return NextResponse.json({ completed: rows });
  }

  const { rows } = await db.execute(
    today
      ? {
          sql: `
            SELECT * FROM todos
            WHERE (defer_until IS NULL OR defer_until <= ?)
              AND (done = 0 OR completed_date = ?)
            ORDER BY done ASC, created_at DESC
            LIMIT 100
          `,
          args: [today, today],
        }
      : `
          SELECT * FROM todos
          ORDER BY done ASC, created_at DESC
          LIMIT 100
        `
  );

  // So deferred todos aren't just invisible until their date arrives:
  // return the actual list (not just a count) so the page can show what's
  // waiting and let you pull one back early if you change your mind.
  let deferred = [];
  if (today) {
    const { rows: deferredRows } = await db.execute({
      sql: `
        SELECT * FROM todos
        WHERE defer_until > ? AND done = 0
        ORDER BY defer_until ASC, created_at DESC
      `,
      args: [today],
    });
    deferred = deferredRows;
  }

  return NextResponse.json({ todos: rows, deferred, deferredCount: deferred.length });
}

export async function POST(req) {
  const { text } = await req.json();
  if (!text || !text.trim()) return NextResponse.json({ error: "text required" }, { status: 400 });
  const db = getDb();
  await db.execute({ sql: "INSERT INTO todos (text) VALUES (?)", args: [text.trim()] });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req) {
  const { id, done, defer_until, completed_date } = await req.json();
  const db = getDb();

  // Two independent things can change here: done-ness, or which day this
  // todo should reappear on ("move to tomorrow"). Only touch the columns
  // the caller actually sent so one doesn't clobber the other.
  //
  // completed_date is the client's local "today" (see lib/db.js) at the
  // moment it was checked off, sent explicitly rather than derived from
  // completed_at server-side -- the server's clock/timezone isn't the same
  // thing as the day the user was actually looking at.
  if (done !== undefined) {
    await db.execute({
      sql: "UPDATE todos SET done = ?, completed_at = CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE NULL END, completed_date = ? WHERE id = ?",
      args: [done ? 1 : 0, done ? 1 : 0, done ? completed_date || null : null, id],
    });
  }
  if (defer_until !== undefined) {
    await db.execute({
      sql: "UPDATE todos SET defer_until = ? WHERE id = ?",
      args: [defer_until || null, id],
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const id = req.nextUrl.searchParams.get("id");
  const db = getDb();
  await db.execute({ sql: "DELETE FROM todos WHERE id = ?", args: [id] });
  return NextResponse.json({ ok: true });
}
