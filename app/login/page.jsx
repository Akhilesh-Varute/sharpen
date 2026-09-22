"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    setBusy(false);
    if (res.ok) {
      router.push(params.get("next") || "/");
      router.refresh();
    } else {
      setError("Wrong PIN.");
      setPin("");
    }
  }

  function press(char) {
    if (busy) return;
    setError("");
    setPin((p) => (p + char).slice(0, 24));
  }

  function backspace() {
    if (busy) return;
    setError("");
    setPin((p) => p.slice(0, -1));
  }

  return (
    <form onSubmit={submit} className="min-h-[70vh] flex flex-col items-center justify-center gap-7 px-4">
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lift mark-glyph">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fffaf3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
            <path d="M4 20 L16 8" />
            <path d="M13 5 L19 11 L21 9 L15 3 Z" />
            <path d="M4 20 L7 20 L7 17 Z" />
          </svg>
        </div>
        <h1 className="text-2xl font-display font-medium">Sharpen</h1>
      </div>

      <input
        autoFocus
        type="password"
        inputMode="text"
        value={pin}
        onChange={(e) => {
          setError("");
          setPin(e.target.value);
        }}
        placeholder="PIN"
        className="w-full max-w-xs text-center text-2xl tracking-[0.3em] border border-line dark:border-dline bg-card dark:bg-dcard rounded-lg2 py-3 shadow-card focus:outline-none focus:ring-[3px] focus:ring-accent/20 dark:focus:ring-daccent/20"
      />

      {error && <p className="text-sm text-warn">{error}</p>}

      <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => press(String(n))}
            className="aspect-square rounded-full border border-line dark:border-dline bg-card dark:bg-dcard shadow-card text-xl font-display active:scale-95 transition"
          >
            {n}
          </button>
        ))}
        <div />
        <button
          type="button"
          onClick={() => press("0")}
          className="aspect-square rounded-full border border-line dark:border-dline bg-card dark:bg-dcard shadow-card text-xl font-display active:scale-95 transition"
        >
          0
        </button>
        <button
          type="button"
          onClick={backspace}
          className="text-ink-soft dark:text-dink-soft text-sm font-semibold"
        >
          ⌫
        </button>
      </div>

      <button
        type="submit"
        disabled={busy || !pin}
        className="w-full max-w-xs bg-ink dark:bg-dink text-paper dark:text-dpaper rounded-lg2 py-3 font-semibold disabled:opacity-50"
      >
        {busy ? "Checking…" : "Unlock"}
      </button>

      <p className="text-xs text-ink-faint dark:text-dink-faint -mt-2">
        Same PIN, same URL on your PC and your phone.
      </p>
    </form>
  );
}
