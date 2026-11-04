'use client';

import React from 'react';
import { Package, ArrowRight, Layers } from 'lucide-react';

export interface ColumnDef<T> {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
  render?: (item: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  isLoading?: boolean;
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptySubtitle?: string;
  footerContent?: React.ReactNode;
  onRowClick?: (item: T) => void;
}

/**
 * Tabla de Datos Genérica Optimizada para ERP Industrial (Mobile-First)
 * - Contenedor con overflow-x-auto y momentum scroll
 * - Padding reducido en móviles (px-2.5 py-2.5) y amplio en desktop (md:px-4 md:py-3.5)
 * - Fuentes tabulares mono y alineación estricta
 */
export default function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyIcon,
  emptyTitle = 'No hay registros disponibles',
  emptySubtitle = 'Los datos aparecerán aquí cuando se registren en el sistema.',
  footerContent,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
      {/* Indicador sutil de scroll en celulares */}
      <div className="sm:hidden px-3 py-1.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <span>Desliza para ver más detalles</span>
        <ArrowRight className="h-3 w-3 text-slate-600 animate-pulse" />
      </div>

      {/* Contenedor responsivo con scroll horizontal */}
      <div className="overflow-x-auto touch-pan-x">
        <table className="w-full text-left border-collapse text-[11px] sm:text-xs">
          {/* Cabecera de Tabla */}
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/90 text-slate-400 font-semibold uppercase tracking-wider font-mono">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`py-2.5 px-2.5 sm:px-3 sm:py-3 md:px-4 md:py-3.5 whitespace-nowrap ${
                    col.align === 'center'
                      ? 'text-center'
                      : col.align === 'right'
                      ? 'text-right'
                      : 'text-left'
                  } ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Filas de la Tabla */}
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx} className="animate-pulse">
                  {columns.map((col, cIdx) => (
                    <td
                      key={cIdx}
                      className="py-3 px-2.5 sm:px-3 sm:py-3 md:px-4 md:py-4"
                    >
                      <div className="h-4 bg-slate-800 rounded w-full max-w-[120px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 px-4 text-center text-slate-400"
                >
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    {emptyIcon || <Package className="h-8 w-8 text-slate-600 mb-2" />}
                    <p className="text-xs sm:text-sm font-semibold text-slate-300">
                      {emptyTitle}
                    </p>
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
                      {emptySubtitle}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={keyExtractor(item, index)}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`transition-colors ${
                    onRowClick
                      ? 'cursor-pointer hover:bg-slate-800/50'
                      : 'hover:bg-slate-800/30'
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-2.5 px-2.5 sm:px-3 sm:py-3 md:px-4 md:py-3.5 ${
                        col.align === 'center'
                          ? 'text-center'
                          : col.align === 'right'
                          ? 'text-right'
                          : 'text-left'
                      } ${col.className || ''}`}
                    >
                      {col.render
                        ? col.render(item, index)
                        : (item as any)[col.key] ?? '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pie de tabla responsivo */}
      {footerContent && (
        <div className="border-t border-slate-800 bg-slate-950/80 px-3 py-2.5 sm:px-4 sm:py-3 text-[11px] sm:text-xs text-slate-400">
          {footerContent}
        </div>
      )}
    </div>
  );
}
