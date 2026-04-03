"use client";

import { useState, useEffect } from "react";

export function useOffline(): boolean {
  const [offline, setOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );

  useEffect(() => {
    function onOnline() { setOffline(false); }
    function onOffline() { setOffline(true); }

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return offline;
}
