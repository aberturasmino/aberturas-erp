'use client';

import React, { useState } from 'react';
import { X, Plus, AlertTriangle, Scale, Boxes } from 'lucide-react';
import { Producto, UnidadMedida } from '../lib/supabase';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (producto: Omit<Producto, 'id'>) => Promise<void>;
}

export default function AddProductModal({
  isOpen,
  onClose,
  onAdd,
}: AddProductModalProps) {
  const [codigo, setCodigo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [unidadMedida, setUnidadMedida] = useState<UnidadMedida>('UNIDADES');
  const [cantidad, setCantidad] = useState<number | ''>(10);
  const [precioVenta, setPrecioVenta] = useState<number | ''>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const esPorPeso = unidadMedida === 'KG';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!codigo.trim()) {
      setError('El CÓDIGO del perfil (ej. 6080.NEGRO o ALU-A30) es obligatorio.');
      return;
    }
    if (!descripcion.trim()) {
      setError('La DESCRIPCIÓN técnica del perfil es obligatoria.');
      return;
    }
    if (cantidad === '' || Number(cantidad) < 0) {
      setError(
        esPorPeso
          ? 'El STOCK EN KG debe ser un número mayor o igual a 0.'
          : 'La CANTIDAD debe ser un número entero mayor o igual a 0.'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await onAdd({
        codigo: codigo.trim().toUpperCase(),
        descripcion: descripcion.trim(),
        unidad_medida: unidadMedida,
        cantidad: esPorPeso
          ? Math.round(Number(cantidad) * 1000) / 1000
          : Math.round(Number(cantidad)),
        precio_venta: precioVenta === '' ? 0 : Number(precioVenta),
      });

      setCodigo('');
      setDescripcion('');
      setUnidadMedida('UNIDADES');
      setCantidad(10);
      setPrecioVenta(0);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al registrar el perfil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="relative w-[95%] sm:w-full max-w-lg overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl text-slate-100 my-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold tracking-tight text-white">
                Agregar Producto / Perfil
              </h2>
              <span className="text-[11px] sm:text-xs text-slate-400">
                Stock por Unidades o Kilogramos de Aluminio
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* UNIDAD DE MEDIDA */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Unidad de Medida *
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setUnidadMedida('UNIDADES');
                  if (cantidad !== '') setCantidad(Math.round(Number(cantidad)));
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 min-h-[44px] rounded-md text-xs font-bold transition-all ${
                  unidadMedida === 'UNIDADES'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Boxes className="h-4 w-4" />
                <span>Unidades (u.)</span>
              </button>
              <button
                type="button"
                onClick={() => setUnidadMedida('KG')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 min-h-[44px] rounded-md text-xs font-bold transition-all ${
                  unidadMedida === 'KG'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-900/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Scale className="h-4 w-4" />
                <span>Peso (KG)</span>
              </button>
            </div>
          </div>

          {/* CÓDIGO */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              CÓDIGO (Identificador y Color)
            </label>
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder={
                esPorPeso
                  ? 'Ej. ALU-A30, ALU-MODENA, ALU-RPT'
                  : 'Ej. 6080.NEGRO, 6070.BLANCO'
              }
              required
              className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* DESCRIPCIÓN */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              DESCRIPCIÓN (Nombre del perfil y especificaciones técnicas)
            </label>
            <textarea
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder={
                esPorPeso
                  ? 'Ej. Aluminio Línea A30 New - Extrusión por Kilo'
                  : 'Ej. JAMBA DE MARCO CORREDIZA DE 3 HOJAS Kg/T 11,08 Negro'
              }
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* CANTIDAD */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                {esPorPeso ? 'STOCK INICIAL (KG)' : 'CANTIDAD INICIAL (U.)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step={esPorPeso ? '0.01' : '1'}
                  value={cantidad}
                  onChange={(e) =>
                    setCantidad(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder={esPorPeso ? '150.50' : '10'}
                  required
                  className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-slate-950 px-3 pr-10 py-2 text-xs font-mono text-white focus:border-blue-500 focus:outline-none tabular-nums"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-slate-400">
                  {esPorPeso ? 'kg' : 'u.'}
                </span>
              </div>
            </div>

            {/* PRECIO VENTA */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                {esPorPeso ? 'PRECIO REF. / KG (ARS)' : 'PRECIO VENTA (ARS)'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={precioVenta === '' ? '' : precioVenta}
                  onChange={(e) =>
                    setPrecioVenta(
                      e.target.value === '' ? '' : parseFloat(e.target.value)
                    )
                  }
                  placeholder="0.00"
                  className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-slate-950 pl-7 pr-3 py-2 text-xs font-mono text-emerald-400 focus:border-blue-500 focus:outline-none tabular-nums"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto min-h-[44px] flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              <span>{isSubmitting ? 'Guardando...' : 'Guardar Producto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
