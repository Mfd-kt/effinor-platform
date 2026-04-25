"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const SIDEBAR_COLLAPSED_COOKIE = "sidebar-collapsed";
const COMMAND_OPEN_EVENT = "erp:command-palette:toggle";

type SidebarContextValue = {
  collapsed: boolean;
  setCollapsed: (next: boolean) => void;
  toggleCollapsed: () => void;
  mobileOpen: boolean;
  setMobileOpen: (next: boolean) => void;
  toggleMobile: () => void;
  /** Demande l'ouverture / fermeture de la command palette globale. */
  openCommandPalette: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

/** Override local : force `collapsed=false` (drawer mobile) sans casser le state global. */
const ForceExpandedContext = createContext<boolean>(false);

export function SidebarForceExpanded({ children }: { children: ReactNode }) {
  return <ForceExpandedContext.Provider value={true}>{children}</ForceExpandedContext.Provider>;
}

function writeCollapsedCookie(value: boolean) {
  if (typeof document === "undefined") return;
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${SIDEBAR_COLLAPSED_COOKIE}=${value ? "1" : "0"}; Path=/; Max-Age=${oneYear}; SameSite=Lax`;
}

type SidebarProviderProps = {
  initialCollapsed: boolean;
  children: ReactNode;
};

export function SidebarProvider({ initialCollapsed, children }: SidebarProviderProps) {
  const [collapsed, setCollapsedState] = useState(initialCollapsed);
  const [mobileOpen, setMobileOpenState] = useState(false);

  const setCollapsed = useCallback((next: boolean) => {
    setCollapsedState(next);
    writeCollapsedCookie(next);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsedState((prev) => {
      const next = !prev;
      writeCollapsedCookie(next);
      return next;
    });
  }, []);

  const setMobileOpen = useCallback((next: boolean) => {
    setMobileOpenState(next);
  }, []);

  const toggleMobile = useCallback(() => {
    setMobileOpenState((prev) => !prev);
  }, []);

  const openCommandPalette = useCallback(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(COMMAND_OPEN_EVENT));
  }, []);

  /** ⌘B / Ctrl+B : toggle sidebar (sauf inputs). */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const inField =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (inField) return;
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      if (e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleCollapsed();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleCollapsed]);

  const value = useMemo<SidebarContextValue>(
    () => ({
      collapsed,
      setCollapsed,
      toggleCollapsed,
      mobileOpen,
      setMobileOpen,
      toggleMobile,
      openCommandPalette,
    }),
    [collapsed, setCollapsed, toggleCollapsed, mobileOpen, setMobileOpen, toggleMobile, openCommandPalette],
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  const forceExpanded = useContext(ForceExpandedContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within <SidebarProvider>");
  }
  if (forceExpanded && ctx.collapsed) {
    return { ...ctx, collapsed: false };
  }
  return ctx;
}

export const SIDEBAR_COOKIE_NAME = SIDEBAR_COLLAPSED_COOKIE;
export const COMMAND_PALETTE_EVENT = COMMAND_OPEN_EVENT;
