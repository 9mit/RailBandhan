"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // In development mode, unregister any active service worker and purge all caches
    // to prevent hydration mismatches and stale chunks during Fast Refresh.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          if (registration.active?.scriptURL.endsWith("/sw.js"))
            registration.unregister();
        }
      });
      if (window.caches) {
        caches.keys().then((keys) => {
          for (const key of keys) {
            if (key.startsWith("railbandhan-")) caches.delete(key);
          }
        });
      }
      return;
    }

    // In production, register SW
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* registration optional */
    });
  }, []);

  return null;
}
