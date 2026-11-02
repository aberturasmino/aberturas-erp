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

  const SidebarContent = () => (
    <div className="flex h-full flex-col justify-between bg-slate-900 border-r border-slate-800 text-slate-100">
      <div>
        {/* Cabecera / Marca Industrial */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-black text-white text-base shadow-lg shadow-blue-900/30 border border-blue-400/30">
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

        {/* Sección de Navegación */}
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
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
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
                  <span>{item.name}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                      isSelected
                        ? 'bg-blue-700 text-blue-100'
                        : item.badge === 'Pronto'
                        ? 'bg-slate-800 text-slate-500'
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

      {/* Pie del Sidebar: Usuario & Sesión de 2h */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 mb-2 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-blue-400 border border-slate-700">
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
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/40 text-xs font-semibold transition-all"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Botón flotante móvil para abrir sidebar */}
      <div className="lg:hidden fixed top-3 left-3 z-40">
        <button
          type="button"
          onClick={() => setIsOpenMobile(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-200 shadow-md hover:bg-slate-800"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Sidebar Escritorio Persistente (Desktop) */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 z-30">
        <SidebarContent />
      </aside>

      {/* Sidebar Móvil (Drawer) */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsOpenMobile(false)}
          />
          <div className="relative flex flex-col w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setIsOpenMobile(false)}
              className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}
