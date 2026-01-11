/**
 * Notification service for PWA push notifications.
 */

/**
 * Check if notifications are supported and get permission status.
 */
export function getNotificationStatus():
  | "granted"
  | "denied"
  | "default"
  | "unsupported" {
  if (!("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

/**
 * Request notification permission from user.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("Notifications not supported");
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

/**
 * Show a notification to the user.
 */
export function showNotification(
  title: string,
  options?: NotificationOptions
): void {
  if (getNotificationStatus() !== "granted") {
    console.warn("Notification permission not granted");
    return;
  }

  new Notification(title, {
    icon: "/snowflake.svg",
    badge: "/snowflake.svg",
    ...options,
  });
}

/**
 * Schedule a notification for a specific time.
 * Uses setTimeout - for production, use service worker + Push API.
 */
export function scheduleNotification(
  title: string,
  scheduledTime: Date,
  options?: NotificationOptions
): number {
  const now = new Date();
  const delay = scheduledTime.getTime() - now.getTime();

  if (delay <= 0) {
    showNotification(title, options);
    return 0;
  }

  return window.setTimeout(() => {
    showNotification(title, options);
  }, delay);
}

/**
 * Cancel a scheduled notification.
 */
export function cancelScheduledNotification(timeoutId: number): void {
  window.clearTimeout(timeoutId);
}
