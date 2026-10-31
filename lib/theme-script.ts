/**
 * Runs before the first paint. The system theme is handled by CSS alone; this
 * only applies a choice the visitor saved with the theme toggle.
 */
export const themeScript = `(() => {
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") document.documentElement.dataset.theme = saved;
  } catch {}
})();`;
