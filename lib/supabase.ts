import { createClient } from '@supabase/supabase-js';

// Duración estricta de la sesión: 2 horas (7200 segundos)
export const SESSION_MAX_DURATION_SECONDS = 2 * 60 * 60; // 7200s
export const SESSION_MAX_DURATION_MS = SESSION_MAX_DURATION_SECONDS * 1000;

// Estructura estricta según remitos de perfiles de aluminio + Precio Venta
export interface Producto {
  id: number | string;
  codigo: string;          // Cadena identificadora y color (ej. '6080.NEGRO')
  descripcion: string;     // Especificación técnica detallada del perfil
  cantidad: number;        // Unidades en stock (número entero)
  precio_venta?: number;   // Precio de venta mayorista unitario en ARS
  created_at?: string;
}

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

// Catálogo ampliado y correlativo a perfiles de aberturas de aluminio con precio de venta
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
    id: 7,
    codigo: '6090.BRONCE',
    descripcion: 'CONTRAVIDRIO CURVO 14mm P/ DVH MODENA Kg/T 2,15 Bronce Colonial',
    cantidad: 55,
    precio_venta: 7400,
  },
  {
    id: 8,
    codigo: '6092.BLANCO',
    descripcion: 'CONTRAVIDRIO RECTO CLIPADO 19mm MODENA Kg/T 1,95 Blanco',
    cantidad: 62,
    precio_venta: 6800,
  },
  {
    id: 9,
    codigo: '6095.NEGRO',
    descripcion: 'TRAVESAÑO REFORZADO DE HOJA MODENA Kg/T 6,80 Negro',
    cantidad: 19,
    precio_venta: 18200,
  },
  {
    id: 10,
    codigo: '6098.BLANCO',
    descripcion: 'PERFIL ACOPLE ESQUINERO A 90 GRADOS MODENA Kg/T 5,60 Blanco',
    cantidad: 11,
    precio_venta: 16400,
  },
  {
    id: 11,
    codigo: '6104.ANOD',
    descripcion: 'PERFIL MOSQUITERO CORREDIZO MODENA Kg/T 3,25 Anodizado Natural',
    cantidad: 28,
    precio_venta: 10500,
  },
  {
    id: 12,
    codigo: 'A30-01.NEGRO',
    descripcion: 'MARCO PERIMETRAL CORREDIZA A30 NEW ALTA PRESTACION Kg/T 14,20 Negro',
    cantidad: 16,
    precio_venta: 48900,
  },
  {
    id: 13,
    codigo: 'A30-15.ANOD',
    descripcion: 'HOJA CORREDIZA REFORZADA P/ DVH HASTA 28mm Kg/T 11,60 Anodizado Natural',
    cantidad: 5,
    precio_venta: 41200,
  },
  {
    id: 14,
    codigo: 'A30-22.NEGRO',
    descripcion: 'UMBRAL CORREDIZA 3 GUIAS A30 NEW CON DRENAJE Kg/T 16,80 Negro',
    cantidad: 9,
    precio_venta: 56000,
  },
  {
    id: 15,
    codigo: 'A30-34.BLANCO',
    descripcion: 'ENCUENTRO CENTRAL 4 HOJAS CORREDIZAS A30 NEW Kg/T 8,90 Blanco',
    cantidad: 7,
    precio_venta: 31500,
  },
  {
    id: 16,
    codigo: 'A30-45.ANOD',
    descripcion: 'TAPAJUNTAS PERIMETRAL DE MONTAJE 60mm A30 NEW Kg/T 4,10 Anodizado Natural',
    cantidad: 34,
    precio_venta: 14800,
  },
  {
    id: 17,
    codigo: 'A30-50.NEGRO',
    descripcion: 'MARCO PUERTA DE REBATIR PESADA A30 NEW DOBLE CONTACTO Kg/T 13,40 Negro',
    cantidad: 4,
    precio_venta: 46700,
  },
  {
    id: 18,
    codigo: 'HER-01.BLANCO',
    descripcion: 'MARCO DE VENTANA HERRERO 2 HOJAS Kg/T 5,40 Blanco',
    cantidad: 58,
    precio_venta: 13900,
  },
  {
    id: 19,
    codigo: 'HER-05.BLANCO',
    descripcion: 'HOJA CORREDIZA HERRERO Kg/T 4,20 Blanco',
    cantidad: 64,
    precio_venta: 11500,
  },
  {
    id: 20,
    codigo: 'HER-08.BRONCE',
    descripcion: 'TRAVESAÑO CENTRAL HERRERO 50mm Kg/T 3,80 Bronce Colonial',
    cantidad: 22,
    precio_venta: 10800,
  },
  {
    id: 21,
    codigo: 'HER-12.BLANCO',
    descripcion: 'ZOCALO ALTO REFORZADO HERRERO P/ PUERTA Kg/T 6,10 Blanco',
    cantidad: 17,
    precio_venta: 15200,
  },
  {
    id: 22,
    codigo: 'HER-18.ANOD',
    descripcion: 'PARANTE DE CRUCE HERRERO VIDRIO SIMPLE 4mm Kg/T 3,45 Anodizado Natural',
    cantidad: 31,
    precio_venta: 9900,
  },
  {
    id: 23,
    codigo: 'HER-25.NEGRO',
    descripcion: 'GUIA MOSQUITERO FIJO HERRERO Kg/T 2,10 Negro',
    cantidad: 47,
    precio_venta: 7200,
  },
  {
    id: 24,
    codigo: 'RPT-01.BLANCO',
    descripcion: 'MARCO BATIENTE CON RUPTURA DE PUENTE TERMICO RPT 65mm Kg/T 15,20 Blanco',
    cantidad: 12,
    precio_venta: 62000,
  },
  {
    id: 25,
    codigo: 'RPT-10.NEGRO',
    descripcion: 'HOJA VENTANA OSCILOBATIENTE RPT CON POLIAMIDA 24mm Kg/T 13,80 Negro',
    cantidad: 6,
    precio_venta: 58500,
  },
];

// Maestro de Clientes Iniciales para Aberturas Miño
export const INITIAL_CLIENTES: Cliente[] = [
  {
    id: 1,
    razon_social: 'Vidriería & Carpintería San Martín S.R.L.',
    cuit: '30-71458921-8',
    telefono: '+54 11 4752-9901',
    direccion: 'Av. Libertador San Martín 2340, San Martín, Bs. As.',
    email: 'compras@vidrieriasanmartin.com.ar',
    condicion_iva: 'Responsable Inscripto',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    razon_social: 'Construcciones del Litoral S.A.',
    cuit: '30-68912445-3',
    telefono: '+54 342 458-1200',
    direccion: 'Bv. Pellegrini 3100, Santa Fe Capital',
    email: 'obras@constructoradellitoral.com',
    condicion_iva: 'Responsable Inscripto',
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    razon_social: 'Estudio Arq. Marcelo Rossi & Asociados',
    cuit: '20-28491033-4',
    telefono: '+54 11 5590-3321',
    direccion: 'Calle 14 Nº 845, La Plata, Bs. As.',
    email: 'contacto@rossiarquitectura.com.ar',
    condicion_iva: 'Monotributo',
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    razon_social: 'Cerramientos & Fachadas Quilmes S.A.S.',
    cuit: '30-71694302-9',
    telefono: '+54 11 4253-7840',
    direccion: 'Av. Calchaquí 1890, Quilmes Oeste',
    email: 'administracion@cerramientosquilmes.com',
    condicion_iva: 'Responsable Inscripto',
    created_at: new Date().toISOString(),
  },
  {
    id: 5,
    razon_social: 'Taller Metálico & Aluminios Don Bosco',
    cuit: '27-32904112-7',
    telefono: '+54 11 4251-0987',
    direccion: 'Av. San Martín 450, Don Bosco',
    email: 'pedidos@aluminiosdonbosco.com',
    condicion_iva: 'Monotributo',
    created_at: new Date().toISOString(),
  },
  {
    id: 6,
    razon_social: 'Consorcio Propietarios Torre Mirador 2',
    cuit: '33-69842109-9',
    telefono: '+54 11 4802-5511',
    direccion: 'Av. Del Libertador 4820, CABA',
    email: 'administracion@torremirador2.com',
    condicion_iva: 'Exento',
    created_at: new Date().toISOString(),
  },
];

const LOCAL_STORAGE_KEY = 'aberturas_mino_remitos_perfiles_v4';
const CLIENTES_STORAGE_KEY = 'aberturas_mino_clientes_v1';
const AUTH_STORAGE_KEY = 'aberturas_mino_auth_session';

// --- GESTIÓN DE PRODUCTOS (LOCAL STORAGE) ---
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

// --- GESTIÓN DE CLIENTES (LOCAL STORAGE) ---
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

// --- AUTENTICACIÓN ---
export async function getSessionUser(): Promise<UserSession | null> {
  const now = Date.now();

  if (isSupabaseConfigured) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        const stored = typeof window !== 'undefined' ? localStorage.getItem(AUTH_STORAGE_KEY) : null;
        let loginTime = now;
        let expiresAt = now + SESSION_MAX_DURATION_MS;

        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            loginTime = parsed.loginTimestamp || now;
            expiresAt = parsed.expiresAt || loginTime + SESSION_MAX_DURATION_MS;
          } catch (_) {}
        }

        if (now >= expiresAt) {
          await logoutUser(true);
          return null;
        }

        return {
          email: session.user.email,
          id: session.user.id,
          role: 'Encargado de Depósito',
          loginTimestamp: loginTime,
          expiresAt: expiresAt,
        };
      }
    } catch (e) {
      console.warn('Error reading Supabase session', e);
    }
  }

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const session: UserSession = JSON.parse(stored);
        if (now >= session.expiresAt) {
          await logoutUser(true);
          return null;
        }
        return session;
      } catch (e) {
        return null;
      }
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
export async function createProducto(nuevo: Omit<Producto, 'id'>): Promise<Producto> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('productos')
      .insert([nuevo])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  const current = getLocalDemoStock();
  const id = Date.now();
  const created: Producto = { ...nuevo, id };
  const updated = [created, ...current];
  saveLocalDemoStock(updated);
  return created;
}

export async function updateProducto(
  id: number | string,
  cambios: Partial<Producto>
): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('productos')
      .update(cambios)
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  const current = getLocalDemoStock();
  const updated = current.map((p) => (p.id === id ? { ...p, ...cambios } : p));
  saveLocalDemoStock(updated);
}

export async function deleteProducto(id: number | string): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  const current = getLocalDemoStock();
  const updated = current.filter((p) => p.id !== id);
  saveLocalDemoStock(updated);
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
  const id = Date.now();
  const created: Cliente = { ...nuevo, id, created_at: new Date().toISOString() };
  const updated = [created, ...current];
  saveLocalDemoClientes(updated);
  return created;
}

export async function updateCliente(
  id: number | string,
  cambios: Partial<Cliente>
): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('clientes')
      .update(cambios)
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  const current = getLocalDemoClientes();
  const updated = current.map((c) => (c.id === id ? { ...c, ...cambios } : c));
  saveLocalDemoClientes(updated);
}

export async function deleteCliente(id: number | string): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  const current = getLocalDemoClientes();
  const updated = current.filter((c) => c.id !== id);
  saveLocalDemoClientes(updated);
}
