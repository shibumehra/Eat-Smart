interface LogoProps {
  className?: string;
  showWordmark?: boolean;
}

export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={3.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* bulb */}
      <path d="M32 6c10.5 0 19 8.2 19 18.3 0 6.6-3.3 10.7-6.2 14.3-2.1 2.6-3.6 4.7-3.9 7.6" />
      <path d="M32 6c-10.5 0-19 8.2-19 18.3 0 6.6 3.3 10.7 6.2 14.3 2.1 2.6 3.6 4.7 3.9 7.6" />
      <path d="M23.1 46.2h17.8" />
      <path d="M25.4 53.1h13.2" />
      <path d="M28.3 58.4h7.4" />
      {/* leaf */}
      <path d="M40 16.5c-12.5-3.2-24 3-24 13.6 0 5.9 4.2 10.3 9.7 10.3 8.6 0 14.3-9.1 14.3-23.9Z" />
      <path d="M38.8 18.2c-8.6 4.4-13.6 12.2-14.6 21.8" />
    </svg>
  );
}

export default function Logo({ className = '', showWordmark = true }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className="h-7 w-7 text-primary" />
      {showWordmark && (
        <span className="font-display text-xl font-medium lowercase tracking-tight text-foreground">
          eatsmart
        </span>
      )}
    </span>
  );
}
