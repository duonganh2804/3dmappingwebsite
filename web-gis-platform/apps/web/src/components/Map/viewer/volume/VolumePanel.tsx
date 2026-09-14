import { CircleHelp, LoaderCircle, Mountain, TriangleAlert, Trash2 } from 'lucide-react';
import type { CutFillReferenceMode, CutFillResult } from '../../measurementTypes';
import { AnalysisPanelShell } from '../analysis/AnalysisPanelShell';
import { MetricCard } from '../analysis/MetricCard';

type Props = {
  result: CutFillResult | null;
  referenceMode: CutFillReferenceMode;
  designElevation: number;
  gridSpacing: number;
  referencePointCount: number;
  selectingReferencePoints: boolean;
  referencePlaneError: string | null;
  busy: boolean;
  progress: number | null;
  onModeChange: (mode: CutFillReferenceMode) => void;
  onDesignElevationChange: (value: number) => void;
  onGridSpacingChange: (value: number) => void;
  onSelectReferencePoints: () => void;
  onRecalculate: () => void;
  onClear: () => void;
};

const number = (value: number, digits = 2) => value.toLocaleString('vi-VN', { maximumFractionDigits: digits });
const modeLabels: Record<CutFillReferenceMode, string> = {
  average: 'Cao độ trung bình', design: 'Cao độ thiết kế', min: 'Cao độ thấp nhất', max: 'Cao độ cao nhất', threePointPlane: 'Mặt phẳng 3 điểm',
};

export function VolumePanel({ result, referenceMode, designElevation, gridSpacing, referencePointCount, selectingReferencePoints, referencePlaneError, busy, progress, onModeChange, onDesignElevationChange, onGridSpacingChange, onSelectReferencePoints, onRecalculate, onClear }: Props) {
  const validDesignElevation = referenceMode !== 'design' || Number.isFinite(designElevation);
  const planeReady = referenceMode !== 'threePointPlane' || referencePointCount === 3;
  const planeStatus = referencePointCount === 0
    ? 'Chọn điểm P1 trên bề mặt'
    : referencePointCount === 1
      ? 'Đã chọn P1 — chọn điểm P2'
      : referencePointCount === 2
        ? 'Đã chọn P1, P2 — chọn điểm P3'
        : '✓ Mặt phẳng đã sẵn sàng';
  const clear = <button type="button" onClick={onClear} title="Xóa kết quả Đào / Đắp" aria-label="Xóa kết quả Đào / Đắp" className="flex h-8 items-center gap-1 rounded-md border border-[var(--ap-border)] px-2 text-[11px] text-[var(--ap-muted)] hover:bg-[var(--ap-hover)] hover:text-[var(--ap-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ap-focus)]"><Trash2 size={13} /> Xóa</button>;
  return <AnalysisPanelShell icon={<Mountain size={15} />} title="ĐÀO / ĐẮP" subtitle="Ước tính khối lượng san nền" action={clear} onClose={onClear}>
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <label className="text-[11px] font-medium text-[var(--ap-muted)]">Mặt tham chiếu<select disabled={busy} value={referenceMode} onChange={event => onModeChange(event.target.value as CutFillReferenceMode)} className="mt-1 h-9 w-full rounded-md border border-[var(--ap-border)] bg-[var(--ap-surface-2)] px-2.5 text-xs text-[var(--ap-text)] outline-none focus-visible:border-[var(--ap-accent)] focus-visible:ring-2 focus-visible:ring-[var(--ap-accent-soft)] disabled:opacity-50"><option value="design">Cao độ thiết kế</option><option value="average">Cao độ trung bình</option><option value="min">Cao độ thấp nhất</option><option value="max">Cao độ cao nhất</option><option value="threePointPlane">Mặt phẳng 3 điểm</option></select></label>
      <label className="text-[11px] font-medium text-[var(--ap-muted)]">Cao độ thiết kế (m)<input aria-label="Cao độ thiết kế mét" type="number" step=".1" disabled={busy || referenceMode !== 'design'} value={Number.isFinite(designElevation) ? designElevation : ''} onChange={event => onDesignElevationChange(event.target.value === '' ? Number.NaN : Number(event.target.value))} className="mt-1 h-9 w-full rounded-md border border-[var(--ap-border)] bg-[var(--ap-surface-2)] px-2.5 text-xs text-[var(--ap-text)] outline-none focus-visible:border-[var(--ap-accent)] focus-visible:ring-2 focus-visible:ring-[var(--ap-accent-soft)] disabled:cursor-not-allowed disabled:opacity-45" /></label>
      <label className="text-[11px] font-medium text-[var(--ap-muted)]">Bước lưới yêu cầu<select disabled={busy} value={gridSpacing} onChange={event => onGridSpacingChange(Number(event.target.value))} className="mt-1 h-9 w-full rounded-md border border-[var(--ap-border)] bg-[var(--ap-surface-2)] px-2.5 text-xs text-[var(--ap-text)] outline-none focus-visible:border-[var(--ap-accent)] focus-visible:ring-2 focus-visible:ring-[var(--ap-accent-soft)] disabled:opacity-50">{[0.5, 1, 2, 5].map(value => <option key={value} value={value}>{value} m</option>)}</select></label>
    </div>
    {referenceMode === 'average' && <p className="mt-2 text-[10px] text-[var(--ap-muted)]">Trung bình có trọng số theo diện tích các ô có dữ liệu.</p>}
    {referenceMode === 'threePointPlane' && <div className="mt-2 rounded-md border border-[var(--ap-border)] bg-[var(--ap-surface-2)] p-2 text-[11px] text-[var(--ap-muted)]"><div className="flex items-center justify-between gap-2"><strong className="text-[var(--ap-text)]">Mặt phẳng 3 điểm</strong><button type="button" disabled={busy} onClick={onSelectReferencePoints} className="shrink-0 text-[var(--ap-accent)] hover:underline disabled:opacity-50">Chọn lại</button></div><p className="mt-1">{[0, 1, 2].map(index => `P${index + 1} ${index < referencePointCount ? '✓' : '—'}`).join('   ')}</p>{referencePointCount < 3 && <p className="mt-1">{planeStatus}</p>}</div>}
    {referencePlaneError && <p className="mt-2 text-[10px] text-red-400">{referencePlaneError}</p>}
    {!validDesignElevation && <p className="mt-2 text-[10px] text-red-400">Nhập cao độ thiết kế hợp lệ trước khi tính.</p>}
    <button type="button" disabled={busy || !result || !validDesignElevation || !planeReady} onClick={onRecalculate} className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-[var(--ap-accent)] text-[11px] font-bold tracking-wide text-[var(--ap-accent-ink)] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ap-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ap-surface)] active:translate-y-px disabled:cursor-wait disabled:opacity-50">{busy && <LoaderCircle size={13} className="animate-spin" />}{busy ? 'ĐANG TÍNH...' : 'TÍNH LẠI'}</button>
    {busy && progress !== null && <p className="mt-1 text-center text-[10px] text-[var(--ap-muted)]">Đang lấy bề mặt {Math.round(progress)}%</p>}
    {result && <><div className="mt-3 grid grid-cols-2 gap-2">
      <MetricCard label="Diện tích vùng" value={<>{number(result.areaM2)} m² <span className="text-[var(--ap-muted)]">· {number(result.areaM2 / 10000, 4)} ha</span></>} />
      <MetricCard label="Mặt tham chiếu" value={modeLabels[result.referenceMode]} />
      <MetricCard label="Đào" value={`${number(result.cutM3)} m³`} accent="cut" /><MetricCard label="Đắp" value={`${number(result.fillM3)} m³`} accent="fill" /><MetricCard label="Chênh lệch ròng" value={`${number(result.netM3)} m³`} accent="primary" />
      <MetricCard label="Lưới thực tế" value={`${number(result.gridSpacing)} m`} /><MetricCard label="Độ phủ" value={`${number(result.validCoverage * 100, 1)}%`} />
      {result.invalidSampleCount > 0 && <><MetricCard label="Mẫu hợp lệ" value={`${result.samples.length} / ${result.totalSampleCount}`} /><MetricCard label="Không có dữ liệu" value={`${result.invalidSampleCount}`} /></>}
    </div>
    {result.validCoverage < 0.8 && <div className="mt-3 flex items-start gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-[11px] text-amber-300"><TriangleAlert size={13} className="mt-0.5 shrink-0" /><span>Độ phủ dữ liệu thấp; khối lượng chỉ tích phân trên {number(result.sampledAreaM2)} m² có mẫu hợp lệ.</span></div>}
    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[var(--ap-muted)]" title="Chênh lệch ròng = Đào - Đắp"><CircleHelp size={13} /><span>Chênh lệch ròng = Đào − Đắp</span></div></>}
  </AnalysisPanelShell>;
}
