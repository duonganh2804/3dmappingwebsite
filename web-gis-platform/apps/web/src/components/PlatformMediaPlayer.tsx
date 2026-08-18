/* Hallmark · component: native media player · genre: modern-minimal · design-system: design.md */
import React from 'react';
import type { Language } from '../hooks/useLanguage';

export const SHTP_MEDIA_CONTEXT: Record<Language, { title: string; description: string }> = {
  vi: {
    title: 'Dữ liệu 3D Mapping từ dự án thực tế',
    description: 'Footage từ quá trình triển khai 3D Mapping tại SHTP Incubation Center giới thiệu bối cảnh thu thập và xây dựng dữ liệu dự án của SAOLATEK.',
  },
  en: {
    title: '3D Mapping data from a real project',
    description: 'Footage from the 3D Mapping work at SHTP Incubation Center provides context for how SAOLATEK captures and develops project data.',
  },
  zh: {
    title: '真实项目的三维建图数据',
    description: 'SHTP 孵化中心三维建图项目的真实影像，用于说明 SAOLATEK 采集和构建项目数据的工作背景。',
  },
};

type PlatformMediaPlayerProps = {
  src: string;
  poster: string;
  label: string;
  title: string;
  description: string;
  caveat?: string;
};

export const PlatformMediaPlayer: React.FC<PlatformMediaPlayerProps> = ({
  src,
  poster,
  label,
  title,
  description,
  caveat,
}) => (
  <figure className="min-w-0 overflow-hidden border border-[var(--color-border)] bg-[var(--color-paper-2)]">
    <video
      {...{ fetchpriority: 'high' }}
      className="aspect-video h-full w-full bg-[var(--color-paper)] object-contain"
      src={src}
      poster={poster}
      controls
      playsInline
      preload="metadata"
      aria-label={label}
    >
      {label}
    </video>
    <figcaption className="border-t border-[var(--color-border)] px-4 py-4 sm:px-5">
      <h2 className="text-base font-semibold text-[var(--color-ink)]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--color-ink-muted)]">{description}</p>
      {caveat ? <p className="mt-2 text-xs leading-5 text-[var(--color-ink-muted)]">{caveat}</p> : null}
    </figcaption>
  </figure>
);
