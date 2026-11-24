import { createClient } from '@supabase/supabase-js';

// Duración estricta de la sesión: 2 horas (7200 segundos)
export const SESSION_MAX_DURATION_SECONDS = 2 * 60 * 60; // 7200s
export const SESSION_MAX_DURATION_MS = SESSION_MAX_DURATION_SECONDS * 1000;

// --- MODELOS DE DATOS ---

export type UnidadMedida = 'UNIDADES' | 'KG';

// 1. Estructura de perfiles de aluminio + Precio Venta + Unidad de Medida
export interface Producto {
  id: string;
  codigo: string; // ej. '6080.NEGRO', 'ALU-A30'
  descripcion: string; // Especificación técnica detallada
  cantidad: number; // numeric(12, 3): unidades enteras o kilogramos con decimales
  unidad_medida: UnidadMedida; // 'UNIDADES' | 'KG'
  precio_venta?: number; // Precio de venta mayorista unitario o por kg en ARS
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

// 3. Motor de Pedidos (Compras, Ventas y Presupuestos)
export type TipoPedido = 'COMPRA' | 'VENTA';
export type EstadoPedido = 'PENDIENTE' | 'PRESUPUESTO' | 'COMPLETADO' | 'CANCELADO';

export interface PedidoDetalle {
  id?: number | string;
  pedido_id?: string;
  producto_id?: string | null;
  material?: string | null;
  peso_kg?: number | null;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  producto?: Pick<Producto, 'id' | 'codigo' | 'descripcion' | 'unidad_medida'> &
    Partial<Producto>;
  created_at?: string;
}

export interface Pedido {
  id: string;
  cliente_id: number | string;
  tipo: TipoPedido;
  estado: EstadoPedido;
  subtotal: number;
  incluye_iva: boolean;
  monto_iva: number;
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

// Helper para redondear stock en KG a 3 decimales sin errores de punto flotante
export const roundKg = (value: number): number => Math.round(value * 1000) / 1000;

// --- CATÁLOGOS INICIALES (FALLBACK LOCAL) ---

export const INITIAL_PRODUCTOS: Producto[] = [
  {
    id: '11111111-1111-4111-8111-111111111001',
    codigo: 'ALU-A30',
    descripcion: 'Aluminio Línea A30 New - Extrusión por Kilo',
    cantidad: 250.5,
    unidad_medida: 'KG',
    precio_venta: 7000,
  },
  {
    id: '11111111-1111-4111-8111-111111111002',
    codigo: 'ALU-MODENA',
    descripcion: 'Aluminio Línea Módena - Extrusión por Kilo',
    cantidad: 320.25,
    unidad_medida: 'KG',
    precio_venta: 7000,
  },
  {
    id: '11111111-1111-4111-8111-111111111003',
    codigo: 'ALU-HERRERO',
    descripcion: 'Aluminio Línea Herrero - Extrusión por Kilo',
    cantidad: 185.0,
    unidad_medida: 'KG',
    precio_venta: 7000,
  },
  {
    id: '11111111-1111-4111-8111-111111111004',
    codigo: '6080.NEGRO',
    descripcion: 'JAMBA DE MARCO CORREDIZA DE 3 HOJAS Kg/T 11,08 Negro',
    cantidad: 24,
    unidad_medida: 'UNIDADES',
    precio_venta: 28500,
  },
  {
    id: '11111111-1111-4111-8111-111111111005',
    codigo: '6070.BLANCO',
    descripcion: 'MARCO SUPERIOR CORREDIZA 2 HOJAS MODENA Kg/T 9,45 Blanco Semi Mate',
    cantidad: 36,
    unidad_medida: 'UNIDADES',
    precio_venta: 24200,
  },
  {
    id: '11111111-1111-4111-8111-111111111006',
    codigo: '6065.NEGRO',
    descripcion: 'ZOCALO ALTO CORREDIZA 2 HOJAS MODENA Kg/T 8,32 Negro microtexturado',
    cantidad: 14,
    unidad_medida: 'UNIDADES',
    precio_venta: 21900,
  },
  {
    id: '11111111-1111-4111-8111-111111111007',
    codigo: '6061.ANOD',
    descripcion: 'HOJA CORREDIZA VIDRIO ENTERO MODENA Kg/T 7,15 Anodizado Natural',
    cantidad: 42,
    unidad_medida: 'UNIDADES',
    precio_venta: 19800,
  },
  {
    id: '11111111-1111-4111-8111-111111111008',
    codigo: '6075.BLANCO',
    descripcion: 'UMBRAL CORREDIZA 2 HOJAS CON GUIA DE ACERO INOX Kg/T 12,30 Blanco',
    cantidad: 8,
    unidad_medida: 'UNIDADES',
    precio_venta: 34500,
  },
  {
    id: '11111111-1111-4111-8111-111111111009',
    codigo: '6082.NEGRO',
    descripcion: 'PARANTE CENTRAL REFORZADO P/ CORREDIZA MODENA Kg/T 9,80 Negro',
    cantidad: 3,
    unidad_medida: 'UNIDADES',
    precio_venta: 26700,
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
    id: '22222222-2222-4222-8222-222222222101',
    cliente_id: 1,
    tipo: 'VENTA',
    estado: 'COMPLETADO',
    subtotal: 328800,
    incluye_iva: true,
    monto_iva: 69048,
    total_pedido: 397848,
    notas: 'Entrega en taller de carpintería San Martín. Remito salida #0891.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    cliente: INITIAL_CLIENTES[0],
    detalles: [
      {
        id: 1,
        pedido_id: '22222222-2222-4222-8222-222222222101',
        producto_id: INITIAL_PRODUCTOS[3].id,
        cantidad: 10,
        precio_unitario: 28500,
        subtotal: 285000,
        producto: INITIAL_PRODUCTOS[3],
      },
      {
        id: 2,
        pedido_id: '22222222-2222-4222-8222-222222222101',
        producto_id: INITIAL_PRODUCTOS[5].id,
        cantidad: 2,
        precio_unitario: 21900,
        subtotal: 43800,
        producto: INITIAL_PRODUCTOS[5],
      },
    ],
  },
  {
    id: '22222222-2222-4222-8222-222222222103',
    cliente_id: 2,
    tipo: 'VENTA',
    estado: 'PRESUPUESTO',
    subtotal: 269500,
    incluye_iva: true,
    monto_iva: 56595,
    total_pedido: 326095,
    notas: 'Cotización por peso de carpintería obra Bv. Pellegrini (Validez 7 días).',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    cliente: INITIAL_CLIENTES[1],
    detalles: [
      {
        id: 6,
        pedido_id: '22222222-2222-4222-8222-222222222103',
        producto_id: INITIAL_PRODUCTOS[0].id,
        material: 'ALU-A30 - Aluminio Línea A30 New - Extrusión por Kilo',
        cantidad: 1,
        peso_kg: 22.5,
        precio_unitario: 7000,
        subtotal: 157500,
        producto: INITIAL_PRODUCTOS[0],
      },
      {
        id: 7,
        pedido_id: '22222222-2222-4222-8222-222222222103',
        producto_id: INITIAL_PRODUCTOS[1].id,
        material: 'ALU-MODENA - Aluminio Línea Módena - Extrusión por Kilo',
        cantidad: 1,
        peso_kg: 16,
        precio_unitario: 7000,
        subtotal: 112000,
        producto: INITIAL_PRODUCTOS[1],
      },
    ],
  },
];

const LOCAL_STORAGE_KEY = 'aberturas_mino_remitos_perfiles_v5';
const CLIENTES_STORAGE_KEY = 'aberturas_mino_clientes_v1';
const PEDIDOS_STORAGE_KEY = 'aberturas_mino_pedidos_v2';
const CONFIG_STORAGE_KEY = 'aberturas_mino_config_v1';
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
      const {
        data: { session },
      } = await supabase.auth.getSession();
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

// --- CRUD PRODUCTOS (UNIDADES Y KG) ---

export async function getProductos(): Promise<Producto[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('productos')
      .select('id, codigo, descripcion, cantidad, unidad_medida, precio_venta')
      .order('codigo', { ascending: true });
    if (error) throw new Error(error.message);
    if (data && data.length > 0) {
      return data.map((p: any) => ({
        id: String(p.id),
        codigo: p.codigo,
        descripcion: p.descripcion,
        cantidad: Number(p.cantidad ?? 0),
        unidad_medida: p.unidad_medida === 'KG' ? 'KG' : 'UNIDADES',
        precio_venta: p.precio_venta !== null && p.precio_venta !== undefined ? Number(p.precio_venta) : 0,
      }));
    }
  }
  return getLocalDemoStock();
}

export async function getProductosPorPeso(): Promise<Producto[]> {
  const todos = await getProductos();
  return todos.filter((p) => p.unidad_medida === 'KG');
}

export async function createProducto(nuevo: Omit<Producto, 'id'>): Promise<Producto> {
  const payload = {
    codigo: nuevo.codigo,
    descripcion: nuevo.descripcion,
    cantidad:
      nuevo.unidad_medida === 'KG'
        ? roundKg(Number(nuevo.cantidad) || 0)
        : Math.max(0, Math.round(Number(nuevo.cantidad) || 0)),
    unidad_medida: nuevo.unidad_medida || 'UNIDADES',
    precio_venta: Number(nuevo.precio_venta ?? 0),
  };

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('productos')
      .insert([payload])
      .select('id, codigo, descripcion, cantidad, unidad_medida, precio_venta')
      .single();
    if (error) throw new Error(error.message);
    return {
      ...data,
      id: String(data.id),
      cantidad: Number(data.cantidad ?? 0),
      unidad_medida: data.unidad_medida === 'KG' ? 'KG' : 'UNIDADES',
      precio_venta: Number(data.precio_venta ?? 0),
    };
  }
  const current = getLocalDemoStock();
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `prod-${Date.now()}`;
  const created: Producto = { ...payload, id };
  saveLocalDemoStock([created, ...current]);
  return created;
}

export async function updateProducto(
  id: string,
  cambios: Partial<Producto>
): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('productos').update(cambios).eq('id', id);
    if (error) throw new Error(error.message);
  }
  const current = getLocalDemoStock();
  saveLocalDemoStock(
    current.map((p) => (String(p.id) === String(id) ? { ...p, ...cambios } : p))
  );
}

export async function deleteProducto(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('productos').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
  const current = getLocalDemoStock();
  saveLocalDemoStock(current.filter((p) => String(p.id) !== String(id)));
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

export async function updateCliente(
  id: number | string,
  cambios: Partial<Cliente>
): Promise<void> {
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

// --- CONFIGURACIÓN GLOBAL (VALOR KILO ALUMINIO) ---

export async function getConfiguracionValor(
  clave: string,
  defaultValor = 7000
): Promise<number> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('configuracion')
        .select('valor')
        .eq('clave', clave)
        .single();
      if (!error && data && data.valor !== undefined && data.valor !== null) {
        return Number(data.valor);
      }
    } catch (e) {
      console.warn('Error leyendo configuracion de Supabase, usando fallback local', e);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed[clave] !== undefined) {
          return Number(parsed[clave]);
        }
      }
    } catch (_) {}
  }

  return defaultValor;
}

export async function updateConfiguracionValor(
  clave: string,
  valor: number
): Promise<number> {
  const numericVal = Math.max(0, Number(valor) || 0);

  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('configuracion')
      .upsert({ clave, valor: numericVal }, { onConflict: 'clave' });
    if (error) {
      throw new Error(`Error al actualizar configuración: ${error.message}`);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : {};
      parsed[clave] = numericVal;
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(parsed));
    } catch (_) {}
  }

  return numericVal;
}

// --- MOTOR TRANSACCIONAL DE PEDIDOS Y COTIZACIONES ---

export interface NuevaLineaPedido {
  producto_id?: string | null;
  material?: string | null;
  peso_kg?: number | null;
  cantidad: number;
  precio_unitario: number;
  subtotal?: number;
}

export interface NuevoPedidoInput {
  cliente_id: number | string;
  tipo: TipoPedido;
  estado?: EstadoPedido;
  subtotal?: number;
  incluye_iva?: boolean;
  monto_iva?: number;
  total_pedido?: number;
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
          subtotal,
          incluye_iva,
          monto_iva,
          total_pedido,
          notas,
          created_at,
          clientes:cliente_id (id, razon_social, cuit, condicion_iva, telefono, email, direccion),
          pedidos_detalle (
            id,
            pedido_id,
            producto_id,
            material,
            peso_kg,
            cantidad,
            precio_unitario,
            subtotal,
            productos:producto_id (id, codigo, descripcion, unidad_medida, cantidad, precio_venta)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        return data.map((p: any) => {
          const subtotalNum = Number(p.subtotal ?? p.total_pedido ?? 0);
          const incluyeIvaBool = Boolean(p.incluye_iva);
          const montoIvaNum = Number(p.monto_iva ?? (incluyeIvaBool ? subtotalNum * 0.21 : 0));
          const totalNum = Number(p.total_pedido ?? subtotalNum + montoIvaNum);

          return {
            id: String(p.id),
            cliente_id: p.cliente_id,
            tipo: p.tipo,
            estado: p.estado,
            subtotal: subtotalNum,
            incluye_iva: incluyeIvaBool,
            monto_iva: montoIvaNum,
            total_pedido: totalNum,
            notas: p.notas,
            created_at: p.created_at,
            cliente: p.clientes,
            detalles: (p.pedidos_detalle || []).map((d: any) => ({
              id: d.id,
              pedido_id: String(d.pedido_id),
              producto_id: d.producto_id ? String(d.producto_id) : null,
              material: d.material,
              peso_kg:
                d.peso_kg !== null && d.peso_kg !== undefined ? Number(d.peso_kg) : null,
              cantidad: Number(d.cantidad ?? 1),
              precio_unitario: Number(d.precio_unitario),
              subtotal: Number(d.subtotal),
              producto: d.productos
                ? {
                    ...d.productos,
                    id: String(d.productos.id),
                    cantidad: Number(d.productos.cantidad ?? 0),
                    unidad_medida:
                      d.productos.unidad_medida === 'KG' ? 'KG' : 'UNIDADES',
                  }
                : undefined,
            })),
          };
        });
      }
    } catch (e) {
      console.warn('Error reading pedidos from Supabase, using local demo fallback', e);
    }
  }

  return getLocalDemoPedidos();
}

/**
 * Calcula cuánto stock (en KG o UNIDADES) se debe descontar/sumar por una línea
 */
function calcularDeltaLinea(
  unidadMedida: UnidadMedida,
  linea: { peso_kg?: number | null; cantidad: number }
): number {
  if (unidadMedida === 'KG') {
    const kg = Number(linea.peso_kg ?? 0);
    return roundKg(kg > 0 ? kg : Number(linea.cantidad ?? 0));
  }
  return Math.max(0, Math.round(Number(linea.cantidad) || 0));
}

/**
 * Transacción Completa de Pedidos y Cotizaciones:
 * 1. Valida stock si estado === 'COMPLETADO' y tipo === 'VENTA'
 * 2. Inserta cabecera en pedidos (uuid) y líneas en pedidos_detalle
 * 3. Actualiza stock en productos: si unidad_medida = 'KG' descuenta/suma peso_kg; si 'UNIDADES' descuenta/suma cantidad
 *    (NO modifica stock si estado === 'PRESUPUESTO' o 'CANCELADO')
 */
export async function registrarPedidoTransaccional(
  input: NuevoPedidoInput
): Promise<Pedido> {
  const {
    cliente_id,
    tipo,
    estado = 'COMPLETADO',
    notas = '',
    lineas,
    incluye_iva = false,
  } = input;

  if (!lineas || lineas.length === 0) {
    throw new Error('El pedido debe tener al menos una línea.');
  }

  const debeAjustarStock = estado !== 'PRESUPUESTO' && estado !== 'CANCELADO';

  const lineasCalculadas = lineas.map((l) => {
    const peso =
      l.peso_kg !== undefined && l.peso_kg !== null
        ? roundKg(Number(l.peso_kg))
        : null;
    const cantInt = Math.max(1, Math.round(Number(l.cantidad) || 1));
    return {
      ...l,
      producto_id: l.producto_id ? String(l.producto_id) : null,
      material: l.material ?? null,
      peso_kg: peso,
      cantidad: cantInt,
      subtotal:
        l.subtotal !== undefined
          ? Math.round(Number(l.subtotal) * 100) / 100
          : Math.round(cantInt * l.precio_unitario * 100) / 100,
    };
  });

  const subtotalCalculado =
    input.subtotal ?? lineasCalculadas.reduce((acc, curr) => acc + curr.subtotal, 0);
  const montoIvaCalculado =
    input.monto_iva ?? (incluye_iva ? Math.round(subtotalCalculado * 0.21 * 100) / 100 : 0);
  const totalPedidoCalculado =
    input.total_pedido ?? Math.round((subtotalCalculado + montoIvaCalculado) * 100) / 100;

  // 1. MODO SUPABASE REAL
  if (isSupabaseConfigured) {
    // A. Validar stock acumulado por producto antes de insertar si es VENTA y COMPLETADO
    const productosMap = new Map<string, Producto>();
    const idsProductos = Array.from(
      new Set(
        lineasCalculadas
          .map((l) => l.producto_id)
          .filter((id): id is string => Boolean(id))
      )
    );

    if (idsProductos.length > 0) {
      const { data: prodsDb, error: prodErr } = await supabase
        .from('productos')
        .select('id, codigo, descripcion, cantidad, unidad_medida, precio_venta')
        .in('id', idsProductos);

      if (prodErr) {
        throw new Error(`Error al consultar productos: ${prodErr.message}`);
      }

      for (const p of prodsDb || []) {
        productosMap.set(String(p.id), {
          id: String(p.id),
          codigo: p.codigo,
          descripcion: p.descripcion,
          cantidad: Number(p.cantidad ?? 0),
          unidad_medida: p.unidad_medida === 'KG' ? 'KG' : 'UNIDADES',
          precio_venta: Number(p.precio_venta ?? 0),
        });
      }

      if (debeAjustarStock && tipo === 'VENTA') {
        const consumoPorProducto = new Map<string, number>();
        for (const l of lineasCalculadas) {
          if (!l.producto_id) continue;
          const prod = productosMap.get(l.producto_id);
          if (!prod) continue;
          const delta = calcularDeltaLinea(prod.unidad_medida, l);
          consumoPorProducto.set(
            l.producto_id,
            roundKg((consumoPorProducto.get(l.producto_id) || 0) + delta)
          );
        }

        for (const [prodId, consumoTotal] of consumoPorProducto.entries()) {
          const prod = productosMap.get(prodId);
          if (prod && consumoTotal > prod.cantidad) {
            const sufijo = prod.unidad_medida === 'KG' ? 'kg' : 'u.';
            throw new Error(
              `Stock insuficiente para ${prod.codigo}. Disponible: ${prod.cantidad} ${sufijo}, solicitado: ${consumoTotal} ${sufijo}.`
            );
          }
        }
      }
    }

    // B. Insertar cabecera en pedidos
    const { data: pedidoData, error: pedidoError } = await supabase
      .from('pedidos')
      .insert([
        {
          cliente_id,
          tipo,
          estado,
          subtotal: subtotalCalculado,
          incluye_iva: Boolean(incluye_iva),
          monto_iva: montoIvaCalculado,
          total_pedido: totalPedidoCalculado,
          notas,
        },
      ])
      .select()
      .single();

    if (pedidoError) {
      throw new Error(`Error al crear pedido: ${pedidoError.message}`);
    }

    const pedidoId = String(pedidoData.id);

    // C. Insertar líneas en pedidos_detalle
    const detallesPayload = lineasCalculadas.map((l) => ({
      pedido_id: pedidoId,
      producto_id: l.producto_id || null,
      material: l.material || null,
      peso_kg: l.peso_kg,
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

    // D. Actualizar Stock en productos si corresponde
    if (debeAjustarStock && idsProductos.length > 0) {
      const variacionPorProducto = new Map<string, number>();
      for (const l of lineasCalculadas) {
        if (!l.producto_id) continue;
        const prod = productosMap.get(l.producto_id);
        if (!prod) continue;
        const delta = calcularDeltaLinea(prod.unidad_medida, l);
        variacionPorProducto.set(
          l.producto_id,
          roundKg((variacionPorProducto.get(l.producto_id) || 0) + delta)
        );
      }

      for (const [prodId, deltaTotal] of variacionPorProducto.entries()) {
        const prod = productosMap.get(prodId);
        if (!prod) continue;
        const nuevoStock =
          tipo === 'COMPRA'
            ? roundKg(prod.cantidad + deltaTotal)
            : Math.max(0, roundKg(prod.cantidad - deltaTotal));

        const { error: updErr } = await supabase
          .from('productos')
          .update({ cantidad: nuevoStock })
          .eq('id', prodId);

        if (updErr) {
          throw new Error(`Error al actualizar stock de ${prod.codigo}: ${updErr.message}`);
        }
      }
    }

    const { data: clienteData } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', cliente_id)
      .single();

    return {
      id: pedidoId,
      cliente_id,
      tipo,
      estado,
      subtotal: subtotalCalculado,
      incluye_iva: Boolean(incluye_iva),
      monto_iva: montoIvaCalculado,
      total_pedido: totalPedidoCalculado,
      notas,
      created_at: pedidoData.created_at || new Date().toISOString(),
      cliente: clienteData || undefined,
      detalles: lineasCalculadas.map((l, i) => ({
        id: i + 1,
        pedido_id: pedidoId,
        producto_id: l.producto_id,
        material: l.material,
        peso_kg: l.peso_kg,
        cantidad: l.cantidad,
        precio_unitario: l.precio_unitario,
        subtotal: l.subtotal,
        producto: l.producto_id ? productosMap.get(l.producto_id) : undefined,
      })),
    };
  }

  // 2. MODO DEMO / LOCALSTORAGE FALLBACK
  const stockLocal = getLocalDemoStock();
  const clientesLocal = getLocalDemoClientes();
  const pedidosLocal = getLocalDemoPedidos();

  if (debeAjustarStock && tipo === 'VENTA') {
    for (const prod of stockLocal) {
      const lineasMatch = lineasCalculadas.filter(
        (l) => l.producto_id && String(l.producto_id) === String(prod.id)
      );
      if (lineasMatch.length > 0) {
        const consumoTotal = roundKg(
          lineasMatch.reduce(
            (acc, item) => acc + calcularDeltaLinea(prod.unidad_medida, item),
            0
          )
        );
        if (consumoTotal > prod.cantidad) {
          const sufijo = prod.unidad_medida === 'KG' ? 'kg' : 'u.';
          throw new Error(
            `Stock insuficiente para ${prod.codigo}. Disponible: ${prod.cantidad} ${sufijo}, solicitado: ${consumoTotal} ${sufijo}.`
          );
        }
      }
    }
  }

  const clienteEncontrado = clientesLocal.find(
    (c) => String(c.id) === String(cliente_id)
  );
  const pedidoId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `ped-${Date.now()}`;
  const fecha = new Date().toISOString();

  let stockActualizado = stockLocal;
  if (debeAjustarStock) {
    stockActualizado = stockLocal.map((prod) => {
      const lineasMatch = lineasCalculadas.filter(
        (l) => l.producto_id && String(l.producto_id) === String(prod.id)
      );
      if (lineasMatch.length > 0) {
        const totalDelta = roundKg(
          lineasMatch.reduce(
            (acc, item) => acc + calcularDeltaLinea(prod.unidad_medida, item),
            0
          )
        );
        const variacion = tipo === 'COMPRA' ? totalDelta : -totalDelta;
        return {
          ...prod,
          cantidad: Math.max(0, roundKg(prod.cantidad + variacion)),
        };
      }
      return prod;
    });
    saveLocalDemoStock(stockActualizado);
  }

  const detallesCompletos: PedidoDetalle[] = lineasCalculadas.map((l, idx) => {
    const prod = l.producto_id
      ? stockActualizado.find((p) => String(p.id) === String(l.producto_id))
      : undefined;
    return {
      id: Date.now() + idx + 1,
      pedido_id: pedidoId,
      producto_id: l.producto_id,
      material: l.material,
      peso_kg: l.peso_kg,
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
    subtotal: subtotalCalculado,
    incluye_iva: Boolean(incluye_iva),
    monto_iva: montoIvaCalculado,
    total_pedido: totalPedidoCalculado,
    notas,
    created_at: fecha,
    cliente: clienteEncontrado,
    detalles: detallesCompletos,
  };

  saveLocalDemoPedidos([nuevoPedido, ...pedidosLocal]);
  return nuevoPedido;
}

/**
 * Convierte un PRESUPUESTO existente en un REMITO (COMPLETADO)
 * 1. Valida stock suficiente (en KG o UNIDADES según corresponda)
 * 2. Actualiza el estado a 'COMPLETADO'
 * 3. Descuenta peso_kg (si KG) o cantidad (si UNIDADES) de la tabla productos
 */
export async function convertirPresupuestoARemito(pedidoId: string): Promise<Pedido> {
  if (isSupabaseConfigured) {
    const { data: pedidoActual, error: fetchError } = await supabase
      .from('pedidos')
      .select(`
        id,
        cliente_id,
        tipo,
        estado,
        subtotal,
        incluye_iva,
        monto_iva,
        total_pedido,
        notas,
        created_at,
        clientes:cliente_id (id, razon_social, cuit, condicion_iva, telefono, email, direccion),
        pedidos_detalle (
          id,
          pedido_id,
          producto_id,
          material,
          peso_kg,
          cantidad,
          precio_unitario,
          subtotal,
          productos:producto_id (id, codigo, descripcion, unidad_medida, cantidad, precio_venta)
        )
      `)
      .eq('id', pedidoId)
      .single();

    if (fetchError || !pedidoActual) {
      throw new Error(`No se encontró el presupuesto #${pedidoId}.`);
    }

    if (pedidoActual.estado === 'COMPLETADO') {
      throw new Error('Este presupuesto ya fue convertido a remito completado.');
    }

    const detalles: any[] = pedidoActual.pedidos_detalle || [];

    // Validar stock antes de confirmar si es VENTA
    const consumoPorProducto = new Map<string, { prod: any; delta: number }>();
    for (const det of detalles) {
      if (!det.producto_id || !det.productos) continue;
      const unidad: UnidadMedida =
        det.productos.unidad_medida === 'KG' ? 'KG' : 'UNIDADES';
      const delta = calcularDeltaLinea(unidad, {
        peso_kg: det.peso_kg,
        cantidad: det.cantidad,
      });
      const existing = consumoPorProducto.get(String(det.producto_id));
      consumoPorProducto.set(String(det.producto_id), {
        prod: det.productos,
        delta: roundKg((existing?.delta || 0) + delta),
      });
    }

    if (pedidoActual.tipo === 'VENTA') {
      for (const { prod, delta } of consumoPorProducto.values()) {
        const stockActual = Number(prod.cantidad ?? 0);
        if (delta > stockActual) {
          const sufijo = prod.unidad_medida === 'KG' ? 'kg' : 'u.';
          throw new Error(
            `Stock insuficiente para ${prod.codigo}. Disponible: ${stockActual} ${sufijo}, requerido: ${delta} ${sufijo}.`
          );
        }
      }
    }

    // Actualizar estado a COMPLETADO
    const { error: updateError } = await supabase
      .from('pedidos')
      .update({ estado: 'COMPLETADO' })
      .eq('id', pedidoId);

    if (updateError) {
      throw new Error(`Error al actualizar el estado del pedido: ${updateError.message}`);
    }

    // Descontar/sumar stock en tabla productos
    for (const [prodId, { prod, delta }] of consumoPorProducto.entries()) {
      const stockActual = Number(prod.cantidad ?? 0);
      const nuevoStock =
        pedidoActual.tipo === 'COMPRA'
          ? roundKg(stockActual + delta)
          : Math.max(0, roundKg(stockActual - delta));

      const { error: stockErr } = await supabase
        .from('productos')
        .update({ cantidad: nuevoStock })
        .eq('id', prodId);

      if (stockErr) {
        throw new Error(`Error al descontar stock de ${prod.codigo}: ${stockErr.message}`);
      }
    }

    const subtotalNum = Number(pedidoActual.subtotal ?? pedidoActual.total_pedido ?? 0);
    const incluyeIvaBool = Boolean(pedidoActual.incluye_iva);
    const montoIvaNum = Number(
      pedidoActual.monto_iva ?? (incluyeIvaBool ? subtotalNum * 0.21 : 0)
    );

    return {
      id: String(pedidoActual.id),
      cliente_id: pedidoActual.cliente_id,
      tipo: pedidoActual.tipo,
      estado: 'COMPLETADO',
      subtotal: subtotalNum,
      incluye_iva: incluyeIvaBool,
      monto_iva: montoIvaNum,
      total_pedido: Number(pedidoActual.total_pedido),
      notas: pedidoActual.notas,
      created_at: pedidoActual.created_at,
      cliente: (pedidoActual as any).clientes,
      detalles: detalles.map((d: any) => ({
        id: d.id,
        pedido_id: String(d.pedido_id),
        producto_id: d.producto_id ? String(d.producto_id) : null,
        material: d.material,
        peso_kg:
          d.peso_kg !== null && d.peso_kg !== undefined ? Number(d.peso_kg) : null,
        cantidad: Number(d.cantidad ?? 1),
        precio_unitario: Number(d.precio_unitario),
        subtotal: Number(d.subtotal),
        producto: d.productos
          ? {
              ...d.productos,
              id: String(d.productos.id),
              cantidad: Number(d.productos.cantidad ?? 0),
              unidad_medida:
                d.productos.unidad_medida === 'KG' ? 'KG' : 'UNIDADES',
            }
          : undefined,
      })),
    };
  }

  // MODO DEMO / LOCALSTORAGE FALLBACK
  const pedidosLocal = getLocalDemoPedidos();
  const pedidoTarget = pedidosLocal.find((p) => String(p.id) === String(pedidoId));
  if (!pedidoTarget) {
    throw new Error(`No se encontró el presupuesto #${pedidoId}.`);
  }
  if (pedidoTarget.estado === 'COMPLETADO') {
    throw new Error('Este presupuesto ya fue convertido a remito completado.');
  }

  const stockLocal = getLocalDemoStock();
  const detalles = pedidoTarget.detalles || [];

  if (pedidoTarget.tipo === 'VENTA') {
    for (const prod of stockLocal) {
      const matchLines = detalles.filter(
        (d) => d.producto_id && String(d.producto_id) === String(prod.id)
      );
      if (matchLines.length > 0) {
        const consumoTotal = roundKg(
          matchLines.reduce(
            (acc, item) => acc + calcularDeltaLinea(prod.unidad_medida, item),
            0
          )
        );
        if (consumoTotal > prod.cantidad) {
          const sufijo = prod.unidad_medida === 'KG' ? 'kg' : 'u.';
          throw new Error(
            `Stock insuficiente para ${prod.codigo}. Disponible: ${prod.cantidad} ${sufijo}, requerido: ${consumoTotal} ${sufijo}.`
          );
        }
      }
    }
  }

  const stockActualizado = stockLocal.map((prod) => {
    const matchLines = detalles.filter(
      (d) => d.producto_id && String(d.producto_id) === String(prod.id)
    );
    if (matchLines.length > 0) {
      const totalDelta = roundKg(
        matchLines.reduce(
          (acc, item) => acc + calcularDeltaLinea(prod.unidad_medida, item),
          0
        )
      );
      const variacion = pedidoTarget.tipo === 'COMPRA' ? totalDelta : -totalDelta;
      return {
        ...prod,
        cantidad: Math.max(0, roundKg(prod.cantidad + variacion)),
      };
    }
    return prod;
  });
  saveLocalDemoStock(stockActualizado);

  const pedidoActualizado: Pedido = {
    ...pedidoTarget,
    estado: 'COMPLETADO',
  };

  saveLocalDemoPedidos(
    pedidosLocal.map((p) => (String(p.id) === String(pedidoId) ? pedidoActualizado : p))
  );

  return pedidoActualizado;
}
