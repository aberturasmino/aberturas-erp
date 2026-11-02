import { createClient } from '@supabase/supabase-js';

// Duración estricta de la sesión: 2 horas (7200 segundos)
export const SESSION_MAX_DURATION_SECONDS = 2 * 60 * 60; // 7200s
export const SESSION_MAX_DURATION_MS = SESSION_MAX_DURATION_SECONDS * 1000;

// --- MODELOS DE DATOS ---

// 1. Estructura de perfiles de aluminio + Precio Venta
export interface Producto {
  id: number | string;
  codigo: string;          // Cadena identificadora y color (ej. '6080.NEGRO')
  descripcion: string;     // Especificación técnica detallada del perfil
  cantidad: number;        // Unidades en stock (número entero)
  precio_venta?: number;   // Precio de venta mayorista unitario en ARS
  created_at?: string;
}

// 2. Maestro de Clientes
export type CondicionIva =
  | 'Responsable Inscripto'
  | 'Monotributo'
  | 'Exento'
  | 'Consumidor Final';

export interface Cliente {
  id: number | string;
  razon_social: string;
  cuit: string;
  telefono: string;
  direccion: string;
  email: string;
  condicion_iva: CondicionIva;
  created_at?: string;
}

// 3. Motor de Pedidos (Compras y Ventas)
export type TipoPedido = 'COMPRA' | 'VENTA';
export type EstadoPedido = 'PENDIENTE' | 'COMPLETADO' | 'CANCELADO';

export interface PedidoDetalle {
  id?: number | string;
  pedido_id?: number | string;
  producto_id: number | string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  producto?: Producto;
  created_at?: string;
}

export interface Pedido {
  id: number | string;
  cliente_id: number | string;
  tipo: TipoPedido;
  estado: EstadoPedido;
  total_pedido: number;
  notas?: string;
  created_at?: string;
  cliente?: Cliente;
  detalles?: PedidoDetalle[];
}

export interface UserSession {
  email: string;
  role?: string;
  id?: string;
  loginTimestamp: number;
  expiresAt: number;
}

// Variables de entorno para Next.js y Vite
const supabaseUrl =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
  '';

const supabaseAnonKey =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
  '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.includes('supabase.co') &&
  !supabaseUrl.includes('your-project')
);

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://dummy-project.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'dummy-anon-key'
);

// --- CATÁLOGOS INICIALES ---

export const INITIAL_PRODUCTOS: Producto[] = [
  {
    id: 1,
    codigo: '6080.NEGRO',
    descripcion: 'JAMBA DE MARCO CORREDIZA DE 3 HOJAS Kg/T 11,08 Negro',
    cantidad: 24,
    precio_venta: 28500,
  },
  {
    id: 2,
    codigo: '6070.BLANCO',
    descripcion: 'MARCO SUPERIOR CORREDIZA 2 HOJAS MODENA Kg/T 9,45 Blanco Semi Mate',
    cantidad: 36,
    precio_venta: 24200,
  },
  {
    id: 3,
    codigo: '6065.NEGRO',
    descripcion: 'ZOCALO ALTO CORREDIZA 2 HOJAS MODENA Kg/T 8,32 Negro microtexturado',
    cantidad: 14,
    precio_venta: 21900,
  },
  {
    id: 4,
    codigo: '6061.ANOD',
    descripcion: 'HOJA CORREDIZA VIDRIO ENTERO MODENA Kg/T 7,15 Anodizado Natural',
    cantidad: 42,
    precio_venta: 19800,
  },
  {
    id: 5,
    codigo: '6075.BLANCO',
    descripcion: 'UMBRAL CORREDIZA 2 HOJAS CON GUIA DE ACERO INOX Kg/T 12,30 Blanco',
    cantidad: 8,
    precio_venta: 34500,
  },
  {
    id: 6,
    codigo: '6082.NEGRO',
    descripcion: 'PARANTE CENTRAL REFORZADO P/ CORREDIZA MODENA Kg/T 9,80 Negro',
    cantidad: 3,
    precio_venta: 26700,
  },
  {
    id: 12,
    codigo: 'A30-01.NEGRO',
    descripcion: 'MARCO PERIMETRAL CORREDIZA A30 NEW ALTA PRESTACION Kg/T 14,20 Negro',
    cantidad: 16,
    precio_venta: 48900,
  },
  {
    id: 18,
    codigo: 'HER-01.BLANCO',
    descripcion: 'MARCO DE VENTANA HERRERO 2 HOJAS Kg/T 5,40 Blanco',
    cantidad: 58,
    precio_venta: 13900,
  },
  {
    id: 24,
    codigo: 'RPT-01.BLANCO',
    descripcion: 'MARCO BATIENTE CON RUPTURA DE PUENTE TERMICO RPT 65mm Kg/T 15,20 Blanco',
    cantidad: 12,
    precio_venta: 62000,
  },
];

export const INITIAL_CLIENTES: Cliente[] = [
  {
    id: 1,
    razon_social: 'Vidriería & Carpintería San Martín S.R.L.',
    cuit: '30-71458921-8',
    telefono: '+54 11 4752-9901',
    direccion: 'Av. Libertador San Martín 2340, San Martín, Bs. As.',
    email: 'compras@vidrieriasanmartin.com.ar',
    condicion_iva: 'Responsable Inscripto',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 2,
    razon_social: 'Construcciones del Litoral S.A.',
    cuit: '30-68912445-3',
    telefono: '+54 342 458-1200',
    direccion: 'Bv. Pellegrini 3100, Santa Fe Capital',
    email: 'obras@constructoradellitoral.com',
    condicion_iva: 'Responsable Inscripto',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 3,
    razon_social: 'Estudio Arq. Marcelo Rossi & Asociados',
    cuit: '20-28491033-4',
    telefono: '+54 11 5590-3321',
    direccion: 'Calle 14 Nº 845, La Plata, Bs. As.',
    email: 'contacto@rossiarquitectura.com.ar',
    condicion_iva: 'Monotributo',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 4,
    razon_social: 'Aluar Extrusión S.A. (Proveedor)',
    cuit: '30-50001002-3',
    telefono: '+54 11 4310-0000',
    direccion: 'Av. Corrientes 327, CABA',
    email: 'ventas@aluar.com.ar',
    condicion_iva: 'Responsable Inscripto',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
];

export const INITIAL_PEDIDOS: Pedido[] = [
  {
    id: 101,
    cliente_id: 1,
    tipo: 'VENTA',
    estado: 'COMPLETADO',
    total_pedido: 342000,
    notas: 'Entrega en taller de carpintería San Martín. Remito salida #0891.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    cliente: INITIAL_CLIENTES[0],
    detalles: [
      {
        id: 1,
        pedido_id: 101,
        producto_id: 1,
        cantidad: 10,
        precio_unitario: 28500,
        subtotal: 285000,
        producto: INITIAL_PRODUCTOS[0],
      },
      {
        id: 2,
        pedido_id: 101,
        producto_id: 3,
        cantidad: 2,
        precio_unitario: 21900,
        subtotal: 43800,
        producto: INITIAL_PRODUCTOS[2],
      },
      {
        id: 3,
        pedido_id: 101,
        producto_id: 18,
        cantidad: 1,
        precio_unitario: 13200,
        subtotal: 13200,
        producto: INITIAL_PRODUCTOS[7],
      },
    ],
  },
  {
    id: 102,
    cliente_id: 4,
    tipo: 'COMPRA',
    estado: 'COMPLETADO',
    total_pedido: 985000,
    notas: 'Remito proveedor Aluar #49202. Reposición perfiles Módena y A30.',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    cliente: INITIAL_CLIENTES[3],
    detalles: [
      {
        id: 4,
        pedido_id: 102,
        producto_id: 12,
        cantidad: 20,
        precio_unitario: 41000,
        subtotal: 820000,
        producto: INITIAL_PRODUCTOS[6],
      },
      {
        id: 5,
        pedido_id: 102,
        producto_id: 4,
        cantidad: 10,
        precio_unitario: 16500,
        subtotal: 165000,
        producto: INITIAL_PRODUCTOS[3],
      },
    ],
  },
];

const LOCAL_STORAGE_KEY = 'aberturas_mino_remitos_perfiles_v4';
const CLIENTES_STORAGE_KEY = 'aberturas_mino_clientes_v1';
const PEDIDOS_STORAGE_KEY = 'aberturas_mino_pedidos_v1';
const AUTH_STORAGE_KEY = 'aberturas_mino_auth_session';

// --- PERSISTENCIA LOCAL (DEMO / FALLBACK) ---

export function getLocalDemoStock(): Producto[] {
  if (typeof window === 'undefined') return INITIAL_PRODUCTOS;
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTOS));
    return INITIAL_PRODUCTOS;
  } catch (e) {
    return INITIAL_PRODUCTOS;
  }
}

export function saveLocalDemoStock(productos: Producto[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(productos));
  } catch (e) {
    console.error('Error saving local demo stock', e);
  }
}

export function getLocalDemoClientes(): Cliente[] {
  if (typeof window === 'undefined') return INITIAL_CLIENTES;
  try {
    const saved = localStorage.getItem(CLIENTES_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    localStorage.setItem(CLIENTES_STORAGE_KEY, JSON.stringify(INITIAL_CLIENTES));
    return INITIAL_CLIENTES;
  } catch (e) {
    return INITIAL_CLIENTES;
  }
}

export function saveLocalDemoClientes(clientes: Cliente[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CLIENTES_STORAGE_KEY, JSON.stringify(clientes));
  } catch (e) {
    console.error('Error saving local demo clientes', e);
  }
}

export function getLocalDemoPedidos(): Pedido[] {
  if (typeof window === 'undefined') return INITIAL_PEDIDOS;
  try {
    const saved = localStorage.getItem(PEDIDOS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    localStorage.setItem(PEDIDOS_STORAGE_KEY, JSON.stringify(INITIAL_PEDIDOS));
    return INITIAL_PEDIDOS;
  } catch (e) {
    return INITIAL_PEDIDOS;
  }
}

export function saveLocalDemoPedidos(pedidos: Pedido[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PEDIDOS_STORAGE_KEY, JSON.stringify(pedidos));
  } catch (e) {
    console.error('Error saving local demo pedidos', e);
  }
}

// --- AUTENTICACIÓN ---

export async function getSessionUser(): Promise<UserSession | null> {
  const now = Date.now();
  if (isSupabaseConfigured) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        return {
          email: session.user.email,
          id: session.user.id,
          role: 'Encargado de Depósito',
          loginTimestamp: now,
          expiresAt: now + SESSION_MAX_DURATION_MS,
        };
      }
    } catch (_) {}
  }
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (_) {}
    }
  }
  return null;
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const now = Date.now();
  const expiresAt = now + SESSION_MAX_DURATION_MS;

  if (isSupabaseConfigured) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return { success: false, error: error.message };
    }

    const sessionData: UserSession = {
      email,
      role: 'Encargado de Depósito',
      id: 'supabase-user',
      loginTimestamp: now,
      expiresAt: expiresAt,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData));
      document.cookie = `sb-demo-auth=true; path=/; max-age=${SESSION_MAX_DURATION_SECONDS}; SameSite=Lax`;
      document.cookie = `sb-session-expires=${expiresAt}; path=/; max-age=${SESSION_MAX_DURATION_SECONDS}; SameSite=Lax`;
    }

    return { success: true };
  }

  if (password.length < 6) {
    return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
  }

  const demoSession: UserSession = {
    email,
    role: email.includes('admin') ? 'Administrador General' : 'Encargado de Depósito',
    id: 'demo-user-01',
    loginTimestamp: now,
    expiresAt: expiresAt,
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(demoSession));
    document.cookie = `sb-demo-auth=true; path=/; max-age=${SESSION_MAX_DURATION_SECONDS}; SameSite=Lax`;
    document.cookie = `sb-session-expires=${expiresAt}; path=/; max-age=${SESSION_MAX_DURATION_SECONDS}; SameSite=Lax`;
  }

  return { success: true };
}

export async function logoutUser(expiredByTimeout = false): Promise<void> {
  if (isSupabaseConfigured) {
    await supabase.auth.signOut();
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    document.cookie = `sb-demo-auth=; path=/; max-age=0`;
    document.cookie = `sb-session-expires=; path=/; max-age=0`;
    if (expiredByTimeout) {
      sessionStorage.setItem('aberturas_session_expired', 'true');
    }
  }
}

// --- CRUD PRODUCTOS ---

export async function getProductos(): Promise<Producto[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('productos')
      .select('id, codigo, descripcion, cantidad, precio_venta')
      .order('id', { ascending: false });
    if (error) throw new Error(error.message);
    if (data && data.length > 0) return data;
  }
  return getLocalDemoStock();
}

export async function createProducto(nuevo: Omit<Producto, 'id'>): Promise<Producto> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('productos')
      .insert([nuevo])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
  const current = getLocalDemoStock();
  const id = Date.now();
  const created: Producto = { ...nuevo, id };
  saveLocalDemoStock([created, ...current]);
  return created;
}

export async function updateProducto(id: number | string, cambios: Partial<Producto>): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('productos').update(cambios).eq('id', id);
    if (error) throw new Error(error.message);
  }
  const current = getLocalDemoStock();
  saveLocalDemoStock(current.map((p) => (p.id === id ? { ...p, ...cambios } : p)));
}

export async function deleteProducto(id: number | string): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('productos').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
  const current = getLocalDemoStock();
  saveLocalDemoStock(current.filter((p) => p.id !== id));
}

// --- CRUD CLIENTES ---

export async function getClientes(): Promise<Cliente[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('razon_social', { ascending: true });
    if (error) throw new Error(error.message);
    if (data && data.length > 0) return data;
  }
  return getLocalDemoClientes();
}

export async function createCliente(nuevo: Omit<Cliente, 'id'>): Promise<Cliente> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('clientes')
      .insert([nuevo])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
  const current = getLocalDemoClientes();
  const created: Cliente = { ...nuevo, id: Date.now(), created_at: new Date().toISOString() };
  saveLocalDemoClientes([created, ...current]);
  return created;
}

export async function updateCliente(id: number | string, cambios: Partial<Cliente>): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('clientes').update(cambios).eq('id', id);
    if (error) throw new Error(error.message);
  }
  const current = getLocalDemoClientes();
  saveLocalDemoClientes(current.map((c) => (c.id === id ? { ...c, ...cambios } : c)));
}

export async function deleteCliente(id: number | string): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
  const current = getLocalDemoClientes();
  saveLocalDemoClientes(current.filter((c) => c.id !== id));
}

// --- MOTOR TRANSACCIONAL DE PEDIDOS ---

export interface NuevaLineaPedido {
  producto_id: number | string;
  cantidad: number;
  precio_unitario: number;
}

export interface NuevoPedidoInput {
  cliente_id: number | string;
  tipo: TipoPedido;
  estado?: EstadoPedido;
  notas?: string;
  lineas: NuevaLineaPedido[];
}

export async function getPedidos(): Promise<Pedido[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          id,
          cliente_id,
          tipo,
          estado,
          total_pedido,
          notas,
          created_at,
          clientes:cliente_id (id, razon_social, cuit, condicion_iva, telefono, email),
          pedidos_detalle (
            id,
            pedido_id,
            producto_id,
            cantidad,
            precio_unitario,
            subtotal,
            productos:producto_id (id, codigo, descripcion)
          )
        `)
        .order('id', { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        return data.map((p: any) => ({
          id: p.id,
          cliente_id: p.cliente_id,
          tipo: p.tipo,
          estado: p.estado,
          total_pedido: Number(p.total_pedido),
          notas: p.notas,
          created_at: p.created_at,
          cliente: p.clientes,
          detalles: (p.pedidos_detalle || []).map((d: any) => ({
            id: d.id,
            pedido_id: d.pedido_id,
            producto_id: d.producto_id,
            cantidad: d.cantidad,
            precio_unitario: Number(d.precio_unitario),
            subtotal: Number(d.subtotal),
            producto: d.productos,
          })),
        }));
      }
    } catch (e) {
      console.warn('Error reading pedidos from Supabase, using local demo fallback', e);
    }
  }

  return getLocalDemoPedidos();
}

/**
 * Transacción Completa de Pedidos:
 * 1. Inserta la cabecera del pedido
 * 2. Inserta cada línea de pedidos_detalle
 * 3. Actualiza el stock en la tabla productos (SUMA en COMPRA, RESTA en VENTA)
 */
export async function registrarPedidoTransaccional(input: NuevoPedidoInput): Promise<Pedido> {
  const { cliente_id, tipo, estado = 'COMPLETADO', notas = '', lineas } = input;

  if (!lineas || lineas.length === 0) {
    throw new Error('El pedido debe tener al menos una línea de producto.');
  }

  // Calcular totales
  const lineasCalculadas = lineas.map((l) => ({
    ...l,
    subtotal: l.cantidad * l.precio_unitario,
  }));
  const totalPedido = lineasCalculadas.reduce((acc, curr) => acc + curr.subtotal, 0);

  // 1. MODO SUPABASE REAL
  if (isSupabaseConfigured) {
    // A. Insertar cabecera en pedidos
    const { data: pedidoData, error: pedidoError } = await supabase
      .from('pedidos')
      .insert([
        {
          cliente_id,
          tipo,
          estado,
          total_pedido: totalPedido,
          notas,
        },
      ])
      .select()
      .single();

    if (pedidoError) {
      throw new Error(`Error al crear pedido: ${pedidoError.message}`);
    }

    const pedidoId = pedidoData.id;

    // B. Insertar líneas en pedidos_detalle
    const detallesPayload = lineasCalculadas.map((l) => ({
      pedido_id: pedidoId,
      producto_id: l.producto_id,
      cantidad: l.cantidad,
      precio_unitario: l.precio_unitario,
      subtotal: l.subtotal,
    }));

    const { error: detallesError } = await supabase
      .from('pedidos_detalle')
      .insert(detallesPayload);

    if (detallesError) {
      throw new Error(`Error al insertar detalles: ${detallesError.message}`);
    }

    // C. Actualizar Stock en tabla productos
    for (const l of lineasCalculadas) {
      const { data: prodData, error: getProdError } = await supabase
        .from('productos')
        .select('cantidad')
        .eq('id', l.producto_id)
        .single();

      if (!getProdError && prodData) {
        const stockActual = prodData.cantidad;
        const nuevoStock =
          tipo === 'COMPRA'
            ? stockActual + l.cantidad
            : Math.max(0, stockActual - l.cantidad);

        await supabase
          .from('productos')
          .update({ cantidad: nuevoStock })
          .eq('id', l.producto_id);
      }
    }

    // Retornar pedido creado
    return {
      id: pedidoId,
      cliente_id,
      tipo,
      estado,
      total_pedido: totalPedido,
      notas,
      created_at: pedidoData.created_at || new Date().toISOString(),
    };
  }

  // 2. MODO DEMO / LOCALSTORAGE FALLBACK
  const stockLocal = getLocalDemoStock();
  const clientesLocal = getLocalDemoClientes();
  const pedidosLocal = getLocalDemoPedidos();

  const clienteEncontrado = clientesLocal.find((c) => String(c.id) === String(cliente_id));
  const pedidoId = Date.now();
  const fecha = new Date().toISOString();

  // A. Actualizar stock de cada producto en memoria local
  const stockActualizado = stockLocal.map((prod) => {
    const lineaMatch = lineasCalculadas.find((l) => String(l.producto_id) === String(prod.id));
    if (lineaMatch) {
      const variacion = tipo === 'COMPRA' ? lineaMatch.cantidad : -lineaMatch.cantidad;
      return {
        ...prod,
        cantidad: Math.max(0, prod.cantidad + variacion),
      };
    }
    return prod;
  });
  saveLocalDemoStock(stockActualizado);

  // B. Construir objeto pedido completo
  const detallesCompletos: PedidoDetalle[] = lineasCalculadas.map((l, idx) => {
    const prod = stockActualizado.find((p) => String(p.id) === String(l.producto_id));
    return {
      id: pedidoId + idx + 1,
      pedido_id: pedidoId,
      producto_id: l.producto_id,
      cantidad: l.cantidad,
      precio_unitario: l.precio_unitario,
      subtotal: l.subtotal,
      producto: prod,
      created_at: fecha,
    };
  });

  const nuevoPedido: Pedido = {
    id: pedidoId,
    cliente_id,
    tipo,
    estado,
    total_pedido: totalPedido,
    notas,
    created_at: fecha,
    cliente: clienteEncontrado,
    detalles: detallesCompletos,
  };

  saveLocalDemoPedidos([nuevoPedido, ...pedidosLocal]);
  return nuevoPedido;
}
