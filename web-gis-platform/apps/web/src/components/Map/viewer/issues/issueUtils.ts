import * as Cesium from 'cesium';
import type { IssueSeverity, IssueStatus } from '../../../../services/api';
export const issueColor=(severity:IssueSeverity)=>Cesium.Color.fromCssColorString(({LOW:'#38bdf8',MEDIUM:'#f59e0b',HIGH:'#f97316',CRITICAL:'#ef4444'} as const)[severity]);
export const statusLabel=(status:IssueStatus)=>({OPEN:'Mở',IN_PROGRESS:'Đang xử lý',RESOLVED:'Đã xử lý'} as const)[status];
