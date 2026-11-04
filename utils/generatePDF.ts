import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Pedido, Cliente, PedidoDetalle } from '../lib/supabase';

export interface PDFOrderData {
  id: number | string;
  tipo: 'COMPRA' | 'VENTA';
  estado?: string;
  created_at?: string;
  notas?: string;
  subtotal: number;
  incluye_iva: boolean;
  monto_iva: number;
  total_pedido: number;
  cliente?: Cliente;
  detalles: Array<{
    codigo?: string;
    descripcion?: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }>;
}

/**
 * Formatea valores numéricos a moneda argentina (ARS)
 */
export const formatCurrencyARS = (amount: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Genera y descarga automáticamente el Remito / Orden de Operación en PDF
 * con la identidad visual corporativa de Aberturas Miño.
 */
export function generateRemitoPDF(order: PDFOrderData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 14;
  let currentY = margin;

  // --- 1. CABECERA CORPORATIVA INDUSTRIAL ---
  // Franja superior de marca
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, currentY, pageWidth - margin * 2, 28, 'F');

  // Logotipo y Nombre de la Empresa
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ABERTURAS MIÑO', margin + 6, currentY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Carpintería de Aluminio & Perfilería Mayorista', margin + 6, currentY + 15);
  doc.text('Av. Mitre 4520, Quilmes, Bs. As. | Tel: +54 11 4253-8890', margin + 6, currentY + 19);
  doc.text('CUIT: 30-71894523-9 | IVA: Responsable Inscripto', margin + 6, currentY + 23);

  // Recuadro Tipo de Comprobante / Remito (Derecha)
  const isVenta = order.tipo === 'VENTA';
  const tagColor = isVenta ? [37, 99, 235] : [16, 185, 129]; // blue-600 o emerald-600

  doc.setFillColor(tagColor[0], tagColor[1], tagColor[2]);
  doc.roundedRect(pageWidth - margin - 64, currentY + 4, 58, 20, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(isVenta ? 'REMITO DE VENTA' : 'ORDEN DE COMPRA', pageWidth - margin - 35, currentY + 11, {
    align: 'center',
  });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° REF: #${order.id}`, pageWidth - margin - 35, currentY + 16, {
    align: 'center',
  });

  currentY += 34;

  // --- 2. INFORMACIÓN DEL COMPROBANTE Y CLIENTE ---
  const fechaStr = order.created_at
    ? new Date(order.created_at).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('es-AR');

  // Caja de Datos del Cliente y Operación
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.3);
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 32, 2, 2, 'FD');

  // Columna Izquierda: Cliente
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFont('helvetica', 'bold');
  doc.text(isVenta ? 'DATOS DEL CLIENTE (DESTINATARIO)' : 'DATOS DEL PROVEEDOR (ORIGEN)', margin + 4, currentY + 6);

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42); // slate-900
  const razonSocial = order.cliente?.razon_social || 'Cliente Mostrador / Sin Asignar';
  doc.text(razonSocial, margin + 4, currentY + 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`CUIT / DNI: ${order.cliente?.cuit || 'S/D'}`, margin + 4, currentY + 17);
  doc.text(`Condición IVA: ${order.cliente?.condicion_iva || 'Consumidor Final'}`, margin + 4, currentY + 22);
  doc.text(`Dirección: ${order.cliente?.direccion || 'Retira en planta'}`, margin + 4, currentY + 27);

  // Columna Derecha: Metadatos de la orden
  const colDerX = pageWidth / 2 + 10;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DE LA TRANSACCIÓN', colDerX, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Fecha y Hora: ${fechaStr}`, colDerX, currentY + 12);
  doc.text(`Estado: ${order.estado || 'COMPLETADO'}`, colDerX, currentY + 17);
  doc.text(`Condición de Pago: Cuenta Corriente / Contado`, colDerX, currentY + 22);
  doc.text(
    `Régimen IVA: ${order.incluye_iva ? 'IVA 21% DISCRIMINADO' : 'SIN DISCRIMINAR (FINAL)'}`,
    colDerX,
    currentY + 27
  );

  currentY += 38;

  // --- 3. TABLA DE ÍTEMS CON JSPDF-AUTOTABLE ---
  const tableRows = order.detalles.map((d, idx) => [
    `${idx + 1}`,
    d.codigo || 'PERFIL',
    d.descripcion || 'Perfil de aluminio normalizado',
    `${d.cantidad} u.`,
    formatCurrencyARS(d.precio_unitario),
    formatCurrencyARS(d.subtotal),
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'CÓDIGO', 'DESCRIPCIÓN DEL MATERIAL', 'CANTIDAD', 'P. UNITARIO', 'SUBTOTAL']],
    body: tableRows,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    bodyStyles: {
      textColor: [30, 41, 59],
      fontSize: 8,
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 28, fontStyle: 'bold' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
    },
  });

  // Obtenemos la coordenada Y posterior a la tabla
  const finalTableY = (doc as any).lastAutoTable?.finalY || currentY + 50;
  currentY = finalTableY + 6;

  // --- 4. SECCIÓN OBSERVACIONES Y RESUMEN FINANCIERO ---
  const summaryBoxWidth = 74;
  const summaryBoxX = pageWidth - margin - summaryBoxWidth;

  // Observaciones (Izquierda)
  if (order.notas && order.notas.trim().length > 0) {
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(margin, currentY, summaryBoxX - margin - 6, 28, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('OBSERVACIONES / CONDICIONES DE ENTREGA:', margin + 4, currentY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const splitNotes = doc.splitTextToSize(order.notas, summaryBoxX - margin - 14);
    doc.text(splitNotes, margin + 4, currentY + 11);
  }

  // Resumen Financiero Claro (Derecha)
  const summaryHeight = order.incluye_iva ? 32 : 24;
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(summaryBoxX, currentY, summaryBoxWidth, summaryHeight, 2, 2, 'FD');

  let summaryLineY = currentY + 7;

  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('SUBTOTAL:', summaryBoxX + 4, summaryLineY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrencyARS(order.subtotal), pageWidth - margin - 4, summaryLineY, {
    align: 'right',
  });

  // IVA 21% (Solo si aplica)
  if (order.incluye_iva) {
    summaryLineY += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(37, 99, 235); // blue-600
    doc.text('IVA (21%):', summaryBoxX + 4, summaryLineY);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrencyARS(order.monto_iva), pageWidth - margin - 4, summaryLineY, {
      align: 'right',
    });
  }

  // Divisor
  summaryLineY += 3;
  doc.setDrawColor(203, 213, 225);
  doc.line(summaryBoxX + 4, summaryLineY, pageWidth - margin - 4, summaryLineY);

  // Total Final
  summaryLineY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL FINAL:', summaryBoxX + 4, summaryLineY);
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text(formatCurrencyARS(order.total_pedido), pageWidth - margin - 4, summaryLineY, {
    align: 'right',
  });

  currentY += summaryHeight + 14;

  // --- 5. FIRMAS DE CONFORMIDAD ---
  const signBoxY = Math.max(currentY, 240);
  const signWidth = (pageWidth - margin * 2 - 20) / 2;

  // Firma 1: Entrega / Despacho
  doc.setDrawColor(148, 163, 184);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(margin + 10, signBoxY, margin + signWidth, signBoxY);
  doc.setLineDashPattern([], 0); // restaurar continuo

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('ENTREGÓ CONFORME', margin + signWidth / 2 + 5, signBoxY + 5, {
    align: 'center',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Aberturas Miño · Control de Depósito', margin + signWidth / 2 + 5, signBoxY + 9, {
    align: 'center',
  });

  // Firma 2: Recepción / Cliente
  const sign2X = pageWidth - margin - signWidth;
  doc.setDrawColor(148, 163, 184);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(sign2X, signBoxY, sign2X + signWidth - 10, signBoxY);
  doc.setLineDashPattern([], 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('RECIBIÓ CONFORME', sign2X + (signWidth - 10) / 2, signBoxY + 5, {
    align: 'center',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Firma, Aclaración y DNI del Receptor', sign2X + (signWidth - 10) / 2, signBoxY + 9, {
    align: 'center',
  });

  // Pie de página final
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Documento no válido como factura. Remito de control interno generado por Aberturas Miño ERP · ${fechaStr}`,
    pageWidth / 2,
    286,
    { align: 'center' }
  );

  // Descarga automática del archivo
  const safeFilename = `Remito_AberturasMino_${order.tipo}_${order.id}.pdf`;
  doc.save(safeFilename);

  return doc;
}
