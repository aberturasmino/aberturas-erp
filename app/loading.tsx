import React from 'react';

interface LoadingProps {
  titulo?: string;
  subtitulo?: string;
}

export default function Loading({
  titulo = 'Iniciando Plataforma de Depósito',
  subtitulo = 'Conectando con Supabase y calculando balance de stock...',
}: LoadingProps) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 select-none">
      <div className="relative flex flex-col items-center max-w-sm w-full text-center">
        {/* Glow de fondo azul acero */}
        <div className="absolute -top-12 h-44 w-44 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />

        {/* Emblema Industrial AM con anillo giratorio animado */}
        <div className="relative mb-6">
          <div className="absolute -inset-2.5 rounded-2xl border-2 border-dashed border-blue-500/40 animate-[spin_1.3s_linear_infinite]" />
          
          <div className="relative flex h-20 w-20 items-center justify-center rounded-xl bg-slate-900 border-2 border-blue-500/50 shadow-2xl shadow-blue-950/70">
            <span className="text-3xl font-black tracking-widest text-white drop-shadow">
              AM
            </span>
          </div>

          {/* Micro led de actividad técnica */}
          <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-blue-500 border-2 border-slate-950 shadow-sm shadow-blue-400" />
        </div>

        {/* Textos de Marca y Sistema */}
        <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-blue-400">
          Aberturas Miño · ERP Mayorista
        </p>
        <h2 className="text-lg font-extrabold text-white tracking-tight mt-1">
          {titulo}
        </h2>

        {/* Barra de progreso de escaneo industrial */}
        <div className="w-full mt-6 space-y-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-900 border border-slate-800">
            <div className="h-full bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-400 rounded-full animate-[progress_1.3s_ease-in-out_infinite]" />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
            <span>SISTEMA: EN LÍNEA</span>
            <span className="text-slate-400">SINCRONIZANDO</span>
            <span>DEPÓSITO: 01</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-4">
          {subtitulo}
        </p>
      </div>
    </div>
  );
}
