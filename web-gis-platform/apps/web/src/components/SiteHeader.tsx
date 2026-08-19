import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ChevronDown,
  Globe,
  Menu,
  X,
} from 'lucide-react';

import logoImg from '../assets/logo.webp';
import {
  useLanguage,
  type Language,
} from '../hooks/useLanguage';
import { useDemoNavigation } from '../hooks/useDemoNavigation';
import { useAuthStore } from '../store/useAuthStore';
import {
  SITE_ACTION_COPY,
  SITE_NAV_GROUPS,
  SITE_NAV_LABELS,
  SITE_NAVIGATION,
  type SiteNavGroupKey,
  type SiteNavItem,
} from '../config/siteNavigation';

type SiteHeaderProps = {
  variant?: 'landing' | 'page';
};

const THEME_STORAGE_KEY = 'saolatek_theme';
const THEME_CHANGE_EVENT = 'saolatek-theme-change';

const readInitialTheme = () => {
  if (typeof window === 'undefined') return true;

  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === 'light') return false;
  if (saved === 'dark') return true;
  return true;
};

export const SiteHeader: React.FC<SiteHeaderProps> = ({
  variant = 'page',
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const { currentLang, setCurrentLang } = useLanguage('vi');
  const { openDemo, isDemoLoading } = useDemoNavigation();
  const { user, isAuthenticated } = useAuthStore();

  const [isDarkMode, setIsDarkMode] = useState(readInitialTheme);
  const [activeDropdown, setActiveDropdown] =
    useState<SiteNavGroupKey | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const actionCopy = SITE_ACTION_COPY[currentLang];
  const navLabels = SITE_NAV_LABELS[currentLang];

  const languageShort: Record<Language, string> = {
    vi: 'VI',
    en: 'EN',
    zh: '中文',
  };

  const languageNames: Record<Language, string> = {
    vi: 'Tiếng Việt',
    en: 'English',
    zh: '中文',
  };

  const accountRoute = isAuthenticated ? '/dashboard' : '/login';

  const openAccount = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Đã đăng nhập:
    // - có Demo access -> openDemo() đưa vào project Demo
    // - chưa có Demo access -> openDemo() đưa sang /book-demo
    openDemo();
  };

  useEffect(() => {
    setActiveDropdown(null);
    setLanguageOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const syncTheme = (event: Event) => {
      const detail = (event as CustomEvent<'light' | 'dark'>).detail;
      if (detail === 'dark') setIsDarkMode(true);
      if (detail === 'light') setIsDarkMode(false);
    };

    window.addEventListener(THEME_CHANGE_EVENT, syncTheme);

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, syncTheme);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const openDropdown = (key: SiteNavGroupKey) => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setActiveDropdown(key);
  };

  const closeDropdown = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setActiveDropdown(null);
      closeTimer.current = null;
    }, 160);
  };

  const handleItem = (item: SiteNavItem) => {
    setActiveDropdown(null);
    setLanguageOpen(false);
    setMobileMenuOpen(false);

    if (item.action === 'demo') {
      openDemo();
      return;
    }

    if (item.action === 'account') {
      openAccount();
      return;
    }

    if (item.route) navigate(item.route);
  };

  const isActive = (item: SiteNavItem) =>
    Boolean(item.route && location.pathname === item.route);

  const applyTheme = (nextDark: boolean) => {
    const theme = nextDark ? 'dark' : 'light';

    setIsDarkMode(nextDark);
    document.documentElement.dataset.saolatekTheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);

    try {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: THEME_STORAGE_KEY,
          newValue: theme,
        })
      );
    } catch {
      // Older browsers: custom event below is enough for same-tab sync.
    }

    window.dispatchEvent(
      new CustomEvent(THEME_CHANGE_EVENT, {
        detail: theme,
      })
    );
  };

  const themeLabel = isDarkMode
    ? actionCopy.switchToLight
    : actionCopy.switchToDark;

  return (
    <>
      <style>{`
        .site-header {
          --sh-bg: rgba(255,255,255,.96);
          --sh-bg-strong: #ffffff;
          --sh-surface: rgba(255,255,255,.99);
          --sh-surface-soft: rgba(2,132,199,.05);

          --sh-ink: #0b1220;
          --sh-muted: #445468;
          --sh-dim: #64748b;

          --sh-border: rgba(15,23,42,.08);
          --sh-border-strong: rgba(15,23,42,.14);

          --sh-accent: #0284c7;
          --sh-accent-2: #0ea5e9;
          --sh-accent-soft: rgba(2,132,199,.08);

          --sh-solid-bg:
            linear-gradient(
              135deg,
              #0f172a 0%,
              #1e293b 100%
            );

          --sh-solid-ink: #ffffff;

          position: sticky !important;
          top: 0 !important;
          left: 0;
          right: 0;
          z-index: 9999 !important;

          display: block !important;
          width: 100%;
          min-height: 72px;

          visibility: visible !important;
          opacity: 1 !important;
          transform: none !important;

          border-bottom: 1px solid var(--sh-border);
          background: var(--sh-bg);
          color: var(--sh-ink);

          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .site-header::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(
              90deg,
              rgba(2,132,199,.025),
              transparent 30%,
              transparent 70%,
              rgba(2,132,199,.02)
            );
        }

        :root[data-saolatek-theme='dark'] .site-header::before {
          background:
            linear-gradient(
              90deg,
              rgba(56,189,248,.035),
              transparent 30%,
              transparent 70%,
              rgba(56,189,248,.025)
            );
        }

        :root[data-saolatek-theme='light'] .site-header {
          --sh-bg: rgba(255,255,255,.96);
          --sh-bg-strong: #ffffff;
          --sh-surface: rgba(255,255,255,.99);
          --sh-surface-soft: rgba(2,132,199,.05);

          --sh-ink: #0b1220;
          --sh-muted: #445468;
          --sh-dim: #64748b;

          --sh-border: rgba(15,23,42,.08);
          --sh-border-strong: rgba(15,23,42,.14);

          --sh-accent: #0284c7;
          --sh-accent-2: #0ea5e9;
          --sh-accent-soft: rgba(2,132,199,.08);

          --sh-solid-bg:
            linear-gradient(
              135deg,
              #0f172a 0%,
              #1e293b 100%
            );

          --sh-solid-ink: #ffffff;
        }

        :root[data-saolatek-theme='dark'] .site-header {
          --sh-bg: rgba(5,10,20,.92);
          --sh-bg-strong: #07101c;
          --sh-surface: rgba(11,19,32,.98);
          --sh-surface-soft: rgba(255,255,255,.045);

          --sh-ink: #f7fafc;
          --sh-muted: #9aa9bb;
          --sh-dim: #64748b;

          --sh-border: rgba(255,255,255,.09);
          --sh-border-strong: rgba(255,255,255,.16);

          --sh-accent: #38bdf8;
          --sh-accent-2: #7dd3fc;
          --sh-accent-soft: rgba(56,189,248,.10);

          --sh-solid-bg:
            linear-gradient(
              135deg,
              #0ea5e9 0%,
              #0284c7 100%
            );

          --sh-solid-ink: #ffffff;
        }

        .site-header--landing,
        .site-header--page {
          position: sticky !important;
          top: 0 !important;
        }

        .site-header__inner {
          position: relative;
          z-index: 1;

          display: grid;
          grid-template-columns:
            minmax(184px,auto)
            minmax(0,1fr)
            auto;

          align-items: center;
          gap: 28px;

          width:
            min(1560px,calc(100% - 64px));
          height: 72px;
          margin: 0 auto;
        }

        /* ==================================================== */
        /* BRAND */
        /* ==================================================== */

        .site-header__logo {
          display: inline-flex;
          align-items: center;
          justify-content: flex-start;
          width: fit-content;
          padding: 0;
          border: 0;
          background: transparent;
          cursor: pointer;
        }

        .site-header__logo img {
          display: block;
          width: auto;
          height: 35px;
          object-fit: contain;
        }

        /* ==================================================== */
        /* DESKTOP NAV */
        /* ==================================================== */

        .site-header__nav {
          display: flex;
          min-width: 0;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 4px;
        }

        .site-header__nav-item {
          position: relative;
          display: flex;
          align-items: center;
          height: 100%;
        }

        .site-header__nav-item::after {
          content: '';
          position: absolute;
          top: 100%;
          right: -12px;
          left: -12px;
          z-index: 20;
          height: 14px;
        }

        .site-header__nav-button {
          position: relative;

          display: inline-flex;
          height: 40px;
          align-items: center;
          justify-content: center;
          gap: 7px;

          padding: 0 14px;

          border: 1px solid transparent;
          border-radius: 10px;
          background: transparent;

          color: var(--sh-muted);

          font-size: 13px;
          font-weight: 620;
          letter-spacing: -.01em;

          cursor: pointer;

          transition:
            color .18s ease,
            border-color .18s ease,
            background .18s ease,
            transform .18s ease;
        }

        .site-header__nav-button:hover,
        .site-header__nav-button.is-open {
          color: var(--sh-ink);
          border-color: rgba(2,132,199,.18);
          background: rgba(2,132,199,.075);
        }

        .site-header__nav-button.is-open {
          font-weight: 700;
        }

        .site-header__nav-button:hover {
          transform: translateY(-1px);
        }

        .site-header__nav-button::before {
          content: '';
          position: absolute;
          right: 14px;
          bottom: -9px;
          left: 14px;
          height: 2px;
          border-radius: 999px;
          background:
            linear-gradient(
              90deg,
              var(--sh-accent),
              var(--sh-accent-2)
            );
          opacity: 0;
          transform: scaleX(.65);
          transform-origin: center;

          transition:
            opacity .18s ease,
            transform .18s ease;
        }

        .site-header__nav-button:hover::before,
        .site-header__nav-button.is-open::before {
          opacity: 1;
          transform: scaleX(1);
        }

        .site-header__nav-button svg {
          color: var(--sh-dim);
          transition:
            transform .18s ease,
            color .18s ease;
        }

        .site-header__nav-button:hover svg,
        .site-header__nav-button.is-open svg {
          color: var(--sh-accent);
        }

        .site-header__nav-button.is-open svg {
          transform: rotate(180deg);
        }

        :root[data-saolatek-theme='light']
        .site-header__nav-button {
          color: #435268;
        }

        :root[data-saolatek-theme='light']
        .site-header__nav-button:hover,
        :root[data-saolatek-theme='light']
        .site-header__nav-button.is-open {
          color: #0f172a;
        }

        :root[data-saolatek-theme='light']
        .site-header__nav-button svg {
          color: #64748b;
        }

        :root[data-saolatek-theme='light']
        .site-header__nav-button:hover svg,
        :root[data-saolatek-theme='light']
        .site-header__nav-button.is-open svg {
          color: #0284c7;
        }

        /* ==================================================== */
        /* DROPDOWN */
        /* ==================================================== */

        .site-header__dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          z-index: 10050;

          width: 304px;
          max-width: calc(100vw - 28px);
          padding: 8px;

          transform: none;

          border: 1px solid var(--sh-border-strong);
          border-radius: 14px;

          background: var(--sh-surface);

          box-shadow:
            0 24px 70px rgba(0,0,0,.24),
            0 0 0 1px rgba(255,255,255,.02);

          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }

        .site-header__dropdown::before {
          content: '';
          position: absolute;
          top: -1px;
          left: 18px;
          width: 56px;
          height: 2px;
          border-radius: 999px;
          background:
            linear-gradient(
              90deg,
              var(--sh-accent),
              var(--sh-accent-2)
            );
        }

        .site-header__dropdown--solutions {
          width: 294px;
        }

        .site-header__dropdown--resources {
          width: 330px;
        }

        .site-header__dropdown--connect {
          width: 276px;
        }

        .site-header__dropdown-item {
          position: relative;

          display: grid;
          width: 100%;
          min-height: 44px;

          grid-template-columns:
            minmax(0,1fr) 18px;

          align-items: center;
          gap: 12px;

          padding: 10px 12px;

          border: 0;
          border-radius: 9px;
          background: transparent;

          color: var(--sh-muted);

          font-size: 12.5px;
          font-weight: 560;
          line-height: 1.4;
          text-align: left;

          cursor: pointer;

          transition:
            color .16s ease,
            background .16s ease,
            transform .16s ease;
        }

        .site-header__dropdown-item + 
        .site-header__dropdown-item {
          margin-top: 2px;
        }

        .site-header__dropdown-item:hover {
          color: var(--sh-ink);
          background: var(--sh-accent-soft);
          transform: translateX(2px);
        }

        .site-header__dropdown-item.is-active {
          color: var(--sh-accent);
          background: var(--sh-accent-soft);
        }

        .site-header__dropdown-item svg {
          color: var(--sh-accent);
          opacity: .72;

          transition:
            opacity .16s ease,
            transform .16s ease;
        }

        .site-header__dropdown-item:hover svg,
        .site-header__dropdown-item.is-active svg {
          opacity: 1;
          transform: translateX(2px);
        }

        /* ==================================================== */
        /* ACTIONS */
        /* ==================================================== */

        .site-header__actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .site-header__language {
          position: relative;
        }

        .site-header__language-button {
          display: inline-flex;
          height: 38px;
          align-items: center;
          gap: 6px;
          padding: 0 10px;

          border: 1px solid transparent;
          border-radius: 9px;
          background: transparent;
          color: var(--sh-muted);

          font-size: 12px;
          font-weight: 600;

          cursor: pointer;

          transition:
            color .16s ease,
            border-color .16s ease,
            background .16s ease;
        }

        .site-header__language-button:hover,
        .site-header__language-button.is-open {
          color: var(--sh-ink);
          border-color: var(--sh-border);
          background: var(--sh-surface-soft);
        }

        .site-header__language-button svg:first-child {
          color: var(--sh-accent);
        }

        .site-header__language-menu {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          z-index: 10060;

          width: 170px;
          padding: 8px;

          border: 1px solid var(--sh-border-strong);
          border-radius: 12px;

          background: var(--sh-surface);

          box-shadow:
            0 20px 50px rgba(0,0,0,.20);

          backdrop-filter: blur(18px);
        }

        .site-header__language-item {
          display: block;
          width: 100%;
          padding: 9px 10px;

          border: 0;
          border-radius: 8px;
          background: transparent;

          color: var(--sh-muted);

          font-size: 12.5px;
          font-weight: 560;
          text-align: left;

          cursor: pointer;

          transition:
            color .15s ease,
            background .15s ease;
        }

        .site-header__language-item:hover,
        .site-header__language-item.is-active {
          color: var(--sh-ink);
          background: var(--sh-accent-soft);
        }

        .site-header__language-item.is-active {
          color: var(--sh-accent);
        }

        /* ==================================================== */
        /* THEME SWITCH */
        /* ==================================================== */

        .site-header__theme {
          position: relative;

          display: flex;
          width: 72px;
          height: 30px;
          flex-shrink: 0;
          overflow: hidden;
          align-items: center;
          padding: 0;

          border: 1px solid var(--sh-border-strong);
          border-radius: 999px;

          background:
            linear-gradient(
              180deg,
              #3195f6 0%,
              #6db8ff 100%
            );

          cursor: pointer;

          box-shadow:
            inset 0 0 0 1px rgba(255,255,255,.08);
        }

        .site-header__theme.is-dark {
          background:
            linear-gradient(
              180deg,
              #0c1323 0%,
              #17233d 100%
            );
        }

        .site-header__theme-thumb {
          position: absolute;
          top: 3px;
          left: 4px;
          z-index: 3;

          width: 22px;
          height: 22px;

          border-radius: 50%;

          background: #ffd34d;

          box-shadow:
            0 2px 8px rgba(0,0,0,.18);

          transition:
            transform .34s cubic-bezier(.16,1,.3,1);
        }

        .site-header__theme.is-dark
        .site-header__theme-thumb {
          transform: translateX(41px);
          background: #eef3fb;
          box-shadow:
            inset -5px -2px 0 #c8d2e2,
            0 2px 8px rgba(0,0,0,.22);
        }

        .site-header__clouds,
        .site-header__stars {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .site-header__cloud {
          position: absolute;
          height: 7px;
          border-radius: 999px;
          background: rgba(255,255,255,.86);
        }

        .site-header__cloud--1 {
          right: 8px;
          bottom: 5px;
          width: 20px;
        }

        .site-header__cloud--2 {
          right: 21px;
          bottom: 8px;
          width: 13px;
        }

        .site-header__cloud--3 {
          right: 4px;
          bottom: 11px;
          width: 11px;
        }

        .site-header__stars {
          opacity: 0;
        }

        .site-header__theme.is-dark
        .site-header__clouds {
          opacity: 0;
        }

        .site-header__theme.is-dark
        .site-header__stars {
          opacity: 1;
        }

        .site-header__star {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: #fff;
        }

        .site-header__star--1 {
          top: 7px;
          left: 12px;
        }

        .site-header__star--2 {
          top: 16px;
          left: 25px;
        }

        .site-header__star--3 {
          top: 8px;
          left: 35px;
        }

        /* ==================================================== */
        /* LOGIN / DEMO CTA */
        /* ==================================================== */

        .site-header__button {
          display: inline-flex;
          height: 40px;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 0 15px;

          border-radius: 9px;

          font-size: 13px;
          font-weight: 650;
          letter-spacing: -.01em;
          white-space: nowrap;

          cursor: pointer;

          transition:
            border-color .18s ease,
            background .18s ease,
            color .18s ease,
            transform .18s ease,
            box-shadow .18s ease;
        }

        .site-header__button--ghost {
          border: 1px solid var(--sh-border-strong);
          background: transparent;
          color: var(--sh-muted);
          font-weight: 600;
        }

        .site-header__button--ghost:hover {
          border-color: rgba(30,167,225,.45);
          color: var(--sh-ink);
          background: var(--sh-accent-soft);
          transform: translateY(-1px);
        }

        .site-header__button--solid {
          border: 1px solid transparent;
          background: var(--sh-solid-bg);
          color: var(--sh-solid-ink);
          font-weight: 700;

          box-shadow:
            0 8px 18px rgba(14,165,233,.18);
        }

        .site-header__button--solid:hover {
          transform: translateY(-1px);
          box-shadow:
            0 12px 24px rgba(14,165,233,.24);
        }

        .site-header__button:disabled {
          cursor: not-allowed;
          opacity: .5;
          transform: none;
          box-shadow: none;
        }

        .site-header__hamburger {
          display: none;
          width: 40px;
          height: 40px;
          align-items: center;
          justify-content: center;
          padding: 0;

          border: 1px solid var(--sh-border);
          border-radius: 9px;
          background: var(--sh-surface-soft);
          color: var(--sh-ink);

          cursor: pointer;
        }

        /* ==================================================== */
        /* MOBILE */
        /* ==================================================== */

        .site-header-mobile {
          position: fixed;
          inset: 0;
          z-index: 11000;

          display: flex;
          flex-direction: column;
          min-height: 100dvh;
          padding: 20px 18px;

          background:
            linear-gradient(
              180deg,
              #050914 0%,
              #08111e 100%
            );

          color: #f8fafc;
        }

        :root[data-saolatek-theme='light']
        .site-header-mobile {
          background:
            linear-gradient(
              180deg,
              #ffffff 0%,
              #f7fafc 100%
            );

          color: #0f172a;
        }

        .site-header-mobile__top,
        .site-header-mobile__controls {
          display: flex;
          align-items: center;
        }

        .site-header-mobile__top {
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 18px;
          padding-bottom: 16px;

          border-bottom:
            1px solid rgba(148,163,184,.18);
        }

        .site-header-mobile__controls {
          gap: 8px;
        }

        .site-header-mobile__top img {
          height: 33px;
          width: auto;
        }

        .site-header-mobile__groups {
          flex: 1;
          overflow-y: auto;
        }

        .site-header-mobile__group {
          padding: 16px 0;

          border-bottom:
            1px solid rgba(148,163,184,.18);
        }

        .site-header-mobile__label {
          margin-bottom: 7px;

          color: var(--sh-accent);

          font-family:
            ui-monospace,
            SFMono-Regular,
            Menlo,
            Monaco,
            Consolas,
            monospace;

          font-size: 10px;
          font-weight: 800;
          letter-spacing: .14em;
          text-transform: uppercase;
        }

        .site-header-mobile__item {
          display: flex;
          width: 100%;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 11px 0;

          border: 0;
          background: transparent;
          color: inherit;

          font-size: 14px;
          font-weight: 550;
          line-height: 1.45;
          text-align: left;

          cursor: pointer;
        }

        .site-header-mobile__item.is-active {
          color: var(--sh-accent);
        }

        .site-header-mobile__actions {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 10px;
          padding-top: 16px;
        }

        .site-header__icon-button {
          display: inline-flex;
          width: 38px;
          height: 38px;
          align-items: center;
          justify-content: center;
          padding: 0;

          border: 1px solid rgba(148,163,184,.18);
          border-radius: 9px;

          background: rgba(255,255,255,.04);
          color: inherit;

          cursor: pointer;
        }

        @media (max-width: 1280px) {
          .site-header__inner {
            width:
              min(calc(100% - 40px),1560px);
            gap: 20px;
          }

          .site-header__nav-button {
            padding-right: 12px;
            padding-left: 12px;
          }

          .site-header__button {
            padding-right: 12px;
            padding-left: 12px;
          }
        }

        @media (max-width: 1180px) {
          .site-header__nav,
          .site-header__actions {
            display: none;
          }

          .site-header__inner {
            grid-template-columns:
              1fr auto;
          }

          .site-header__hamburger {
            display: flex;
            justify-self: end;
          }
        }

        @media (max-width: 640px) {
          .site-header__inner {
            width:
              min(calc(100% - 28px),1560px);
          }

          .site-header-mobile__actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <header className={`site-header site-header--${variant}`}>
        <div className="site-header__inner">
          <button
            type="button"
            className="site-header__logo"
            onClick={() => navigate('/')}
            aria-label="SAOLATEK — Home"
          >
            <img src={logoImg} alt="SAOLATEK" />
          </button>

          <nav className="site-header__nav" aria-label="Main navigation">
            {SITE_NAV_GROUPS.map((menuKey) => (
              <div
                key={menuKey}
                className="site-header__nav-item"
                onMouseEnter={() => openDropdown(menuKey)}
                onMouseLeave={closeDropdown}
              >
                <button
                  type="button"
                  className={`site-header__nav-button ${
                    activeDropdown === menuKey ? 'is-open' : ''
                  }`}
                  onClick={() =>
                    setActiveDropdown(
                      activeDropdown === menuKey ? null : menuKey
                    )
                  }
                  aria-expanded={activeDropdown === menuKey}
                >
                  {navLabels[menuKey]}
                  <ChevronDown size={13} />
                </button>

                {activeDropdown === menuKey && (
                  <div
                    className={`site-header__dropdown site-header__dropdown--${menuKey}`}
                    onMouseEnter={() => openDropdown(menuKey)}
                    onMouseLeave={closeDropdown}
                  >
                    {SITE_NAVIGATION[menuKey].map((item) => (
                      <button
                        type="button"
                        key={item.route ?? item.action}
                        className={`site-header__dropdown-item ${
                          isActive(item) ? 'is-active' : ''
                        }`}
                        onClick={() => handleItem(item)}
                      >
                        <span>{item.label[currentLang]}</span>
                        <ArrowRight size={13} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="site-header__actions">
            <div className="site-header__language">
              <button
                type="button"
                className={`site-header__language-button ${
                  languageOpen ? 'is-open' : ''
                }`}
                onClick={() => setLanguageOpen((value) => !value)}
                aria-label={actionCopy.selectLanguage}
                aria-expanded={languageOpen}
              >
                <Globe size={16} />
                <span>{languageShort[currentLang]}</span>
                <ChevronDown size={11} />
              </button>

              {languageOpen && (
                <div className="site-header__language-menu">
                  {(['vi', 'en', 'zh'] as const).map((language) => (
                    <button
                      type="button"
                      key={language}
                      className={`site-header__language-item ${
                        currentLang === language ? 'is-active' : ''
                      }`}
                      onClick={() => {
                        setCurrentLang(language);
                        setLanguageOpen(false);
                      }}
                    >
                      {languageNames[language]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              className={`site-header__theme ${
                isDarkMode ? 'is-dark' : ''
              }`}
              onClick={() => applyTheme(!isDarkMode)}
              aria-label={themeLabel}
              title={themeLabel}
              aria-pressed={isDarkMode}
            >
              <div className="site-header__clouds">
                <div className="site-header__cloud site-header__cloud--1" />
                <div className="site-header__cloud site-header__cloud--2" />
                <div className="site-header__cloud site-header__cloud--3" />
              </div>

              <div className="site-header__stars">
                <div className="site-header__star site-header__star--1" />
                <div className="site-header__star site-header__star--2" />
                <div className="site-header__star site-header__star--3" />
              </div>

              <div className="site-header__theme-thumb" />
            </button>

            <button
              type="button"
              className="site-header__button site-header__button--ghost"
              onClick={openAccount}
            >
              {isAuthenticated
                ? actionCopy.dashboard
                : actionCopy.login}

              {isAuthenticated && user?.fullName
                ? ` (${user.fullName.split(' ')[0]})`
                : ''}
            </button>

            <button
              type="button"
              className="site-header__button site-header__button--solid"
              onClick={openDemo}
              disabled={isDemoLoading}
            >
              {actionCopy.demo}
            </button>
          </div>

          <button
            type="button"
            className="site-header__hamburger"
            onClick={() => setMobileMenuOpen(true)}
            aria-label={actionCopy.openNavigation}
          >
            <Menu size={23} />
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div
          className="site-header-mobile"
          role="dialog"
          aria-modal="true"
          aria-label={actionCopy.openNavigation}
        >
          <div className="site-header-mobile__top">
            <button
              type="button"
              className="site-header__logo"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/');
              }}
            >
              <img src={logoImg} alt="SAOLATEK" />
            </button>

            <div className="site-header-mobile__controls">
              <button
                type="button"
                className={`site-header__theme ${
                  isDarkMode ? 'is-dark' : ''
                }`}
                onClick={() => applyTheme(!isDarkMode)}
                aria-label={themeLabel}
              >
                <div className="site-header__clouds">
                  <div className="site-header__cloud site-header__cloud--1" />
                  <div className="site-header__cloud site-header__cloud--2" />
                  <div className="site-header__cloud site-header__cloud--3" />
                </div>

                <div className="site-header__stars">
                  <div className="site-header__star site-header__star--1" />
                  <div className="site-header__star site-header__star--2" />
                  <div className="site-header__star site-header__star--3" />
                </div>

                <div className="site-header__theme-thumb" />
              </button>

              <button
                type="button"
                className="site-header__icon-button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label={actionCopy.closeNavigation}
              >
                <X size={23} />
              </button>
            </div>
          </div>

          <div className="site-header-mobile__groups">
            {SITE_NAV_GROUPS.map((menuKey) => (
              <section
                key={menuKey}
                className="site-header-mobile__group"
              >
                <div className="site-header-mobile__label">
                  {navLabels[menuKey]}
                </div>

                {SITE_NAVIGATION[menuKey].map((item) => (
                  <button
                    type="button"
                    key={item.route ?? item.action}
                    className={`site-header-mobile__item ${
                      isActive(item) ? 'is-active' : ''
                    }`}
                    onClick={() => handleItem(item)}
                  >
                    <span>{item.label[currentLang]}</span>
                    <ArrowRight size={14} />
                  </button>
                ))}
              </section>
            ))}
          </div>

          <div className="site-header-mobile__actions">
            <button
              type="button"
              className="site-header__button site-header__button--ghost"
              onClick={() => {
                setMobileMenuOpen(false);
                openAccount();
              }}
            >
              {isAuthenticated
                ? actionCopy.dashboard
                : actionCopy.login}
            </button>

            <button
              type="button"
              className="site-header__button site-header__button--solid"
              onClick={() => {
                setMobileMenuOpen(false);
                openDemo();
              }}
              disabled={isDemoLoading}
            >
              {actionCopy.demo}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SiteHeader;