import type { ReactNode } from 'react';
export function MetricCard({ label, value, accent }: { label: string; value: ReactNode; accent?: 'cut'|'fill'|'primary' }) {
  const tone = accent === 'cut' ? 'text-[var(--ap-cut)]' : accent === 'fill' ? 'text-[var(--ap-fill)]' : accent === 'primary' ? 'text-[var(--ap-accent)]' : 'text-[var(--ap-text)]';
  return <div className="min-w-0 rounded-lg border border-[var(--ap-border-soft)] bg-[var(--ap-surface-2)] px-2.5 py-2"><div className="truncate text-[10px] font-medium text-[var(--ap-muted)]">{label}</div><div className={`mt-1 truncate font-mono text-xs font-semibold tabular-nums ${tone}`}>{value}</div></div>;
}
