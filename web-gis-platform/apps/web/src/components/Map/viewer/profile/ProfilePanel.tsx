import { useState } from 'react';
import { Activity } from 'lucide-react';
import type { ProfileResult, ProfileSample } from '../../measurementTypes';
import { buildProfileChartPoints } from '../../measurementUtils';
import { AnalysisPanelShell } from '../analysis/AnalysisPanelShell';
import { MetricCard } from '../analysis/MetricCard';
import { formatChainage } from './crossSectionUtils';

type Props = { profile: ProfileResult; isSampling: boolean; onClose: () => void };
const W = 520, H = 200, PX = 42, PY = 24;

export function ProfilePanel({ profile, isSampling, onClose }: Props) {
  const [hover, setHover] = useState<ProfileSample | null>(null);
  const distanceRange = Math.max(profile.totalDistance, .01);
  const heightRange = Math.max(profile.maxHeight - profile.minHeight, .01);
  const plot = (sample: ProfileSample) => ({ x: PX + sample.distance / distanceRange * (W - PX * 2), y: H - PY - (sample.height - profile.minHeight) / heightRange * (H - PY * 2) });
  const hovered = hover ? plot(hover) : null;
  const elevationDifference = profile.samples.at(-1)!.height - profile.samples[0].height;
  const ticks = [0, .2, .4, .6, .8, 1];

  return <AnalysisPanelShell icon={<Activity size={15}/>} title="TRẮC DỌC CAO ĐỘ" subtitle={<>{formatChainage(profile.totalDistance)} • {profile.totalDistance.toFixed(2)} m • {profile.samples.length} mẫu{isSampling ? ' • Đang cập nhật…' : ''}</>} onClose={onClose}>
    <div className="rounded-lg border border-[var(--ap-border-soft)] bg-[var(--ap-chart)] p-2">
      <svg viewBox="0 0 520 200" className="h-[190px] w-full" role="img" aria-label="Biểu đồ lý trình và cao độ" onPointerLeave={() => setHover(null)} onPointerMove={event => { const box=event.currentTarget.getBoundingClientRect(); const distance=Math.max(0,Math.min(1,(((event.clientX-box.left)/box.width)*W-PX)/(W-PX*2)))*profile.totalDistance; let nearest=profile.samples[0]; profile.samples.forEach(sample=>{if(Math.abs(sample.distance-distance)<Math.abs(nearest.distance-distance))nearest=sample}); setHover(nearest); }}>
        {ticks.map(r=><g key={r}><line x1={PX} x2={W-PX} y1={PY+r*(H-PY*2)} y2={PY+r*(H-PY*2)} stroke="var(--ap-grid)"/><line x1={PX+r*(W-PX*2)} x2={PX+r*(W-PX*2)} y1={PY} y2={H-PY} stroke="var(--ap-grid)"/><text x={PX+r*(W-PX*2)} y={H-7} textAnchor={r===0?'start':r===1?'end':'middle'} fill="var(--ap-muted)" fontSize="10">{(profile.totalDistance*r).toFixed(r===1?1:0)}m</text></g>)}
        <text x="4" y={PY+4} fill="var(--ap-muted)" fontSize="10">{profile.maxHeight.toFixed(2)}</text><text x="4" y={H-PY+3} fill="var(--ap-muted)" fontSize="10">{profile.minHeight.toFixed(2)}</text>
        <polyline points={buildProfileChartPoints(profile,W,H,PX,PY)} fill="none" stroke="var(--ap-accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
        {hover&&hovered&&<g pointerEvents="none"><line x1={hovered.x} x2={hovered.x} y1={PY} y2={H-PY} stroke="var(--ap-accent)" strokeDasharray="3 3"/><circle cx={hovered.x} cy={hovered.y} r="4" fill="var(--ap-surface)" stroke="var(--ap-accent)" strokeWidth="2"/><rect x={Math.min(hovered.x+8,350)} y={Math.max(hovered.y-50,5)} width="158" height="44" rx="6" fill="var(--ap-surface)" stroke="var(--ap-border)"/><text x={Math.min(hovered.x+16,358)} y={Math.max(hovered.y-34,21)} fill="var(--ap-text)" fontSize="10"><tspan x={Math.min(hovered.x+16,358)}>Lý trình {formatChainage(hover.distance)}</tspan><tspan x={Math.min(hovered.x+16,358)} dy="13">Khoảng cách {hover.distance.toFixed(1)} m • Cao độ {hover.height.toFixed(2)} m</tspan></text></g>}
      </svg>
    </div>
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"><MetricCard label="Chiều dài" value={profile.totalDistance.toFixed(2)+' m'}/><MetricCard label="H min" value={profile.minHeight.toFixed(2)+' m'}/><MetricCard label="H max" value={profile.maxHeight.toFixed(2)+' m'}/><MetricCard label="Δ Cao độ" value={(elevationDifference>=0?'+':'')+elevationDifference.toFixed(2)+' m'} accent="primary"/></div>
  </AnalysisPanelShell>;
}
