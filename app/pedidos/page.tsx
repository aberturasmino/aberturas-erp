'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardList,
  Search,
  Plus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Building2,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  X,
  Package,
  Layers,
  ArrowRight,
  FileDown
} from 'lucide-react';
import {
  Pedido,
  TipoPedido,
  EstadoPedido,
  NuevoPedidoInput,
  getPedidos,
  registrarPedidoTransaccional
} from '../../lib/supabase';
import PedidoModal from '../../components/PedidoModal';
import { generateRemitoPDF } from '../../utils/generatePDF';

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modales
  const [modalNuevoOpen, setModalNuevoOpen] = useState<boolean>(false);
  const [pedidoDetalleSeleccionado, setPedidoDetalleSeleccionado] = useState<Pedido | null>(null);

  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    setIsLoading(true);
    try {
      const data = await getPedidos();
      setPedidos(data);
    } catch (err: any) {
      console.error('Error al cargar pedidos:', err);
      showToast('Error al conectar con la base de pedidos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await cargarPedidos();
    setIsRefreshing(false);
    showToast('Historial de pedidos sincronizado');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((c) => (c === msg ? null : c));
    }, 4000);
  };

  const handleConfirmarNuevoPedido = async (input: NuevoPedidoInput) => {
    const pedidoCreado = await registrarPedidoTransaccional(input);
    setPedidos((prev) => [pedidoCreado, ...prev]);
    showToast(`Pedido #${pedidoCreado.id} (${pedidoCreado.tipo}) registrado y stock actualizado.`);
    return pedidoCreado;
  };

  const handleDescargarPDF = (pedido: Pedido) => {
    const lineasParaPdf = (pedido.detalles || []).map((d) => ({
      codigo: d.producto?.codigo || `ID #${d.producto_id}`,
      descripcion: d.producto?.descripcion || 'Perfil de aluminio normalizado',
      cantidad: d.cantidad,
      precio_unitario: d.precio_unitario,
      subtotal: d.subtotal,
    }));

    generateRemitoPDF({
      id: pedido.id,
      tipo: pedido.tipo,
      estado: pedido.estado,
      created_at: pedido.created_at,
      notas: pedido.notas,
      subtotal: pedido.subtotal || pedido.total_pedido,
      incluye_iva: pedido.incluye_iva ?? false,
      monto_iva: pedido.monto_iva ?? 0,
      total_pedido: pedido.total_pedido,
      cliente: pedido.cliente,
      detalles: lineasParaPdf,
    });
    showToast(`Descargando Remito #${pedido.id} en PDF...`);
  };

  // Filtrado reactivo
  const filteredPedidos = useMemo(() => {
    return pedidos.filter((p) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        String(p.id).includes(q) ||
        p.cliente?.razon_social?.toLowerCase().includes(q) ||
        p.cliente?.cuit?.toLowerCase().includes(q) ||
        (p.notas && p.notas.toLowerCase().includes(q));

      const matchTipo = filtroTipo === 'todos' || p.tipo === filtroTipo;
      const matchEstado = filtroEstado === 'todos' || p.estado === filtroEstado;

      return matchSearch && matchTipo && matchEstado;
    });
  }, [pedidos, searchTerm, filtroTipo, filtroEstado]);

  // Métricas
  const totalOperaciones = pedidos.length;
  const totalVentas = pedidos
    .filter((p) => p.tipo === 'VENTA' && p.estado !== 'CANCELADO')
    .reduce((acc, curr) => acc + curr.total_pedido, 0);
  const totalCompras = pedidos
    .filter((p) => p.tipo === 'COMPRA' && p.estado !== 'CANCELADO')
    .reduce((acc, curr) => acc + curr.total_pedido, 0);

  const getTipoBadge = (tipo: TipoPedido) => {
    if (tipo === 'VENTA') {
      return 'bg-blue-950 text-blue-300 border-blue-800/80';
    }
    return 'bg-emerald-950 text-emerald-300 border-emerald-800/80';
  };

  const getEstadoBadge = (estado: EstadoPedido) => {
    switch (estado) {
      case 'COMPLETADO':
        return 'bg-slate-800 text-emerald-400 border-emerald-800/40';
      case 'PENDIENTE':
        return 'bg-slate-800 text-amber-400 border-amber-800/40';
      case 'CANCELADO':
      default:
        return 'bg-slate-800 text-red-400 border-red-800/40';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg border border-blue-500/40 bg-slate-900/95 px-4 py-3 text-xs font-semibold text-blue-300 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Cabecera del Módulo */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-black text-base shadow-md shadow-blue-900/30 border border-blue-400/30">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white whitespace-nowrap">
                Gestión de Pedidos & Remitos
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Aberturas Miño · Registro de Compras, Ventas y Movimientos de Stock
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Sincronizar</span>
            </button>

            <button
              onClick={() => setModalNuevoOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-900/30 transition-all active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Pedido</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Métricas de Pedidos */}
        <section aria-label="Estadísticas de Pedidos" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
              <span className="font-semibold uppercase tracking-wider">Total Operaciones</span>
              <ClipboardList className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
              {totalOperaciones}
            </div>
            <span className="text-[11px] text-slate-500">Pedidos registrados</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
              <span className="font-semibold uppercase tracking-wider">Facturación Ventas</span>
              <TrendingDown className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-xl font-bold font-mono text-blue-400 tabular-nums truncate">
              $ {totalVentas.toLocaleString('es-AR')}
            </div>
            <span className="text-[11px] text-slate-500">Salidas a clientes</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
              <span className="font-semibold uppercase tracking-wider">Inversión en Compras</span>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums truncate">
              $ {totalCompras.toLocaleString('es-AR')}
            </div>
            <span className="text-[11px] text-slate-500">Ingresos de proveedores</span>
          </div>
        </section>

        {/* Buscador & Filtros */}
        <section aria-label="Búsqueda de Pedidos" className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por Nº de pedido, cliente, CUIT u observaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Filtros de Tipo */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setFiltroTipo('todos')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    filtroTipo === 'todos'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroTipo('VENTA')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    filtroTipo === 'VENTA'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Solo Ventas
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroTipo('COMPRA')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    filtroTipo === 'COMPRA'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Solo Compras
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* TABLA DE PEDIDOS */}
        <section aria-label="Tabla de Historial de Pedidos" className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider font-mono">
                  <th scope="col" className="py-3.5 px-4 w-32">Nº PEDIDO</th>
                  <th scope="col" className="py-3.5 px-4">CLIENTE / PROVEEDOR</th>
                  <th scope="col" className="py-3.5 px-4 text-center w-28">TIPO</th>
                  <th scope="col" className="py-3.5 px-4 text-center w-32">ESTADO</th>
                  <th scope="col" className="py-3.5 px-4 text-center w-28">LÍNEAS</th>
                  <th scope="col" className="py-3.5 px-4 text-right w-36">TOTAL PEDIDO</th>
                  <th scope="col" className="py-3.5 px-4 text-right w-24">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-4 px-4"><div className="h-4 w-20 bg-slate-800 rounded"></div></td>
                      <td className="py-4 px-4"><div className="h-4 w-48 bg-slate-800 rounded"></div></td>
                      <td className="py-4 px-4 text-center"><div className="h-4 w-16 bg-slate-800 rounded mx-auto"></div></td>
                      <td className="py-4 px-4 text-center"><div className="h-4 w-20 bg-slate-800 rounded mx-auto"></div></td>
                      <td className="py-4 px-4 text-center"><div className="h-4 w-10 bg-slate-800 rounded mx-auto"></div></td>
                      <td className="py-4 px-4 text-right"><div className="h-4 w-24 bg-slate-800 rounded ml-auto"></div></td>
                      <td className="py-4 px-4 text-right"><div className="h-6 w-12 bg-slate-800 rounded ml-auto"></div></td>
                    </tr>
                  ))
                ) : filteredPedidos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <ClipboardList className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-300">
                        No se encontraron pedidos con el criterio de búsqueda
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Utiliza el botón superior "Nuevo Pedido" para registrar una venta o compra.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredPedidos.map((pedido) => {
                    const cantLineas = pedido.detalles?.length || 0;
                    const fecha = pedido.created_at
                      ? new Date(pedido.created_at).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })
                      : 'Fecha s/d';

                    return (
                      <tr
                        key={pedido.id}
                        className="hover:bg-slate-800/50 transition-colors group"
                      >
                        {/* 1. NÚMERO DE PEDIDO */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-mono font-bold text-white text-xs">
                              #{pedido.id}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {fecha}
                            </span>
                          </div>
                        </td>

                        {/* 2. CLIENTE */}
                        <td className="py-3.5 px-4 text-slate-200">
                          <div className="flex flex-col">
                            <span className="font-bold text-white text-xs">
                              {pedido.cliente?.razon_social || 'Cliente General'}
                            </span>
                            {pedido.cliente?.cuit && (
                              <span className="text-[11px] font-mono text-slate-400">
                                CUIT: {pedido.cliente.cuit}
                              </span>
                            )}
                            {pedido.notas && (
                              <span className="text-[10px] text-slate-500 italic truncate max-w-xs">
                                "{pedido.notas}"
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. TIPO (COMPRA / VENTA) */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded border uppercase font-mono ${getTipoBadge(
                              pedido.tipo
                            )}`}
                          >
                            {pedido.tipo}
                          </span>
                        </td>

                        {/* 4. ESTADO */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded border font-mono ${getEstadoBadge(
                              pedido.estado
                            )}`}
                          >
                            {pedido.estado}
                          </span>
                        </td>

                        {/* 5. LÍNEAS */}
                        <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-300 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                            {cantLineas} {cantLineas === 1 ? 'ítem' : 'ítems'}
                          </span>
                        </td>

                        {/* 6. TOTAL */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 text-xs whitespace-nowrap tabular-nums">
                          $ {pedido.total_pedido.toLocaleString('es-AR')}
                        </td>

                        {/* 7. ACCIONES */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDescargarPDF(pedido)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-xs transition-colors border border-blue-500/40"
                              title="Descargar Remito en PDF"
                            >
                              <FileDown className="h-3.5 w-3.5" />
                              <span>PDF</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setPedidoDetalleSeleccionado(pedido)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition-colors border border-slate-700"
                              title="Ver detalle del pedido"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Ver</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-800 bg-slate-950 px-4 py-3 text-xs text-slate-400 flex items-center justify-between">
            <span>
              Mostrando <strong className="text-slate-200">{filteredPedidos.length}</strong> de{' '}
              <strong className="text-slate-200">{pedidos.length}</strong> pedidos
            </span>
            <span className="font-mono text-[11px] text-slate-500">
              Aberturas Miño · Libro de Remitos y Órdenes
            </span>
          </div>
        </section>
      </main>

      {/* Modal de Nuevo Pedido */}
      <PedidoModal
        isOpen={modalNuevoOpen}
        onClose={() => setModalNuevoOpen(false)}
        onSuccess={cargarPedidos}
        onConfirmPedido={handleConfirmarNuevoPedido}
      />

      {/* Modal para ver Detalle de Líneas de Pedido */}
      {pedidoDetalleSeleccionado && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPedidoDetalleSeleccionado(null);
          }}
        >
          <div className="relative w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Detalle del Pedido #{pedidoDetalleSeleccionado.id}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    {pedidoDetalleSeleccionado.tipo} · {pedidoDetalleSeleccionado.cliente?.razon_social}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPedidoDetalleSeleccionado(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Información General */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg border border-slate-800 bg-slate-950/70 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block uppercase text-[10px]">Cliente / CUIT</span>
                  <span className="font-bold text-white truncate block">
                    {pedidoDetalleSeleccionado.cliente?.cuit || 'S/D'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase text-[10px]">Tipo</span>
                  <span className="font-bold text-blue-400">{pedidoDetalleSeleccionado.tipo}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase text-[10px]">Estado</span>
                  <span className="font-bold text-emerald-400">{pedidoDetalleSeleccionado.estado}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase text-[10px]">Fecha</span>
                  <span className="text-slate-300">
                    {pedidoDetalleSeleccionado.created_at
                      ? new Date(pedidoDetalleSeleccionado.created_at).toLocaleDateString('es-AR')
                      : '-'}
                  </span>
                </div>
              </div>

              {pedidoDetalleSeleccionado.notas && (
                <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/40 text-xs text-slate-300">
                  <span className="text-slate-500 font-mono uppercase text-[10px] block mb-1">
                    Observaciones / Remito
                  </span>
                  <p>{pedidoDetalleSeleccionado.notas}</p>
                </div>
              )}

              {/* Tabla de Líneas */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
                  Líneas de Perfiles de Aluminio
                </span>
                <div className="rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-mono">
                        <th className="py-2.5 px-3">CÓDIGO</th>
                        <th className="py-2.5 px-3">DESCRIPCIÓN</th>
                        <th className="py-2.5 px-3 text-center">CANTIDAD</th>
                        <th className="py-2.5 px-3 text-right">PRECIO UNIT.</th>
                        <th className="py-2.5 px-3 text-right">SUBTOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {pedidoDetalleSeleccionado.detalles?.map((det, idx) => (
                        <tr key={det.id || idx} className="hover:bg-slate-900/50">
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-400">
                            {det.producto?.codigo || `ID #${det.producto_id}`}
                          </td>
                          <td className="py-2.5 px-3 text-slate-200">
                            {det.producto?.descripcion || 'Perfil de catálogo'}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-white">
                            {det.cantidad} u.
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                            $ {det.precio_unitario.toLocaleString('es-AR')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                            $ {det.subtotal.toLocaleString('es-AR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Resumen financiero en modal de detalle */}
              <div className="p-4 rounded-lg border border-slate-800 bg-slate-950 font-mono space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>SUBTOTAL:</span>
                  <span className="text-slate-200 font-bold">
                    $ {(pedidoDetalleSeleccionado.subtotal || pedidoDetalleSeleccionado.total_pedido).toLocaleString('es-AR')}
                  </span>
                </div>
                {pedidoDetalleSeleccionado.incluye_iva && (
                  <div className="flex items-center justify-between text-xs text-blue-400">
                    <span>IVA (21%):</span>
                    <span className="font-bold">
                      +$ {(pedidoDetalleSeleccionado.monto_iva || 0).toLocaleString('es-AR')}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-800">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-sans font-bold">
                    Total Liquidado
                  </span>
                  <span className="text-xl font-black text-emerald-400">
                    $ {pedidoDetalleSeleccionado.total_pedido.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950/60">
              <button
                type="button"
                onClick={() => handleDescargarPDF(pedidoDetalleSeleccionado)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-xs font-bold text-white hover:bg-blue-500 shadow-md shadow-blue-900/30 transition-all"
              >
                <FileDown className="h-4 w-4" />
                <span>Descargar Remito PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setPedidoDetalleSeleccionado(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
