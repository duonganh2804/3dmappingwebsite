import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CircleHelp } from 'lucide-react';
import './DemoViewerTour.css';

const COMPLETED_KEY = '3dmapping.demoTour.v1.completed';
const steps = [
  { target: 'display-toolbar', title: 'Chọn lớp dữ liệu', text: 'Dùng Toàn cảnh, Point Cloud, 3D Model hoặc Ảnh DOM để chọn cách quan sát dự án.' },
  { target: 'measurement-tools', title: 'ĐO ĐẠC', text: 'Các công cụ đo giúp kiểm tra khoảng cách, diện tích và kích thước trên dữ liệu 3D.' },
  { target: 'cut-tools', title: 'CẮT DỮ LIỆU', text: 'Dùng vùng cắt để tập trung quan sát phần dữ liệu cần kiểm tra.' },
  { target: 'navigation-tools', title: 'ĐIỀU HƯỚNG', text: 'Chọn góc nhìn và chế độ điều hướng phù hợp để khám phá dự án.' },
  { target: 'display-tools', title: 'HIỂN THỊ / LỚP DỮ LIỆU', text: 'Bật, tắt từng lớp và điều chỉnh độ trong suốt tại đây. Bạn có thể kết hợp Model và ảnh DOM.' },
  { target: null, title: 'Hoàn tất', text: 'Bạn đã sẵn sàng khám phá 3D Mapping. Mở lại hướng dẫn bất kỳ lúc nào bằng nút dấu hỏi trong sidebar.' }
] as const;

type Box = { left: number; top: number; width: number; height: number };
const getTarget = (index: number) => {
  const target = steps[index]?.target;
  if (!target) return null;
  const element = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
  return element && element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden' ? element : null;
};

const initialStep = () => {
  try { return localStorage.getItem(COMPLETED_KEY) === '1' ? null : -1; }
  catch { return -1; }
};

export function DemoViewerTour({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  // -1 = welcome, null = closed. This component is mounted only for Demo projects.
  const [step, setStep] = useState<number | null>(initialStep);
  const [targetBox, setTargetBox] = useState<Box | null>(null);
  const [cardPosition, setCardPosition] = useState<{ left: number; top: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLButtonElement>(null);
  const open = step !== null;

  const finish = useCallback(() => {
    try { localStorage.setItem(COMPLETED_KEY, '1'); } catch { /* Storage can be disabled. */ }
    setStep(null);
  }, []);

  const move = (direction: 1 | -1) => {
    onOpenSidebar();
    let next = (step ?? -1) + direction;
    // Collapsed or unavailable sections are skipped without clicking any tools.
    while (next >= 0 && next < steps.length - 1 && !getTarget(next)) next += direction;
    setStep(Math.max(-1, Math.min(steps.length - 1, next)));
  };

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        finish();
      } else if (event.key === 'Tab') {
        const buttons = Array.from(cardRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
        const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
        if (buttons.length) {
          event.preventDefault();
          const next = current < 0 ? (event.shiftKey ? buttons.length - 1 : 0)
            : (current + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
          buttons[next].focus();
        }
        event.stopImmediatePropagation();
      } else {
        // Do not forward keyboard shortcuts to the map while the modal is open.
        event.stopPropagation();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      if (previousFocus?.isConnected && previousFocus !== document.body) previousFocus.focus({ preventScroll: true });
      else helpRef.current?.focus({ preventScroll: true });
    };
  }, [open, finish]);

  useLayoutEffect(() => {
    if (step === null) return;
    cardRef.current?.focus({ preventScroll: true });
    const target = step >= 0 ? getTarget(step) : null;
    if (step >= 0 && step < steps.length - 1 && !target) {
      setStep(step + 1);
      return;
    }
    const sidebarScroll = target?.closest<HTMLElement>('.viewer-sidebar-scroll');
    const previousScrollTop = sidebarScroll?.scrollTop;
    target?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    let frame = 0;
    const measure = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const rect = target?.getBoundingClientRect();
      let box: Box | null = null;
      if (rect) {
        const clip = sidebarScroll?.getBoundingClientRect();
        const left = Math.max(6, rect.left - 4, clip?.left ?? 0);
        const top = Math.max(6, rect.top - 4, clip?.top ?? 0);
        const right = Math.min(viewportWidth - 6, rect.right + 4, clip?.right ?? viewportWidth);
        const bottom = Math.min(viewportHeight - 6, rect.bottom + 4, clip?.bottom ?? viewportHeight);
        if (right > left && bottom > top) box = { left, top, width: right - left, height: bottom - top };
      }
      setTargetBox(box);
      const card = cardRef.current?.getBoundingClientRect();
      const width = card?.width ?? 320;
      const height = card?.height ?? 230;
      const clamp = (n: number, max: number) => Math.max(12, Math.min(n, max - 12));
      const candidates = box ? [
        { left: box.left + box.width + 12, top: box.top },
        { left: box.left - width - 12, top: box.top },
        { left: box.left, top: box.top + box.height + 12 },
        { left: box.left, top: box.top - height - 12 }
      ] : [{ left: (viewportWidth - width) / 2, top: (viewportHeight - height) / 2 }];
      const positions = candidates.map(p => ({ left: clamp(p.left, viewportWidth - width), top: clamp(p.top, viewportHeight - height) }));
      const overlap = (p: typeof positions[number]) => box
        ? Math.max(0, Math.min(p.left + width, box.left + box.width) - Math.max(p.left, box.left)) *
          Math.max(0, Math.min(p.top + height, box.top + box.height) - Math.max(p.top, box.top))
        : 0;
      positions.sort((a, b) => overlap(a) - overlap(b));
      setCardPosition(positions[0]);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    const observer = new ResizeObserver(schedule);
    if (target) observer.observe(target);
    if (cardRef.current) observer.observe(cardRef.current);
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    document.addEventListener('transitionend', schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
      document.removeEventListener('transitionend', schedule);
      if (sidebarScroll && previousScrollTop !== undefined) sidebarScroll.scrollTop = previousScrollTop;
    };
  }, [step]);

  const welcome = step === -1;
  const last = step === steps.length - 1;
  const current = step !== null && step >= 0 ? steps[step] : null;
  return <>
    <button
      ref={helpRef}
      type="button"
      title="Hướng dẫn sử dụng"
      aria-label="Hướng dẫn sử dụng"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--vs-border)] bg-[var(--vs-surface)] text-[var(--vs-text-soft)] transition hover:border-sky-500/35 hover:bg-[var(--vs-surface-hover)] hover:text-sky-500 focus-visible:outline-2 focus-visible:outline-sky-500"
      onClick={() => { onOpenSidebar(); setStep(-1); }}
    ><CircleHelp size={15} aria-hidden="true" /></button>
    {open && createPortal(
      <div className="demo-tour" data-tour-overview="open" onPointerDown={event => event.stopPropagation()} onClick={event => event.stopPropagation()}>
        <div className="demo-tour__backdrop" style={{ background: targetBox ? 'transparent' : 'rgba(2,6,23,.42)' }} />
        {targetBox && <div className="demo-tour__highlight" style={targetBox} aria-hidden="true" />}
        <div ref={cardRef} className="demo-tour__card" role="dialog" aria-modal="true" aria-labelledby="demo-tour-title" aria-describedby="demo-tour-description" tabIndex={-1} style={cardPosition ?? { left: 12, top: 12 }}>
          <div className="demo-tour__counter">{welcome ? '3D Mapping · Hướng dẫn' : `Bước ${(step ?? 0) + 1} / ${steps.length}`}</div>
          <h2 id="demo-tour-title">{welcome ? 'Chào mừng đến 3D Mapping' : current?.title}</h2>
          <p id="demo-tour-description">{welcome ? 'Khám phá nhanh các công cụ để bắt đầu xem và kiểm tra dữ liệu 3D của bạn.' : current?.text}</p>
          <div className="demo-tour__actions">
            {!last && <button type="button" onClick={finish}>Bỏ qua</button>}
            {!welcome && <button type="button" onClick={() => move(-1)}>Trước</button>}
            <button type="button" className="demo-tour__primary" onClick={() => last ? finish() : move(1)}>{welcome ? 'Bắt đầu hướng dẫn' : last ? 'Hoàn tất' : 'Tiếp'}</button>
          </div>
        </div>
      </div>, document.body
    )}
  </>;
}
