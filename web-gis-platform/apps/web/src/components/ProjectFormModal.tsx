import React, {
  useEffect,
  useState,
} from 'react';
import {
  Database,
  FolderOpen,
  Info,
  Layers,
  Link2,
  Loader2,
  MapPinned,
  Rocket,
  Save,
  Sparkles,
  X,
} from 'lucide-react';

import { Button } from './UI/Button';
import { type Project } from '../store/useProjectStore';
import { useLanguage } from '../hooks/useLanguage';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  project?: Project | null;
  language?: 'vi' | 'en' | 'zh';
}


const PROJECT_MODAL_COPY = {
  vi: {
    close: 'Đóng',
    editTitle: 'Chỉnh sửa dự án',
    newTitle: 'Thêm dự án mới',
    editDesc: 'Cập nhật thông tin, tọa độ và nguồn dữ liệu của dự án.',
    newDesc: 'Khởi tạo không gian dữ liệu 3D mới trên nền tảng.',
    autoMode: 'Xử lý thư mục gốc',
    manualMode: 'Nhập URL thủ công',
    infoTitle: 'Thông tin dự án',
    infoDesc: 'Thông tin cơ bản và hệ tọa độ sử dụng.',
    projectName: 'Tên dự án',
    projectNamePlaceholder: 'VD: Khu vực Quy Nhơn 2026',
    epsg: 'Mã EPSG',
    epsgPlaceholder: '32648 = UTM Zone 48N',
    description: 'Mô tả',
    descriptionPlaceholder: 'Mô tả ngắn gọn về dự án...',
    inputTitle: 'Dữ liệu đầu vào',
    inputDesc: 'Chọn thư mục nguồn để hệ thống xử lý tự động.',
    processTitle: 'Quy trình xử lý tự động',
    step1: '01 · Nhận diện dữ liệu từ thư mục nguồn',
    step2: '02 · Xử lý DOM / Model / Point Cloud',
    step3: '03 · Tối ưu và upload dữ liệu',
    step4: '04 · Cập nhật dự án lên hệ thống',
    workDuring: 'Bạn có thể tiếp tục làm việc trong khi hệ thống xử lý.',
    inputDir: 'Đường dẫn thư mục dữ liệu gốc',
    inputDirHelp: 'Thư mục chứa kết quả xuất từ DJI Terra hoặc phần mềm xử lý tương ứng.',
    outputDir: 'Thư mục đầu ra',
    optional: '(tùy chọn)',
    outputPlaceholder: 'Bỏ trống để hệ thống tự tạo thư mục _Processed',
    sourceTitle: 'Tọa độ & nguồn dữ liệu',
    sourceDesc: 'Khai báo vị trí dự án và URL các lớp dữ liệu hiện có.',
    longitude: 'Kinh độ (Longitude)',
    latitude: 'Vĩ độ (Latitude)',
    uploadedUrls: 'URLs dữ liệu đã upload',
    domUrl: 'DOM URL (ảnh orthophoto)',
    modelUrl: '3D Model URL (tileset.json)',
    pointCloudUrl: 'Point Cloud URL (tileset.json)',
    editFooter: 'Các thay đổi sẽ được áp dụng cho dự án hiện tại.',
    autoFooter: 'Hệ thống sẽ tạo dự án và bắt đầu pipeline xử lý.',
    manualFooter: 'Dự án sẽ được lưu với các nguồn dữ liệu đã khai báo.',
    cancel: 'Hủy',
    update: 'Cập nhật dự án',
    start: 'Bắt đầu xử lý',
    save: 'Lưu dự án',
    updating: 'Đang cập nhật...',
    creating: 'Đang khởi tạo...',
    error: 'Thao tác thất bại.',
  },
  en: {
    close: 'Close',
    editTitle: 'Edit project',
    newTitle: 'Add new project',
    editDesc: 'Update project information, coordinates, and data sources.',
    newDesc: 'Create a new 3D data workspace on the platform.',
    autoMode: 'Process source folder',
    manualMode: 'Enter URLs manually',
    infoTitle: 'Project information',
    infoDesc: 'Basic project information and coordinate reference system.',
    projectName: 'Project name',
    projectNamePlaceholder: 'Example: Quy Nhon Area 2026',
    epsg: 'EPSG code',
    epsgPlaceholder: '32648 = UTM Zone 48N',
    description: 'Description',
    descriptionPlaceholder: 'Briefly describe the project...',
    inputTitle: 'Input data',
    inputDesc: 'Select a source folder for automatic processing.',
    processTitle: 'Automatic processing workflow',
    step1: '01 · Detect data from the source folder',
    step2: '02 · Process DOM / Model / Point Cloud',
    step3: '03 · Optimize and upload data',
    step4: '04 · Update the project in the system',
    workDuring: 'You can continue working while the system processes the data.',
    inputDir: 'Source data folder path',
    inputDirHelp: 'Folder containing output from DJI Terra or an equivalent processing application.',
    outputDir: 'Output folder',
    optional: '(optional)',
    outputPlaceholder: 'Leave blank to automatically create a _Processed folder',
    sourceTitle: 'Coordinates & data sources',
    sourceDesc: 'Define the project location and URLs for available data layers.',
    longitude: 'Longitude',
    latitude: 'Latitude',
    uploadedUrls: 'Uploaded data URLs',
    domUrl: 'DOM URL (orthophoto)',
    modelUrl: '3D Model URL (tileset.json)',
    pointCloudUrl: 'Point Cloud URL (tileset.json)',
    editFooter: 'Changes will be applied to the current project.',
    autoFooter: 'The system will create the project and start the processing pipeline.',
    manualFooter: 'The project will be saved with the specified data sources.',
    cancel: 'Cancel',
    update: 'Update project',
    start: 'Start processing',
    save: 'Save project',
    updating: 'Updating...',
    creating: 'Creating...',
    error: 'Operation failed.',
  },
  zh: {
    close: '关闭',
    editTitle: '编辑项目',
    newTitle: '新建项目',
    editDesc: '更新项目资料、坐标和数据源。',
    newDesc: '在平台上创建新的3D数据空间。',
    autoMode: '处理源文件夹',
    manualMode: '手动输入URL',
    infoTitle: '项目信息',
    infoDesc: '项目基本信息和坐标参考系统。',
    projectName: '项目名称',
    projectNamePlaceholder: '例如：归仁区域 2026',
    epsg: 'EPSG代码',
    epsgPlaceholder: '32648 = UTM Zone 48N',
    description: '描述',
    descriptionPlaceholder: '简要描述项目...',
    inputTitle: '输入数据',
    inputDesc: '选择源文件夹，由系统自动处理。',
    processTitle: '自动处理流程',
    step1: '01 · 从源文件夹识别数据',
    step2: '02 · 处理 DOM / 模型 / 点云',
    step3: '03 · 优化并上传数据',
    step4: '04 · 更新系统中的项目',
    workDuring: '系统处理时您仍可继续工作。',
    inputDir: '源数据文件夹路径',
    inputDirHelp: '包含 DJI Terra 或同类处理软件输出结果的文件夹。',
    outputDir: '输出文件夹',
    optional: '（可选）',
    outputPlaceholder: '留空则自动创建 _Processed 文件夹',
    sourceTitle: '坐标与数据源',
    sourceDesc: '设置项目位置及现有数据图层的URL。',
    longitude: '经度',
    latitude: '纬度',
    uploadedUrls: '已上传的数据URL',
    domUrl: 'DOM URL（正射影像）',
    modelUrl: '3D模型 URL（tileset.json）',
    pointCloudUrl: '点云 URL（tileset.json）',
    editFooter: '更改将应用到当前项目。',
    autoFooter: '系统将创建项目并启动处理流程。',
    manualFooter: '项目将使用已填写的数据源保存。',
    cancel: '取消',
    update: '更新项目',
    start: '开始处理',
    save: '保存项目',
    updating: '正在更新...',
    creating: '正在创建...',
    error: '操作失败。',
  },
} as const;

const modalStyle = `
  .project-form-modal {
    --pf-overlay: rgba(15, 23, 42, .42);
    --pf-bg: #ffffff;
    --pf-surface: #f8fafc;
    --pf-surface-2: #f1f5f9;
    --pf-ink: #0f172a;
    --pf-soft: #475569;
    --pf-muted: #64748b;
    --pf-border: rgba(148, 163, 184, .34);
    --pf-border-strong: rgba(100, 116, 139, .46);
    --pf-accent: #0284c7;
    --pf-accent-soft: rgba(2, 132, 199, .08);
    --pf-danger: #e11d48;
    --pf-shadow: 0 28px 80px rgba(15, 23, 42, .20);
  }

  html[data-saolatek-theme='dark']
  .project-form-modal {
    --pf-overlay: rgba(2, 6, 23, .70);
    --pf-bg: #0b1626;
    --pf-surface: #101d2f;
    --pf-surface-2: #152338;
    --pf-ink: #f8fafc;
    --pf-soft: #cbd5e1;
    --pf-muted: #94a3b8;
    --pf-border: rgba(71, 85, 105, .54);
    --pf-border-strong: rgba(100, 116, 139, .64);
    --pf-accent: #38bdf8;
    --pf-accent-soft: rgba(56, 189, 248, .09);
    --pf-danger: #fb7185;
    --pf-shadow: 0 30px 90px rgba(2, 6, 23, .48);
  }

  .project-form-dialog {
    background: var(--pf-bg);
    color: var(--pf-ink);
    border-color: var(--pf-border);
    box-shadow: var(--pf-shadow);
  }

  .project-form-scroll::-webkit-scrollbar {
    width: 6px;
  }

  .project-form-scroll::-webkit-scrollbar-track {
    background: transparent;
  }

  .project-form-scroll::-webkit-scrollbar-thumb {
    background: var(--pf-border-strong);
    border-radius: 999px;
  }

  .project-form-field {
    width: 100%;
    border: 1px solid var(--pf-border);
    border-radius: 10px;
    background: var(--pf-surface);
    color: var(--pf-ink);
    outline: none;
    transition:
      border-color .15s ease,
      background .15s ease,
      box-shadow .15s ease;
  }

  .project-form-field::placeholder {
    color: var(--pf-muted);
    opacity: .76;
  }

  .project-form-field:hover {
    border-color: var(--pf-border-strong);
  }

  .project-form-field:focus {
    border-color: var(--pf-accent);
    background: var(--pf-bg);
    box-shadow: 0 0 0 3px var(--pf-accent-soft);
  }

  .project-form-label {
    color: var(--pf-soft);
  }

  .project-form-help {
    color: var(--pf-muted);
  }

  .project-form-section {
    border: 1px solid var(--pf-border);
    border-radius: 14px;
    background: color-mix(
      in srgb,
      var(--pf-surface) 74%,
      transparent
    );
  }

  .project-form-mode {
    border: 1px solid transparent;
    color: var(--pf-muted);
  }

  .project-form-mode:hover {
    background: var(--pf-surface-2);
    color: var(--pf-ink);
  }

  .project-form-mode.is-active {
    border-color: rgba(2, 132, 199, .22);
    background: var(--pf-bg);
    color: var(--pf-accent);
    box-shadow:
      0 1px 2px rgba(15, 23, 42, .05),
      0 0 0 1px var(--pf-accent-soft);
  }

  html[data-saolatek-theme='dark']
  .project-form-mode.is-active {
    border-color: rgba(56, 189, 248, .28);
  }

  .project-form-info {
    border: 1px solid rgba(2, 132, 199, .20);
    background: var(--pf-accent-soft);
  }

  html[data-saolatek-theme='dark']
  .project-form-info {
    border-color: rgba(56, 189, 248, .22);
  }

  .project-form-close {
    border: 1px solid var(--pf-border);
    background: var(--pf-surface);
    color: var(--pf-muted);
  }

  .project-form-close:hover {
    border-color: var(--pf-border-strong);
    background: var(--pf-surface-2);
    color: var(--pf-ink);
  }

  .project-form-footer {
    border-color: var(--pf-border);
    background:
      color-mix(
        in srgb,
        var(--pf-bg) 94%,
        transparent
      );
  }
`;

export const ProjectFormModal:
  React.FC<ProjectFormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    project = null,
    language,
  }) => {
    const { currentLang: hookLang } =
      useLanguage('vi');

    const currentLang =
      language ?? hookLang;

    const c =
      PROJECT_MODAL_COPY[currentLang];

    const [
      isAutoProcess,
      setIsAutoProcess,
    ] = useState(true);

    const [
      isSubmitting,
      setIsSubmitting,
    ] = useState(false);

    const [formData, setFormData] =
      useState({
        name: '',
        description: '',
        centerLon: '',
        centerLat: '',
        epsg: '32648',
        domUrl: '',
        modelUrl: '',
        pointCloudId: '',
        inputDir: '',
        outputDir: '',
      });

    useEffect(() => {
      if (project && isOpen) {
        setFormData({
          name: project.name || '',
          description:
            project.description || '',
          centerLon:
            project.centerLon !== undefined
              ? project.centerLon.toString()
              : '',
          centerLat:
            project.centerLat !== undefined
              ? project.centerLat.toString()
              : '',
          epsg:
            project.epsg !== undefined
              ? project.epsg.toString()
              : '32648',
          domUrl: project.domUrl || '',
          modelUrl:
            project.modelUrl || '',
          pointCloudId:
            project.pointCloudId || '',
          inputDir: '',
          outputDir: '',
        });

        setIsAutoProcess(false);
      } else if (isOpen) {
        setFormData({
          name: '',
          description: '',
          centerLon: '',
          centerLat: '',
          epsg: '32648',
          domUrl: '',
          modelUrl: '',
          pointCloudId: '',
          inputDir: '',
          outputDir: '',
        });

        setIsAutoProcess(true);
      }
    }, [project, isOpen]);

    if (!isOpen) return null;

    const handleChange = (
      e:
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLTextAreaElement>
    ) => {
      setFormData((prev) => ({
        ...prev,
        [e.target.name]:
          e.target.value,
      }));
    };

    const handleSubmit = async (
      e: React.FormEvent
    ) => {
      e.preventDefault();
      setIsSubmitting(true);

      const submitData: any = {
        name: formData.name.trim(),
        description:
          formData.description.trim(),
        epsg:
          parseInt(
            formData.epsg,
            10
          ) || 32648,
      };

      if (!project) {
        submitData.isAutoProcess =
          isAutoProcess;

        if (isAutoProcess) {
          submitData.inputDir =
            formData.inputDir.trim();

          submitData.outputDir =
            formData.outputDir.trim() ||
            undefined;

          submitData.centerLon = 0;
          submitData.centerLat = 0;
        } else {
          submitData.centerLon =
            parseFloat(
              formData.centerLon
            ) || 0;

          submitData.centerLat =
            parseFloat(
              formData.centerLat
            ) || 0;

          submitData.domUrl =
            formData.domUrl.trim();

          submitData.modelUrl =
            formData.modelUrl.trim();

          submitData.pointCloudId =
            formData.pointCloudId.trim();
        }
      } else {
        submitData.centerLon =
          parseFloat(
            formData.centerLon
          ) || 0;

        submitData.centerLat =
          parseFloat(
            formData.centerLat
          ) || 0;

        submitData.domUrl =
          formData.domUrl.trim();

        submitData.modelUrl =
          formData.modelUrl.trim();

        submitData.pointCloudId =
          formData.pointCloudId.trim();
      }

      try {
        await onSubmit(submitData);
        onClose();
      } catch (err) {
        console.error(err);
        alert(c.error);
      } finally {
        setIsSubmitting(false);
      }
    };

    const submitLabel = project
      ? c.update
      : isAutoProcess
        ? c.start
        : c.save;

    return (
      <div className="project-form-modal fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <style>{modalStyle}</style>

        <button
          type="button"
          aria-label={c.close}
          className="absolute inset-0 cursor-default bg-[var(--pf-overlay)] backdrop-blur-[3px]"
          onClick={onClose}
        />

        <div className="project-form-dialog relative flex max-h-[92vh] w-full max-w-[760px] flex-col overflow-hidden rounded-[20px] border">
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--pf-border)] px-6 py-5 sm:px-7">
            <div className="flex min-w-0 gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-500/15 bg-sky-500/[0.07] text-sky-600 dark:text-sky-400">
                {project ? (
                  <MapPinned size={19} />
                ) : (
                  <Sparkles size={19} />
                )}
              </div>

              <div className="min-w-0">
                <h2 className="text-[21px] font-bold tracking-[-.02em] text-[var(--pf-ink)]">
                  {project ? c.editTitle : c.newTitle}
                </h2>

                <p className="mt-1 text-[12px] leading-5 text-[var(--pf-muted)]">
                  {project ? c.editDesc : c.newDesc}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="project-form-close flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition"
            >
              <X size={17} />
            </button>
          </div>

          <div className="project-form-scroll flex-1 overflow-y-auto px-6 py-5 sm:px-7">
            {!project && (
              <div className="mb-5 rounded-[14px] border border-[var(--pf-border)] bg-[var(--pf-surface)] p-1">
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setIsAutoProcess(true)
                    }
                    className={`project-form-mode flex min-h-11 items-center justify-center gap-2 rounded-[10px] px-3 text-[12px] font-semibold transition ${
                      isAutoProcess
                        ? 'is-active'
                        : ''
                    }`}
                  >
                    <FolderOpen size={15} />
                    {c.autoMode}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setIsAutoProcess(false)
                    }
                    className={`project-form-mode flex min-h-11 items-center justify-center gap-2 rounded-[10px] px-3 text-[12px] font-semibold transition ${
                      !isAutoProcess
                        ? 'is-active'
                        : ''
                    }`}
                  >
                    <Layers size={15} />
                    {c.manualMode}
                  </button>
                </div>
              </div>
            )}

            <form
              id="project-form"
              onSubmit={handleSubmit}
              className="space-y-4 text-left"
            >
              <section className="project-form-section p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Database
                    size={14}
                    className="text-sky-600 dark:text-sky-400"
                  />
                  <div>
                    <p className="text-[12px] font-bold text-[var(--pf-ink)]">
                      {c.infoTitle}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[var(--pf-muted)]">
                      {c.infoDesc}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="project-form-label text-[11px] font-semibold">
                      {c.projectName}{' '}
                      <span className="text-rose-500">
                        *
                      </span>
                    </label>

                    <input
                      required
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="project-form-field h-11 px-3.5 text-[13px]"
                      placeholder={c.projectNamePlaceholder}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="project-form-label text-[11px] font-semibold">
                      {c.epsg}
                    </label>

                    <input
                      name="epsg"
                      value={formData.epsg}
                      onChange={handleChange}
                      className="project-form-field h-11 px-3.5 text-[13px]"
                      placeholder={c.epsgPlaceholder}
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-1.5">
                  <label className="project-form-label text-[11px] font-semibold">
                    {c.description}
                  </label>

                  <textarea
                    name="description"
                    value={
                      formData.description
                    }
                    onChange={handleChange}
                    rows={3}
                    className="project-form-field resize-none px-3.5 py-3 text-[13px] leading-5"
                    placeholder={c.descriptionPlaceholder}
                  />
                </div>
              </section>

              {isAutoProcess &&
              !project ? (
                <section className="project-form-section p-4 sm:p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <FolderOpen
                      size={14}
                      className="text-sky-600 dark:text-sky-400"
                    />

                    <div>
                      <p className="text-[12px] font-bold text-[var(--pf-ink)]">
                        {c.inputTitle}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[var(--pf-muted)]">
                        {c.inputDesc}
                      </p>
                    </div>
                  </div>

                  <div className="project-form-info mb-4 flex gap-3 rounded-xl p-3.5">
                    <Info
                      size={16}
                      className="mt-0.5 shrink-0 text-sky-600 dark:text-sky-400"
                    />

                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-[var(--pf-ink)]">
                        {c.processTitle}
                      </p>

                      <div className="mt-1.5 grid gap-1 text-[10px] leading-4 text-[var(--pf-soft)] sm:grid-cols-2">
                        <span>
                          {c.step1}
                        </span>
                        <span>
                          {c.step2}
                        </span>
                        <span>
                          {c.step3}
                        </span>
                        <span>
                          {c.step4}
                        </span>
                      </div>

                      <p className="mt-2 text-[10px] font-medium text-sky-600 dark:text-sky-400">
                        {c.workDuring}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="project-form-label text-[11px] font-semibold">
                        {c.inputDir}{' '}
                        <span className="text-rose-500">
                          *
                        </span>
                      </label>

                      <input
                        required
                        name="inputDir"
                        value={
                          formData.inputDir
                        }
                        onChange={
                          handleChange
                        }
                        className="project-form-field h-11 px-3.5 font-mono text-[11px]"
                        placeholder="VD: C:\\Users\\duong\\3dmapping\\TenDuAn_process"
                      />

                      <p className="project-form-help text-[10px] leading-4">
                        {c.inputDirHelp}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="project-form-label text-[11px] font-semibold">
                        {c.outputDir}{' '}
                        <span className="text-[10px] font-normal text-[var(--pf-muted)]">
                          {c.optional}
                        </span>
                      </label>

                      <input
                        name="outputDir"
                        value={
                          formData.outputDir
                        }
                        onChange={
                          handleChange
                        }
                        className="project-form-field h-11 px-3.5 font-mono text-[11px]"
                        placeholder={c.outputPlaceholder}
                      />
                    </div>
                  </div>
                </section>
              ) : (
                <section className="project-form-section p-4 sm:p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Link2
                      size={14}
                      className="text-sky-600 dark:text-sky-400"
                    />

                    <div>
                      <p className="text-[12px] font-bold text-[var(--pf-ink)]">
                        {c.sourceTitle}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[var(--pf-muted)]">
                        {c.sourceDesc}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="project-form-label text-[11px] font-semibold">
                        {c.longitude}{' '}
                        <span className="text-rose-500">
                          *
                        </span>
                      </label>

                      <input
                        required
                        type="number"
                        step="any"
                        name="centerLon"
                        value={
                          formData.centerLon
                        }
                        onChange={
                          handleChange
                        }
                        className="project-form-field h-11 px-3.5 text-[13px]"
                        placeholder="VD: 109.1940"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="project-form-label text-[11px] font-semibold">
                        {c.latitude}{' '}
                        <span className="text-rose-500">
                          *
                        </span>
                      </label>

                      <input
                        required
                        type="number"
                        step="any"
                        name="centerLat"
                        value={
                          formData.centerLat
                        }
                        onChange={
                          handleChange
                        }
                        className="project-form-field h-11 px-3.5 text-[13px]"
                        placeholder="VD: 13.7758"
                      />
                    </div>
                  </div>

                  <div className="mt-4 space-y-3 border-t border-[var(--pf-border)] pt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[.08em] text-[var(--pf-muted)]">
                      {c.uploadedUrls}
                    </p>

                    {[
                      {
                        name: 'domUrl',
                        label: c.domUrl,
                        placeholder:
                          'https://r2.example.com/dom.png',
                      },
                      {
                        name: 'modelUrl',
                        label: c.modelUrl,
                        placeholder:
                          'https://r2.example.com/model/tileset.json',
                      },
                      {
                        name: 'pointCloudId',
                        label: c.pointCloudUrl,
                        placeholder:
                          'https://r2.example.com/pointcloud/tileset.json',
                      },
                    ].map((field) => (
                      <div
                        key={field.name}
                        className="space-y-1.5"
                      >
                        <label className="project-form-label text-[10px] font-semibold">
                          {field.label}
                        </label>

                        <input
                          name={field.name}
                          value={
                            (formData as any)[
                              field.name
                            ]
                          }
                          onChange={
                            handleChange
                          }
                          className="project-form-field h-10 px-3.5 font-mono text-[10px]"
                          placeholder={
                            field.placeholder
                          }
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </form>
          </div>

          <div className="project-form-footer flex shrink-0 items-center justify-between gap-3 border-t px-6 py-4 sm:px-7">
            <p className="hidden text-[10px] text-[var(--pf-muted)] sm:block">
              {project
                ? c.editFooter
                : isAutoProcess
                  ? c.autoFooter
                  : c.manualFooter}
            </p>

            <div className="ml-auto flex items-center gap-2.5">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
                className="min-w-[84px] rounded-[10px]"
              >
                {c.cancel}
              </Button>

              <Button
                form="project-form"
                type="submit"
                disabled={isSubmitting}
                className={`min-w-[148px] gap-2 rounded-[10px] ${
                  isSubmitting
                    ? 'opacity-70'
                    : ''
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2
                      size={14}
                      className="animate-spin"
                    />
                    {project
                      ? c.updating
                      : c.creating}
                  </>
                ) : (
                  <>
                    {project ? (
                      <Save size={14} />
                    ) : isAutoProcess ? (
                      <Rocket size={14} />
                    ) : (
                      <Save size={14} />
                    )}
                    {submitLabel}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

export default ProjectFormModal;