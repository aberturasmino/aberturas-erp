'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Layers,
  Search,
  RefreshCw,
  AlertTriangle,
  ArrowUpDown,
  SlidersHorizontal,
  CheckCircle2,
  Database,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Boxes,
  FileCode,
  ShieldCheck,
  X
} from 'lucide-react';
import {
  supabase,
  Producto,
  isSupabaseConfigured,
  getLocalDemoStock,
  saveLocalDemoStock,
  INITIAL_PRODUCTOS
} from '../lib/supabase';
import StockModal from '../components/StockModal';

export default function ERPPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isUsingDemo, setIsUsingDemo] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedLinea, setSelectedLinea] = useState<string>('TODAS');
  const [selectedTipo, setSelectedTipo] = useState<string>('TODOS');
  const [soloStockBajo, setSoloStockBajo] = useState<boolean>(false);

  // Modal and toast states
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showSqlModal, setShowSqlModal] = useState<boolean>(false);

  // Load products on mount
  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    // If Supabase is configured with real credentials, query Supabase
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('productos')
          .select('*')
          .order('id', { ascending: true });

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          setProductos(data);
          setIsUsingDemo(false);
        } else {
          // Table exists but is empty -> fallback to initial seed or show empty
          setProductos(INITIAL_PRODUCTOS);
          setIsUsingDemo(false);
        }
      } catch (err: any) {
        console.warn('Error conectando a Supabase, activando modo demostración interactivo:', err);
        const demoData = getLocalDemoStock();
        setProductos(demoData);
        setIsUsingDemo(true);
        setErrorMessage(
          'No se pudo conectar a Supabase o la tabla no está creada. Operando en modo demostración local interactivo.'
        );
      } finally {
        setIsLoading(false);
      }
    } else {
      // Supabase credentials not provided -> load interactive local demo storage
      const demoData = getLocalDemoStock();
      setProductos(demoData);
      setIsUsingDemo(true);
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await cargarProductos();
    setIsRefreshing(false);
    showToast('Inventario sincronizado con éxito');
  };

  const handleOpenStockModal = (producto: Producto) => {
    setSelectedProducto(producto);
    setModalOpen(true);
  };

  const handleActualizarStock = async (
    productoId: number | string,
    nuevoStock: number,
    cantidad: number,
    operacion: 'sumar' | 'restar'
  ) => {
    if (isSupabaseConfigured && !isUsingDemo) {
      // Real Supabase update query
      const { error } = await supabase
        .from('productos')
        .update({ stock_actual: nuevoStock })
        .eq('id', productoId);

      if (error) {
        throw new Error(error.message);
      }
    }

    // Update local state reactively
    setProductos((prev) => {
      const updated = prev.map((p) =>
        p.id === productoId ? { ...p, stock_actual: nuevoStock } : p
      );
      if (isUsingDemo) {
        saveLocalDemoStock(updated);
      }
      return updated;
    });

    const accionTexto = operacion === 'sumar' ? 'ingresaron' : 'retiraron';
    showToast(`Se ${accionTexto} ${cantidad} u. correctamente. Nuevo stock: ${nuevoStock}`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  };

  // Distinct lists for filters
  const lineasDisponibles = useMemo(() => {
    const list = Array.from(new Set(productos.map((p) => p.linea)));
    return ['TODAS', ...list];
  }, [productos]);

  const tiposDisponibles = useMemo(() => {
    const list = Array.from(new Set(productos.map((p) => p.tipo)));
    return ['TODOS', ...list];
  }, [productos]);

  // Filtered products list
  const filteredProductos = useMemo(() => {
    return productos.filter((p) => {
      const matchesSearch =
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.codigo_sku.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLinea = selectedLinea === 'TODAS' || p.linea === selectedLinea;
      const matchesTipo = selectedTipo === 'TODOS' || p.tipo === selectedTipo;
      const matchesBajoStock = !soloStockBajo || p.stock_actual <= 5;

      return matchesSearch && matchesLinea && matchesTipo && matchesBajoStock;
    });
  }, [productos, searchTerm, selectedLinea, selectedTipo, soloStockBajo]);

  // KPI Calculations
  const totalArticulos = productos.length;
  const totalUnidades = productos.reduce((acc, curr) => acc + curr.stock_actual, 0);
  const totalStockBajo = productos.filter((p) => p.stock_actual <= 5).length;
  const valorizacionTotal = productos.reduce(
    (acc, curr) => acc + curr.stock_actual * curr.precio_mayorista,
    0
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Barra de Notificación Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg border border-blue-500/40 bg-slate-900/95 px-4 py-3 text-xs font-semibold text-blue-300 shadow-2xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2">
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

      {/* Top Header Contract Industrial */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-6">
          {/* Marca / Identidad Industrial */}
          <div className="flex items-center gap-3.5 shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-black text-lg tracking-wider shadow-lg shadow-blue-900/30 border border-blue-400/30">
              AM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-blue-400 font-bold">
                  Plataforma Industrial
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-xs text-slate-400">Depósito Central</span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white whitespace-nowrap">
                ERP Mayorista - Aberturas Miño
              </h1>
            </div>
          </div>

          {/* Acciones de Cabecera */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowSqlModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 hover:text-white transition-colors"
              title="Ver esquema SQL para Supabase"
            >
              <FileCode className="h-3.5 w-3.5 text-blue-400" />
              <span>Esquema SQL</span>
            </button>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Sincronizar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenedor Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner de Estado de Conexión Supabase */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                isSupabaseConfigured && !isUsingDemo
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
              }`}
            >
              <Database className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200">
                  {isSupabaseConfigured && !isUsingDemo
                    ? 'Conectado a Base de Datos Supabase (PostgreSQL)'
                    : 'Modo Demostración Interactivo (Simulación Local Activa)'}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    isSupabaseConfigured && !isUsingDemo
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-blue-950 text-blue-300 border border-blue-800'
                  }`}
                >
                  {isSupabaseConfigured && !isUsingDemo ? 'LIVE_DB' : 'DEMO_CACHE'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isSupabaseConfigured && !isUsingDemo
                  ? 'Sincronización bidireccional directa con la tabla "productos".'
                  : 'Las variables NEXT_PUBLIC_SUPABASE_* no están configuradas; puedes probar altas y bajas en memoria sin trabas.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSqlModal(true)}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-2 flex items-center gap-1"
            >
              <span>Ver tabla productos SQL</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Tira de Métricas KPI de Depósito */}
        <section aria-label="Métricas de Inventario" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
              <span className="font-semibold uppercase tracking-wider">Catálogo Activo</span>
              <Package className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
              {totalArticulos}
            </div>
            <span className="text-[11px] text-slate-500">Modelos de aberturas</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
              <span className="font-semibold uppercase tracking-wider">Unidades Físicas</span>
              <Boxes className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
              {totalUnidades} <span className="text-sm font-normal text-slate-400">u.</span>
            </div>
            <span className="text-[11px] text-slate-500">Disponibles en nave central</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
              <span className="font-semibold uppercase tracking-wider">Stock Crítico</span>
              <AlertTriangle className={`h-4 w-4 ${totalStockBajo > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
            </div>
            <div className={`text-2xl font-bold font-mono tabular-nums ${totalStockBajo > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
              {totalStockBajo}
            </div>
            <span className="text-[11px] text-slate-500">Líneas con 5 o menos unidades</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
              <span className="font-semibold uppercase tracking-wider">Valuación Mayorista</span>
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums truncate">
              ${valorizacionTotal.toLocaleString('es-AR')}
            </div>
            <span className="text-[11px] text-slate-500">Total calculado según lista</span>
          </div>
        </section>

        {/* Barra de Búsqueda y Filtros de Depósito */}
        <section aria-label="Herramientas de Búsqueda" className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Buscador en Vivo */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por código SKU, modelo de abertura, medidas o vidrio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Selector de Filtros */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Filtro por Línea */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Línea:</span>
                <select
                  value={selectedLinea}
                  onChange={(e) => setSelectedLinea(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 focus:outline-none font-medium cursor-pointer"
                >
                  {lineasDisponibles.map((l) => (
                    <option key={l} value={l} className="bg-slate-900 text-slate-200">
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por Tipo */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Tipo:</span>
                <select
                  value={selectedTipo}
                  onChange={(e) => setSelectedTipo(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 focus:outline-none font-medium cursor-pointer"
                >
                  {tiposDisponibles.map((t) => (
                    <option key={t} value={t} className="bg-slate-900 text-slate-200">
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botón de Stock Crítico */}
              <button
                type="button"
                onClick={() => setSoloStockBajo(!soloStockBajo)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
                  soloStockBajo
                    ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                    : 'border-slate-700 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                <span>Solo Crítico (≤ 5)</span>
              </button>
            </div>
          </div>
        </section>

        {/* Tabla Industrial de Productos */}
        <section aria-label="Inventario de Productos" className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider">
                  <th scope="col" className="py-3.5 px-4 font-mono">CÓDIGO SKU</th>
                  <th scope="col" className="py-3.5 px-4">PRODUCTO / ESPECIFICACIÓN</th>
                  <th scope="col" className="py-3.5 px-4">LÍNEA</th>
                  <th scope="col" className="py-3.5 px-4">TIPO</th>
                  <th scope="col" className="py-3.5 px-4 text-right font-mono">PRECIO MAYORISTA</th>
                  <th scope="col" className="py-3.5 px-4 text-center font-mono">STOCK ACTUAL</th>
                  <th scope="col" className="py-3.5 px-4 text-right">GESTIÓN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {isLoading ? (
                  // Estado de Carga (Skeletons)
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-4 px-4"><div className="h-4 w-28 bg-slate-800 rounded"></div></td>
                      <td className="py-4 px-4"><div className="h-4 w-64 bg-slate-800 rounded"></div></td>
                      <td className="py-4 px-4"><div className="h-4 w-20 bg-slate-800 rounded"></div></td>
                      <td className="py-4 px-4"><div className="h-4 w-16 bg-slate-800 rounded"></div></td>
                      <td className="py-4 px-4 text-right"><div className="h-4 w-20 bg-slate-800 rounded ml-auto"></div></td>
                      <td className="py-4 px-4 text-center"><div className="h-4 w-12 bg-slate-800 rounded mx-auto"></div></td>
                      <td className="py-4 px-4 text-right"><div className="h-7 w-28 bg-slate-800 rounded ml-auto"></div></td>
                    </tr>
                  ))
                ) : filteredProductos.length === 0 ? (
                  // Estado Vacío
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Package className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-300">
                        No se encontraron aberturas con los filtros seleccionados
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Prueba ajustando la búsqueda o quitando los filtros de línea y tipo.
                      </p>
                    </td>
                  </tr>
                ) : (
                  // Filas de Productos
                  filteredProductos.map((prod) => {
                    const esCritico = prod.stock_actual <= 5;
                    return (
                      <tr
                        key={prod.id}
                        className="hover:bg-slate-800/50 transition-colors group"
                      >
                        {/* SKU */}
                        <td className="py-3.5 px-4 font-mono font-semibold text-blue-400 whitespace-nowrap">
                          {prod.codigo_sku}
                        </td>

                        {/* Nombre y Medidas */}
                        <td className="py-3.5 px-4 font-medium text-slate-200 min-w-[240px]">
                          {prod.nombre}
                        </td>

                        {/* Línea */}
                        <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                          <span className="inline-flex items-center text-xs text-slate-300 font-medium">
                            {prod.linea}
                          </span>
                        </td>

                        {/* Tipo */}
                        <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                          {prod.tipo}
                        </td>

                        {/* Precio Mayorista */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-200 tabular-nums whitespace-nowrap">
                          ${prod.precio_mayorista.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Stock Actual con Alerta si es crítico */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                            <span
                              className={`text-sm font-bold px-2.5 py-0.5 rounded ${
                                esCritico
                                  ? 'bg-amber-950 text-amber-400 border border-amber-800 font-extrabold'
                                  : 'text-slate-100 bg-slate-950 border border-slate-800'
                              }`}
                            >
                              {prod.stock_actual} u.
                            </span>
                            {esCritico && (
                              <span title="Stock bajo (reponer)">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Botón de Acción Principal */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenStockModal(prod)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm shadow-blue-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <Boxes className="h-3.5 w-3.5" />
                            <span>Actualizar Stock</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pie de Tabla con Resumen */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-800 bg-slate-950 px-4 py-3 text-xs text-slate-400 gap-2">
            <div>
              Mostrando <strong className="text-slate-200">{filteredProductos.length}</strong> de{' '}
              <strong className="text-slate-200">{productos.length}</strong> productos en inventario
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span>Stock normal</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                <span>Stock crítico (≤ 5 u.)</span>
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Industrial */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <p>Aberturas Miño · Sistema de Gestión de Inventario Mayorista · Carpintería de Aluminio & Chapa</p>
      </footer>

      {/* Modal Interactivo de Actualización de Stock */}
      <StockModal
        isOpen={modalOpen}
        producto={selectedProducto}
        onClose={() => setModalOpen(false)}
        onConfirm={handleActualizarStock}
      />

      {/* Modal Informativo: Esquema SQL para Supabase */}
      {showSqlModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSqlModal(false);
          }}
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <FileCode className="h-5 w-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">
                  Instrucciones de Configuración en Supabase
                </h3>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs text-slate-300">
              <p>
                Para conectar este MVP a tu base de datos de <strong>Supabase</strong>, ve a tu panel de Supabase &gt; <strong>SQL Editor</strong> y pega el siguiente script:
              </p>
              <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-blue-300">
{`-- Crear tabla productos para Aberturas Miño
create table if not exists public.productos (
  id bigint generated by default as identity primary key,
  codigo_sku text not null unique,
  nombre text not null,
  linea text not null,
  tipo text not null,
  precio_mayorista numeric(12, 2) not null default 0.00,
  stock_actual integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS y politicas de lectura/actualizacion
alter table public.productos enable row level security;

create policy "Permitir lectura publica" on public.productos for select using (true);
create policy "Permitir actualizacion stock" on public.productos for update using (true);
create policy "Permitir insercion" on public.productos for insert with check (true);`}
              </pre>
              <div className="rounded-lg bg-slate-950 border border-slate-800 p-3 space-y-1">
                <p className="font-semibold text-slate-200">Variables de entorno requeridas:</p>
                <code className="block text-[11px] font-mono text-blue-400">NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co</code>
                <code className="block text-[11px] font-mono text-blue-400">NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key</code>
              </div>
            </div>
            <div className="flex justify-end border-t border-slate-800 bg-slate-950 px-6 py-3">
              <button
                onClick={() => setShowSqlModal(false)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
