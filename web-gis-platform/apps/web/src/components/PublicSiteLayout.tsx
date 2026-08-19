import React, {
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react';
import {
  Outlet,
  useLocation,
} from 'react-router-dom';

import SiteHeader from './SiteHeader';

type PublicSiteLayoutProps = {
  children?: React.ReactNode;
};

/**
 * Shared public-site shell.
 *
 * - One shared SiteHeader for all public routes.
 * - Landing keeps only the shared header.
 * - Inner pages may still contain their old page-owned <header>;
 *   this layout hides only the first header found inside page content.
 * - Supports both nested <Outlet /> and flat-route children.
 * - Scrolls to top when route changes.
 */
export const PublicSiteLayout: React.FC<PublicSiteLayoutProps> = ({
  children,
}) => {
  const location = useLocation();

  const contentRef =
    useRef<HTMLDivElement | null>(
      null
    );

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    });
  }, [location.pathname]);

  useLayoutEffect(() => {
    const root =
      contentRef.current;

    if (!root) {
      return;
    }

    /*
     * Landing no longer owns a page header,
     * so only internal public pages need cleanup.
     */
    if (location.pathname === '/') {
      return;
    }

    const pageOwnedHeader =
      root.querySelector('header');

    if (!pageOwnedHeader) {
      return;
    }

    pageOwnedHeader.setAttribute(
      'data-public-page-owned-header',
      'hidden'
    );

    return () => {
      pageOwnedHeader.removeAttribute(
        'data-public-page-owned-header'
      );
    };
  }, [location.pathname]);

  return (
    <>
      <style>{`
        [data-public-page-owned-header='hidden'] {
          display: none !important;
        }
      `}</style>

      <SiteHeader variant="page" />

      <div
        ref={contentRef}
        className="public-site-content"
      >
        {children ?? <Outlet />}
      </div>
    </>
  );
};

export default PublicSiteLayout;