'use client';

import React, { useState, useEffect } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { Producto } from '../lib/supabase';

interface DeleteProductModalProps {
  isOpen: boolean;
  producto: Producto | null;
  productosDisponibles: Producto[];
  onClose: () => void;
  onConfirmDelete: (productoId: number | string) => Promise<void>;
}

export default function DeleteProductModal({
  isOpen,
  producto,
  productosDisponibles,
  onClose,
  onConfirmDelete,
}: DeleteProductModalProps) {
  const [selectedId, setSelectedId] = useState<string | number>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (producto) {
      setSelectedId(producto.id);
    } else if (productosDisponibles.length > 0) {
      setSelectedId(productosDisponibles[0].id);
    }
    setError(null);
    setIsDeleting(false);
  }, [producto, productosDisponibles, isOpen]);

  if (!isOpen) return null;

  const currentProducto =
    producto || productosDisponibles.find((p) => p.id === selectedId) || null;

  const handleDelete = async () => {
    if (!currentProducto) return;
    try {
      setIsDeleting(true);
      setError(null);
      await onConfirmDelete(currentProducto.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al eliminar el producto.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
    >
      <div className="relative w-[95%] sm:w-full max-w-md overflow-hidden rounded-xl border border-red-500/30 bg-slate-900 shadow-2xl text-slate-100 my-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-400 border border-red-500/30">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">Eliminar Perfil</h2>
              <p className="text-[11px] sm:text-xs text-slate-400">Confirmación de baja de inventario</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!producto && productosDisponibles.length > 0 && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Selecciona el perfil a dar de baja:
              </label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
              >
                {productosDisponibles.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900">
                    {p.codigo} - {p.descripcion} ({p.cantidad} u.)
                  </option>
                ))}
              </select>
            </div>
          )}

          {currentProducto ? (
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-blue-400">
                  {currentProducto.codigo}
                </span>
                <span className="text-[11px] text-slate-400">
                  Cantidad: <strong className="text-slate-200">{currentProducto.cantidad} u.</strong>
                </span>
              </div>
              <p className="text-xs font-medium text-slate-200 leading-snug">
                {currentProducto.descripcion}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400">No hay perfiles disponibles para eliminar.</p>
          )}

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-300 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
            <p>
              Esta acción eliminará el perfil del catálogo y de la base de datos de forma permanente.
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="w-full sm:w-auto min-h-[44px] flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || !currentProducto}
              className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-5 py-2 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              <span>{isDeleting ? 'Eliminando...' : 'Eliminar Perfil'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
