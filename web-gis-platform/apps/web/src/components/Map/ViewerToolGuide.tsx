import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CircleHelp } from 'lucide-react';
import './DemoViewerTour.css';
import './ViewerToolGuide.css';

const guides = {
  measurement: {
    title: 'ĐO ĐẠC',
    steps: [
      ['Góc', 'Chọn ba điểm để đo góc tại điểm thứ hai, tạo bởi hai đoạn nối đến điểm đầu và điểm cuối.', 'measure-angle'],
      ['Điểm', 'Chọn một điểm trên dữ liệu để xem kinh độ, vĩ độ và cao độ tại vị trí đó.', 'measure-point'],
      ['Cự ly', 'Chọn các điểm liên tiếp để đo khoảng cách theo tuyến. Nhấp đúp để hoàn thành phép đo.', 'measure-distance'],
      ['Cao độ', 'Chọn hai điểm để xem chênh cao, khoảng cách ngang và khoảng cách nghiêng giữa chúng.', 'measure-height'],
      ['Đường tròn', 'Chọn tâm rồi chọn một điểm trên đường tròn để xem bán kính và diện tích hình tròn.', 'measure-circle'],
      ['Phương vị', 'Chọn hai điểm để đo góc phương vị từ hướng Bắc và khoảng cách trên bề mặt ellipsoid giữa chúng.', 'measure-azimuth'],
      ['Diện tích', 'Chọn các đỉnh bao quanh khu vực cần đo. Nhấp đúp để chốt đa giác và xem diện tích.', 'measure-area'],
      ['Thể tích', 'Chọn ít nhất ba đỉnh rồi nhấp đúp để ước tính thể tích lăng trụ: diện tích đa giác nhân chênh lệch cao độ lớn nhất và nhỏ nhất của các đỉnh.', 'measure-volume'],
      ['Sphere', 'Chọn tâm và một điểm xác định bán kính để dựng hình cầu, xem bán kính, diện tích mặt cầu và thể tích.', 'measure-sphere'],
      ['Trắc dọc', 'Chọn các điểm tạo tuyến rồi nhấp đúp để lấy mẫu cao độ và xem biểu đồ trắc dọc theo tuyến.', 'measure-profile'],
      ['Đào / Đắp', 'Khoanh vùng bằng ít nhất ba đỉnh, nhấp đúp hoặc nhấn Enter để tính khối lượng đào và đắp so với mặt tham chiếu. Có thể điều chỉnh mặt tham chiếu trong bảng phân tích.', 'measure-cutFill'],
      ['Trắc ngang', 'Hoàn thành một tuyến Trắc dọc trước, rồi chọn vị trí dọc tuyến để xem mặt cắt cao độ vuông góc tại lý trình đó.', 'measure-crossSection'],
      ['Ghi chú', 'Chọn vị trí trên dữ liệu và nhập nội dung để đặt ghi chú 3D tại điểm đó.', 'measure-annotation'],
      ['Vấn đề', 'Chọn vị trí trên Model, DOM hoặc Point Cloud để mở biểu mẫu tạo vấn đề gắn với vị trí đó.', 'measure-issue'],
      ['Xóa', 'Xóa toàn bộ phép đo và ghi chú 3D, đồng thời dọn kết quả trắc dọc, trắc ngang và đào / đắp. Các vấn đề đã tạo được quản lý riêng.', 'measure-clear']
    ]
  },
  clipping: {
    title: 'CẮT DỮ LIỆU',
    steps: [
      ['Box', 'Chọn Box để tạo vùng cắt dạng khối hộp. Làm theo chỉ dẫn trên Viewer để xác định vùng cần quan sát.', 'clip-box'],
      ['Đa giác', 'Chọn Đa giác để tạo vùng cắt theo đường bao do bạn chỉ định. Phù hợp khi khu vực cần xem có hình dạng không đều.', 'clip-polygon'],
      ['Mặt phẳng', 'Chọn Mặt phẳng để cắt theo mặt phẳng Z. Điều chỉnh theo chỉ dẫn hiện trên Viewer.', 'clip-plane'],
      ['Bên trong', 'Chọn chế độ giữ phần bên trong vùng cắt. Khi có nhiều vùng, bộ lọc Bất kỳ / Tất cả quyết định cách kết hợp chúng.', 'clip-inside'],
      ['Bên ngoài', 'Chọn chế độ giữ phần bên ngoài vùng cắt để quan sát dữ liệu xung quanh vùng đã xác định.', 'clip-outside'],
      ['Xóa clipping', 'Nút Xóa trong nhóm Cắt dữ liệu gỡ các vùng cắt để quan sát lại toàn bộ dữ liệu. Nút này khác với Xóa phép đo.', 'clip-clear']
    ]
  },
  navigation: {
    title: 'ĐIỀU HƯỚNG',
    steps: [
      ['Earth', 'Chọn Earth để điều khiển góc nhìn theo quả địa cầu và quan sát bối cảnh xung quanh dự án.', 'navigation-earth'],
      ['Bay', 'Chọn Bay để dùng chế độ di chuyển tự do. Điều chỉnh tốc độ camera phù hợp với quy mô khu vực.', 'navigation-fps'],
      ['Orbit', 'Chọn Orbit để xoay góc nhìn quanh tâm quan sát, thuận tiện kiểm tra mô hình từ nhiều hướng.', 'navigation-orbit'],
      ['Focus', 'Chọn Focus rồi chọn một điểm trên dữ liệu làm vị trí cần tập trung quan sát. Chú ý chỉ dẫn của Viewer khi đang chọn điểm.', 'navigation-focus'],
      ['Dự án', 'Nút Dự án đưa camera về khu vực dự án, hữu ích khi bạn đã di chuyển ra xa dữ liệu.', 'navigation-cube'],
      ['Camera', 'Nút Camera điều khiển hoạt ảnh camera. Các nút góc nhìn giúp chuyển nhanh sang hướng quan sát mong muốn.', 'navigation-anim']
    ]
  },
  display: {
    title: 'HIỂN THỊ / LỚP DỮ LIỆU',
    steps: [
      ['Point Cloud', 'Lớp Point Cloud hiển thị dữ liệu đám mây điểm khi dự án có dữ liệu tương ứng. Việc mở hướng dẫn này không tải Point Cloud.', 'layer-pointcloud'],
      ['3D Model', 'Dùng lớp 3D Model để quan sát bề mặt mô hình. Theo dõi trạng thái tải bên cạnh tên lớp nếu dữ liệu chưa sẵn sàng.', 'layer-model'],
      ['Ảnh DOM', 'Lớp ảnh DOM cung cấp ảnh trực giao của dự án. Có thể hiển thị cùng mô hình để đối chiếu vị trí và bề mặt.', 'layer-dom'],
      ['Độ trong suốt', 'Thanh opacity của Model điều chỉnh mức hiển thị từ 0% đến 100%. 100% cho mô hình hiển thị đầy đủ.', 'layer-model-opacity'],
      ['Bật / tắt layer', 'Bấm hàng 3D Model để bật hoặc tắt riêng lớp mô hình. Các lớp khác có checkbox độc lập tương tự.', 'layer-model']
    ]
  }
} as const;

export type ViewerToolGuideGroup = keyof typeof guides;

type TargetBox = { left: number; top: number; width: number; height: number };
function getToolTarget(name: string) {
  const target = document.querySelector<HTMLElement>(`[data-tool-guide="${name}"]`);
  return target?.getClientRects().length && getComputedStyle(target).visibility !== 'hidden' ? target : null;
}

export function ViewerToolGuide({ group }: { group: ViewerToolGuideGroup }) {
  const [step, setStep] = useState<number | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const maskId = useId();
  const direction = useRef<1 | -1>(1);
  const [placement, setPlacement] = useState<{ box: TargetBox; left: number; top: number } | null>(null);
  const guide = guides[group];
  const open = step !== null;

  const findStep = (start: number, delta: 1 | -1): number | null => {
    for (let index = start; index >= 0 && index < guide.steps.length; index += delta) {
      if (getToolTarget(guide.steps[index][2])) return index;
    }
    return null;
  };
  const move = (delta: 1 | -1) => {
    direction.current = delta;
    setStep(findStep((step ?? 0) + delta, delta));
  };

  useLayoutEffect(() => {
    if (step === null) return;
    const targetName = guide.steps[step][2];
    const target = getToolTarget(targetName);
    const skip = () => {
      for (let next = step + direction.current; next >= 0 && next < guide.steps.length; next += direction.current) {
        if (getToolTarget(guide.steps[next][2])) { setStep(next); return; }
      }
      setStep(null);
    };
    if (!target) { skip(); return; }
    const scroll = target.closest<HTMLElement>('.viewer-sidebar-scroll');
    const previousScroll = scroll?.scrollTop;
    target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
    let frame = 0;
    const measure = () => {
      if (!target.isConnected || !getToolTarget(targetName)) { skip(); return; }
      const rect = target.getBoundingClientRect();
      const clip = scroll?.getBoundingClientRect();
      const left = Math.max(0, rect.left, clip?.left ?? 0);
      const top = Math.max(0, rect.top, clip?.top ?? 0);
      const right = Math.min(innerWidth, rect.right, clip?.right ?? innerWidth);
      const bottom = Math.min(innerHeight, rect.bottom, clip?.bottom ?? innerHeight);
      if (right <= left || bottom <= top) { skip(); return; }
      const box = { left, top, width: right - left, height: bottom - top };
      const card = dialog.current?.getBoundingClientRect();
      if (!card) return;
      const clamp = (n: number, max: number) => Math.max(12, Math.min(n, max - 12));
      const candidates = [
        { left: right + 14, top }, { left: left - card.width - 14, top },
        { left, top: bottom + 14 }, { left, top: top - card.height - 14 }
      ].map(p => ({ left: clamp(p.left, innerWidth - card.width), top: clamp(p.top, innerHeight - card.height) }));
      const overlap = (p: typeof candidates[number]) =>
        Math.max(0, Math.min(p.left + card.width, right) - Math.max(p.left, left)) *
        Math.max(0, Math.min(p.top + card.height, bottom) - Math.max(p.top, top));
      candidates.sort((a, b) => overlap(a) - overlap(b));
      setPlacement({ box, ...candidates[0] });
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    measure();
    const resize = new ResizeObserver(schedule);
    resize.observe(target);
    if (dialog.current) resize.observe(dialog.current);
    if (scroll) resize.observe(scroll);
    const mutations = new MutationObserver(schedule);
    mutations.observe(target.closest('aside') ?? document.body, { childList: true, subtree: true });
    mutations.observe(target, { attributes: true, attributeFilter: ['class', 'style', 'hidden', 'data-tool-guide'] });
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      mutations.disconnect();
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
      if (scroll && previousScroll !== undefined) scroll.scrollTop = previousScroll;
    };
  }, [step, guide]);

  useEffect(() => {
    if (!open) return;
    dialog.current?.focus({ preventScroll: true });
    const onKeyDown = (event: KeyboardEvent) => {
      // Modal keyboard input must not activate map shortcuts underneath it.
      event.stopImmediatePropagation();
      if (event.key === 'Escape') {
        event.preventDefault();
        setStep(null);
      } else if (event.key === 'Tab') {
        const buttons = Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
        if (!buttons.length) return;
        event.preventDefault();
        const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
        const next = current < 0 ? (event.shiftKey ? buttons.length - 1 : 0)
          : (current + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
        buttons[next].focus();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      if (trigger.current?.isConnected) trigger.current.focus({ preventScroll: true });
    };
  }, [open]);

  return <>
    <button
      ref={trigger}
      type="button"
      className="viewer-tool-guide-help"
      data-guide-open={group}
      title="Hướng dẫn chi tiết"
      aria-label="Hướng dẫn chi tiết"
      aria-haspopup="dialog"
      onClick={event => {
        event.stopPropagation();
        if (document.querySelector('[data-tour-overview="open"]')) return;
        direction.current = 1;
        setStep(findStep(0, 1));
      }}
    ><CircleHelp size={13} aria-hidden="true" /></button>
    {step !== null && createPortal(
      <div className="demo-tour viewer-tool-guide" data-guide={group}
        onPointerDown={event => event.stopPropagation()} onClick={event => event.stopPropagation()}
        onWheel={event => event.stopPropagation()}>
        {/* A transparent cutout reveals only the actual tool. The modal still
            intercepts input, so highlighting cannot activate the tool. */}
        <svg className="viewer-tool-guide__mask" width="100%" height="100%" aria-hidden="true">
          <defs><mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
            <rect width="100%" height="100%" fill="white" />
            {placement && <rect x={placement.box.left} y={placement.box.top} width={placement.box.width} height={placement.box.height} fill="black" />}
          </mask></defs>
          <rect width="100%" height="100%" fill="rgba(2,6,23,.55)" mask={`url(#${maskId})`} />
        </svg>
        {placement && <div className="viewer-tool-guide__highlight" data-guide-highlight={guide.steps[step][2]} style={placement.box} aria-hidden="true" />}
        <div ref={dialog} className="demo-tour__card viewer-tool-guide__card" role="dialog" aria-modal="true"
          style={placement ? { left: placement.left, top: placement.top } : { left: 12, top: 12 }}
          aria-labelledby={titleId} aria-describedby={descriptionId} tabIndex={-1}>
          <div className="demo-tour__counter">{guide.title}</div>
          <div className="viewer-tool-guide__step" role="status" aria-live="polite" aria-atomic="true">
            Bước {step + 1} / {guide.steps.length} · {guide.steps[step][0]}
          </div>
          <h2 id={titleId}>{guide.title} · {guide.steps[step][0]}</h2>
          <p id={descriptionId}>{guide.steps[step][1]}</p>
          <div className="demo-tour__actions">
            <button type="button" disabled={findStep(step - 1, -1) === null} onClick={() => move(-1)}>Trước</button>
            <button type="button" disabled={findStep(step + 1, 1) === null} onClick={() => move(1)}>Tiếp</button>
            <button type="button" className="demo-tour__primary" onClick={() => setStep(null)}>Đóng</button>
          </div>
        </div>
      </div>, document.body
    )}
  </>;
}
