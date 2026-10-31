"use client";

import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ label }: { label: string }) {
  function toggle() {
    const root = document.documentElement;
    const current =
      root.dataset.theme ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Private mode: the choice simply is not remembered.
    }
  }

  return (
    <button type="button" className="btn btn-tertiary btn-icon theme-toggle" aria-label={label} onClick={toggle}>
      <Sun className="icon-sun" aria-hidden />
      <Moon className="icon-moon" aria-hidden />
    </button>
  );
}
