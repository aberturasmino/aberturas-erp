'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Trash2,
  Edit2,
  Building2,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  BadgeCheck,
  ShieldAlert
} from 'lucide-react';
import {
  Cliente,
  CondicionIva,
  getClientes,
  createCliente,
  updateCliente,
  deleteCliente,
  isSupabaseConfigured
} from '../../lib/supabase';

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filtroIva, setFiltroIva] = useState<string>('todos');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modales
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null);

  // Formulario de Cliente
  const [razonSocial, setRazonSocial] = useState<string>('');
  const [cuit, setCuit] = useState<string>('');
  const [telefono, setTelefono] = useState<string>('');
  const [direccion, setDireccion] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [condicionIva, setCondicionIva] = useState<CondicionIva>('Responsable Inscripto');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    setIsLoading(true);
    try {
      const data = await getClientes();
      setClientes(data);
    } catch (err: any) {
      console.error('Error al cargar clientes:', err);
      showToast('Error al conectar con la base de clientes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await cargarClientes();
    setIsRefreshing(false);
    showToast('Padrón de clientes sincronizado correctamente');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((c) => (c === msg ? null : c));
    }, 4000);
  };

  const handleOpenCreateModal = () => {
    setEditingCliente(null);
    setRazonSocial('');
    setCuit('');
    setTelefono('');
    setDireccion('');
    setEmail('');
    setCondicionIva('Responsable Inscripto');
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setRazonSocial(cliente.razon_social);
    setCuit(cliente.cuit);
    setTelefono(cliente.telefono || '');
    setDireccion(cliente.direccion || '');
    setEmail(cliente.email || '');
    setCondicionIva(cliente.condicion_iva);
    setFormError(null);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!razonSocial.trim()) {
      setFormError('La Razón Social o Nombre es obligatoria.');
      return;
    }
    if (!cuit.trim()) {
      setFormError('El número de CUIT o DNI es obligatorio.');
      return;
    }

    try {
      setIsSubmitting(true);

      if (editingCliente) {
        // Actualizar
        const cambios: Partial<Cliente> = {
          razon_social: razonSocial.trim(),
          cuit: cuit.trim(),
          telefono: telefono.trim(),
          direccion: direccion.trim(),
          email: email.trim(),
          condicion_iva: condicionIva,
        };
        await updateCliente(editingCliente.id, cambios);
        setClientes((prev) =>
          prev.map((c) => (c.id === editingCliente.id ? { ...c, ...cambios } : c))
        );
        showToast(`Cliente "${razonSocial.trim()}" actualizado correctamente`);
      } else {
        // Crear
        const nuevo = await createCliente({
          razon_social: razonSocial.trim(),
          cuit: cuit.trim(),
          telefono: telefono.trim(),
          direccion: direccion.trim(),
          email: email.trim(),
          condicion_iva: condicionIva,
        });
        setClientes((prev) => [nuevo, ...prev]);
        showToast(`Cliente "${nuevo.razon_social}" registrado con éxito`);
      }

      setModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'Error al guardar el cliente en Supabase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!clienteToDelete) return;
    try {
      await deleteCliente(clienteToDelete.id);
      setClientes((prev) => prev.filter((c) => c.id !== clienteToDelete.id));
      showToast(`Cliente "${clienteToDelete.razon_social}" eliminado`);
      setDeleteModalOpen(false);
      setClienteToDelete(null);
    } catch (err: any) {
      showToast(err?.message || 'Error al eliminar el cliente');
    }
  };

  // Filtrado reactivo
  const filteredClientes = useMemo(() => {
    return clientes.filter((c) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        c.razon_social.toLowerCase().includes(q) ||
        c.cuit.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.direccion.toLowerCase().includes(q);

      const matchesIva =
        filtroIva === 'todos' || c.condicion_iva.toLowerCase() === filtroIva.toLowerCase();

      return matchesSearch && matchesIva;
    });
  }, [clientes, searchTerm, filtroIva]);

  // Métricas
  const totalClientes = clientes.length;
  const totalRI = clientes.filter((c) => c.condicion_iva === 'Responsable Inscripto').length;
  const totalMono = clientes.filter((c) => c.condicion_iva === 'Monotributo').length;

  const getCondicionBadge = (condicion: CondicionIva) => {
    switch (condicion) {
      case 'Responsable Inscripto':
        return 'bg-blue-950 text-blue-300 border-blue-800/80';
      case 'Monotributo':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800/80';
      case 'Exento':
        return 'bg-purple-950 text-purple-300 border-purple-800/80';
      case 'Consumidor Final':
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Toast Feedback */}
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
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white whitespace-nowrap">
                Maestro de Clientes Mayoristas
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Aberturas Miño · Registro comercial, cuentas corrientes y condiciones fiscales
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
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-900/30 transition-all active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Cliente</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Métricas de Clientes */}
        <section aria-label="Estadísticas de Clientes" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
              <span className="font-semibold uppercase tracking-wider">Total de Clientes</span>
              <Building2 className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
              {totalClientes}
            </div>
            <span className="text-[11px] text-slate-500">Empresas y carpinterías activas</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
              <span className="font-semibold uppercase tracking-wider">Responsables Inscriptos</span>
              <BadgeCheck className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-blue-400 tabular-nums">
              {totalRI}
            </div>
            <span className="text-[11px] text-slate-500">Emisión de Factura A</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
              <span className="font-semibold uppercase tracking-wider">Monotributo / Otros</span>
              <FileText className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
              {totalMono}
            </div>
            <span className="text-[11px] text-slate-500">Talleres y particulares</span>
          </div>
        </section>

        {/* Buscador & Filtro por Condición IVA */}
        <section aria-label="Búsqueda de Clientes" className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por Razón Social, CUIT, Email o Dirección..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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

            {/* Filtros rápidos por IVA */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {['todos', 'Responsable Inscripto', 'Monotributo', 'Exento'].map((cond) => (
                <button
                  key={cond}
                  type="button"
                  onClick={() => setFiltroIva(cond)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border whitespace-nowrap transition-colors ${
                    filtroIva === cond
                      ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {cond === 'todos' ? 'Todos' : cond}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* TABLA INDUSTRIAL DE CLIENTES */}
        <section aria-label="Tabla de Clientes" className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
          {/* Indicador de scroll horizontal para móviles */}
          <div className="sm:hidden px-3 py-1.5 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>Desliza para ver CUIT, IVA y contacto</span>
            <span className="text-blue-400 font-bold">● Scroll</span>
          </div>

          <div className="overflow-x-auto touch-pan-x">
            <table className="w-full text-left text-[11px] sm:text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/90 text-slate-400 font-semibold uppercase tracking-wider font-mono">
                  <th scope="col" className="py-2.5 px-2.5 sm:px-3 sm:py-3 md:px-4 md:py-3.5 min-w-[180px]">RAZÓN SOCIAL</th>
                  <th scope="col" className="py-2.5 px-2.5 sm:px-3 sm:py-3 md:px-4 md:py-3.5 w-32 sm:w-36">CUIT / DNI</th>
                  <th scope="col" className="py-2.5 px-2.5 sm:px-3 sm:py-3 md:px-4 md:py-3.5 w-36 sm:w-44">CONDICIÓN IVA</th>
                  <th scope="col" className="py-2.5 px-2.5 sm:px-3 sm:py-3 md:px-4 md:py-3.5 min-w-[150px]">CONTACTO</th>
                  <th scope="col" className="py-2.5 px-2.5 sm:px-3 sm:py-3 md:px-4 md:py-3.5 min-w-[160px]">DIRECCIÓN</th>
                  <th scope="col" className="py-2.5 px-2.5 sm:px-3 sm:py-3 md:px-4 md:py-3.5 text-right w-24 sm:w-28">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-3 px-2.5 sm:px-3 sm:py-3 md:px-4 md:py-4"><div className="h-4 w-40 bg-slate-800 rounded"></div></td>
                      <td className="py-3 px-2.5 sm:px-3 sm:py-3 md:px-4 md:py-4"><div className="h-4 w-24 bg-slate-800 rounded"></div></td>
                      <td className="py-3 px-2.5 sm:px-3 sm:py-3 md:px-4 md:py-4"><div className="h-4 w-28 bg-slate-800 rounded"></div></td>
                      <td className="py-3 px-2.5 sm:px-3 sm:py-3 md:px-4 md:py-4"><div className="h-4 w-32 bg-slate-800 rounded"></div></td>
                      <td className="py-3 px-2.5 sm:px-3 sm:py-3 md:px-4 md:py-4"><div className="h-4 w-44 bg-slate-800 rounded"></div></td>
                      <td className="py-3 px-2.5 sm:px-3 sm:py-3 md:px-4 md:py-4 text-right"><div className="h-6 w-14 bg-slate-800 rounded ml-auto"></div></td>
                    </tr>
                  ))
                ) : filteredClientes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 px-4 text-center text-slate-400">
                      <Users className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-300">
                        No se encontraron clientes registrados
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Utiliza el botón "Nuevo Cliente" para agregar una nueva cuenta.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredClientes.map((cliente) => (
                    <tr
                      key={cliente.id}
                      className="hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* RAZÓN SOCIAL */}
                      <td className="py-2.5 px-2.5 sm:px-3 sm:py-3 md:px-4 md:py-3.5 font-bold text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-800 text-blue-400 border border-slate-700 shrink-0">
                            <Building2 className="h-3.5 w-3.5" />
                          </div>
                          <span>{cliente.razon_social}</span>
                        </div>
                      </td>

                      {/* CUIT */}
                      <td className="py-2.5 px-2.5 sm:px-3 sm:py-3 md:px-4 md:py-3.5 font-mono text-slate-300 font-medium whitespace-nowrap">
                        {cliente.cuit}
                      </td>

                      {/* CONDICIÓN IVA */}
                      <td className="py-2.5 px-2.5 sm:px-3 sm:py-3 md:px-4 md:py-3.5 whitespace-nowrap">
                        <span
                          className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded border ${getCondicionBadge(
                            cliente.condicion_iva
                          )}`}
                        >
                          {cliente.condicion_iva}
                        </span>
                      </td>

                      {/* CONTACTO */}
                      <td className="py-2.5 px-2.5 sm:px-3 sm:py-3 md:px-4 md:py-3.5 text-slate-300">
                        <div className="flex flex-col gap-0.5 text-xs">
                          {cliente.telefono && (
                            <span className="flex items-center gap-1.5 text-slate-300">
                              <Phone className="h-3 w-3 text-slate-500 shrink-0" />
                              <span>{cliente.telefono}</span>
                            </span>
                          )}
                          {cliente.email && (
                            <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                              <Mail className="h-3 w-3 text-slate-500 shrink-0" />
                              <span className="truncate max-w-[180px]">{cliente.email}</span>
                            </span>
                          )}
                          {!cliente.telefono && !cliente.email && (
                            <span className="text-slate-600 text-[11px]">Sin datos</span>
                          )}
                        </div>
                      </td>

                      {/* DIRECCIÓN */}
                      <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">
                        {cliente.direccion ? (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                            <span className="truncate">{cliente.direccion}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-[11px]">No registrada</span>
                        )}
                      </td>

                      {/* ACCIONES */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(cliente)}
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Editar cliente"
                            aria-label={`Editar ${cliente.razon_social}`}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setClienteToDelete(cliente);
                              setDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Eliminar cliente"
                            aria-label={`Eliminar ${cliente.razon_social}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-800 bg-slate-950 px-4 py-3 text-xs text-slate-400 flex items-center justify-between">
            <span>
              Total: <strong className="text-slate-200">{filteredClientes.length}</strong> clientes
            </span>
            <span className="font-mono text-[11px] text-slate-500">
              Aberturas Miño · Maestro Comercial
            </span>
          </div>
        </section>
      </main>

      {/* Modal de Alta / Edición de Cliente */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) setModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl text-slate-100">
            {/* Header del modal */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-tight text-white">
                    {editingCliente ? 'Modificar Cliente' : 'Nuevo Cliente Mayorista'}
                  </h2>
                  <span className="text-xs text-slate-400">Datos comerciales y de facturación</span>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                disabled={isSubmitting}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              {formError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Razón Social */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Razón Social o Nombre Completo *
                </label>
                <input
                  type="text"
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  placeholder="Ej. Vidriería San Martín S.R.L. / Arq. Marcelo Rossi"
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* CUIT y Condición IVA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    CUIT / DNI *
                  </label>
                  <input
                    type="text"
                    value={cuit}
                    onChange={(e) => setCuit(e.target.value)}
                    placeholder="Ej. 30-71458921-8"
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Condición IVA *
                  </label>
                  <select
                    value={condicionIva}
                    onChange={(e) => setCondicionIva(e.target.value as CondicionIva)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Responsable Inscripto">Responsable Inscripto</option>
                    <option value="Monotributo">Monotributo</option>
                    <option value="Exento">Exento</option>
                    <option value="Consumidor Final">Consumidor Final</option>
                  </select>
                </div>
              </div>

              {/* Teléfono y Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+54 11 4752-9901"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="compras@cliente.com.ar"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Dirección Comercial o de Obra
                </label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Ej. Av. Calchaquí 1890, Quilmes Oeste"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Botones */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={isSubmitting}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {isSubmitting
                      ? 'Guardando...'
                      : editingCliente
                      ? 'Guardar Cambios'
                      : 'Registrar Cliente'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Eliminación de Cliente */}
      {deleteModalOpen && clienteToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-md rounded-xl border border-red-500/30 bg-slate-900 p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">¿Eliminar Cliente?</h3>
                <span className="text-xs text-slate-400">Esta acción no se puede deshacer</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              ¿Estás seguro de que deseas eliminar la cuenta de{' '}
              <strong className="text-white font-semibold">"{clienteToDelete.razon_social}"</strong>{' '}
              (CUIT: {clienteToDelete.cuit}) del padrón comercial?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setClienteToDelete(null);
                }}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-500 px-4 py-2 text-xs font-semibold text-white"
              >
                <Trash2 className="h-4 w-4" />
                <span>Confirmar Eliminación</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
