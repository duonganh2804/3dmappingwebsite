import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDemoAccess } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

const getDemoDestination = (demoProjectId?: string) =>
  demoProjectId ? `/viewer/${demoProjectId}` : '/dashboard';

/**
 * Dùng cho toàn bộ nút "Đăng ký xem Demo" ở Landing / Platform / Solution.
 *
 * Flow:
 * - Chưa đăng nhập -> /login -> /book-demo
 * - Đã đăng nhập, chưa có Demo -> /book-demo
 * - Đã đăng nhập, đã có Demo -> /viewer/:demoProjectId (fallback /dashboard)
 */
export const useDemoNavigation = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [isCheckingDemo, setIsCheckingDemo] = useState(false);

  const openDemo = useCallback(async () => {
    if (isLoading || isCheckingDemo) return;

    if (!isAuthenticated) {
      navigate('/login', {
        state: { returnTo: '/book-demo' }
      });
      return;
    }

    setIsCheckingDemo(true);

    try {
      const demoAccess = await fetchDemoAccess();

      if (demoAccess.success && demoAccess.hasAccess) {
        navigate(getDemoDestination(demoAccess.demoProjectId));
        return;
      }

      navigate('/book-demo');
    } finally {
      setIsCheckingDemo(false);
    }
  }, [isAuthenticated, isLoading, isCheckingDemo, navigate]);

  return {
    openDemo,
    isDemoLoading: isLoading || isCheckingDemo
  };
};

export default useDemoNavigation;