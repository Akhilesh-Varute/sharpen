export default function Spinner({ className = "w-4 h-4", strokeWidth = 3 }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeOpacity="0.2"
      />
      <path
        d="M21.5 12a9.5 9.5 0 0 0-9.5-9.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}
