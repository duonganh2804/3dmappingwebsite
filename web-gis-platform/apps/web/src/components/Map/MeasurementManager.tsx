import { Eye, EyeOff, Trash2 } from 'lucide-react';

export interface MeasurementManagerItem {
  id: string;
  title: string;
  value: string;
  visible: boolean;
}

interface MeasurementManagerProps {
  items: MeasurementManagerItem[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function MeasurementManager({ items, onToggle, onDelete }: MeasurementManagerProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-1.5 border-t border-[var(--vs-border-soft)] pt-3">
      <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--vs-muted)]">
        Danh sách phép đo
      </div>
      <div className="max-h-48 space-y-1 overflow-y-auto pr-0.5">
        {items.map(item => (
          <div
            key={item.id}
            className="flex min-w-0 items-center gap-1.5 rounded-md border border-[var(--vs-border)] bg-[var(--vs-bg-soft)] px-2 py-1.5"
          >
            <div className={`min-w-0 flex-1 ${item.visible ? '' : 'opacity-45'}`}>
              <div className="truncate text-[10px] font-semibold text-[var(--vs-text)]">{item.title}</div>
              <div className="truncate text-[9px] text-[var(--vs-muted)]">{item.value}</div>
            </div>
            <button
              type="button"
              onClick={() => onToggle(item.id)}
              title={item.visible ? 'Ẩn phép đo' : 'Hiện phép đo'}
              aria-label={item.visible ? `Ẩn ${item.title}` : `Hiện ${item.title}`}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[var(--vs-muted)] transition hover:bg-[var(--vs-segment)] hover:text-[var(--vs-text)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400"
            >
              {item.visible ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              title="Xóa phép đo"
              aria-label={`Xóa ${item.title}`}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[var(--vs-muted)] transition hover:bg-red-500/10 hover:text-red-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
