import { NextResponse } from "next/server";
import { getDb } from "../../../lib/db";

// `today` (YYYY-MM-DD, the client's local date -- see lib/db.js) hides any
// todo deferred to a later day; once its defer_until date arrives it's back
// in the list automatically. Omitting `today` returns everything, deferred
// or not, so existing callers don't break.
export async function GET(req) {
  const today = req.nextUrl.searchParams.get("today");
  const db = getDb();
  const { rows } = await db.execute(
    today
      ? {
          sql: `
            SELECT * FROM todos
            WHERE defer_until IS NULL OR defer_until <= ?
            ORDER BY done ASC, created_at DESC
            LIMIT 100
          `,
          args: [today],
        }
      : `
          SELECT * FROM todos
          ORDER BY done ASC, created_at DESC
          LIMIT 100
        `
  );
  return NextResponse.json({ todos: rows });
}

export async function POST(req) {
  const { text } = await req.json();
  if (!text || !text.trim()) return NextResponse.json({ error: "text required" }, { status: 400 });
  const db = getDb();
  await db.execute({ sql: "INSERT INTO todos (text) VALUES (?)", args: [text.trim()] });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req) {
  const { id, done, defer_until } = await req.json();
  const db = getDb();

  // Two independent things can change here: done-ness, or which day this
  // todo should reappear on ("move to tomorrow"). Only touch the columns
  // the caller actually sent so one doesn't clobber the other.
  if (done !== undefined) {
    await db.execute({
      sql: "UPDATE todos SET done = ?, completed_at = CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE NULL END WHERE id = ?",
      args: [done ? 1 : 0, done ? 1 : 0, id],
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
