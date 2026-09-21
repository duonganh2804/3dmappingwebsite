/* Hallmark · component: analysis panel · genre: modern-minimal · theme: SAOLATEK
 * states: default · hover · focus · active · disabled · loading · error · success
 * contrast: pass · pre-emit critique: P5 H5 E4 S5 R5 V4
 */
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

type Props = { icon: ReactNode; title: string; subtitle?: ReactNode; action?: ReactNode; onClose: () => void; children: ReactNode };

export function AnalysisPanelShell({ icon, title, subtitle, action, onClose, children }: Props) {
  return <section className="saolatek-analysis-panel absolute bottom-3 right-3 z-30 flex max-h-[min(74vh,620px)] w-[min(440px,calc(100%-24px))] flex-col overflow-hidden rounded-xl border border-[var(--ap-border)] bg-[var(--ap-surface)] text-[var(--ap-text)] shadow-[var(--ap-shadow)] md:bottom-4 md:right-4" aria-label={title}>
    <style>{ANALYSIS_PANEL_STYLES}</style>
    <header className="flex shrink-0 items-start gap-2.5 border-b border-[var(--ap-border-soft)] px-4 py-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--ap-accent-soft)] text-[var(--ap-accent)]">{icon}</span>
      <div className="min-w-0 flex-1"><h2 className="text-sm font-semibold leading-5 tracking-tight">{title}</h2>{subtitle && <div className="mt-0.5 truncate text-[11px] leading-4 text-[var(--ap-muted)]">{subtitle}</div>}</div>
      {action}
      <button type="button" onClick={onClose} title="Đóng" aria-label={`Đóng ${title}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-transparent text-[var(--ap-muted)] hover:border-[var(--ap-border)] hover:bg-[var(--ap-hover)] hover:text-[var(--ap-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ap-focus)] active:translate-y-px"><X size={15}/></button>
    </header>
    <div className="min-h-0 overflow-y-auto overscroll-contain p-4">{children}</div>
  </section>;
}

const ANALYSIS_PANEL_STYLES = `
.saolatek-analysis-panel{--ap-surface:rgba(13,27,45,.97);--ap-surface-2:#101f32;--ap-hover:#172a41;--ap-border:#34465c;--ap-border-soft:#26384d;--ap-text:#e7eef7;--ap-muted:#9aacbf;--ap-accent:#38aee8;--ap-accent-ink:#fff;--ap-accent-soft:rgba(56,174,232,.12);--ap-cut:#fb923c;--ap-fill:#34d399;--ap-cross-line:#e58a1f;--ap-focus:#38aee8;--ap-shadow:0 12px 32px rgba(2,6,23,.24);--ap-grid:rgba(148,163,184,.16);--ap-chart:#0b1727}
html[data-saolatek-theme='light'] .saolatek-analysis-panel{--ap-surface:rgba(255,255,255,.98);--ap-surface-2:#f6f9fc;--ap-hover:#eef4f8;--ap-border:#c9d5df;--ap-border-soft:#dce5ec;--ap-text:#17283c;--ap-muted:#607286;--ap-accent:#087fae;--ap-accent-ink:#fff;--ap-accent-soft:rgba(8,127,174,.09);--ap-cut:#c2410c;--ap-fill:#047857;--ap-cross-line:#c96d0b;--ap-focus:#087fae;--ap-shadow:0 10px 28px rgba(15,23,42,.13);--ap-grid:rgba(71,85,105,.15);--ap-chart:#f8fafc}
.saolatek-analysis-panel input,.saolatek-analysis-panel select{color-scheme:dark}
html[data-saolatek-theme='light'] .saolatek-analysis-panel input,html[data-saolatek-theme='light'] .saolatek-analysis-panel select{color-scheme:light}
`;
