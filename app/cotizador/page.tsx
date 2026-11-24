'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Calculator,
  Scale,
  Plus,
  Trash2,
  FileText,
  FileCheck2,
  UserCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  Percent,
  Package,
  Save
} from 'lucide-react';
import {
  Cliente,
  Producto,
  getClientes,
  getProductosPorPeso,
  getConfiguracionValor,
  updateConfiguracionValor,
  registrarPedidoTransaccional,
  NuevaLineaPedido,
  roundKg
} from '../../lib/supabase';
import { generateRemitoPDF, TipoDocumentoPDF } from '../../utils/generatePDF';

interface CotizadorItem {
  tempId: string;
  productoId: string;
  detalleCustom: string;
  cantidad: number;
  pesoKg: number;
}

export default function CotizadorPage() {
  // Datos maestros
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productosKg, setProductosKg] = useState<Producto[]>([]);
  const [isLoadingMaster, setIsLoadingMaster] = useState<boolean>(true);

  // Configuración global del kilo de aluminio
  const [valorKilo, setValorKilo] = useState<number>(7000);
  const [valorKiloInput, setValorKiloInput] = useState<string>('7000');
  const [isSavingKilo, setIsSavingKilo] = useState<boolean>(false);
  const [kiloSyncLabel, setKiloSyncLabel] = useState<string>('Sincronizado');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Formulario de cotización
  const [clienteId, setClienteId] = useState<string>('');
  const [notas, setNotas] = useState<string>('');
  const [incluyeIva, setIncluyeIva] = useState<boolean>(true);
  const [items, setItems] = useState<CotizadorItem[]>([
    {
      tempId: 'item-init-1',
      productoId: '',
      detalleCustom: '',
      cantidad: 1,
      pesoKg: 15,
    },
  ]);

  // Estado de envío y feedback
  const [submittingAction, setSubmittingAction] = useState<'PRESUPUESTO' | 'VENTA' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    cargarDatosIniciales();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const cargarDatosIniciales = async () => {
    setIsLoadingMaster(true);
    try {
      const [clientesData, prodsKgData, kiloActual] = await Promise.all([
        getClientes(),
        getProductosPorPeso(),
        getConfiguracionValor('precio_kilo_aluminio', 7000),
      ]);
      setClientes(clientesData);
      setProductosKg(prodsKgData);
      setValorKilo(kiloActual);
      setValorKiloInput(String(kiloActual));

      if (clientesData.length > 0) {
        setClienteId(String(clientesData[0].id));
      }

      if (prodsKgData.length > 0) {
        setItems((prev) =>
          prev.map((it) =>
            it.productoId ? it : { ...it, productoId: String(prodsKgData[0].id) }
          )
        );
      }
    } catch (err: any) {
      console.error('Error cargando datos del cotizador:', err);
      setErrorMsg('No se pudieron cargar los catálogos iniciales.');
    } finally {
      setIsLoadingMaster(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4500);
  };

  // Actualización en tiempo real contra tabla configuracion de Supabase
  const persistirValorKilo = async (nuevoValor: number) => {
    setIsSavingKilo(true);
    setKiloSyncLabel('Guardando...');
    try {
      const saved = await updateConfiguracionValor('precio_kilo_aluminio', nuevoValor);
      setValorKilo(saved);
      setKiloSyncLabel('Sincronizado');
    } catch (err: any) {
      console.error('Error actualizando precio del kilo:', err);
      setKiloSyncLabel('Error');
      setErrorMsg(err?.message || 'No se pudo actualizar el valor del kilo en Supabase.');
    } finally {
      setIsSavingKilo(false);
    }
  };

  const handleValorKiloChange = (rawVal: string) => {
    setValorKiloInput(rawVal);
    const parsed = parseFloat(rawVal);
    if (Number.isNaN(parsed) || parsed < 0) return;

    setValorKilo(parsed);
    setKiloSyncLabel('Pendiente...');

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      persistirValorKilo(parsed);
    }, 600);
  };

  const handleValorKiloBlur = () => {
    const parsed = parseFloat(valorKiloInput);
    const safeVal = Number.isNaN(parsed) || parsed < 0 ? 7000 : parsed;
    setValorKiloInput(String(safeVal));
    setValorKilo(safeVal);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    persistirValorKilo(safeVal);
  };

  // Gestión de ítems dinámicos
  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        tempId: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productoId: productosKg[0] ? String(productosKg[0].id) : '',
        detalleCustom: '',
        cantidad: 1,
        pesoKg: 0,
      },
    ]);
  };

  const removeItem = (tempId: string) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((item) => item.tempId !== tempId));
  };

  const updateItem = (tempId: string, patch: Partial<CotizadorItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.tempId === tempId ? { ...item, ...patch } : item))
    );
  };

  const getProductoById = (prodId: string): Producto | undefined =>
    productosKg.find((p) => String(p.id) === String(prodId));

  const getItemMaterialLabel = (item: CotizadorItem): string => {
    const prod = getProductoById(item.productoId);
    const base = prod ? `${prod.codigo} - ${prod.descripcion}` : 'Aluminio por Kilo';
    return item.detalleCustom.trim() ? `${base} (${item.detalleCustom.trim()})` : base;
  };

  const getItemSubtotal = (item: CotizadorItem): number => {
    const peso = Number(item.pesoKg) || 0;
    return Math.round(peso * valorKilo * 100) / 100;
  };

  // Acumulado de kg solicitados por producto (para validar stock si hay ítems repetidos)
  const kgSolicitadosPorProducto = items.reduce<Record<string, number>>((acc, it) => {
    if (!it.productoId) return acc;
    acc[it.productoId] = roundKg((acc[it.productoId] || 0) + (Number(it.pesoKg) || 0));
    return acc;
  }, {});

  const hayStockInsuficiente = productosKg.some(
    (prod) => (kgSolicitadosPorProducto[prod.id] || 0) > prod.cantidad
  );

  // Cálculos globales
  const pesoTotalKg = roundKg(
    items.reduce((acc, item) => acc + (Number(item.pesoKg) || 0), 0)
  );
  const subtotalCalculado = items.reduce((acc, item) => acc + getItemSubtotal(item), 0);
  const montoIvaCalculado = incluyeIva
    ? Math.round(subtotalCalculado * 0.21 * 100) / 100
    : 0;
  const totalFinal = Math.round((subtotalCalculado + montoIvaCalculado) * 100) / 100;

  const handleEmitirDocumento = async (modo: 'PRESUPUESTO' | 'VENTA') => {
    setErrorMsg(null);

    if (!clienteId) {
      setErrorMsg('Debe seleccionar un cliente para emitir el documento.');
      return;
    }

    if (productosKg.length === 0) {
      setErrorMsg(
        'No hay productos con unidad de medida KG en Inventario. Agregue uno primero.'
      );
      return;
    }

    if (valorKilo <= 0) {
      setErrorMsg('El valor del kilo de aluminio debe ser mayor a $ 0.');
      return;
    }

    if (items.some((it) => !it.productoId)) {
      setErrorMsg('Seleccione el material de aluminio (KG) en todas las líneas.');
      return;
    }

    if (items.some((it) => Number(it.pesoKg) <= 0)) {
      setErrorMsg('Todos los ítems deben tener un peso en kilogramos mayor a 0.');
      return;
    }

    // Validar stock disponible en KG antes de confirmar venta y remito
    if (modo === 'VENTA') {
      for (const prod of productosKg) {
        const kgRequeridos = kgSolicitadosPorProducto[prod.id] || 0;
        if (kgRequeridos > prod.cantidad) {
          setErrorMsg(
            `Stock insuficiente para ${prod.codigo}. Disponible: ${prod.cantidad} kg, solicitado: ${kgRequeridos} kg.`
          );
          return;
        }
      }
    }

    setSubmittingAction(modo);

    try {
      const clienteSeleccionado = clientes.find((c) => String(c.id) === String(clienteId));
      const estadoDestino = modo === 'PRESUPUESTO' ? 'PRESUPUESTO' : 'COMPLETADO';
      const tipoDocPDF: TipoDocumentoPDF = modo === 'PRESUPUESTO' ? 'PRESUPUESTO' : 'REMITO';

      const lineasPayload: NuevaLineaPedido[] = items.map((it) => {
        const prod = getProductoById(it.productoId);
        return {
          producto_id: prod ? prod.id : it.productoId,
          material: getItemMaterialLabel(it),
          peso_kg: roundKg(Number(it.pesoKg)),
          cantidad: Math.max(1, Math.round(Number(it.cantidad) || 1)),
          precio_unitario: valorKilo,
          subtotal: getItemSubtotal(it),
        };
      });

      const notaFinal =
        notas.trim() ||
        `Cotización por peso (${pesoTotalKg.toFixed(2)} kg a $${valorKilo.toLocaleString('es-AR')}/kg)`;

      const pedidoCreado = await registrarPedidoTransaccional({
        cliente_id: clienteSeleccionado ? clienteSeleccionado.id : clienteId,
        tipo: 'VENTA',
        estado: estadoDestino,
        subtotal: subtotalCalculado,
        incluye_iva: incluyeIva,
        monto_iva: montoIvaCalculado,
        total_pedido: totalFinal,
        notas: notaFinal,
        lineas: lineasPayload,
      });

      const detallesParaPdf = items.map((it) => {
        const prod = getProductoById(it.productoId);
        return {
          codigo: prod?.codigo || 'KG',
          material: getItemMaterialLabel(it),
          descripcion: getItemMaterialLabel(it),
          cantidad: Math.max(1, Math.round(Number(it.cantidad) || 1)),
          peso_kg: roundKg(Number(it.pesoKg)),
          precio_unitario: valorKilo,
          subtotal: getItemSubtotal(it),
        };
      });

      generateRemitoPDF(
        {
          id: pedidoCreado.id,
          tipo: 'VENTA',
          estado: estadoDestino,
          tipoDocumento: tipoDocPDF,
          created_at: pedidoCreado.created_at,
          notas: notaFinal,
          subtotal: subtotalCalculado,
          incluye_iva: incluyeIva,
          monto_iva: montoIvaCalculado,
          total_pedido: totalFinal,
          cliente: clienteSeleccionado || pedidoCreado.cliente,
          detalles: detallesParaPdf,
        },
        tipoDocPDF
      );

      if (modo === 'VENTA') {
        const updatedKgProds = await getProductosPorPeso();
        setProductosKg(updatedKgProds);
        showToast(
          `Venta confirmada. Se descontaron ${pesoTotalKg.toFixed(2)} kg del inventario y se descargó el Remito PDF.`
        );
      } else {
        showToast(
          `Presupuesto guardado (sin descontar stock) y PDF descargado.`
        );
      }
    } catch (err: any) {
      console.error('Error generando cotización/remito:', err);
      setErrorMsg(err?.message || 'Error al registrar la operación en la base de datos.');
    } finally {
      setSubmittingAction(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-50 flex items-center gap-3 rounded-lg border border-blue-500/40 bg-slate-900/95 px-4 py-3 text-xs font-semibold text-blue-300 shadow-2xl backdrop-blur-md">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="flex-1">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 text-slate-400 hover:text-white"
            aria-label="Cerrar aviso"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Cabecera Industrial con Valor del Kilo Editable */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-md">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                Cotizador de Aluminio por Peso
              </h1>
              <p className="text-[11px] text-slate-400">
                Aberturas Miño · Stock en Kilogramos (ALU-A30, ALU-MODENA, ALU-HERRERO) y Remitos
              </p>
            </div>
          </div>

          {/* Input Editable en Tiempo Real: Valor del Kilo de Aluminio ($) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 rounded-xl border border-slate-700/80 bg-slate-950/90 px-3.5 py-2.5 shadow-inner">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-amber-400 shrink-0" />
              <label
                htmlFor="valor-kilo-aluminio"
                className="text-[11px] font-bold uppercase tracking-wider text-slate-300 whitespace-nowrap"
              >
                Valor Kilo Aluminio ($):
              </label>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-36">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-amber-400">
                  $
                </span>
                <input
                  id="valor-kilo-aluminio"
                  type="number"
                  min={0}
                  step="50"
                  value={valorKiloInput}
                  onChange={(e) => handleValorKiloChange(e.target.value)}
                  onBlur={handleValorKiloBlur}
                  className="w-full min-h-[40px] rounded-lg border border-amber-500/40 bg-slate-900 pl-7 pr-3 py-1.5 font-mono text-sm font-black text-amber-300 tabular-nums focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <button
                type="button"
                onClick={handleValorKiloBlur}
                disabled={isSavingKilo}
                className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 transition-colors shrink-0"
                title="Guardar valor del kilo en Supabase"
              >
                {isSavingKilo ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                ) : (
                  <Save className="h-3.5 w-3.5 text-emerald-400" />
                )}
                <span className="font-mono">{kiloSyncLabel}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {errorMsg && (
          <div className="rounded-xl border border-red-500/40 bg-red-950/50 p-4 flex items-start gap-3 text-xs text-red-200">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMsg}</div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-red-300 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Columna Izquierda (8 cols): Cliente + Ítems Dinámicos */}
          <div className="lg:col-span-8 space-y-5">
            {/* Tarjeta 1: Selección de Cliente */}
            <section className="rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-blue-400" />
                  1. Datos del Cliente y Referencia de Obra
                </h2>
                <span className="text-[11px] font-mono text-slate-500">
                  {clientes.length} clientes disponibles
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Cliente Destinatario *
                  </label>
                  <select
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                    disabled={isLoadingMaster}
                    className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  >
                    {clientes.length === 0 && <option value="">Cargando clientes...</option>}
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.razon_social} · CUIT {c.cuit}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Referencia de Obra / Observaciones
                  </label>
                  <input
                    type="text"
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Ej: Carpintería Obra Pellegrini · Plazo entrega 10 días"
                    className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </section>

            {/* Tarjeta 2: Ítems Dinámicos de Aluminio (productos con unidad_medida = 'KG') */}
            <section className="rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Package className="h-4 w-4 text-amber-400" />
                    2. Detalle de Material por Kilo (unidad_medida = KG)
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Seleccione la línea desde inventario en kg e ingrese el peso manual a cotizar o despachar.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-[38px] px-3.5 py-2 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-300 hover:bg-blue-600 hover:text-white text-xs font-bold transition-colors shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>Agregar Ítem</span>
                </button>
              </div>

              {productosKg.length === 0 && !isLoadingMaster ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-950/30 p-4 text-xs text-amber-200 flex items-center gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>
                    No se encontraron productos con <strong>unidad_medida = 'KG'</strong> en Inventario. Agregue productos en KG desde Inventario para cotizar.
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => {
                    const prod = getProductoById(item.productoId);
                    const sub = getItemSubtotal(item);
                    const totalKgParaEsteProd = prod ? kgSolicitadosPorProducto[prod.id] || 0 : 0;
                    const stockDisponibleKg = prod ? Number(prod.cantidad ?? 0) : 0;
                    const stockInsuficiente = prod ? totalKgParaEsteProd > stockDisponibleKg : false;

                    return (
                      <div
                        key={item.tempId}
                        className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 sm:p-4 space-y-3 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                              Ítem #{index + 1}
                            </span>
                            {prod && (
                              <span
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                  stockInsuficiente
                                    ? 'bg-red-950/80 text-red-300 border-red-700/60'
                                    : 'bg-slate-900 text-amber-300 border-slate-700'
                                }`}
                              >
                                Stock disponible: {stockDisponibleKg.toLocaleString('es-AR', { maximumFractionDigits: 2 })} kg
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(item.tempId)}
                            disabled={items.length === 1}
                            className="inline-flex items-center gap-1 min-h-[36px] px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            title="Eliminar ítem"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Quitar</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                          {/* Selector de Material desde productos KG */}
                          <div className="md:col-span-5">
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                              Material Aluminio (KG) *
                            </label>
                            <select
                              value={item.productoId}
                              onChange={(e) =>
                                updateItem(item.tempId, { productoId: e.target.value })
                              }
                              className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-white focus:border-blue-500 focus:outline-none"
                            >
                              {productosKg.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.codigo} — {p.descripcion} ({p.cantidad.toLocaleString('es-AR', { maximumFractionDigits: 2 })} kg disp.)
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Peso Manual (Kg) */}
                          <div className="md:col-span-3">
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                              Peso (kg) *
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={item.pesoKg || ''}
                                onChange={(e) =>
                                  updateItem(item.tempId, {
                                    pesoKg: Math.max(0, parseFloat(e.target.value) || 0),
                                  })
                                }
                                placeholder="0.00"
                                className={`w-full min-h-[44px] rounded-lg border bg-slate-900 pl-3 pr-9 py-2 font-mono text-xs font-bold tabular-nums focus:outline-none ${
                                  stockInsuficiente
                                    ? 'border-red-500 text-red-300 focus:border-red-400'
                                    : 'border-slate-700 text-amber-300 focus:border-amber-400'
                                }`}
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-slate-500">
                                kg
                              </span>
                            </div>
                          </div>

                          {/* Subtotal Calculado */}
                          <div className="md:col-span-4">
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                              Subtotal ({Number(item.pesoKg || 0).toFixed(2)} kg × $
                              {valorKilo.toLocaleString('es-AR')})
                            </label>
                            <div className="min-h-[44px] flex items-center justify-end rounded-lg border border-slate-800 bg-slate-900/70 px-3 font-mono text-sm font-black text-emerald-400 tabular-nums">
                              ${' '}
                              {sub.toLocaleString('es-AR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Detalle adicional y cantidad entera de aberturas/tiras */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
                          <div className="md:col-span-9">
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                              Tipología / Acabado (opcional)
                            </label>
                            <input
                              type="text"
                              value={item.detalleCustom}
                              onChange={(e) =>
                                updateItem(item.tempId, { detalleCustom: e.target.value })
                              }
                              placeholder="Ej: Ventana corrediza 2 hojas 150x120 · Pintura Negra"
                              className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                              Cant. Aberturas / Tiras
                            </label>
                            <input
                              type="number"
                              min={1}
                              step={1}
                              value={item.cantidad}
                              onChange={(e) =>
                                updateItem(item.tempId, {
                                  cantidad: Math.max(1, parseInt(e.target.value, 10) || 1),
                                })
                              }
                              className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs font-bold text-white tabular-nums focus:border-blue-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        {stockInsuficiente && prod && (
                          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/40 px-3 py-2 text-[11px] text-red-300">
                            <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                            <span>
                              Stock insuficiente en <strong>{prod.codigo}</strong>: se solicitan{' '}
                              <strong className="font-mono">{totalKgParaEsteProd} kg</strong> y hay{' '}
                              <strong className="font-mono">{stockDisponibleKg} kg</strong> disponibles. Podés generar un Presupuesto, pero no confirmar la venta hasta reponer stock.
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Columna Derecha (4 cols): Resumen Financiero y Acciones */}
          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
            <section className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4 shadow-xl">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Resumen de Cotización
                </h2>
                <span className="font-mono text-xs font-bold text-amber-400 tabular-nums">
                  {pesoTotalKg.toFixed(2)} kg totales
                </span>
              </div>

              {/* Switch IVA 21% */}
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/90 p-3.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                      incluyeIva
                        ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    <Percent className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      ¿Incluir IVA (21%)?
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {incluyeIva ? 'Discriminado en el documento' : 'Presupuesto / Remito neto'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={incluyeIva}
                  onClick={() => setIncluyeIva((prev) => !prev)}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    incluyeIva ? 'bg-blue-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      incluyeIva ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Desglose Numérico */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2.5 font-mono">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Valor Kilo Base:</span>
                  <span className="text-amber-300 font-bold tabular-nums">
                    $ {valorKilo.toLocaleString('es-AR')}/kg
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Subtotal Aluminio:</span>
                  <span className="text-slate-100 font-bold tabular-nums">
                    ${' '}
                    {subtotalCalculado.toLocaleString('es-AR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                {incluyeIva && (
                  <div className="flex items-center justify-between text-xs text-blue-400">
                    <span>IVA (21%):</span>
                    <span className="font-bold tabular-nums">
                      +$
                      {montoIvaCalculado.toLocaleString('es-AR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
                <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between">
                  <span className="font-sans text-xs font-extrabold uppercase tracking-wider text-slate-300">
                    Total Final
                  </span>
                  <span className="text-xl font-black text-emerald-400 tabular-nums">
                    ${' '}
                    {totalFinal.toLocaleString('es-AR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              {/* Botones de Emisión Dual */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  disabled={submittingAction !== null || isLoadingMaster || productosKg.length === 0}
                  onClick={() => handleEmitirDocumento('PRESUPUESTO')}
                  className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl border border-amber-500/50 bg-amber-500/15 hover:bg-amber-500 hover:text-slate-950 text-amber-300 font-bold text-xs px-4 py-3 transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  {submittingAction === 'PRESUPUESTO' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  <span>Generar Presupuesto (PDF)</span>
                </button>

                <button
                  type="button"
                  disabled={
                    submittingAction !== null ||
                    isLoadingMaster ||
                    productosKg.length === 0 ||
                    hayStockInsuficiente
                  }
                  onClick={() => handleEmitirDocumento('VENTA')}
                  className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-3 shadow-lg shadow-blue-900/30 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingAction === 'VENTA' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileCheck2 className="h-4 w-4" />
                  )}
                  <span>Confirmar Venta y Remito</span>
                </button>
              </div>

              <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3 text-[11px] text-slate-400 space-y-1">
                <p>
                  <strong className="text-amber-300">Presupuesto:</strong> Guarda en pedidos como <span className="font-mono">PRESUPUESTO</span> sin descontar kg del stock.
                </p>
                <p>
                  <strong className="text-blue-400">Venta y Remito:</strong> Valida stock en kg, registra como <span className="font-mono text-emerald-400">COMPLETADO</span>, descuenta los kg y emite Remito.
                </p>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
