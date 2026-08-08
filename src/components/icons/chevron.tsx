export function Chevron({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg aria-hidden className={className} fill="none" viewBox="0 0 16 16">
      <path
        d="M6 3.5 10.5 8 6 12.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}
