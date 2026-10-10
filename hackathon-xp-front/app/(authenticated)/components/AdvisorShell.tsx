"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from "motion/react";
import {
  BarChart3,
  Bell,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  Moon,
  Settings2,
  Sparkles,
  Sun,
  Users,
  X,
} from "lucide-react";
import { signOut } from "@/lib/mock-auth";

const settingsEvent = "xp-ui-settings-changed";
const subscribe = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener(settingsEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(settingsEvent, callback);
  };
};

function useStoredSetting(key: string, fallback: string) {
  return useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(key) ?? fallback,
    () => fallback,
  );
}

function saveSetting(key: string, value: string) {
  window.localStorage.setItem(key, value);
  window.dispatchEvent(new Event(settingsEvent));
}

const navigation = [
  { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/conexoes", label: "Conexões", icon: Link2 },
  { href: "/oportunidades", label: "Oportunidades", icon: Sparkles, count: 12 },
];

export function AdvisorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const theme = useStoredSetting("xp-theme", "light");
  const iconMode = useStoredSetting("xp-icon-mode", "animated");
  const dynamicSidebar = useStoredSetting("xp-dynamic-sidebar", "off") === "on";
  const [manuallyCollapsed, setManuallyCollapsed] = useState(false);
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    },
    [],
  );

  const compact = (dynamicSidebar || manuallyCollapsed) && !hoverExpanded && !mobileOpen;
  const activeRoute = navigation.find(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
  );
  const pageTitle = pathname.startsWith("/clientes/") ? "Perfil do cliente" : activeRoute?.label;

  function handleLogout() {
    signOut();
    router.replace("/");
    router.refresh();
  }

  function handleSidebarEnter() {
    if (!dynamicSidebar || window.innerWidth <= 700) return;
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setHoverExpanded(true), 600);
  }

  function handleSidebarLeave() {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    if (dynamicSidebar) setHoverExpanded(false);
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className={`app-shell ${compact ? "shell-compact" : ""}`} data-theme={theme}>
        {mobileOpen && (
          <button
            className="mobile-scrim"
            aria-label="Fechar menu"
            onClick={() => setMobileOpen(false)}
          />
        )}
        <aside
          className={`sidebar ${compact ? "sidebar-collapsed" : ""} ${mobileOpen ? "is-open" : ""}`}
          onMouseEnter={handleSidebarEnter}
          onMouseLeave={handleSidebarLeave}
          onPointerDownCapture={() => {
            if (hoverTimer.current) clearTimeout(hoverTimer.current);
          }}
        >
          <div className="sidebar-top">
            <Link href="/dashboard" className="brand" aria-label="XP Open Finance, visão geral">
              <span className="brand-mark">
                <Image src="/xp-logo.svg" alt="XP Investimentos" width={31} height={31} />
              </span>
              {!compact && (
                <span className="brand-copy">
                  <strong>XP</strong>
                  <small>OPEN FINANCE</small>
                </span>
              )}
            </Link>
            <button
              className="sidebar-close"
              aria-label="Fechar menu"
              onClick={() => setMobileOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          <div className="workspace-label" title={compact ? "Área do assessor" : undefined}>
            <span className="workspace-icon">
              <BarChart3 size={17} />
            </span>
            {!compact && (
              <span>
                Área do assessor<small>Hackathon XP</small>
              </span>
            )}
          </div>

          <div className="nav-caption">MENU PRINCIPAL</div>
          <nav aria-label="Navegação principal">
            {navigation.map(({ href, label, icon: Icon, count }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`nav-item ${active ? "active" : ""}`}
                  aria-current={active ? "page" : undefined}
                  aria-label={compact ? label : undefined}
                  title={compact ? label : undefined}
                  onClick={() => setMobileOpen(false)}
                >
                  <motion.span
                    className="nav-icon"
                    animate={
                      iconMode === "animated" && active && !reduceMotion
                        ? { rotate: [0, -10, 0], scale: [1, 1.12, 1] }
                        : { rotate: 0, scale: 1 }
                    }
                    whileHover={
                      iconMode === "animated" && !reduceMotion
                        ? { rotate: -12, scale: 1.16 }
                        : undefined
                    }
                    transition={{ duration: 0.3 }}
                  >
                    <Icon size={19} strokeWidth={1.9} />
                  </motion.span>
                  {!compact && <span>{label}</span>}
                  {!compact && count && <em>{count}</em>}
                </Link>
              );
            })}
          </nav>

          <div className="sidebar-spacer" />
          <div className="sidebar-controls">
            <button
              className="nav-item sidebar-control"
              title={theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"}
              onClick={() => saveSetting("xp-theme", theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
              {!compact && <span>{theme === "light" ? "Modo escuro" : "Modo claro"}</span>}
            </button>
            <button
              className="nav-item sidebar-control"
              title="Configurações da sidebar"
              aria-expanded={settingsOpen}
              onClick={() => setSettingsOpen((open) => !open)}
            >
              <Settings2 size={19} />
              {!compact && <span>Configurações</span>}
            </button>
            <AnimatePresence>
              {settingsOpen && (
                <motion.div
                  className="sidebar-settings"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="sidebar-settings-head">
                    <strong>Preferências</strong>
                    <button
                      aria-label="Fechar configurações"
                      onClick={() => setSettingsOpen(false)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <button
                    className="setting-row"
                    aria-pressed={iconMode === "animated"}
                    onClick={() =>
                      saveSetting("xp-icon-mode", iconMode === "animated" ? "static" : "animated")
                    }
                  >
                    <span>
                      Ícones animados<small>Animação ao passar o mouse</small>
                    </span>
                    <span className={`setting-switch ${iconMode === "animated" ? "on" : ""}`} />
                  </button>
                  <button
                    className="setting-row"
                    aria-pressed={dynamicSidebar}
                    onClick={() => {
                      saveSetting("xp-dynamic-sidebar", dynamicSidebar ? "off" : "on");
                      setHoverExpanded(false);
                    }}
                  >
                    <span>
                      Sidebar dinâmica<small>Expandir ao passar o mouse</small>
                    </span>
                    <span className={`setting-switch ${dynamicSidebar ? "on" : ""}`} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="sidebar-bottom">
            <span className="advisor-avatar">AC</span>
            {!compact && (
              <span>
                <strong>Ana Carvalho</strong>
                <small>Assessor de investimentos</small>
              </span>
            )}
            <button
              className="logout-button"
              type="button"
              aria-label="Sair da conta"
              title="Sair da conta"
              onClick={handleLogout}
            >
              <LogOut size={18} />
            </button>
          </div>
          {!dynamicSidebar && (
            <button
              className="sidebar-collapse-button"
              aria-label={manuallyCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
              title={manuallyCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
              onClick={() => setManuallyCollapsed((value) => !value)}
            >
              {manuallyCollapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
            </button>
          )}
        </aside>

        <main className="main-area">
          <header className="topbar">
            <div className="topbar-left">
              <button
                className="mobile-menu icon-button"
                aria-label="Abrir menu"
                onClick={() => setMobileOpen(true)}
              >
                <Menu size={21} />
              </button>
              <Image
                className="mobile-logo"
                src="/xp-logo.svg"
                alt="XP Investimentos"
                width={24}
                height={24}
              />
              <span className="breadcrumb">Plataforma</span>
              <ChevronRight size={15} className="breadcrumb-arrow" />
              <strong>{pageTitle}</strong>
            </div>
            <div className="topbar-right">
              <button
                className="icon-button notification-button"
                aria-label="Notificações"
                onClick={() => setNotice("Nenhuma nova notificação.")}
              >
                <Bell size={19} />
              </button>
              <span className="topbar-avatar">AC</span>
            </div>
          </header>
          <AnimatePresence>
            {notice && (
              <motion.div
                className="notice"
                role="status"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <span>{notice}</span>
                <button onClick={() => setNotice("")} aria-label="Fechar aviso">
                  <X size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </MotionConfig>
  );
}
