import { NextResponse } from "next/server";
import { getDb } from "../../../lib/db";

export async function GET() {
  const db = getDb();
  const { rows } = await db.execute(`
    SELECT * FROM todos
    ORDER BY done ASC, created_at DESC
    LIMIT 100
  `);
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
  const { id, done } = await req.json();
  const db = getDb();
  await db.execute({
    sql: "UPDATE todos SET done = ?, completed_at = CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE NULL END WHERE id = ?",
    args: [done ? 1 : 0, done ? 1 : 0, id],
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const id = req.nextUrl.searchParams.get("id");
  const db = getDb();
  await db.execute({ sql: "DELETE FROM todos WHERE id = ?", args: [id] });
  return NextResponse.json({ ok: true });
}
