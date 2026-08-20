import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDemoAccess } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Dùng cho toàn bộ nút "Đăng ký xem Demo"
 * ở Landing / Platform / Solution pages.
 *
 * Flow:
 * - Chưa đăng nhập
 *      -> /login
 *      -> sau login quay về /book-demo
 *
 * - Đã đăng nhập + đã có quyền Demo
 *      -> /dashboard?tab=demo
 *
 * - Đã đăng nhập + chưa có Demo
 *      -> /book-demo
 *
 * - Backend demo-access lỗi / 503
 *      -> vẫn cho vào /book-demo
 */
export const useDemoNavigation = () => {
  const navigate = useNavigate();

  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated
  );

  const isLoading = useAuthStore(
    (state) => state.isLoading
  );

  const [isCheckingDemo, setIsCheckingDemo] =
    useState(false);

  const openDemo = useCallback(async () => {
    // Không cho spam click
    if (isLoading || isCheckingDemo) {
      return;
    }

    // ============================================================
    // CHƯA ĐĂNG NHẬP
    // ============================================================

    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          returnTo: '/book-demo'
        }
      });

      return;
    }

    // ============================================================
    // ĐÃ ĐĂNG NHẬP
    // ============================================================

    setIsCheckingDemo(true);

    try {
      const demoAccess =
        await fetchDemoAccess();

      /**
       * User đã được cấp quyền Demo.
       *
       * Demo của project nằm trong:
       * Dashboard -> Demo Showcase
       */
      if (
        demoAccess.success &&
        demoAccess.hasAccess
      ) {
        navigate('/dashboard?tab=demo');

        return;
      }

      /**
       * Chưa được cấp Demo.
       */
      navigate('/book-demo');
    } catch (error) {
      /**
       * Backend demo-access có thể:
       * - chưa deploy
       * - chưa config Demo
       * - trả 503
       *
       * Không block frontend.
       */
      console.warn(
        '[Demo] demo-access unavailable. Fallback to /book-demo:',
        error
      );

      navigate('/book-demo');
    } finally {
      setIsCheckingDemo(false);
    }
  }, [
    isAuthenticated,
    isLoading,
    isCheckingDemo,
    navigate
  ]);

  return {
    openDemo,

    /**
     * Tên mới.
     */
    isCheckingDemo,

    /**
     * Alias giữ tương thích với các page cũ:
     *
     * AgricultureSolutionPage
     * ConstructionInfrastructureSolutionPage
     * Platform3DGisPage
     * SurveyingSolutionPage
     * UavMappingLidarSolutionPage
     */
    isDemoLoading: isCheckingDemo
  };
};

export default useDemoNavigation;