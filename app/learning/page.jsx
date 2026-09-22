"use client";

import { useEffect, useState } from "react";

function daysAgo(dateStr) {
  const then = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.round((now - then) / 86400000);
  if (diff <= 0) return "today";
  if (diff === 1) return "yesterday";
  return `${diff} days ago`;
}

export default function LearningPage() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  async function load() {
    const res = await fetch("/api/learning").then((r) => r.json());
    setItems(res.items || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addItem(e) {
    e.preventDefault();
    if (!title.trim()) return;
    await fetch("/api/learning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, category }),
    });
    setTitle("");
    setCategory("");
    load();
  }

  async function setStatus(id, status) {
    await fetch("/api/learning", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  if (loading) return <p className="text-ink-faint dark:text-dink-faint">Loading…</p>;

  const active = items.filter((i) => i.status !== "done");
  const done = items.filter((i) => i.status === "done");

  return (
    <div className="space-y-6">
      <header className="pt-1">
        <div className="text-xs font-mono uppercase tracking-[0.08em] text-accent dark:text-daccent font-semibold">
          {active.length} active{done.length > 0 ? ` · ${done.length} done` : ""}
        </div>
        <h1 className="text-2xl font-display font-medium mt-1">Learning</h1>
      </header>

      <form onSubmit={addItem} className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What are you learning?"
          className="flex-1 border border-line dark:border-dline bg-paper dark:bg-dpaper rounded-sm2 px-3 py-2 text-sm focus:outline-none focus:ring-[3px] focus:ring-accent/20 dark:focus:ring-daccent/20"
        />
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category"
          className="w-28 border border-line dark:border-dline bg-paper dark:bg-dpaper rounded-sm2 px-3 py-2 text-sm focus:outline-none focus:ring-[3px] focus:ring-accent/20 dark:focus:ring-daccent/20"
        />
        <button className="bg-ink dark:bg-dink text-paper dark:text-dpaper rounded-sm2 px-4 font-semibold text-sm">
          Add
        </button>
      </form>

      <div className="space-y-4">
        {active.map((item) => (
          <div
            key={item.id}
            className="bg-card dark:bg-dcard border border-line-soft dark:border-dline-soft rounded-lg2 shadow-card p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-semibold text-sm">{item.title}</span>
                {item.logCount > 0 && (
                  <div className="text-xs font-mono text-ink-faint dark:text-dink-faint mt-0.5">
                    {item.logCount} {item.logCount === 1 ? "entry" : "entries"} · last logged {daysAgo(item.logs[0].log_date)}
                  </div>
                )}
              </div>
              {item.category && (
                <span className="flex-none text-[0.63rem] font-mono text-ink-soft dark:text-dink-soft bg-paper dark:bg-dpaper border border-line dark:border-dline px-2 py-1 rounded-full whitespace-nowrap">
                  {item.category}
                </span>
              )}
            </div>
            <div className="flex gap-4 text-xs font-semibold">
              {item.status === "active" ? (
                <button
                  onClick={() => setStatus(item.id, "paused")}
                  className="text-ink-faint dark:text-dink-faint hover:text-warn dark:hover:text-warn"
                >
                  pause
                </button>
              ) : (
                <button
                  onClick={() => setStatus(item.id, "active")}
                  className="text-ink-faint dark:text-dink-faint hover:text-accent dark:hover:text-daccent"
                >
                  resume
                </button>
              )}
              <button
                onClick={() => setStatus(item.id, "done")}
                className="text-ink-faint dark:text-dink-faint hover:text-good dark:hover:text-dgood"
              >
                mark done
              </button>
            </div>
            {item.logs.length > 0 && (
              <ul className="space-y-1.5 border-t border-line-soft dark:border-dline-soft pt-3">
                {(expanded[item.id] ? item.logs : item.logs.slice(0, 5)).map((l) => (
                  <li key={l.id} className="text-sm text-ink-soft dark:text-dink-soft flex gap-2">
                    <span className="flex-none font-mono text-[0.68rem] text-ink-faint dark:text-dink-faint pt-0.5">
                      {l.log_date}
                    </span>
                    <span>{l.note}</span>
                  </li>
                ))}
              </ul>
            )}
            {item.logs.length > 5 && (
              <button
                onClick={() => setExpanded((e) => ({ ...e, [item.id]: !e[item.id] }))}
                className="text-xs font-semibold text-ink-faint dark:text-dink-faint hover:text-accent dark:hover:text-daccent"
              >
                {expanded[item.id] ? "show less" : `show all ${item.logCount}`}
              </button>
            )}
            {item.logs.length === 0 && (
              <p className="text-sm text-ink-faint dark:text-dink-faint">
                Nothing logged yet — log entries against this from the Today page.
              </p>
            )}
          </div>
        ))}
        {active.length === 0 && (
          <p className="text-ink-faint dark:text-dink-faint text-sm">Nothing active — add what you're working on above.</p>
        )}
      </div>

      {done.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-ink-faint dark:text-dink-faint">
            Done
          </h2>
          <div className="flex flex-wrap gap-2">
            {done.map((item) => (
              <span
                key={item.id}
                className="text-sm text-ink-faint dark:text-dink-faint bg-card dark:bg-dcard border border-line-soft dark:border-dline-soft px-3 py-1.5 rounded-full line-through"
              >
                {item.title}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
