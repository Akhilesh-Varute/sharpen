"use client";

import { useEffect, useState } from "react";
import Spinner from "../../components/Spinner";
import ErrorBanner from "../../components/ErrorBanner";
import { fetchJson } from "../../lib/fetchJson";
import { getCache, setCache } from "../../lib/pageCache";

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

const CACHE_KEY = "habits";

export default function HabitsPage() {
  const today = todayStr();
  const days = last30Days();
  const cached = getCache(CACHE_KEY);
  const [habits, setHabits] = useState(cached?.habits || []);
  const [archivedHabits, setArchivedHabits] = useState(cached?.archived || []);
  const [newHabit, setNewHabit] = useState("");
  const [addingHabit, setAddingHabit] = useState(false);
  const [archivingId, setArchivingId] = useState(null);
  const [restoringId, setRestoringId] = useState(null);
  const [loading, setLoading] = useState(!cached);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);

  async function load() {
    setLoadError(null);
    try {
      const res = await fetchJson(`/api/habits?today=${today}`);
      const nextHabits = res.habits || [];
      const nextArchived = res.archived || [];
      setHabits(nextHabits);
      setArchivedHabits(nextArchived);
      setCache(CACHE_KEY, { habits: nextHabits, archived: nextArchived });
    } catch (err) {
      setLoadError(err.message || "Couldn't load habits.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggle(habit, date, done) {
    const prevHabits = habits;
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
    try {
      await fetchJson("/api/habits/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habit_id: habit.id, date, done }),
      });
      setActionError(null);
      await load();
    } catch (err) {
      setActionError(err.message || "Couldn't update that habit.");
      setHabits(prevHabits);
    }
  }

  async function addHabit(e) {
    e.preventDefault();
    if (!newHabit.trim() || addingHabit) return;
    setAddingHabit(true);
    try {
      await fetchJson("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newHabit }),
      });
      setNewHabit("");
      setActionError(null);
      await load();
    } catch (err) {
      setActionError(err.message || "Couldn't add that habit.");
    } finally {
      setAddingHabit(false);
    }
  }

  async function archive(id) {
    setArchivingId(id);
    try {
      await fetchJson(`/api/habits?id=${id}`, { method: "DELETE" });
      setActionError(null);
      await load();
    } catch (err) {
      setActionError(err.message || "Couldn't archive that habit.");
    } finally {
      setArchivingId(null);
    }
  }

  async function restore(id) {
    setRestoringId(id);
    try {
      await fetchJson("/api/habits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setActionError(null);
      await load();
    } catch (err) {
      setActionError(err.message || "Couldn't restore that habit.");
    } finally {
      setRestoringId(null);
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
          {archivedHabits.length > 0 ? ` · ${archivedHabits.length} archived` : ""}
        </div>
        <h1 className="text-2xl font-display font-medium mt-1">Habits</h1>
      </header>

      {loadError && <ErrorBanner message={loadError} onRetry={load} />}
      {actionError && (
        <ErrorBanner message={actionError} onRetry={() => setActionError(null)} retryLabel="Dismiss" />
      )}

      <form onSubmit={addHabit} className="flex gap-2">
        <input
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
          placeholder="New habit…"
          disabled={addingHabit}
          className="flex-1 min-w-0 border border-line dark:border-dline bg-paper dark:bg-dpaper rounded-sm2 px-3.5 py-3 text-base focus:outline-none focus:ring-[3px] focus:ring-accent/20 dark:focus:ring-daccent/20 disabled:opacity-60"
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
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => toggle(h, today, !h.doneToday)}
                  className={`w-11 h-11 rounded-full border flex items-center justify-center transition ${
                    h.doneToday
                      ? "bg-good dark:bg-dgood border-good dark:border-dgood text-accent-ink"
                      : "bg-paper dark:bg-dpaper border-line dark:border-dline"
                  }`}
                >
                  {!!h.doneToday && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
                <span className="font-semibold text-base truncate">{h.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-base font-mono font-tabular text-accent-strong dark:text-daccent-strong">
                  {h.streak > 0 ? `🔥 ${h.streak}` : "—"}
                </span>
                <button
                  onClick={() => archive(h.id)}
                  disabled={archivingId === h.id}
                  className="text-xs font-semibold bg-warn-soft dark:bg-dwarn-soft text-warn dark:text-dwarn rounded-full px-3 py-1.5 disabled:opacity-50 flex items-center gap-1.5"
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

      {archivedHabits.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-ink-faint dark:text-dink-faint">
            Archived
          </h2>
          <div className="space-y-2">
            {archivedHabits.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between gap-2 bg-card dark:bg-dcard border border-line-soft dark:border-dline-soft rounded-lg2 p-3"
              >
                <span className="text-base text-ink-faint dark:text-dink-faint truncate">{h.name}</span>
                <button
                  onClick={() => restore(h.id)}
                  disabled={restoringId === h.id}
                  className="flex-none text-xs font-semibold bg-accent-soft dark:bg-daccent-soft text-accent dark:text-daccent rounded-full px-3 py-1.5 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {restoringId === h.id && <Spinner className="w-3 h-3" />}
                  restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
