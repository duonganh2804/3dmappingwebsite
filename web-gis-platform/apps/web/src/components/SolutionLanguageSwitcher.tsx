import React, { useState } from 'react';
import { Check, Globe } from 'lucide-react';

import type { Language } from '../hooks/useLanguage';

type Props = {
  currentLang: Language;
  onChange: (language: Language) => void;
  ariaLabel: string;
};

const OPTIONS: Array<{ value: Language; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'zh', label: '中文' },
];

export const SolutionLanguageSwitcher: React.FC<Props> = ({ currentLang, onChange, ariaLabel }) => {
  const [open, setOpen] = useState(false);
  const localizedAriaLabel = currentLang === 'en'
    ? 'Select language'
    : currentLang === 'zh'
      ? '选择语言'
      : ariaLabel;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 sm:h-10 sm:w-10"
        aria-label={localizedAriaLabel}
        aria-expanded={open}
      >
        <Globe size={17} />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-36 max-w-[calc(100vw-24px)] overflow-hidden rounded-xl border border-white/10 bg-[#09111f] p-1.5 shadow-2xl">
          {OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => { onChange(value); setOpen(false); }}
              className="flex w-full items-center justify-between whitespace-nowrap rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400"
            >
              {label}
              {currentLang === value && <Check size={14} className="text-sky-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
