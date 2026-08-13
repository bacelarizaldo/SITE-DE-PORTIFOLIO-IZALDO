export default function PlaceholderTag({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-accent/50 bg-ink/80 px-3 py-1 text-[10px] font-medium tracking-[0.15em] text-accent uppercase ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      Placeholder
    </span>
  );
}
