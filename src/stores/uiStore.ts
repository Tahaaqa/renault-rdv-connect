import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppRole } from "@/types";

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  theme: "dark" | "light";
  setTheme: (t: "dark" | "light") => void;
  toggleTheme: () => void;
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  // DEV: override role to preview UIs
  devRoleOverride: AppRole | null;
  setDevRole: (r: AppRole | null) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      theme: "dark",
      setTheme: (t) => set({ theme: t }),
      toggleTheme: () => set({ theme: get().theme === "dark" ? "light" : "dark" }),
      paletteOpen: false,
      setPaletteOpen: (open) => set({ paletteOpen: open }),
      devRoleOverride: null,
      setDevRole: (r) => set({ devRoleOverride: r }),
    }),
    { name: "renault-ui" },
  ),
);
