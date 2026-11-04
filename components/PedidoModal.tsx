'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Building2,
  Package,
  Layers,
  Receipt,
  FileDown
} from 'lucide-react';
import {
  Producto,
  Cliente,
  TipoPedido,
  NuevaLineaPedido,
  NuevoPedidoInput,
  Pedido,
  getClientes,
  getProductos
} from '../lib/supabase';
import { generateRemitoPDF } from '../utils/generatePDF';

interface PedidoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  onConfirmPedido: (input: NuevoPedidoInput) => Promise<Pedido | any>;
}

interface LineaFormState {
  id: string; // ID temporal para el formulario
  producto_id: number | string;
  cantidad: number;
  precio_unitario: number;
}

export default function PedidoModal({
  isOpen,
  onClose,
  onSuccess,
  onConfirmPedido,
}: PedidoModalProps) {
  const [tipo, setTipo] = useState<TipoPedido>('VENTA');
  const [clienteId, setClienteId] = useState<string>('');
  const [notas, setNotas] = useState<string>('');
  const [incluyeIva, setIncluyeIva] = useState<boolean>(true);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [lineas, setLineas] = useState<LineaFormState[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      cargarCatalogos();
      setTipo('VENTA');
      setNotas('');
      setIncluyeIva(true);
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const cargarCatalogos = async () => {
    setIsLoadingCatalog(true);
    try {
      const [cls, prods] = await Promise.all([getClientes(), getProductos()]);
      setClientes(cls);
      setProductos(prods);

      if (cls.length > 0) {
        setClienteId(String(cls[0].id));
      }

      // Iniciar con una primera línea si hay productos
      if (prods.length > 0) {
        setLineas([
          {
            id: 'linea-1',
            producto_id: prods[0].id,
            cantidad: 1,
            precio_unitario: prods[0].precio_venta || 0,
          },
        ]);
      } else {
        setLineas([]);
      }
    } catch (err: any) {
      setErrorMessage('Error al cargar catálogos para el pedido.');
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  if (!isOpen) return null;

  // Manejo de líneas dinámicas
  const handleAddLinea = () => {
    if (productos.length === 0) return;
    const primerProd = productos[0];
    const nueva: LineaFormState = {
      id: `linea-${Date.now()}-${Math.random()}`,
      producto_id: primerProd.id,
      cantidad: 1,
      precio_unitario: primerProd.precio_venta || 0,
    };
    setLineas((prev) => [...prev, nueva]);
  };

  const handleRemoveLinea = (id: string) => {
    if (lineas.length === 1) {
      setErrorMessage('El pedido debe conservar al menos un producto.');
      return;
    }
    setErrorMessage(null);
    setLineas((prev) => prev.filter((l) => l.id !== id));
  };

  const handleProductoChange = (lineaId: string, newProductoId: number | string) => {
    const prodSeleccionado = productos.find((p) => String(p.id) === String(newProductoId));
    setLineas((prev) =>
      prev.map((l) => {
        if (l.id === lineaId) {
          return {
            ...l,
            producto_id: newProductoId,
            precio_unitario: prodSeleccionado?.precio_venta || l.precio_unitario || 0,
          };
        }
        return l;
      })
    );
  };

  const handleCantidadChange = (lineaId: string, val: number) => {
    const parsed = isNaN(val) ? 0 : Math.max(1, val);
    setLineas((prev) =>
      prev.map((l) => (l.id === lineaId ? { ...l, cantidad: parsed } : l))
    );
  };

  const handlePrecioChange = (lineaId: string, val: number) => {
    const parsed = isNaN(val) ? 0 : Math.max(0, val);
    setLineas((prev) =>
      prev.map((l) => (l.id === lineaId ? { ...l, precio_unitario: parsed } : l))
    );
  };

  // Cálculos reactivos de subtotales, IVA y total final
  const lineasCalculadas = lineas.map((l) => {
    const productoObj = productos.find((p) => String(p.id) === String(l.producto_id));
    const subtotal = l.cantidad * l.precio_unitario;
    const stockDisponible = productoObj?.cantidad ?? 0;
    const excedeStock = tipo === 'VENTA' && l.cantidad > stockDisponible;

    return {
      ...l,
      productoObj,
      subtotal,
      stockDisponible,
      excedeStock,
    };
  });

  const subtotal = lineasCalculadas.reduce((acc, curr) => acc + curr.subtotal, 0);
  const montoIva = incluyeIva ? Math.round(subtotal * 0.21 * 100) / 100 : 0;
  const totalFinal = Math.round((subtotal + montoIva) * 100) / 100;
  const totalUnidades = lineasCalculadas.reduce((acc, curr) => acc + curr.cantidad, 0);
  const hayStockInsuficiente = lineasCalculadas.some((l) => l.excedeStock);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!clienteId) {
      setErrorMessage('Por favor selecciona un cliente para la operación.');
      return;
    }

    if (lineas.length === 0) {
      setErrorMessage('Agrega al menos una línea con producto y cantidad.');
      return;
    }

    if (hayStockInsuficiente && tipo === 'VENTA') {
      setErrorMessage(
        'Atención: Hay ítems donde la cantidad a vender supera el stock disponible en depósito.'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: NuevoPedidoInput = {
        cliente_id: clienteId,
        tipo,
        estado: 'COMPLETADO',
        subtotal,
        incluye_iva: incluyeIva,
        monto_iva: montoIva,
        total_pedido: totalFinal,
        notas: notas.trim(),
        lineas: lineas.map((l) => ({
          producto_id: l.producto_id,
          cantidad: l.cantidad,
          precio_unitario: l.precio_unitario,
        })),
      };

      // 1. Guardar en Base de Datos (Cabecera, Detalle y Ajuste de Stock)
      const pedidoCreado = await onConfirmPedido(payload);

      // 2. Descargar automáticamente el Remito oficial en PDF
      const clienteSeleccionado = clientes.find((c) => String(c.id) === String(clienteId));
      const lineasParaPdf = lineasCalculadas.map((l) => ({
        codigo: l.productoObj?.codigo,
        descripcion: l.productoObj?.descripcion,
        cantidad: l.cantidad,
        precio_unitario: l.precio_unitario,
        subtotal: l.subtotal,
      }));

      generateRemitoPDF({
        id: pedidoCreado?.id || Date.now(),
        tipo,
        estado: 'COMPLETADO',
        created_at: pedidoCreado?.created_at || new Date().toISOString(),
        notas: notas.trim(),
        subtotal,
        incluye_iva: incluyeIva,
        monto_iva: montoIva,
        total_pedido: totalFinal,
        cliente: clienteSeleccionado,
        detalles: lineasParaPdf,
      });

      await onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al procesar la transacción del pedido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="relative w-full max-w-3xl overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl text-slate-100 my-auto">
        {/* Cabecera Industrial */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold shadow-md ${
                tipo === 'VENTA'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">
                Nuevo Pedido ({tipo === 'VENTA' ? 'Orden de Venta' : 'Orden de Compra'})
              </h2>
              <span className="text-xs text-slate-400">
                Aberturas Miño · Emisión de remito y ajuste automático de depósito
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Selector de Tipo de Operación (VENTA vs COMPRA) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Tipo de Operación *
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setTipo('VENTA')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-bold transition-all ${
                    tipo === 'VENTA'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <TrendingDown className="h-4 w-4 text-blue-200" />
                  <span>Venta (Salida)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('COMPRA')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-bold transition-all ${
                    tipo === 'COMPRA'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <TrendingUp className="h-4 w-4 text-emerald-200" />
                  <span>Compra (Ingreso)</span>
                </button>
              </div>
            </div>

            {/* Selector de Cliente / Proveedor */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                {tipo === 'VENTA' ? 'Cliente Destino *' : 'Proveedor / Origen *'}
              </label>
              <div className="relative">
                <select
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                >
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.razon_social} ({c.cuit}) - {c.condicion_iva}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* LÍNEAS DINÁMICAS DE PRODUCTOS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Líneas de Perfiles y Cantidades
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddLinea}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-300 hover:bg-blue-600 hover:text-white text-xs font-semibold transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Agregar Perfil</span>
              </button>
            </div>

            {lineasCalculadas.length === 0 ? (
              <div className="p-6 text-center rounded-lg border border-dashed border-slate-800 bg-slate-950/40 text-slate-500 text-xs">
                No hay productos cargados en este pedido. Presiona "Agregar Perfil".
              </div>
            ) : (
              <div className="space-y-2.5">
                {lineasCalculadas.map((linea, index) => (
                  <div
                    key={linea.id}
                    className="p-3 rounded-lg border border-slate-800 bg-slate-950/70 space-y-2 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      {/* 1. Selector de Producto */}
                      <div className="flex-1 min-w-0">
                        <label className="block text-[10px] font-mono text-slate-400 uppercase mb-0.5">
                          #{index + 1} Perfil / Código
                        </label>
                        <select
                          value={linea.producto_id}
                          onChange={(e) => handleProductoChange(linea.id, e.target.value)}
                          className="w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                        >
                          {productos.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.codigo} - {p.descripcion} (Stock: {p.cantidad} u.)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 2. Cantidad */}
                      <div className="w-24 shrink-0">
                        <label className="block text-[10px] font-mono text-slate-400 uppercase mb-0.5">
                          Cantidad
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={linea.cantidad}
                          onChange={(e) => handleCantidadChange(linea.id, parseInt(e.target.value))}
                          className="w-full text-center rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs font-mono font-bold text-white focus:border-blue-500 focus:outline-none tabular-nums"
                        />
                      </div>

                      {/* 3. Precio Unitario */}
                      <div className="w-32 shrink-0">
                        <label className="block text-[10px] font-mono text-slate-400 uppercase mb-0.5">
                          Precio Unit. (ARS)
                        </label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-mono text-slate-500">
                            $
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={linea.precio_unitario}
                            onChange={(e) => handlePrecioChange(linea.id, parseFloat(e.target.value))}
                            className="w-full rounded-md border border-slate-700 bg-slate-900 pl-5 pr-2 py-1.5 text-xs font-mono text-emerald-400 font-bold focus:border-blue-500 focus:outline-none tabular-nums"
                          />
                        </div>
                      </div>

                      {/* 4. Subtotal y Eliminar */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-36 shrink-0 pt-1 sm:pt-4">
                        <div className="text-right">
                          <span className="text-[10px] font-mono text-slate-500 block uppercase sm:hidden">
                            Subtotal
                          </span>
                          <span className="text-xs font-mono font-bold text-white tabular-nums">
                            $ {linea.subtotal.toLocaleString('es-AR')}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveLinea(linea.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                          title="Quitar ítem"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Alerta de Stock si es Venta */}
                    {linea.excedeStock && (
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-medium bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <span>
                          Stock insuficiente: Solicitadas {linea.cantidad} u., pero solo hay{' '}
                          <strong>{linea.stockDisponible} u.</strong> disponibles.
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Observaciones o Notas */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Observaciones / Nº de Remito / Flete
            </label>
            <input
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej. Remito #4812, Retira por depósito de Quilmes, Pago 30 días..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* INTERRUPTOR DE IVA (21%) */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/80">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg border transition-colors ${
                  incluyeIva
                    ? 'bg-blue-600/20 border-blue-500/30 text-blue-400'
                    : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}
              >
                <Receipt className="h-4 w-4" />
              </div>
              <div>
                <label
                  htmlFor="toggle-iva"
                  className="text-xs font-bold text-slate-200 block cursor-pointer"
                >
                  ¿Incluir IVA (21%)?
                </label>
                <span className="text-[11px] text-slate-400">
                  {incluyeIva
                    ? 'Aplica 21% de alícuota sobre el subtotal discriminado'
                    : 'Operación sin IVA discriminado / Precio final directo'}
                </span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="toggle-iva"
                type="checkbox"
                checked={incluyeIva}
                onChange={(e) => setIncluyeIva(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Panel de Resumen y Desglose Financiero */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 uppercase tracking-wider block">
                  Resumen de la Transacción
                </span>
                <span className="text-xs text-slate-300">
                  {lineasCalculadas.length} ítems · Total de{' '}
                  <strong className="text-white">{totalUnidades} barras/unidades</strong>
                </span>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-sans pt-1">
                  <FileDown className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Al confirmar se descargará automáticamente el <strong>Remito en PDF</strong> con
                    el desglose completo.
                  </span>
                </div>
              </div>

              {/* Liquidación: Subtotal, IVA 21% y Total Final */}
              <div className="text-right border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-6 space-y-1 min-w-[200px]">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>SUBTOTAL:</span>
                  <span className="font-bold text-slate-200 tabular-nums">
                    $ {subtotal.toLocaleString('es-AR')}
                  </span>
                </div>

                {incluyeIva && (
                  <div className="flex items-center justify-between text-xs text-blue-400">
                    <span>IVA (21%):</span>
                    <span className="font-bold tabular-nums">
                      +$ {montoIva.toLocaleString('es-AR')}
                    </span>
                  </div>
                )}

                <div className="border-t border-slate-800 pt-1.5 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 uppercase tracking-widest">
                    TOTAL FINAL:
                  </span>
                  <span className="text-2xl font-black text-emerald-400 tabular-nums">
                    $ {totalFinal.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || lineas.length === 0 || (hayStockInsuficiente && tipo === 'VENTA')}
              className={`flex items-center gap-2 rounded-lg px-6 py-2.5 text-xs font-bold text-white shadow-lg transition-all ${
                isSubmitting || lineas.length === 0 || (hayStockInsuficiente && tipo === 'VENTA')
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : tipo === 'VENTA'
                  ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Guardando y Generando PDF...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Confirmar y Descargar Remito</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
