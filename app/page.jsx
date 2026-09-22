"use client";

import { useEffect, useState } from "react";

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const MOODS = ["😞", "😕", "😐", "🙂", "😄"];

export default function TodayPage() {
  const date = todayStr();
  const [entry, setEntry] = useState({ log: "", reflection: "", mood: null, energy: null });
  const [saved, setSaved] = useState(true);
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [items, setItems] = useState([]);
  const [learnNote, setLearnNote] = useState("");
  const [learnItemId, setLearnItemId] = useState("");
  const [todayLogs, setTodayLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [journalRes, todosRes, itemsRes, logsRes] = await Promise.all([
        fetch(`/api/journal?date=${date}`).then((r) => r.json()),
        fetch("/api/todos").then((r) => r.json()),
        fetch("/api/learning").then((r) => r.json()),
        fetch("/api/learning/log?limit=100").then((r) => r.json()),
      ]);
      if (journalRes.entry) {
        setEntry({
          log: journalRes.entry.log || "",
          reflection: journalRes.entry.reflection || "",
          mood: journalRes.entry.mood,
          energy: journalRes.entry.energy,
        });
      }
      setTodos(todosRes.todos || []);
      setItems((itemsRes.items || []).filter((i) => i.status !== "done"));
      setTodayLogs((logsRes.logs || []).filter((l) => l.log_date === date));
      setLoading(false);
    })();
  }, [date]);

  async function saveEntry(next) {
    const merged = { ...entry, ...next };
    setEntry(merged);
    setSaved(false);
    await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, ...merged }),
    });
    setSaved(true);
  }

  async function addTodo(e) {
    e.preventDefault();
    if (!newTodo.trim()) return;
    await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newTodo }),
    });
    setNewTodo("");
    const res = await fetch("/api/todos").then((r) => r.json());
    setTodos(res.todos || []);
  }

  async function toggleTodo(id, done) {
    setTodos((t) => t.map((x) => (x.id === id ? { ...x, done: done ? 1 : 0 } : x)));
    await fetch("/api/todos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, done }),
    });
  }

  async function deleteTodo(id) {
    setTodos((t) => t.filter((x) => x.id !== id));
    await fetch(`/api/todos?id=${id}`, { method: "DELETE" });
  }

  async function addLearning(e) {
    e.preventDefault();
    if (!learnNote.trim()) return;
    await fetch("/api/learning/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        learning_item_id: learnItemId || null,
        date,
        note: learnNote,
      }),
    });
    setLearnNote("");
    const res = await fetch("/api/learning/log?limit=100").then((r) => r.json());
    setTodayLogs((res.logs || []).filter((l) => l.log_date === date));
  }

  if (loading) return <p className="text-ink-faint dark:text-dink-faint">Loading…</p>;

  return (
    <div className="space-y-6">
      <header className="pt-1">
        <div className="text-xs font-mono uppercase tracking-[0.08em] text-accent dark:text-daccent font-semibold">
          {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
        </div>
        <h1 className="text-2xl font-display font-medium mt-1">
          {new Date().getHours() < 12 ? "Morning." : new Date().getHours() < 18 ? "Afternoon." : "Evening."}
        </h1>
      </header>

      {/* Check-in */}
      <section className="bg-card dark:bg-dcard border border-line-soft dark:border-dline-soft rounded-lg2 shadow-card p-4 space-y-3">
        <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-ink-faint dark:text-dink-faint">
          Check-in
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-ink-soft dark:text-dink-soft w-14 flex-none">Mood</span>
          <div className="flex flex-1 justify-between gap-1">
            {MOODS.map((emoji, i) => (
              <button
                key={i}
                onClick={() => saveEntry({ mood: i + 1 })}
                className={`flex-1 max-w-[42px] aspect-square rounded-[12px] text-lg flex items-center justify-center border transition ${
                  entry.mood === i + 1
                    ? "bg-accent-soft dark:bg-daccent-soft border-accent dark:border-daccent -translate-y-0.5"
                    : "bg-paper dark:bg-dpaper border-transparent"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-ink-soft dark:text-dink-soft w-14 flex-none">Energy</span>
          <div className="flex flex-1 justify-between gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => saveEntry({ energy: n })}
                className={`flex-1 max-w-[42px] h-[30px] rounded-sm2 text-xs font-mono border ${
                  entry.energy === n
                    ? "bg-ink text-paper dark:bg-dink dark:text-dpaper border-ink dark:border-dink"
                    : "bg-paper dark:bg-dpaper text-ink-soft dark:text-dink-soft border-line dark:border-dline"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Todos */}
      <section className="bg-card dark:bg-dcard border border-line-soft dark:border-dline-soft rounded-lg2 shadow-card p-4 space-y-3">
        <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-ink-faint dark:text-dink-faint">
          Today
        </h2>
        <form onSubmit={addTodo} className="flex gap-2">
          <input
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Add a todo…"
            className="flex-1 border border-line dark:border-dline bg-paper dark:bg-dpaper rounded-sm2 px-3 py-2 text-sm focus:outline-none focus:ring-[3px] focus:ring-accent/20 dark:focus:ring-daccent/20"
          />
          <button className="bg-ink dark:bg-dink text-paper dark:text-dpaper rounded-sm2 px-4 font-semibold text-sm">
            Add
          </button>
        </form>
        <ul>
          {todos.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-3 py-2 border-b border-line-soft dark:border-dline-soft last:border-none group"
            >
              <button
                onClick={() => toggleTodo(t.id, !t.done)}
                className={`w-[21px] h-[21px] flex-none rounded-[7px] border flex items-center justify-center transition ${
                  t.done
                    ? "bg-good dark:bg-dgood border-good dark:border-dgood text-accent-ink"
                    : "bg-paper dark:bg-dpaper border-line dark:border-dline"
                }`}
              >
                {t.done && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </button>
              <span className={`flex-1 text-sm ${t.done ? "line-through text-ink-faint dark:text-dink-faint" : ""}`}>
                {t.text}
              </span>
              <button
                onClick={() => deleteTodo(t.id)}
                className="opacity-0 group-hover:opacity-100 text-ink-faint dark:text-dink-faint hover:text-warn dark:hover:text-warn text-xs font-semibold"
              >
                remove
              </button>
            </li>
          ))}
          {todos.length === 0 && <p className="text-ink-faint dark:text-dink-faint text-sm py-1">Nothing yet.</p>}
        </ul>
      </section>

      {/* Learned today */}
      <section className="bg-card dark:bg-dcard border border-line-soft dark:border-dline-soft rounded-lg2 shadow-card p-4 space-y-3">
        <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-ink-faint dark:text-dink-faint">
          Learned today
        </h2>
        <form onSubmit={addLearning} className="flex gap-2">
          <select
            value={learnItemId}
            onChange={(e) => setLearnItemId(e.target.value)}
            className="border border-line dark:border-dline bg-paper dark:bg-dpaper rounded-sm2 px-2 py-2 text-sm max-w-[110px]"
          >
            <option value="">General</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.title}
              </option>
            ))}
          </select>
          <input
            value={learnNote}
            onChange={(e) => setLearnNote(e.target.value)}
            placeholder="One thing you learned…"
            className="flex-1 border border-line dark:border-dline bg-paper dark:bg-dpaper rounded-sm2 px-3 py-2 text-sm focus:outline-none focus:ring-[3px] focus:ring-accent/20 dark:focus:ring-daccent/20"
          />
          <button className="bg-ink dark:bg-dink text-paper dark:text-dpaper rounded-sm2 px-4 font-semibold text-sm">
            Log
          </button>
        </form>
        {todayLogs.length > 0 && (
          <div>
            {todayLogs.map((l) => (
              <div key={l.id} className="flex gap-2 text-sm py-2 border-b border-line-soft dark:border-dline-soft last:border-none">
                {l.item_title && (
                  <span className="flex-none font-mono text-[0.63rem] text-accent-strong dark:text-daccent-strong bg-accent-soft dark:bg-daccent-soft px-2 py-0.5 rounded-full h-fit">
                    {l.item_title}
                  </span>
                )}
                <span className="text-ink-soft dark:text-dink-soft">{l.note}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Journal */}
      <section className="bg-card dark:bg-dcard border border-line-soft dark:border-dline-soft rounded-lg2 shadow-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-ink-faint dark:text-dink-faint">
            Journal
          </h2>
          <span className="text-[0.65rem] font-mono text-ink-faint dark:text-dink-faint flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${saved ? "bg-good dark:bg-dgood" : "bg-accent dark:bg-daccent"}`} />
            {saved ? "Saved" : "Saving…"}
          </span>
        </div>

        <div>
          <p className="text-[0.72rem] text-ink-faint dark:text-dink-faint mb-1.5">
            Anything that happened, any stray thought — don't organize, just write.
          </p>
          <textarea
            value={entry.log}
            onChange={(e) => setEntry((s) => ({ ...s, log: e.target.value }))}
            onBlur={() => saveEntry({})}
            rows={4}
            className="w-full border border-line dark:border-dline bg-paper dark:bg-dpaper rounded-sm2 px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-[3px] focus:ring-accent/20 dark:focus:ring-daccent/20"
          />
        </div>

        <div>
          <p className="text-[0.72rem] text-ink-faint dark:text-dink-faint mb-1.5">
            A few honest lines: how today actually went.
          </p>
          <textarea
            value={entry.reflection}
            onChange={(e) => setEntry((s) => ({ ...s, reflection: e.target.value }))}
            onBlur={() => saveEntry({})}
            rows={3}
            className="w-full border border-line dark:border-dline bg-paper dark:bg-dpaper rounded-sm2 px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-[3px] focus:ring-accent/20 dark:focus:ring-daccent/20"
          />
        </div>
      </section>
    </div>
  );
}
