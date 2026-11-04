'use client';

import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Users,
  ClipboardList,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
  Building2,
  ExternalLink
} from 'lucide-react';
import { getSessionUser, logoutUser, UserSession } from '../lib/supabase';

interface SidebarProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
}

export default function Sidebar({ currentPath, onNavigate, onLogout }: SidebarProps) {
  const [activePath, setActivePath] = useState<string>(currentPath || '/');
  const [user, setUser] = useState<UserSession | null>(null);
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);

  useEffect(() => {
    if (currentPath) {
      setActivePath(currentPath);
    } else if (typeof window !== 'undefined') {
      setActivePath(window.location.pathname);
    }
    cargarUsuario();
  }, [currentPath]);

  // Prevenir scroll en el body cuando el menú móvil está abierto
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isOpenMobile) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, [isOpenMobile]);

  const cargarUsuario = async () => {
    const session = await getSessionUser();
    setUser(session);
  };

  const handleLinkClick = (e: React.MouseEvent, path: string) => {
    if (onNavigate) {
      e.preventDefault();
      setActivePath(path);
      onNavigate(path);
      setIsOpenMobile(false);
      if (typeof window !== 'undefined' && window.location.pathname !== path) {
        window.history.pushState({}, '', path);
      }
    } else {
      setIsOpenMobile(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    if (onLogout) {
      onLogout();
    } else if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const menuItems = [
    {
      name: 'Inventario',
      path: '/',
      icon: Boxes,
      badge: 'Stock & Precios',
    },
    {
      name: 'Clientes',
      path: '/clientes',
      icon: Users,
      badge: 'Maestro',
    },
    {
      name: 'Pedidos',
      path: '/pedidos',
      icon: ClipboardList,
      badge: 'Remitos',
      disabled: false,
    },
  ];

  // Contenido compartido del Sidebar (Mobile Drawer y Desktop Docked)
  const SidebarNavContent = () => (
    <div className="flex h-full flex-col justify-between bg-slate-900 border-r border-slate-800 text-slate-100 overflow-y-auto">
      <div>
        {/* Cabecera / Identidad Industrial */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-black text-white text-base shadow-lg shadow-blue-900/40 border border-blue-400/30">
              AM
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-sm tracking-tight text-white truncate">
                Aberturas Miño
              </span>
              <span className="font-mono text-[10px] text-blue-400 font-semibold uppercase tracking-wider">
                ERP Mayorista
              </span>
            </div>
          </div>

          {/* Botón de cierre visible únicamente en móvil dentro del drawer */}
          <button
            type="button"
            onClick={() => setIsOpenMobile(false)}
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Cerrar navegación"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Módulos de Navegación con touch targets mínimos de 44px */}
        <nav className="p-3 space-y-1.5" aria-label="Navegación principal">
          <div className="px-3 py-2 text-[10px] font-mono font-semibold uppercase tracking-widest text-slate-500">
            Módulos Principales
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isSelected =
              activePath === item.path ||
              (item.path !== '/' && activePath.startsWith(item.path));

            return (
              <a
                key={item.name}
                href={item.path}
                onClick={(e) => handleLinkClick(e, item.path)}
                className={`group flex items-center justify-between px-3.5 py-3 md:py-2.5 min-h-[44px] rounded-lg text-xs font-semibold transition-all active:scale-[0.99] ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      isSelected ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                    }`}
                  />
                  <span className="truncate">{item.name}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                      isSelected
                        ? 'bg-blue-700 text-blue-100'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                  <ChevronRight
                    className={`h-3 w-3 transition-transform ${
                      isSelected ? 'text-white' : 'text-slate-600 group-hover:translate-x-0.5'
                    }`}
                  />
                </div>
              </a>
            );
          })}
        </nav>
      </div>

      {/* Pie del Sidebar: Usuario & Cierre de Sesión */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50">
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 mb-2 space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-blue-400 border border-slate-700 shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-slate-200 truncate">
                {user?.email || 'Operador de Depósito'}
              </span>
              <span className="text-[9px] font-mono text-emerald-400">
                ● Sesión activa (2h)
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 min-h-[44px] rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/40 text-xs font-semibold transition-all active:scale-[0.98]"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. BARRA SUPERIOR MÓVIL (Mobile-First: visible solo en < md) */}
      <header className="md:hidden sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsOpenMobile(true)}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 active:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            aria-label="Abrir menú de navegación"
            aria-expanded={isOpenMobile}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-black text-white text-xs border border-blue-400/30">
              AM
            </div>
            <span className="font-bold text-sm text-white tracking-tight">
              Aberturas Miño
            </span>
          </div>
        </div>

        <span className="text-[10px] font-mono text-blue-400 font-bold px-2 py-1 rounded bg-blue-950/80 border border-blue-800/80 uppercase">
          {activePath === '/clientes'
            ? 'Clientes'
            : activePath === '/pedidos'
            ? 'Pedidos'
            : 'Inventario'}
        </span>
      </header>

      {/* 2. SIDEBAR ESCRITORIO ANCLADO Y FIJO (Desktop: visible a partir de md:) */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 z-30">
        <SidebarNavContent />
      </aside>

      {/* 3. SIDEBAR MÓVIL EN DRAWER CON OVERLAY (Mobile-First: < md:) */}
      {isOpenMobile && (
        <div
          role="dialog"
          aria-modal="true"
          className="md:hidden fixed inset-0 z-50 flex"
        >
          {/* Backdrop con desenfoque suave */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpenMobile(false)}
            aria-hidden="true"
          />

          {/* Panel Deslizante Drawer */}
          <div className="relative flex flex-col w-[85%] max-w-xs h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <SidebarNavContent />
          </div>
        </div>
      )}
    </>
  );
}
