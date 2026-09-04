export type AppNotificationLevel =
  | 'info'
  | 'success'
  | 'warning'
  | 'error';

export type AppNotificationSource =
  | 'project'
  | 'pipeline'
  | 'system';

export type AppNotification = {
  id: string;
  level: AppNotificationLevel;
  source: AppNotificationSource;
  title: string;
  message: string;
  createdAt: number;
  read: boolean;
  href?: string;
  projectId?: string;
};

export type PushAppNotificationInput = Omit<
  AppNotification,
  'id' | 'createdAt' | 'read'
> & {
  id?: string;
  createdAt?: number;
};

export const APP_NOTIFICATION_EVENT =
  'saolatek-notification-center-change';

const STORAGE_PREFIX =
  'saolatek_notification_center_v1';

const MAX_NOTIFICATIONS = 50;

const normalizeUserId = (
  userId?: string | null,
) =>
  userId?.trim() || 'anonymous';

const getStorageKey = (
  userId?: string | null,
) =>
  `${STORAGE_PREFIX}:${normalizeUserId(userId)}`;

const isNotification = (
  value: unknown,
): value is AppNotification => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item =
    value as Partial<AppNotification>;

  return (
    typeof item.id === 'string' &&
    typeof item.title === 'string' &&
    typeof item.message === 'string' &&
    typeof item.createdAt === 'number' &&
    typeof item.read === 'boolean' &&
    (
      item.level === 'info' ||
      item.level === 'success' ||
      item.level === 'warning' ||
      item.level === 'error'
    ) &&
    (
      item.source === 'project' ||
      item.source === 'pipeline' ||
      item.source === 'system'
    )
  );
};

const emitChange = (
  userId?: string | null,
) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(APP_NOTIFICATION_EVENT, {
      detail: {
        userId: normalizeUserId(userId),
      },
    }),
  );
};

export const getAppNotifications = (
  userId?: string | null,
): AppNotification[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(
      getStorageKey(userId),
    );

    if (!raw) return [];

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(isNotification)
      .sort(
        (a, b) =>
          b.createdAt - a.createdAt,
      )
      .slice(0, MAX_NOTIFICATIONS);
  } catch {
    return [];
  }
};

const writeNotifications = (
  userId: string | null | undefined,
  notifications: AppNotification[],
) => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(
    getStorageKey(userId),
    JSON.stringify(
      notifications
        .sort(
          (a, b) =>
            b.createdAt -
            a.createdAt,
        )
        .slice(
          0,
          MAX_NOTIFICATIONS,
        ),
    ),
  );

  emitChange(userId);
};

export const pushAppNotification = (
  userId: string | null | undefined,
  input: PushAppNotificationInput,
) => {
  const createdAt =
    input.createdAt ?? Date.now();

  const id =
    input.id ??
    `${input.source}:${createdAt}:${Math.random()
      .toString(36)
      .slice(2, 9)}`;

  const nextItem: AppNotification = {
    ...input,
    id,
    createdAt,
    read: false,
  };

  const current =
    getAppNotifications(userId);

  const next = [
    nextItem,
    ...current.filter(
      item => item.id !== id,
    ),
  ];

  writeNotifications(
    userId,
    next,
  );

  return nextItem;
};

export const markAppNotificationRead = (
  userId: string | null | undefined,
  id: string,
) => {
  const next =
    getAppNotifications(userId).map(
      item =>
        item.id === id
          ? {
              ...item,
              read: true,
            }
          : item,
    );

  writeNotifications(
    userId,
    next,
  );
};

export const markAllAppNotificationsRead = (
  userId?: string | null,
) => {
  const next =
    getAppNotifications(userId).map(
      item => ({
        ...item,
        read: true,
      }),
    );

  writeNotifications(
    userId,
    next,
  );
};

export const removeAppNotification = (
  userId: string | null | undefined,
  id: string,
) => {
  const next =
    getAppNotifications(userId).filter(
      item => item.id !== id,
    );

  writeNotifications(
    userId,
    next,
  );
};

export const clearAppNotifications = (
  userId?: string | null,
) => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(
    getStorageKey(userId),
  );

  emitChange(userId);
};
