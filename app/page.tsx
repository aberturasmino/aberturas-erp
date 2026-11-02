'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  X,
  LogOut,
  User,
  Plus,
  Trash2,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import {
  supabase,
  Producto,
  isSupabaseConfigured,
  getLocalDemoStock,
  saveLocalDemoStock,
  INITIAL_PRODUCTOS,
  getSessionUser,
  logoutUser,
  UserSession,
  createProducto,
  deleteProducto,
  updateProducto
} from '../lib/supabase';
import StockModal from '../components/StockModal';
import AddProductModal from '../components/AddProductModal';
import DeleteProductModal from '../components/DeleteProductModal';

interface ERPPageProps {
  onLogout?: () => void;
  currentUser?: UserSession | null;
}

export default function ERPPage({ onLogout, currentUser }: ERPPageProps) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isUsingDemo, setIsUsingDemo] = useState<boolean>(false);
  const [user, setUser] = useState<UserSession | null>(currentUser || null);

  // Búsqueda y Filtro
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [soloStockBajo, setSoloStockBajo] = useState<boolean>(false);

  // Modales
  const [stockModalOpen, setStockModalOpen] = useState<boolean>(false);
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);

  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const [productoToDelete, setProductoToDelete] = useState<Producto | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;

  // Carga inicial
  useEffect(() => {
    cargarProductos();
    cargarSesion();
  }, []);

  const cargarSesion = async () => {
    if (!currentUser) {
      const activeUser = await getSessionUser();
      setUser(activeUser);
    }
  };

  const handleLogoutClick = async () => {
    await logoutUser();
    setUser(null);
    if (onLogout) {
      onLogout();
    } else if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const cargarProductos = async () => {
    setIsLoading(true);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('productos')
          .select('id, codigo, descripcion, cantidad, precio_venta')
          .order('id', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          setProductos(data);
          setIsUsingDemo(false);
        } else {
          setProductos(INITIAL_PRODUCTOS);
          setIsUsingDemo(false);
        }
      } catch (err: any) {
        console.warn('Conectando a almacenamiento local:', err);
        const demoData = getLocalDemoStock();
        setProductos(demoData);
        setIsUsingDemo(true);
      } finally {
        setIsLoading(false);
      }
    } else {
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
    showToast('Inventario y precios sincronizados correctamente');
  };

  // Actualización de stock y precio de venta
  const handleOpenStockModal = (producto: Producto) => {
    setSelectedProducto(producto);
    setStockModalOpen(true);
  };

  const handleActualizarStock = async (
    productoId: number | string,
    nuevoStock: number,
    cantidadAjustada: number,
    operacion: 'sumar' | 'restar',
    nuevoPrecioVenta?: number
  ) => {
    const payload: Partial<Producto> = {
      cantidad: nuevoStock,
    };
    if (typeof nuevoPrecioVenta === 'number') {
      payload.precio_venta = nuevoPrecioVenta;
    }

    if (isSupabaseConfigured && !isUsingDemo) {
      const { error } = await supabase
        .from('productos')
        .update(payload)
        .eq('id', productoId);

      if (error) throw new Error(error.message);
    }

    setProductos((prev) => {
      const updated = prev.map((p) =>
        p.id === productoId ? { ...p, ...payload } : p
      );
      if (isUsingDemo) {
        saveLocalDemoStock(updated);
      }
      return updated;
    });

    const accionTexto = operacion === 'sumar' ? 'ingresaron' : 'retiraron';
    showToast(
      `Se ${accionTexto} ${cantidadAjustada} u. ${
        nuevoPrecioVenta ? `(Precio: $ ${nuevoPrecioVenta.toLocaleString('es-AR')})` : ''
      }`
    );
  };

  // Creación de perfil nuevo (codigo, descripcion, cantidad, precio_venta)
  const handleCrearProducto = async (nuevo: Omit<Producto, 'id'>) => {
    const creado = await createProducto(nuevo);
    setProductos((prev) => [creado, ...prev]);
    showToast(`Perfil ${creado.codigo} agregado al inventario`);
  };

  // Eliminación de perfil
  const handleConfirmarEliminacion = async (productoId: number | string) => {
    await deleteProducto(productoId);
    setProductos((prev) => prev.filter((p) => p.id !== productoId));
    showToast('Perfil eliminado correctamente');
  };

  const handleOpenDeleteSingle = (producto: Producto) => {
    setProductoToDelete(producto);
    setDeleteModalOpen(true);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  };

  // Filtrado reactivo por CÓDIGO o DESCRIPCIÓN
  const filteredProductos = useMemo(() => {
    return productos.filter((p) => {
      const matchesSearch =
        p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.descripcion.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesBajoStock = !soloStockBajo || p.cantidad <= 5;

      return matchesSearch && matchesBajoStock;
    });
  }, [productos, searchTerm, soloStockBajo]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredProductos.length / itemsPerPage));
  const paginatedProductos = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProductos.slice(start, start + itemsPerPage);
  }, [filteredProductos, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, soloStockBajo]);

  // Métricas de depósito
  const totalCodigos = productos.length;
  const totalUnidades = productos.reduce((acc, curr) => acc + curr.cantidad, 0);
  const totalStockBajo = productos.filter((p) => p.cantidad <= 5).length;
  const valorizacionInventario = productos.reduce(
    (acc, curr) => acc + curr.cantidad * (curr.precio_venta || 0),
    0
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Notificación Toast */}
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

      {/* Cabecera Limpia */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-black text-base shadow-md shadow-blue-900/30 border border-blue-400/30">
              AM
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white whitespace-nowrap">
                Inventario & Precios de Perfiles
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Aberturas Miño · Remitos de Proveedores y Lista de Venta Mayorista
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

            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <span className="hidden md:block text-xs font-medium text-slate-300 truncate max-w-[150px]">
                  {user.email}
                </span>
                <button
                  onClick={handleLogoutClick}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (onLogout) onLogout();
                  else if (typeof window !== 'undefined') window.location.href = '/login';
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-colors"
              >
                <User className="h-3.5 w-3.5" />
                <span>Ingresar</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Métricas de Remitos & Valorización */}
        <section aria-label="Resumen de Inventario" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
              <span className="font-semibold uppercase tracking-wider">Perfiles en Catálogo</span>
              <Package className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
              {totalCodigos}
            </div>
            <span className="text-[11px] text-slate-500">Códigos registrados</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
              <span className="font-semibold uppercase tracking-wider">Unidades Totales</span>
              <Boxes className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
              {totalUnidades} <span className="text-sm font-normal text-slate-400">productos</span>
            </div>
            <span className="text-[11px] text-slate-500">En depósito central</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
              <span className="font-semibold uppercase tracking-wider">Stock Crítico</span>
              <AlertTriangle className={`h-4 w-4 ${totalStockBajo > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
            </div>
            <div className={`text-2xl font-bold font-mono tabular-nums ${totalStockBajo > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
              {totalStockBajo}
            </div>
            <span className="text-[11px] text-slate-500">Perfiles con ≤ 5 unidades</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
              <span className="font-semibold uppercase tracking-wider">Valorización Stock</span>
              <DollarSign className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums truncate">
              $ {valorizacionInventario.toLocaleString('es-AR')}
            </div>
            <span className="text-[11px] text-slate-500">Total a precio venta mayorista</span>
          </div>
        </section>

        {/* Búsqueda y Filtro Rápido */}
        <section aria-label="Búsqueda" className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por código (ej. 6080.NEGRO) o descripción técnica..."
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

            <button
              type="button"
              onClick={() => setSoloStockBajo(!soloStockBajo)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                soloStockBajo
                  ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                  : 'border-slate-700 bg-slate-950 text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              <span>Solo Crítico (≤ 5 u.)</span>
            </button>
          </div>
        </section>

        {/* Acciones Superiores de Tabla */}
        <section aria-label="Acciones de Perfiles" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-900/30 transition-all active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span>Agregar Producto</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setProductoToDelete(null);
                setDeleteModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400 text-slate-300 text-xs font-bold transition-all active:scale-[0.98]"
            >
              <Trash2 className="h-4 w-4 text-red-400" />
              <span>Eliminar Producto</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Mostrando <strong className="text-slate-200">{filteredProductos.length}</strong> de{' '}
            <strong className="text-slate-200">{productos.length}</strong> perfiles
          </div>
        </section>

        {/* TABLA DE INVENTARIO CON 4 COLUMNAS DE DATOS: CÓDIGO, DESCRIPCIÓN, CANTIDAD, PRECIO VENTA */}
        <section aria-label="Tabla de Perfiles de Aluminio" className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider font-mono">
                  <th scope="col" className="py-3.5 px-4 w-40">CÓDIGO</th>
                  <th scope="col" className="py-3.5 px-4">DESCRIPCIÓN</th>
                  <th scope="col" className="py-3.5 px-4 text-center w-32">CANTIDAD</th>
                  <th scope="col" className="py-3.5 px-4 text-right w-40">PRECIO VENTA</th>
                  <th scope="col" className="py-3.5 px-4 text-right w-44">GESTIÓN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-4 px-4"><div className="h-4 w-28 bg-slate-800 rounded"></div></td>
                      <td className="py-4 px-4"><div className="h-4 w-96 bg-slate-800 rounded"></div></td>
                      <td className="py-4 px-4 text-center"><div className="h-4 w-12 bg-slate-800 rounded mx-auto"></div></td>
                      <td className="py-4 px-4 text-right"><div className="h-4 w-20 bg-slate-800 rounded ml-auto"></div></td>
                      <td className="py-4 px-4 text-right"><div className="h-7 w-28 bg-slate-800 rounded ml-auto"></div></td>
                    </tr>
                  ))
                ) : paginatedProductos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <Package className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-300">
                        No se encontraron perfiles con el criterio de búsqueda
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Verifica el código o agrega uno nuevo con el botón superior.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedProductos.map((prod) => {
                    const esCritico = prod.cantidad <= 5;
                    const precio = prod.precio_venta ?? 0;
                    return (
                      <tr
                        key={prod.id}
                        className="hover:bg-slate-800/50 transition-colors group"
                      >
                        {/* 1. CÓDIGO */}
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-400 whitespace-nowrap">
                          {prod.codigo}
                        </td>

                        {/* 2. DESCRIPCIÓN */}
                        <td className="py-3.5 px-4 font-medium text-slate-200">
                          {prod.descripcion}
                        </td>

                        {/* 3. CANTIDAD */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap font-mono tabular-nums">
                          <div className="inline-flex items-center gap-1.5">
                            <span
                              className={`text-sm font-bold px-2.5 py-0.5 rounded ${
                                esCritico
                                  ? 'bg-amber-950 text-amber-400 border border-amber-800 font-extrabold'
                                  : 'text-slate-100 bg-slate-950 border border-slate-800'
                              }`}
                            >
                              {prod.cantidad} u.
                            </span>
                            {esCritico && (
                              <span title="Stock bajo (reponer remito)">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 4. PRECIO VENTA */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-bold text-emerald-400 tabular-nums">
                          {precio > 0 ? (
                            `$ ${precio.toLocaleString('es-AR')}`
                          ) : (
                            <span className="text-slate-500 font-normal text-[11px]">A cotizar</span>
                          )}
                        </td>

                        {/* GESTIÓN (Actualizar Stock & Precio / Eliminar) */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenStockModal(prod)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm shadow-blue-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                              <Boxes className="h-3.5 w-3.5" />
                              <span>Ajustar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenDeleteSingle(prod)}
                              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Eliminar este perfil"
                              aria-label={`Eliminar ${prod.codigo}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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

          {/* Paginación */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-800 bg-slate-950 px-4 py-3 text-xs text-slate-400 gap-3">
            <div>
              Página <strong className="text-slate-200">{currentPage}</strong> de{' '}
              <strong className="text-slate-200">{totalPages}</strong>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5 font-mono">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 rounded border border-slate-800 bg-slate-900 text-slate-300 disabled:opacity-40 hover:bg-slate-800"
                >
                  Anterior
                </button>
                <span className="px-2 text-slate-500">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 rounded border border-slate-800 bg-slate-900 text-slate-300 disabled:opacity-40 hover:bg-slate-800"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Pie de página */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <p>Aberturas Miño · Control de Perfiles de Aluminio, Stock y Lista Mayorista</p>
      </footer>

      {/* Modal de Stock y Precio */}
      <StockModal
        isOpen={stockModalOpen}
        producto={selectedProducto}
        onClose={() => setStockModalOpen(false)}
        onConfirm={handleActualizarStock}
      />

      {/* Modal de Agregar Producto */}
      <AddProductModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleCrearProducto}
      />

      {/* Modal de Eliminar Producto */}
      <DeleteProductModal
        isOpen={deleteModalOpen}
        producto={productoToDelete}
        productosDisponibles={productos}
        onClose={() => {
          setDeleteModalOpen(false);
          setProductoToDelete(null);
        }}
        onConfirmDelete={handleConfirmarEliminacion}
      />
    </div>
  );
}
