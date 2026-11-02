# ERP Mayorista - Aberturas Miño (Gestión de Stock)

Sistema integral de gestión y control de inventario mayorista para fábrica y distribuidora de aberturas de aluminio y chapa (ventanas, puertas, portones y cerramientos), desarrollado con arquitectura Next.js (App Router), cliente oficial de Supabase y Tailwind CSS.

---

### Decisiones Críticas y Preferencias Confirmadas

> [!IMPORTANT]
> Decisiones de diseño y funcionamiento acordadas para el MVP:

- **Estética Visual Industrial**: Paleta basada en grafito oscuro (`#0f172a`, `#1e293b`), grises metálicos de aluminio cepillado (`#334155`, `#475569`) y acentos en **Azul Acero Industrial** (`#2563eb` / `#0284c7`) para acciones prioritarias y estados de foco.
- **Interacción para Actualizar Stock**: **Modal interactivo** de alta precisión con selector intuitivo de operación (**Sumar Entrada** [+] o **Restar Salida** [-]), validación de cantidades mínimas, cálculo del nuevo stock en tiempo real y registro de motivo opcional (ej. "Ingreso de fábrica", "Remito de entrega mayorista").
- **Modo Demostración / Resiliencia de Conexión**: Detección automática del estado de las variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Si no están configuradas en el entorno actual, el sistema activa un modo de datos interactivo con productos reales de aberturas (Línea Módena, Línea Herrero, A30 New, Chapa Inyectada) y permite probar las altas y bajas sin errores ni bloqueos.
- **Doble Entregable**: Estructura de código limpia y modular para Next.js App Router (`lib/supabase.ts`, `app/page.tsx`, `app/layout.tsx`, SQL DDL) y su integración inmediata y verificada en el entorno de previsualización en vivo.

---

## 1. Visión General y Concepto Central

- **Propósito**: Proporcionar al personal de depósito y ventas mayoristas de *Aberturas Miño* un panel de control veloz, robusto y sin distracciones para consultar precios por bulto/unidad, código SKU de fábrica, línea de perfiles y ajustar niveles de stock al despachar pedidos o recibir lotes de extrusión.
- **Usuario Objetivo**: Encargados de depósito, despachantes de fábrica y operadores de ventas mayoristas.
- **Valor Principal**: Velocidad de consulta y cero errores de stock mediante feedback visual inmediato y actualización reactiva en Supabase.

---

## 2. Experiencia de Usuario y Diseño Visual

### Identidad Visual & Paleta Industrial
- **Superficie y Contenedores**: Fondo pizarra industrial oscura (`slate-950`/`slate-900`) con bordes finos de precisión técnica (`border-slate-800`), simulando paneles de control de maquinaria e instrumentación de taller.
- **Acento Azul Acero**: Botones primarios, estados activos y badges de línea en tonos azul acero templado (`blue-600` / `cyan-500`).
- **Tipografía y Legibilidad**: 
  - Títulos y navegación con corte nítido y moderno (`Plus Jakarta Sans` / `Outfit`).
  - Precios, SKUs y cantidades de stock formateados estrictamente con números tabulares monoespaciados (`font-mono tabular-nums`) para evitar saltos de línea y facilitar la comparación visual por columnas.
- **Alertas de Stock**:
  - *Stock Crítico* ($\le 5$ u): Indicador ámbar/rojo con texto explícito de reposición.
  - *Stock Normal*: Estado neutro de alta visibilidad.

### Flujo de Usuario: Actualización de Stock
1. **Exploración**: El usuario visualiza la grilla con filtrado por búsqueda de SKU/nombre o selección por línea (Herrero, Módena, A30 New, etc.).
2. **Apertura de Acción**: Clic en `"Actualizar Stock"` en la fila del producto deseado.
3. **Modal de Ajuste**:
   - Muestra el SKU, nombre del producto y stock actual en números destacados.
   - Botones segmentados para elegir: `Ingreso (+)` o `Egreso (-)`.
   - Campo numérico con botones rápidos (`+1`, `+5`, `+10`, `+50`).
   - Previsualización en vivo del balance resultante: `Stock Actual (14) - Salida (3) = 11 unidades`.
4. **Confirmación**: Clic en `"Confirmar Ajuste"`. Se dispara la llamada asíncrona a Supabase `update({ stock_actual })`, con spinner de carga y toast de éxito.

---

## 3. Decisiones de Producto y Arquitectura de Datos

- **Cliente Supabase Centralizado (`lib/supabase.ts`)**:
  - Se instancia `createClient(supabaseUrl, supabaseAnonKey)` tipado con la interfaz TypeScript de la tabla `productos`.
  - Mecanismo seguro de fallback que no crashea si las variables de entorno están ausentes en tiempo de compilación.
- **Esquema de Base de Datos Supabase (`productos`)**:
  - `id`: `uuid` o `bigint` autoincremental (Primary Key).
  - `codigo_sku`: `text` (ej. `ABM-MOD-150`, `ABM-HER-120`).
  - `nombre`: `text` (ej. `Ventana Corrediza Módena DVH 1.50x1.10m`).
  - `linea`: `text` (ej. `Módena`, `Herrero`, `A30 New`, `Chapa`).
  - `tipo`: `text` (ej. `Ventana`, `Puerta`, `Portón`, `Paño Fijo`).
  - `precio_mayorista`: `numeric` / `decimal`.
  - `stock_actual`: `integer`.
- **Script SQL de Creación y Datos Iniciales**:
  - Se proveerá el script SQL completo para que el usuario pueda copiar y ejecutar en el SQL Editor de Supabase en 1 clic.

---

## 4. Arquitectura Técnica y Componentes

### Diagrama de Componentes y Flujo de Datos

```
┌────────────────────────────────────────────────────────────────────────┐
│                   ERP Mayorista - Aberturas Miño                      │
└────────────────────────────────────────────────────────────────────────┘
                                    │
       ┌────────────────────────────┴───────────────────────────┐
       ▼                                                        ▼
┌──────────────────────────────┐        ┌──────────────────────────────┐
│  Top Bar & Metric Strip      │        │  Filtros & Buscador en Vivo  │
│  - Total Items / Alertas     │        │  - Búsqueda SKU/Nombre       │
│  - Estado Supabase / Demo    │        │  - Filtro por Línea/Tipo     │
└──────────────────────────────┘        └──────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  Tabla de Productos (Data Grid Industrial)                             │
│  - SKU | Producto | Línea | Tipo | Precio Mayorista | Stock | Acciones │
│  - font-mono tabular-nums | Filas con hover sutil                      │
└────────────────────────────────────────────────────────────────────────┘
                                    │  [Clic en 'Actualizar Stock']
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  Modal 'Actualizar Stock'                                              │
│  - Selector Sumar (+) / Restar (-)                                     │
│  - Input de cantidad + cálculo dinámico                                │
│  - Ejecuta Supabase update() / Fallback local interactivo              │
└────────────────────────────────────────────────────────────────────────┘
```

### Estructura de Archivos del Proyecto
1. `lib/supabase.ts`: Inicialización del cliente Supabase, tipos TypeScript y helpers de persistencia.
2. `components/StockUpdateModal.tsx`: Componente accesible de diálogo para entrada/salida de stock.
3. `components/ProductsTable.tsx`: Grilla de datos con columnas ordenables, formato de moneda ARS/USD y feedback visual.
4. `app/page.tsx`: Vista principal de Next.js (Dashboard industrial completo, métricas de inventario y estado en tiempo real).
5. `app/layout.tsx`: Layout raíz con configuración de fuentes y metadatos.
6. `schema.sql`: Script DDL listo para ejecutar en Supabase con la tabla `productos` y datos iniciales de prueba.
