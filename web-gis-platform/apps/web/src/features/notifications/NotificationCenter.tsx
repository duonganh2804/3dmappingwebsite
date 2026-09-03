
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CheckCircle2,
  CircleAlert,
  Info,
  Settings,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';

import {
  APP_NOTIFICATION_EVENT,
  clearAppNotifications,
  getAppNotifications,
  markAllAppNotificationsRead,
  markAppNotificationRead,
  removeAppNotification,
  type AppNotification,
} from './notificationStore';

type Language = 'vi' | 'en' | 'zh';

type NotificationCenterProps = {
  userId?: string | null;
  language: Language;
};

const TEXT = {
  vi: {
    title: 'Thông báo',
    unread: 'chưa đọc',
    allRead: 'Đánh dấu tất cả đã đọc',
    clearAll: 'Xóa tất cả',
    clearConfirm:
      'Xóa toàn bộ thông báo trên thiết bị này?',
    emptyTitle: 'Chưa có thông báo',
    emptyDesc:
      'Các sự kiện quan trọng của dự án và pipeline sẽ xuất hiện tại đây.',
    settings: 'Cài đặt thông báo',
    justNow: 'Vừa xong',
    minutes: 'phút trước',
    hours: 'giờ trước',
    days: 'ngày trước',
    remove: 'Xóa thông báo',
  },
  en: {
    title: 'Notifications',
    unread: 'unread',
    allRead: 'Mark all as read',
    clearAll: 'Clear all',
    clearConfirm:
      'Clear all notifications on this device?',
    emptyTitle: 'No notifications yet',
    emptyDesc:
      'Important project and pipeline events will appear here.',
    settings: 'Notification settings',
    justNow: 'Just now',
    minutes: 'min ago',
    hours: 'hr ago',
    days: 'days ago',
    remove: 'Remove notification',
  },
  zh: {
    title: '通知',
    unread: '未读',
    allRead: '全部标为已读',
    clearAll: '清除全部',
    clearConfirm:
      '清除此设备上的所有通知？',
    emptyTitle: '暂无通知',
    emptyDesc:
      '重要的项目和 pipeline 事件会显示在这里。',
    settings: '通知设置',
    justNow: '刚刚',
    minutes: '分钟前',
    hours: '小时前',
    days: '天前',
    remove: '删除通知',
  },
} as const;

const iconForLevel = (
  level: AppNotification['level'],
) => {
  if (level === 'success') {
    return (
      <CheckCircle2
        size={15}
        className="text-emerald-600"
      />
    );
  }

  if (level === 'warning') {
    return (
      <AlertTriangle
        size={15}
        className="text-amber-600"
      />
    );
  }

  if (level === 'error') {
    return (
      <XCircle
        size={15}
        className="text-red-600"
      />
    );
  }

  return (
    <Info
      size={15}
      className="text-blue-600"
    />
  );
};

const iconBackground = (
  level: AppNotification['level'],
) => {
  if (level === 'success') {
    return 'bg-emerald-50';
  }

  if (level === 'warning') {
    return 'bg-amber-50';
  }

  if (level === 'error') {
    return 'bg-red-50';
  }

  return 'bg-blue-50';
};

export const NotificationCenter: React.FC<
  NotificationCenterProps
> = ({
  userId,
  language,
}) => {
  const navigate = useNavigate();
  const rootRef =
    useRef<HTMLDivElement>(null);

  const [open, setOpen] =
    useState(false);
  const [notifications, setNotifications] =
    useState<AppNotification[]>(() =>
      getAppNotifications(userId),
    );

  const t = TEXT[language];

  const reload = () => {
    setNotifications(
      getAppNotifications(userId),
    );
  };

  useEffect(() => {
    reload();
  }, [userId]);

  useEffect(() => {
    const handleChange = (
      event: Event,
    ) => {
      const customEvent =
        event as CustomEvent<{
          userId?: string;
        }>;

      if (
        customEvent.detail?.userId &&
        customEvent.detail.userId !==
          (userId?.trim() ||
            'anonymous')
      ) {
        return;
      }

      reload();
    };

    const handleStorage = (
      event: StorageEvent,
    ) => {
      if (
        event.key?.startsWith(
          'saolatek_notification_center_v1:',
        )
      ) {
        reload();
      }
    };

    window.addEventListener(
      APP_NOTIFICATION_EVENT,
      handleChange,
    );
    window.addEventListener(
      'storage',
      handleStorage,
    );

    return () => {
      window.removeEventListener(
        APP_NOTIFICATION_EVENT,
        handleChange,
      );
      window.removeEventListener(
        'storage',
        handleStorage,
      );
    };
  }, [userId]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (
      event: MouseEvent,
    ) => {
      if (
        !rootRef.current?.contains(
          event.target as Node,
        )
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handlePointerDown,
    );
    window.addEventListener(
      'keydown',
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handlePointerDown,
      );
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      );
    };
  }, [open]);

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        item => !item.read,
      ).length,
    [notifications],
  );

  const relativeTime = (
    createdAt: number,
  ) => {
    const elapsed = Math.max(
      0,
      Date.now() - createdAt,
    );

    const minute = 60_000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (elapsed < minute) {
      return t.justNow;
    }

    if (elapsed < hour) {
      return `${Math.floor(
        elapsed / minute,
      )} ${t.minutes}`;
    }

    if (elapsed < day) {
      return `${Math.floor(
        elapsed / hour,
      )} ${t.hours}`;
    }

    return `${Math.floor(
      elapsed / day,
    )} ${t.days}`;
  };

  const openNotification = (
    item: AppNotification,
  ) => {
    if (!item.read) {
      markAppNotificationRead(
        userId,
        item.id,
      );
    }

    setOpen(false);

    if (item.href) {
      navigate(item.href);
    }
  };

  const markAllRead = () => {
    markAllAppNotificationsRead(
      userId,
    );
  };

  const clearAll = () => {
    if (
      !window.confirm(
        t.clearConfirm,
      )
    ) {
      return;
    }

    clearAppNotifications(userId);
  };

  return (
    <div
      ref={rootRef}
      className="relative"
    >
      <button
        onClick={() =>
          setOpen(value => !value)
        }
        className={`relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors lg:h-auto lg:w-auto lg:p-2 ${
          open
            ? 'bg-slate-100 text-slate-900'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
        }`}
        title={t.title}
        aria-label={t.title}
        aria-expanded={open}
      >
        <Bell size={16} />

        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-blue-600 px-0.5 text-[8px] font-bold leading-none text-white lg:-right-0.5 lg:-top-0.5">
            {unreadCount > 9
              ? '9+'
              : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[70] mt-2 w-[360px] max-w-[calc(100vw-24px)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <div>
              <div className="text-xs font-bold text-slate-950">
                {t.title}
              </div>
              <div className="mt-0.5 text-[10px] text-slate-400">
                {unreadCount}{' '}
                {t.unread}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                  title={t.allRead}
                >
                  <CheckCheck
                    size={14}
                  />
                </button>
              )}

              {notifications.length >
                0 && (
                <button
                  onClick={clearAll}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
                  title={t.clearAll}
                >
                  <Trash2
                    size={14}
                  />
                </button>
              )}
            </div>
          </div>

          {notifications.length ===
          0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-6 py-8 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <Bell size={19} />
              </div>

              <div className="mt-3 text-xs font-bold text-slate-800">
                {t.emptyTitle}
              </div>

              <div className="mt-1 max-w-64 text-[10px] leading-5 text-slate-500">
                {t.emptyDesc}
              </div>
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto">
              {notifications.map(
                item => (
                  <div
                    key={item.id}
                    className={`group relative border-b border-slate-100 last:border-b-0 ${
                      item.read
                        ? 'bg-white'
                        : 'bg-blue-50/35'
                    }`}
                  >
                    <button
                      onClick={() =>
                        openNotification(
                          item,
                        )
                      }
                      className="flex w-full gap-3 px-4 py-3.5 pr-10 text-left transition-colors hover:bg-slate-50"
                    >
                      <span
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBackground(
                          item.level,
                        )}`}
                      >
                        {iconForLevel(
                          item.level,
                        )}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-start gap-2">
                          <span className="min-w-0 flex-1 text-[11px] font-bold leading-4 text-slate-900">
                            {item.title}
                          </span>

                          {!item.read && (
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                          )}
                        </span>

                        <span className="mt-1 block text-[10px] leading-4 text-slate-500">
                          {item.message}
                        </span>

                        <span className="mt-1.5 block font-mono text-[9px] text-slate-400">
                          {relativeTime(
                            item.createdAt,
                          )}
                        </span>
                      </span>
                    </button>

                    <button
                      onClick={event => {
                        event.stopPropagation();
                        removeAppNotification(
                          userId,
                          item.id,
                        );
                      }}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md text-slate-300 opacity-0 transition-opacity hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100 focus:opacity-100"
                      title={t.remove}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ),
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-3 py-2.5">
            <button
              onClick={() => {
                setOpen(false);
                navigate('/settings');
              }}
              className="flex min-h-8 items-center gap-1.5 rounded-md px-2 text-[10px] font-bold text-slate-600 hover:bg-white hover:text-blue-700"
            >
              <Settings size={12} />
              {t.settings}
            </button>

            {notifications.length >
              0 && (
              <div className="flex items-center gap-1 text-[9px] font-medium text-slate-400">
                <CircleAlert
                  size={11}
                />
                {notifications.length}/50
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
