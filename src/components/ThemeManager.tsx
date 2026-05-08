import { useEffect } from "react";
import { useUIStore } from "@/stores/uiStore";

export function ThemeManager() {
  const theme = useUIStore((s) => s.theme);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(theme);
    root.style.colorScheme = theme;
  }, [theme]);
  return null;
}
