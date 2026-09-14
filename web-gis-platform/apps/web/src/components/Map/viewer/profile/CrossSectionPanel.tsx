import { useState } from 'react';
import { ScanLine } from 'lucide-react';
import type { CrossSectionResult, CrossSectionSample } from '../../measurementTypes';
import { AnalysisPanelShell } from '../analysis/AnalysisPanelShell';
import { MetricCard } from '../analysis/MetricCard';
import { formatChainage, type CrossSectionSettings } from './crossSectionUtils';

type Props={result:CrossSectionResult|null;settings:CrossSectionSettings;busy:boolean;onSettingsChange:(value:CrossSectionSettings)=>void;onClose:()=>void};
const W=520,H=190,PX=42,PY=24;
export function CrossSectionPanel({result,settings,busy,onSettingsChange,onClose}:Props){
 const [hover,setHover]=useState<CrossSectionSample|null>(null);
 const update=(key:keyof CrossSectionSettings,value:number)=>onSettingsChange({...settings,[key]:value});
 const rangeX=result?Math.max(.01,result.leftWidth+result.rightWidth):1,rangeY=result?Math.max(.01,result.maxElevation-result.minElevation):1;
 const point=(sample:CrossSectionSample)=>({x:PX+((sample.offset+(result?.leftWidth??0))/rangeX)*(W-PX*2),y:H-PY-((sample.elevation-(result?.minElevation??0))/rangeY)*(H-PY*2)});
 const hp=hover?point(hover):null;
 return <AnalysisPanelShell icon={<ScanLine size={15}/>} title="TRẮC NGANG" subtitle={result?formatChainage(result.station):(busy?'Đang lấy mẫu…':'Chọn vị trí trên tuyến trắc dọc')} onClose={onClose}>
  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{([['leftWidth','Trái',1,200],['rightWidth','Phải',1,200],['spacing','Bước mẫu',.1,5]] as const).map(([key,label,min,max])=><label key={key} className={`text-[11px] font-medium text-[var(--ap-muted)] ${key==='spacing'?'col-span-2 sm:col-span-1':''}`}>{label} (m)<input aria-label={label+' mét'} type="number" min={min} max={max} step={key==='spacing'?.1:1} value={settings[key]} onChange={e=>update(key,Math.max(min,Math.min(max,Number(e.target.value)||min)))} className="mt-1 h-9 w-full rounded-md border border-[var(--ap-border)] bg-[var(--ap-surface-2)] px-2.5 text-xs text-[var(--ap-text)] outline-none focus-visible:border-[var(--ap-accent)] focus-visible:ring-2 focus-visible:ring-[var(--ap-accent-soft)]"/></label>)}</div>
  {result&&<><div className="mt-3 rounded-lg border border-[var(--ap-border-soft)] bg-[var(--ap-chart)] p-2"><svg viewBox="0 0 520 190" className="h-[180px] w-full" role="img" aria-label="Biểu đồ cao độ theo offset" onPointerLeave={()=>setHover(null)} onPointerMove={event=>{const box=event.currentTarget.getBoundingClientRect();const offset=Math.max(0,Math.min(1,(((event.clientX-box.left)/box.width)*W-PX)/(W-PX*2)))*rangeX-result.leftWidth;let nearest=result.samples[0];result.samples.forEach(s=>{if(Math.abs(s.offset-offset)<Math.abs(nearest.offset-offset))nearest=s});setHover(nearest)}}>
   {[0,.25,.5,.75,1].map(r=><g key={r}><line x1={PX} x2={W-PX} y1={PY+r*(H-PY*2)} y2={PY+r*(H-PY*2)} stroke="var(--ap-grid)"/><text x={PX+r*(W-PX*2)} y={H-6} textAnchor={r===0?'start':r===1?'end':'middle'} fill="var(--ap-muted)" fontSize="10">{(r*rangeX-result.leftWidth>=0?'+':'')+(r*rangeX-result.leftWidth).toFixed(0)}m</text></g>)}
   <line x1={point({offset:0,elevation:result.minElevation,position:result.samples[0].position}).x} x2={point({offset:0,elevation:result.minElevation,position:result.samples[0].position}).x} y1={PY} y2={H-PY} stroke="var(--ap-accent)" strokeDasharray="4 3"/>
   <polyline points={result.samples.map(s=>{const p=point(s);return p.x.toFixed(1)+','+p.y.toFixed(1)}).join(' ')} fill="none" stroke="var(--ap-cross-line)" strokeWidth="2.5" strokeLinejoin="round"/>
   {hover&&hp&&<g pointerEvents="none"><circle cx={hp.x} cy={hp.y} r="4" fill="var(--ap-surface)" stroke="var(--ap-cross-line)" strokeWidth="2"/><rect x={Math.min(hp.x+8,370)} y={Math.max(hp.y-35,5)} width="135" height="30" rx="6" fill="var(--ap-surface)" stroke="var(--ap-border)"/><text x={Math.min(hp.x+15,377)} y={Math.max(hp.y-17,23)} fill="var(--ap-text)" fontSize="10">Offset {hover.offset>=0?'+':''}{hover.offset.toFixed(1)} m • {hover.elevation.toFixed(2)} m</text></g>}
  </svg></div><div className="mt-3 grid grid-cols-3 gap-2"><MetricCard label="H min" value={result.minElevation.toFixed(2)+' m'}/><MetricCard label="H max" value={result.maxElevation.toFixed(2)+' m'}/><MetricCard label="Δ Cao độ" value={(result.maxElevation-result.minElevation).toFixed(2)+' m'} accent="primary"/></div></>}
 </AnalysisPanelShell>;
}
