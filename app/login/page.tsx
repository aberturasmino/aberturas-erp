'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, AlertTriangle, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { loginUser, isSupabaseConfigured } from '../../lib/supabase';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState<string>('admin@aberturasmino.com');
  const [password, setPassword] = useState<string>('admin123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expiredNotice, setExpiredNotice] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  // Detectar si la sesión se cerró por seguridad
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const wasExpired = sessionStorage.getItem('aberturas_session_expired');
      const urlParams = new URLSearchParams(window.location.search);
      if (wasExpired === 'true' || urlParams.get('expired') === 'true') {
        setExpiredNotice(true);
        sessionStorage.removeItem('aberturas_session_expired');
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setExpiredNotice(false);
    setIsLoading(true);

    try {
      // Tiempo de carga calibrado a exactamente 1,3 segundos
      const [result] = await Promise.all([
        loginUser(email, password),
        new Promise((resolve) => setTimeout(resolve, 1300)),
      ]);

      if (!result.success) {
        setErrorMessage(result.error || 'Credenciales inválidas. Verifica tu correo y contraseña.');
        setIsLoading(false);
        return;
      }

      setSuccess(true);

      if (onLoginSuccess) {
        onLoginSuccess();
      } else if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error de autenticación con Supabase.');
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('deposito@aberturasmino.com');
    setPassword('mino2026');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-blue-600 selection:text-white">
      {/* Contenedor Glow de Ambiente Industrial */}
      <div className="relative w-full max-w-md">
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl text-slate-100 backdrop-blur-sm">
          {/* Encabezado Industrial con Emblema AM */}
          <div className="border-b border-slate-800 bg-slate-950/90 px-8 pt-8 pb-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-2xl tracking-widest shadow-lg shadow-blue-900/50 border border-blue-400/40">
              AM
            </div>
            <p className="mt-4 text-[11px] font-mono font-bold uppercase tracking-widest text-blue-400">
              Control de Acceso Mayorista
            </p>
            <h1 className="mt-1 text-xl font-extrabold tracking-tight text-white">
              Aberturas Miño · ERP
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Gestión y control de inventario mayorista
            </p>
          </div>

          {/* Formulario de Login */}
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {/* Aviso discreto si la sesión finalizó por seguridad */}
            {expiredNotice && (
              <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300">
                <Clock className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Sesión finalizada</strong>
                  <span>Por razones de seguridad, tu sesión ha caducado. Por favor ingresa nuevamente.</span>
                </div>
              </div>
            )}

            {/* Mensaje de Error */}
            {errorMessage && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            )}

            {/* Mensaje de Éxito */}
            {success && (
              <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <p>Acceso verificado. Ingresando al depósito...</p>
              </div>
            )}

            {/* Campo Email */}
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operador@aberturasmino.com"
                  required
                  disabled={isLoading}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-60"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Contraseña
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  disabled={isLoading}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors font-mono disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Botón de Inicio de Sesión */}
            <button
              type="submit"
              disabled={isLoading || success}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-[0.99] py-3 px-4 text-xs font-bold text-white shadow-lg shadow-blue-900/40 transition-all disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Verificando credenciales...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Acceso Concedido</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Depósito</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Botón de prueba rápida (Demo) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleFillDemo}
                className="w-full text-center text-[11px] text-slate-400 hover:text-blue-400 transition-colors"
              >
                ¿Quieres probar rápido? <span className="underline">Cargar credenciales de prueba</span>
              </button>
            </div>
          </form>

          {/* Pie informativo limpio de seguridad */}
          <div className="border-t border-slate-800 bg-slate-950/60 px-8 py-3.5 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
              <span>Conexión Segura SSL</span>
            </span>
            <span className="font-mono">
              {isSupabaseConfigured ? 'PRODUCCIÓN' : 'DEMO ACTIVA'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
