'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ArrowRight, Package, AlertTriangle, CheckCircle2, DollarSign } from 'lucide-react';
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
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl text-slate-100">
        {/* Encabezado Industrial */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 id="modal-title" className="text-base font-bold tracking-tight text-white">
                Ajuste de Stock y Precio
              </h2>
              <span className="font-mono text-xs font-semibold text-blue-400">{producto.codigo}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Ficha técnica del perfil (código y descripción estricta) */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3.5 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Descripción del Perfil
            </span>
            <p className="text-xs font-semibold text-slate-200 leading-snug">
              {producto.descripcion}
            </p>
          </div>

          {/* Selector de Operación (Sumar Entrada vs Restar Salida) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Tipo de Movimiento
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setOperacion('sumar');
                  setMotivo('Remito de proveedor');
                  setErrorMessage(null);
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold transition-all ${
                  operacion === 'sumar'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Plus className="h-4 w-4" />
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
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold transition-all ${
                  operacion === 'restar'
                    ? 'bg-slate-700 text-amber-300 border border-amber-500/30 shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Minus className="h-4 w-4" />
                <span>Restar Salida (-)</span>
              </button>
            </div>
          </div>

          {/* Selector y Campo de Cantidad */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="input-cantidad" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Cantidad a {operacion === 'sumar' ? 'Ingresar' : 'Retirar'}
              </label>
              <span className="text-xs text-slate-400 font-mono">
                Stock actual: <strong className="text-slate-200">{stockActual} u.</strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleCantidadChange(Math.max(1, cantidad - 1))}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:border-slate-600 transition-colors"
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
                className="w-full text-center rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 font-mono text-xl font-bold text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 tabular-nums"
                required
              />

              <button
                type="button"
                onClick={() => handleCantidadChange(cantidad + 1)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:border-slate-600 transition-colors"
                aria-label="Sumar una unidad"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Accesos rápidos */}
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-500 font-medium mr-1">Rápidos:</span>
              {[1, 5, 10, 20, 50].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleCantidadChange(preset)}
                  className={`px-2 py-0.5 text-xs font-mono rounded border transition-colors ${
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

          {/* Campo NUEVO: PRECIO VENTA (numeric) */}
          <div>
            <label htmlFor="input-precio-venta" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Precio Venta Mayorista (ARS)
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
                className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-8 pr-4 py-2 font-mono text-sm font-bold text-emerald-400 placeholder-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Actualiza el valor unitario de venta según remito o lista vigente.
            </span>
          </div>

          {/* Motivo o Número de Remito */}
          <div>
            <label htmlFor="input-motivo" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Nº de Remito o Motivo (Opcional)
            </label>
            <input
              id="input-motivo"
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej. Remito #4892 Aluar, Extrusión Lote 3..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Panel de Cálculo de Balance */}
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Balance de Perfiles</span>
              <span className="font-mono">{operacion === 'sumar' ? 'Entrada' : 'Salida'}</span>
            </div>
            <div className="flex items-center justify-between font-mono">
              <div className="text-center">
                <span className="text-[10px] text-slate-500 block uppercase">Stock Actual</span>
                <span className="text-base font-bold text-slate-300 tabular-nums">{stockActual}</span>
              </div>
              <div className="text-slate-600 font-bold text-sm">
                {operacion === 'sumar' ? '+' : '-'}
              </div>
              <div className="text-center">
                <span className="text-[10px] text-slate-500 block uppercase">Variación</span>
                <span className={`text-base font-bold tabular-nums ${operacion === 'sumar' ? 'text-blue-400' : 'text-amber-400'}`}>
                  {cantidad}
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-600" />
              <div className="text-center">
                <span className="text-[10px] text-slate-500 block uppercase">Stock Resultante</span>
                <span
                  className={`text-xl font-bold tabular-nums ${
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

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || esStockNegativo || cantidad <= 0}
              className={`flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-semibold text-white shadow-lg transition-all ${
                isSubmitting || esStockNegativo || cantidad <= 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-blue-600 hover:bg-blue-500 active:scale-[0.99] shadow-blue-900/30'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
