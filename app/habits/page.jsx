"use client";

import { useEffect, useState } from "react";
import Spinner from "../../components/Spinner";

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function last30Days() {
  const days = [];
  const d = new Date();
  for (let i = 29; i >= 0; i--) {
    const day = new Date(d);
    day.setDate(d.getDate() - i);
    days.push(day.toISOString().slice(0, 10));
  }
  return days;
}

export default function HabitsPage() {
  const today = todayStr();
  const days = last30Days();
  const [habits, setHabits] = useState([]);
  const [newHabit, setNewHabit] = useState("");
  const [addingHabit, setAddingHabit] = useState(false);
  const [archivingId, setArchivingId] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch(`/api/habits?today=${today}`).then((r) => r.json());
    setHabits(res.habits || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggle(habit, date, done) {
    setHabits((hs) =>
      hs.map((h) =>
        h.id === habit.id
          ? {
              ...h,
              last30: done ? [...h.last30, date] : h.last30.filter((d) => d !== date),
              doneToday: date === today ? done : h.doneToday,
            }
          : h
      )
    );
    await fetch("/api/habits/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habit_id: habit.id, date, done }),
    });
    load();
  }

  async function addHabit(e) {
    e.preventDefault();
    if (!newHabit.trim() || addingHabit) return;
    setAddingHabit(true);
    try {
      await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newHabit }),
      });
      setNewHabit("");
      await load();
    } finally {
      setAddingHabit(false);
    }
  }

  async function archive(id) {
    setArchivingId(id);
    try {
      await fetch(`/api/habits?id=${id}`, { method: "DELETE" });
      await load();
    } finally {
      setArchivingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-ink-faint dark:text-dink-faint">
        <Spinner className="w-6 h-6 text-accent dark:text-daccent" />
        <span className="text-sm">Loading habits…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="pt-1">
        <div className="text-xs font-mono uppercase tracking-[0.08em] text-accent dark:text-daccent font-semibold">
          {habits.length} {habits.length === 1 ? "habit" : "habits"}
        </div>
        <h1 className="text-2xl font-display font-medium mt-1">Habits</h1>
      </header>

      <form onSubmit={addHabit} className="flex gap-2">
        <input
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
          placeholder="New habit…"
          disabled={addingHabit}
          className="flex-1 border border-line dark:border-dline bg-paper dark:bg-dpaper rounded-sm2 px-3.5 py-3 text-base focus:outline-none focus:ring-[3px] focus:ring-accent/20 dark:focus:ring-daccent/20 disabled:opacity-60"
        />
        <button
          disabled={addingHabit || !newHabit.trim()}
          className="bg-ink dark:bg-dink text-paper dark:text-dpaper rounded-sm2 px-5 font-semibold text-base disabled:opacity-50 flex items-center gap-1.5 min-w-[72px] justify-center"
        >
          {addingHabit ? <Spinner className="w-3.5 h-3.5" /> : "Add"}
        </button>
      </form>

      <div className="space-y-4">
        {habits.map((h) => (
          <div
            key={h.id}
            className="bg-card dark:bg-dcard border border-line-soft dark:border-dline-soft rounded-lg2 shadow-card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggle(h, today, !h.doneToday)}
                  className={`w-11 h-11 rounded-full border flex items-center justify-center transition ${
                    h.doneToday
                      ? "bg-good dark:bg-dgood border-good dark:border-dgood text-accent-ink"
                      : "bg-paper dark:bg-dpaper border-line dark:border-dline"
                  }`}
                >
                  {h.doneToday && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
                <span className="font-semibold text-base">{h.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-base font-mono font-tabular text-accent-strong dark:text-daccent-strong">
                  {h.streak > 0 ? `🔥 ${h.streak}` : "—"}
                </span>
                <button
                  onClick={() => archive(h.id)}
                  disabled={archivingId === h.id}
                  className="text-xs text-ink-faint dark:text-dink-faint active:text-warn dark:active:text-warn font-semibold disabled:opacity-50 flex items-center gap-1 py-2 px-1 -my-2"
                >
                  {archivingId === h.id && <Spinner className="w-3 h-3" />}
                  archive
                </button>
              </div>
            </div>
            <div className="flex gap-[3px]">
              {days.map((d) => {
                const done = h.last30.includes(d);
                return (
                  <button
                    key={d}
                    title={d}
                    onClick={() => toggle(h, d, !done)}
                    className={`flex-1 h-7 rounded-[4px] ${
                      done ? "bg-good dark:bg-dgood" : "bg-line-soft dark:bg-dline-soft"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        ))}
        {habits.length === 0 && (
          <p className="text-ink-faint dark:text-dink-faint text-base">No habits yet — add one above.</p>
        )}
      </div>
    </div>
  );
}
