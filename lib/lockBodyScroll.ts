"use client";

import { useEffect } from "react";

/** Stops the page behind a sheet from scrolling on iPhone / PWA. */
export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const y = window.scrollY;
    document.documentElement.classList.add("move-editor-open");
    document.body.classList.add("move-editor-open");
    document.body.style.top = `-${y}px`;
    return () => {
      document.documentElement.classList.remove("move-editor-open");
      document.body.classList.remove("move-editor-open");
      document.body.style.top = "";
      window.scrollTo(0, y);
    };
  }, [locked]);
}
