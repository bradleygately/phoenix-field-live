/** Local notifications for the leave-by clock, with an in-app banner fallback. */

export type NotifyPermission = "unsupported" | "default" | "granted" | "denied";

export function notifyPermission(): NotifyPermission {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission as NotifyPermission;
}

export async function requestNotifyPermission(): Promise<NotifyPermission> {
  if (notifyPermission() === "unsupported") return "unsupported";
  try {
    return (await Notification.requestPermission()) as NotifyPermission;
  } catch {
    return "denied";
  }
}

/** Fires through the service worker when possible so it survives a locked screen. */
export async function fireNotification(title: string, body: string, tag: string) {
  if (notifyPermission() !== "granted") return false;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg?.showNotification) {
      await reg.showNotification(title, { body, tag, icon: "/app-icon-192.png" });
      return true;
    }
    new Notification(title, { body, tag, icon: "/app-icon-192.png" });
    return true;
  } catch {
    return false;
  }
}

/** Short vibration so a pocketed phone still lands the cue. */
export function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}
