import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';

import logoImg from '../../assets/logo.webp';
import { SolutionLanguageSwitcher } from '../../components/SolutionLanguageSwitcher';
import { useDemoNavigation } from '../../hooks/useDemoNavigation';
import type { Language } from '../../hooks/useLanguage';

interface ResourceShellProps {
  children: React.ReactNode;
  currentLang: Language;
  setCurrentLang: (lang: Language) => void;
}

type ShellCopy = {
  languageLabel: string;
  home: string;
  demo: string;
  footer: string;
};

const COPY: Record<Language, ShellCopy> = {
  vi: {
    languageLabel: 'Chọn ngôn ngữ',
    home: 'Trang chủ',
    demo: 'Đăng ký xem Demo',
    footer:
      'Tài nguyên kỹ thuật · UAV · LiDAR · Point Cloud · Web GIS 3D'
  },
  en: {
    languageLabel: 'Select language',
    home: 'Home',
    demo: 'Request Demo',
    footer:
      'Technical Resources · UAV · LiDAR · Point Cloud · 3D Web GIS'
  },
  zh: {
    languageLabel: '选择语言',
    home: '首页',
    demo: '申请演示',
    footer:
      '技术资源 · UAV · LiDAR · 点云 · 3D Web GIS'
  }
};

export const ResourceShell: React.FC<ResourceShellProps> = ({
  children,
  currentLang,
  setCurrentLang
}) => {
  const navigate = useNavigate();
  const { openDemo, isDemoLoading } = useDemoNavigation();
  const c = COPY[currentLang];

  return (
    <div className="min-h-screen overflow-x-clip bg-[#050914] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050914]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1520px] items-center justify-between gap-2 px-3 sm:px-5 md:px-8 lg:px-12">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="shrink-0 border-0 bg-transparent p-0"
            aria-label={c.home}
          >
            <img
              src={logoImg}
              alt="SAOLATEK"
              className="h-8 w-auto object-contain sm:h-9"
            />
          </button>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 md:gap-3">
            <div className="[&_button]:min-w-[44px]">
              <SolutionLanguageSwitcher
                currentLang={currentLang}
                onChange={setCurrentLang}
                ariaLabel={c.languageLabel}
              />
            </div>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="hidden h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-300 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white sm:inline-flex"
            >
              <ArrowLeft size={16} />
              {c.home}
            </button>

            <button
              type="button"
              onClick={openDemo}
              disabled={isDemoLoading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sky-400 px-4 text-sm font-bold text-[#04101a] transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10"
            >
              <span className="hidden sm:inline">
                {c.demo}
              </span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-white/10 bg-[#050914]">
        <div className="mx-auto flex max-w-[1520px] flex-col gap-5 px-5 py-10 md:flex-row md:items-center md:justify-between md:px-8 lg:px-12">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-fit border-0 bg-transparent p-0"
            aria-label={c.home}
          >
            <img
              src={logoImg}
              alt="SAOLATEK"
              className="h-8 w-auto object-contain"
            />
          </button>

          <div className="text-xs font-medium text-slate-500">
            {c.footer}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ResourceShell;