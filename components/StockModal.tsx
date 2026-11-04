'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Minus,
  ArrowRight,
  Package,
  AlertTriangle,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { Producto } from '../lib/supabase';

interface StockModalProps {
  isOpen: boolean;
  producto: Producto | null;
  onClose: () => void;
  onConfirm: (
    productoId: number | string,
    nuevoStock: number,
    cantidad: number,
    operacion: 'sumar' | 'restar',
    nuevoPrecioVenta?: number
  ) => Promise<void>;
}

export default function StockModal({
  isOpen,
  producto,
  onClose,
  onConfirm,
}: StockModalProps) {
  const [operacion, setOperacion] = useState<'sumar' | 'restar'>('sumar');
  const [cantidad, setCantidad] = useState<number>(1);
  const [precioVenta, setPrecioVenta] = useState<number | ''>(0);
  const [motivo, setMotivo] = useState<string>('Remito de proveedor');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && producto) {
      setOperacion('sumar');
      setCantidad(1);
      setPrecioVenta(producto.precio_venta ?? 0);
      setMotivo('Remito de proveedor');
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen, producto]);

  if (!isOpen || !producto) return null;

  const stockActual = producto.cantidad;
  const nuevoStockCalculado =
    operacion === 'sumar' ? stockActual + cantidad : stockActual - cantidad;

  const esStockNegativo = nuevoStockCalculado < 0;

  const handleCantidadChange = (val: number) => {
    const parsed = isNaN(val) ? 0 : Math.max(0, val);
    setCantidad(parsed);
    if (operacion === 'restar' && parsed > stockActual) {
      setErrorMessage('Atención: La salida supera la cantidad disponible en depósito.');
    } else {
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cantidad <= 0) {
      setErrorMessage('Por favor ingresa una cantidad mayor a 0.');
      return;
    }

    if (esStockNegativo) {
      setErrorMessage('No es posible dejar el stock con saldo negativo.');
      return;
    }

    const valorPrecio = precioVenta === '' ? 0 : Number(precioVenta);
    if (valorPrecio < 0) {
      setErrorMessage('El precio de venta no puede ser negativo.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onConfirm(producto.id, nuevoStockCalculado, cantidad, operacion, valorPrecio);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al actualizar el stock en Supabase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-stock-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      {/* Contenedor Modal: 95% en celulares, max-w-lg en tablets y notebooks */}
      <div className="relative w-[95%] sm:w-full max-w-lg overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl text-slate-100 my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Encabezado Industrial con padding responsive */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Package className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 id="modal-stock-title" className="text-sm sm:text-base font-bold tracking-tight text-white truncate">
                Ajuste de Stock y Precio
              </h2>
              <span className="font-mono text-[11px] sm:text-xs font-semibold text-blue-400 truncate block">
                {producto.codigo}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulario con paddings y espaciados mobile-first */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Ficha técnica del perfil */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
              Descripción del Perfil
            </span>
            <p className="text-xs font-semibold text-slate-200 leading-snug">
              {producto.descripcion}
            </p>
          </div>

          {/* Grilla dinámica: Tipo de Movimiento (1 columna en móvil muy angosto, 2 en pantallas medianas) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Tipo de Movimiento
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setOperacion('sumar');
                  setMotivo('Remito de proveedor');
                  setErrorMessage(null);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 min-h-[44px] rounded-md text-xs font-bold transition-all active:scale-[0.98] ${
                  operacion === 'sumar'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span>Sumar Entrada (+)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setOperacion('restar');
                  setMotivo('Consumo de taller / Despacho');
                  if (cantidad > stockActual) {
                    setErrorMessage('Atención: La salida supera la cantidad disponible.');
                  }
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 min-h-[44px] rounded-md text-xs font-bold transition-all active:scale-[0.98] ${
                  operacion === 'restar'
                    ? 'bg-slate-700 text-amber-300 border border-amber-500/40 shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Minus className="h-4 w-4 shrink-0" />
                <span>Restar Salida (-)</span>
              </button>
            </div>
          </div>

          {/* Selector de Cantidad con botones táctiles de 44px */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="input-cantidad" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Cantidad a {operacion === 'sumar' ? 'Ingresar' : 'Retirar'}
              </label>
              <span className="text-xs text-slate-400 font-mono">
                Stock actual: <strong className="text-slate-200">{stockActual} u.</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => handleCantidadChange(Math.max(1, cantidad - 1))}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 active:bg-slate-600 transition-colors"
                aria-label="Restar una unidad"
              >
                <Minus className="h-4 w-4" />
              </button>

              <input
                id="input-cantidad"
                type="number"
                min="1"
                value={cantidad === 0 ? '' : cantidad}
                onChange={(e) => handleCantidadChange(parseInt(e.target.value) || 0)}
                className="w-full min-h-[44px] text-center rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xl font-bold text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 tabular-nums"
                required
              />

              <button
                type="button"
                onClick={() => handleCantidadChange(cantidad + 1)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 active:bg-slate-600 transition-colors"
                aria-label="Sumar una unidad"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Accesos rápidos con touch targets optimizados */}
            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-500 font-medium mr-1">Rápidos:</span>
              {[1, 5, 10, 20, 50].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleCantidadChange(preset)}
                  className={`min-h-[36px] px-3 py-1 text-xs font-mono font-bold rounded-lg border transition-colors ${
                    cantidad === preset
                      ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  +{preset}
                </button>
              ))}
            </div>
          </div>

          {/* Grilla dinámica: Precio Venta y Motivo (1 columna en móvil, 2 en tablet/desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Campo Precio de Venta */}
            <div>
              <label htmlFor="input-precio-venta" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Precio Venta (ARS)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono font-bold text-slate-500">
                  $
                </span>
                <input
                  id="input-precio-venta"
                  type="number"
                  min="0"
                  step="0.01"
                  value={precioVenta === '' ? '' : precioVenta}
                  onChange={(e) => setPrecioVenta(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="0.00"
                  className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-slate-950 pl-8 pr-3 py-2 font-mono text-sm font-bold text-emerald-400 placeholder-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Motivo o Remito */}
            <div>
              <label htmlFor="input-motivo" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Remito / Motivo
              </label>
              <input
                id="input-motivo"
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej. Remito #4892 Aluar..."
                className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Panel de Cálculo de Balance (adaptado a pantallas angostas) */}
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 sm:p-3.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
              <span>Balance de Perfiles</span>
              <span className="font-mono text-blue-400 font-bold uppercase">
                {operacion === 'sumar' ? '+ Entrada' : '- Salida'}
              </span>
            </div>

            <div className="grid grid-cols-3 sm:flex sm:items-center justify-between gap-2 font-mono text-center">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Actual</span>
                <span className="text-sm sm:text-base font-bold text-slate-300 tabular-nums">
                  {stockActual} u.
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Variación</span>
                <span
                  className={`text-sm sm:text-base font-bold tabular-nums ${
                    operacion === 'sumar' ? 'text-blue-400' : 'text-amber-400'
                  }`}
                >
                  {operacion === 'sumar' ? `+${cantidad}` : `-${cantidad}`}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Resultante</span>
                <span
                  className={`text-base sm:text-lg font-black tabular-nums ${
                    esStockNegativo
                      ? 'text-red-400'
                      : nuevoStockCalculado <= 5
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {nuevoStockCalculado} u.
                </span>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
              <p>{errorMessage}</p>
            </div>
          )}

          {/* Botones de Acción con altura mínima de 44px */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5 sm:gap-3 pt-2.5 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto min-h-[44px] flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || esStockNegativo || cantidad <= 0}
              className={`w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-xs font-bold text-white shadow-lg transition-all active:scale-[0.98] ${
                isSubmitting || esStockNegativo || cantidad <= 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/40'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Confirmar ({nuevoStockCalculado} u.)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
