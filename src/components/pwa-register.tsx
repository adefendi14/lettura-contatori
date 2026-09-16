"use client";

import { useEffect } from "react";
import { basePath, withBase } from "@/lib/site";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const scope = basePath ? `${basePath}/` : "/";
        await navigator.serviceWorker.register(withBase("/sw.js"), { scope });
      } catch (err) {
        console.warn("Registrazione service worker non riuscita:", err);
      }
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}
