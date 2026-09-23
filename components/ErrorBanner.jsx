"use client";

export default function ErrorBanner({ message, onRetry, retryLabel = "Retry" }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-card dark:bg-dcard border border-warn/40 rounded-lg2 shadow-card px-4 py-3 text-sm text-warn">
      <span className="min-w-0">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="flex-none font-semibold underline underline-offset-2">
          {retryLabel}
        </button>
      )}
    </div>
  );
}
