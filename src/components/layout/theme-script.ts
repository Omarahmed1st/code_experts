// Runs in <head> before first paint so an explicit theme choice never flashes.
// Keep it tiny and dependency-free. (Phase 7's Content-Security-Policy needs
// this script's hash: see docs/ARCHITECTURE.md, design system.)
export const THEME_STORAGE_KEY = "codelab-theme";

export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;
