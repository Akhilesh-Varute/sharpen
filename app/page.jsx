"use client";

import { useEffect, useState } from "react";
import Spinner from "../components/Spinner";

function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayStr() {
  return toDateStr(new Date());
}

function shiftDate(dateStr, deltaDays) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + deltaDays);
  return toDateStr(d);
}

function formatHeading(dateStr, today) {
  if (dateStr === today) return "Today";
  const yesterday = shiftDate(today, -1);
  if (dateStr === yesterday) return "Yesterday";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
}

const MOODS = ["😞", "😕", "😐", "🙂", "😄"];

export default function TodayPage() {
  const today = todayStr();
  const [viewDate, setViewDate] = useState(today);
  const isToday = viewDate === today;

  const [entry, setEntry] = useState({ log: "", reflection: "", mood: null, energy: null });
  const [saved, setSaved] = useState(true);
  const [todos, setTodos] = useState([]);
  const [deferredCount, setDeferredCount] = useState(0);
  const [newTodo, setNewTodo] = useState("");
  const [addingTodo, setAddingTodo] = useState(false);
  const [items, setItems] = useState([]);
  const [learnNote, setLearnNote] = useState("");
  const [learnItemId, setLearnItemId] = useState("");
  const [addingLearn, setAddingLearn] = useState(false);
  const [dayLogs, setDayLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  // Todos and learning tracks aren't tied to viewDate at all — they used to
  // get refetched on every prev/next tap for no reason. Load them once, on
  // mount, separately from the per-day data below.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [todosRes, itemsRes] = await Promise.all([
        fetch(`/api/todos?today=${today}`).then((r) => r.json()),
        fetch("/api/learning").then((r) => r.json()),
      ]);
      if (cancelled) return;
      setTodos(todosRes.todos || []);
      setDeferredCount(todosRes.deferredCount || 0);
      setItems((itemsRes.items || []).filter((i) => i.status !== "done"));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Only the journal entry and that day's learning log actually depend on
  // viewDate, so this is what prev/next re-fetches — two small, indexed,
  // date-filtered queries instead of the previous four (two of which pulled
  // unrelated or oversized data).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (loading) {
        // first load only
      } else {
        setSwitching(true);
      }
      const [journalRes, logsRes] = await Promise.all([
        fetch(`/api/journal?date=${viewDate}`).then((r) => r.json()),
        fetch(`/api/learning/log?date=${viewDate}`).then((r) => r.json()),
      ]);
      if (cancelled) return;
      setEntry(
        journalRes.entry
          ? {
              log: journalRes.entry.log || "",
              reflection: journalRes.entry.reflection || "",
              mood: journalRes.entry.mood,
              energy: journalRes.entry.energy,
            }
          : { log: "", reflection: "", mood: null, energy: null }
      );
      setDayLogs(logsRes.logs || []);
      setLoading(false);
      setSwitching(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewDate]);

  async function saveEntry(next) {
    const merged = { ...entry, ...next };
    setEntry(merged);
    setSaved(false);
    await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: viewDate, ...merged }),
    });
    setSaved(true);
  }

  async function addTodo(e) {
    e.preventDefault();
    if (!newTodo.trim() || addingTodo) return;
    setAddingTodo(true);
    try {
      await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newTodo }),
      });
      setNewTodo("");
      const res = await fetch(`/api/todos?today=${today}`).then((r) => r.json());
      setTodos(res.todos || []);
      setDeferredCount(res.deferredCount || 0);
    } finally {
      setAddingTodo(false);
    }
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

  async function deferTodoToTomorrow(id) {
    // Optimistically drop it from today's list — it'll come back on its own
    // once that date rolls around (see the `today` filter on GET /api/todos).
    setTodos((t) => t.filter((x) => x.id !== id));
    setDeferredCount((c) => c + 1);
    await fetch("/api/todos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, defer_until: shiftDate(today, 1) }),
    });
  }

  async function addLearning(e) {
    e.preventDefault();
    if (!learnNote.trim() || addingLearn) return;
    setAddingLearn(true);
    try {
      await fetch("/api/learning/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learning_item_id: learnItemId || null,
          date: viewDate,
          note: learnNote,
        }),
      });
      setLearnNote("");
      const res = await fetch(`/api/learning/log?date=${viewDate}`).then((r) => r.json());
      setDayLogs(res.logs || []);
    } finally {
      setAddingLearn(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-ink-faint dark:text-dink-faint">
        <Spinner className="w-6 h-6 text-accent dark:text-daccent" />
        <span className="text-sm">Loading today…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="pt-1 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-mono uppercase tracking-[0.08em] text-accent dark:text-daccent font-semibold flex items-center gap-2">
            {new Date(viewDate + "T00:00:00").toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
            {switching && <Spinner className="w-3 h-3" />}
          </div>
          <h1 className="text-2xl font-display font-medium mt-1">
            {isToday
              ? new Date().getHours() < 12
                ? "Morning."
                : new Date().getHours() < 18
                ? "Afternoon."
                : "Evening."
              : formatHeading(viewDate, today) + "."}
          </h1>
        </div>
        <div className="flex items-center gap-1 flex-none">
          <button
            aria-label="Previous day"
            onClick={() => setViewDate((d) => shiftDate(d, -1))}
            className="w-11 h-11 rounded-full border border-line dark:border-dline bg-card dark:bg-dcard shadow-card flex items-center justify-center text-ink-soft dark:text-dink-soft"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            aria-label="Next day"
            onClick={() => setViewDate((d) => (d < today ? shiftDate(d, 1) : d))}
            disabled={isToday}
            className="w-11 h-11 rounded-full border border-line dark:border-dline bg-card dark:bg-dcard shadow-card flex items-center justify-center text-ink-soft dark:text-dink-soft disabled:opacity-30"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </header>

      {!isToday && (
        <button
          onClick={() => setViewDate(today)}
          className="text-sm font-semibold text-accent dark:text-daccent flex items-center gap-1.5 -mt-2 py-1"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Jump back to today
        </button>
      )}

      {/* Check-in */}
      <section className="bg-card dark:bg-dcard border border-line-soft dark:border-dline-soft rounded-lg2 shadow-card p-4 space-y-3">
        <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-ink-faint dark:text-dink-faint">
          Check-in
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-ink-soft dark:text-dink-soft w-14 flex-none">Mood</span>
          <div className="flex flex-1 justify-between gap-1">
            {MOODS.map((emoji, i) => (
              <button
                key={i}
                onClick={() => saveEntry({ mood: i + 1 })}
                className={`flex-1 max-w-[48px] aspect-square rounded-[14px] text-xl flex items-center justify-center border transition ${
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
          <span className="text-sm font-semibold text-ink-soft dark:text-dink-soft w-14 flex-none">Energy</span>
          <div className="flex flex-1 justify-between gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => saveEntry({ energy: n })}
                className={`flex-1 max-w-[48px] h-10 rounded-sm2 text-sm font-mono border ${
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

      {/* Todos — a single running list, not tied to a date, except that any
          todo can be moved to tomorrow (defer_until) so it drops out of
          today's view and reappears once that day arrives. */}
      {isToday && (
        <section className="bg-card dark:bg-dcard border border-line-soft dark:border-dline-soft rounded-lg2 shadow-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-ink-faint dark:text-dink-faint">
              Today
            </h2>
            {deferredCount > 0 && (
              <span className="text-[0.68rem] font-mono text-ink-faint dark:text-dink-faint">
                {deferredCount} moved to later
              </span>
            )}
          </div>
          <form onSubmit={addTodo} className="flex gap-2">
            <input
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add a todo…"
              disabled={addingTodo}
              className="flex-1 min-w-0 border border-line dark:border-dline bg-paper dark:bg-dpaper rounded-sm2 px-3.5 py-3 text-base focus:outline-none focus:ring-[3px] focus:ring-accent/20 dark:focus:ring-daccent/20 disabled:opacity-60"
            />
            <button
              disabled={addingTodo || !newTodo.trim()}
              className="bg-ink dark:bg-dink text-paper dark:text-dpaper rounded-sm2 px-5 font-semibold text-base disabled:opacity-50 flex items-center gap-1.5 min-w-[72px] justify-center"
            >
              {addingTodo ? <Spinner className="w-3.5 h-3.5" /> : "Add"}
            </button>
          </form>
          <ul>
            {todos.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-3 py-3 border-b border-line-soft dark:border-dline-soft last:border-none group"
              >
                <button
                  onClick={() => toggleTodo(t.id, !t.done)}
                  className={`w-7 h-7 flex-none rounded-[9px] border flex items-center justify-center transition ${
                    t.done
                      ? "bg-good dark:bg-dgood border-good dark:border-dgood text-accent-ink"
                      : "bg-paper dark:bg-dpaper border-line dark:border-dline"
                  }`}
                >
                  {!!t.done && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
                <span className={`flex-1 min-w-0 text-base ${t.done ? "line-through text-ink-faint dark:text-dink-faint" : ""}`}>
                  {t.text}
                </span>
                {!t.done && (
                  <button
                    onClick={() => deferTodoToTomorrow(t.id)}
                    aria-label="Move to tomorrow"
                    title="Move to tomorrow"
                    className="flex-none w-9 h-9 -my-1 flex items-center justify-center text-ink-faint dark:text-dink-faint active:text-accent dark:active:text-daccent"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => deleteTodo(t.id)}
                  aria-label="Remove todo"
                  className="flex-none w-9 h-9 -my-1 flex items-center justify-center text-ink-faint dark:text-dink-faint active:text-warn dark:active:text-warn"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0-.8 12.1A2 2 0 0 1 15.2 21H8.8a2 2 0 0 1-2-1.9L6 7" />
                  </svg>
                </button>
              </li>
            ))}
            {todos.length === 0 && <p className="text-ink-faint dark:text-dink-faint text-base py-1">Nothing yet.</p>}
          </ul>
        </section>
      )}

      {/* Learned that day */}
      <section className="bg-card dark:bg-dcard border border-line-soft dark:border-dline-soft rounded-lg2 shadow-card p-4 space-y-3">
        <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-ink-faint dark:text-dink-faint">
          {isToday ? "Learned today" : "Learned that day"}
        </h2>
        <form onSubmit={addLearning} className="flex gap-2">
          <select
            value={learnItemId}
            onChange={(e) => setLearnItemId(e.target.value)}
            disabled={addingLearn}
            className="border border-line dark:border-dline bg-paper dark:bg-dpaper rounded-sm2 px-2 py-3 text-base max-w-[112px] disabled:opacity-60"
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
            disabled={addingLearn}
            className="flex-1 min-w-0 border border-line dark:border-dline bg-paper dark:bg-dpaper rounded-sm2 px-3.5 py-3 text-base focus:outline-none focus:ring-[3px] focus:ring-accent/20 dark:focus:ring-daccent/20 disabled:opacity-60"
          />
          <button
            disabled={addingLearn || !learnNote.trim()}
            className="bg-ink dark:bg-dink text-paper dark:text-dpaper rounded-sm2 px-5 font-semibold text-base disabled:opacity-50 flex items-center gap-1.5 min-w-[64px] justify-center"
          >
            {addingLearn ? <Spinner className="w-3.5 h-3.5" /> : "Log"}
          </button>
        </form>
        {dayLogs.length > 0 && (
          <div>
            {dayLogs.map((l) => (
              <div key={l.id} className="flex gap-2 text-base py-2.5 border-b border-line-soft dark:border-dline-soft last:border-none">
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
        {dayLogs.length === 0 && (
          <p className="text-ink-faint dark:text-dink-faint text-base">Nothing logged this day.</p>
        )}
      </section>

      {/* Journal */}
      <section className="bg-card dark:bg-dcard border border-line-soft dark:border-dline-soft rounded-lg2 shadow-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-ink-faint dark:text-dink-faint">
            Journal
          </h2>
          <span className="text-[0.65rem] font-mono text-ink-faint dark:text-dink-faint flex items-center gap-1.5">
            {saved ? (
              <span className="w-1.5 h-1.5 rounded-full bg-good dark:bg-dgood" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-accent dark:bg-daccent animate-pulse" />
            )}
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
            className="w-full border border-line dark:border-dline bg-paper dark:bg-dpaper rounded-sm2 px-3.5 py-3 text-base leading-relaxed focus:outline-none focus:ring-[3px] focus:ring-accent/20 dark:focus:ring-daccent/20"
          />
        </div>

        <div>
          <p className="text-[0.72rem] text-ink-faint dark:text-dink-faint mb-1.5">
            A few honest lines: how that day actually went.
          </p>
          <textarea
            value={entry.reflection}
            onChange={(e) => setEntry((s) => ({ ...s, reflection: e.target.value }))}
            onBlur={() => saveEntry({})}
            rows={3}
            className="w-full border border-line dark:border-dline bg-paper dark:bg-dpaper rounded-sm2 px-3.5 py-3 text-base leading-relaxed focus:outline-none focus:ring-[3px] focus:ring-accent/20 dark:focus:ring-daccent/20"
          />
        </div>
      </section>
    </div>
  );
}
