import { createClient } from '@supabase/supabase-js';

// Types for Aberturas Miño stock management
export interface Producto {
  id: number | string;
  codigo_sku: string;
  nombre: string;
  linea: string; // ej. Módena, Herrero, A30 New, Chapa Inyectada
  tipo: string;  // ej. Ventana, Puerta, Portón, Paño Fijo
  precio_mayorista: number;
  stock_actual: number;
  created_at?: string;
}

// Support both Next.js (process.env.NEXT_PUBLIC_*) and Vite (import.meta.env.VITE_*)
const supabaseUrl =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
  '';

const supabaseAnonKey =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
  '';

// Detect if valid Supabase credentials are configured
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.includes('supabase.co') &&
  !supabaseUrl.includes('your-project')
);

// Create the official Supabase client instance
// If credentials are dummy/empty, provide a safe placeholder client to prevent runtime crashes
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://dummy-project.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'dummy-anon-key'
);

// Sample industrial seed data for Aberturas Miño (windows, doors, gates & enclosures)
export const INITIAL_PRODUCTOS: Producto[] = [
  {
    id: 1,
    codigo_sku: 'ABM-MOD-150-DVH',
    nombre: 'Ventana Corrediza Módena 1.50 x 1.10m c/ DVH 4+9+4 Blanco',
    linea: 'Línea Módena',
    tipo: 'Ventana',
    precio_mayorista: 145000,
    stock_actual: 18,
  },
  {
    id: 2,
    codigo_sku: 'ABM-MOD-200-DVH',
    nombre: 'Ventana Balcón Módena 2.00 x 2.00m Vidrio Entero DVH Negro',
    linea: 'Línea Módena',
    tipo: 'Ventana Balcón',
    precio_mayorista: 268000,
    stock_actual: 7,
  },
  {
    id: 3,
    codigo_sku: 'ABM-HER-120-VID',
    nombre: 'Ventana Corrediza Herrero 1.20 x 1.00m Vidrio Flotante 4mm Blanco',
    linea: 'Línea Herrero',
    tipo: 'Ventana',
    precio_mayorista: 68500,
    stock_actual: 32,
  },
  {
    id: 4,
    codigo_sku: 'ABM-HER-150-VID',
    nombre: 'Ventana Corrediza Herrero 1.50 x 1.10m Vidrio 4mm Anodizado Natural',
    linea: 'Línea Herrero',
    tipo: 'Ventana',
    precio_mayorista: 82000,
    stock_actual: 4, // Stock crítico
  },
  {
    id: 5,
    codigo_sku: 'ABM-A30-220-DVH',
    nombre: 'Puerta Ventana A30 New Elevable 2.40 x 2.20m DVH Laminado Negro',
    linea: 'A30 New Premium',
    tipo: 'Puerta Ventana',
    precio_mayorista: 489000,
    stock_actual: 3, // Stock crítico
  },
  {
    id: 6,
    codigo_sku: 'ABM-CHP-080-INY',
    nombre: 'Puerta Entrada Chapa Inyectada 18 Barral Acero 0.80 x 2.00m Grafito',
    linea: 'Chapa Inyectada',
    tipo: 'Puerta Exterior',
    precio_mayorista: 198000,
    stock_actual: 12,
  },
  {
    id: 7,
    codigo_sku: 'ABM-CHP-090-APL',
    nombre: 'Puerta Chapa Doble Inyectada Lisa c/ Apliques Acero 0.90 x 2.00m',
    linea: 'Chapa Inyectada',
    tipo: 'Puerta Exterior',
    precio_mayorista: 215000,
    stock_actual: 15,
  },
  {
    id: 8,
    codigo_sku: 'ABM-MOD-PF-060',
    nombre: 'Paño Fijo Módena 0.60 x 1.50m Vidrio Laminado de Seguridad 3+3',
    linea: 'Línea Módena',
    tipo: 'Paño Fijo',
    precio_mayorista: 94000,
    stock_actual: 22,
  },
  {
    id: 9,
    codigo_sku: 'ABM-PRT-LEV-240',
    nombre: 'Portón Levadizo Automático Chapa 18 c/ Contrapesos 2.40 x 2.00m',
    linea: 'Chapa Inyectada',
    tipo: 'Portón',
    precio_mayorista: 620000,
    stock_actual: 2, // Stock crítico
  },
  {
    id: 10,
    codigo_sku: 'ABM-HER-BAN-060',
    nombre: 'Ventiluz Banderola Herrero 0.60 x 0.40m Vidrio Fantasía 4mm',
    linea: 'Línea Herrero',
    tipo: 'Ventiluz',
    precio_mayorista: 39500,
    stock_actual: 45,
  },
];

// Helper to get or set local demo storage when Supabase is not connected
const LOCAL_STORAGE_KEY = 'aberturas_mino_stock_demo_v1';

export function getLocalDemoStock(): Producto[] {
  if (typeof window === 'undefined') return INITIAL_PRODUCTOS;
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
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
