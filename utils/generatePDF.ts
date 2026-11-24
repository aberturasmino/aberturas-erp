import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Cliente } from '../lib/supabase';

export type TipoDocumentoPDF = 'PRESUPUESTO' | 'REMITO';

export interface PDFOrderDetail {
  codigo?: string;
  material?: string | null;
  descripcion?: string;
  cantidad: number;
  peso_kg?: number | null;
  precio_unitario: number;
  subtotal: number;
}

export interface PDFOrderData {
  id: number | string;
  tipo: 'COMPRA' | 'VENTA';
  estado?: string;
  tipoDocumento?: TipoDocumentoPDF;
  created_at?: string;
  notas?: string;
  subtotal: number;
  incluye_iva: boolean;
  monto_iva: number;
  total_pedido: number;
  cliente?: Cliente;
  detalles: PDFOrderDetail[];
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
 * Genera y descarga automáticamente el Presupuesto o Remito en PDF
 * con la identidad visual corporativa de Aberturas Miño y columna de Peso (kg).
 */
export function generateRemitoPDF(
  order: PDFOrderData,
  tipoDocumentoArg?: TipoDocumentoPDF
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const tipoDocumento: TipoDocumentoPDF =
    tipoDocumentoArg ||
    order.tipoDocumento ||
    (order.estado === 'PRESUPUESTO' ? 'PRESUPUESTO' : 'REMITO');

  const esPresupuesto = tipoDocumento === 'PRESUPUESTO';
  const isVenta = order.tipo === 'VENTA';

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 14;
  let currentY = margin;

  // --- 1. CABECERA CORPORATIVA INDUSTRIAL ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, currentY, pageWidth - margin * 2, 28, 'F');

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

  // Recuadro Tipo de Documento (Derecha)
  const tagColor = esPresupuesto
    ? [217, 119, 6] // amber-600 para PRESUPUESTO
    : isVenta
    ? [37, 99, 235] // blue-600 para REMITO DE VENTA
    : [16, 185, 129]; // emerald-600 para ORDEN DE COMPRA

  const docTitle = esPresupuesto
    ? 'PRESUPUESTO'
    : isVenta
    ? 'REMITO DE VENTA'
    : 'ORDEN DE COMPRA';

  doc.setFillColor(tagColor[0], tagColor[1], tagColor[2]);
  doc.roundedRect(pageWidth - margin - 64, currentY + 4, 58, 20, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(docTitle, pageWidth - margin - 35, currentY + 11, {
    align: 'center',
  });

  const shortRef =
    String(order.id).length > 12
      ? String(order.id).slice(0, 8).toUpperCase()
      : String(order.id);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° REF: #${shortRef}`, pageWidth - margin - 35, currentY + 16, {
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

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 32, 2, 2, 'FD');

  // Columna Izquierda: Cliente
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text(
    esPresupuesto
      ? 'CLIENTE / SOLICITANTE'
      : isVenta
      ? 'DATOS DEL CLIENTE (DESTINATARIO)'
      : 'DATOS DEL PROVEEDOR (ORIGEN)',
    margin + 4,
    currentY + 6
  );

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  const razonSocial = order.cliente?.razon_social || 'Cliente Mostrador / Sin Asignar';
  doc.text(razonSocial, margin + 4, currentY + 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`CUIT / DNI: ${order.cliente?.cuit || 'S/D'}`, margin + 4, currentY + 17);
  doc.text(
    `Condición IVA: ${order.cliente?.condicion_iva || 'Consumidor Final'}`,
    margin + 4,
    currentY + 22
  );
  doc.text(
    `Dirección: ${order.cliente?.direccion || 'Retira en planta'}`,
    margin + 4,
    currentY + 27
  );

  // Columna Derecha: Metadatos de la orden
  const colDerX = pageWidth / 2 + 10;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL DOCUMENTO', colDerX, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Fecha y Hora: ${fechaStr}`, colDerX, currentY + 12);
  doc.text(
    `Estado: ${order.estado || (esPresupuesto ? 'PRESUPUESTO' : 'COMPLETADO')}`,
    colDerX,
    currentY + 17
  );
  doc.text(
    esPresupuesto
      ? 'Validez: 7 días · Sujeto a variación de aluminio'
      : 'Condición de Pago: Cuenta Corriente / Contado',
    colDerX,
    currentY + 22
  );
  doc.text(
    `Régimen IVA: ${order.incluye_iva ? 'IVA 21% DISCRIMINADO' : 'SIN DISCRIMINAR (FINAL)'}`,
    colDerX,
    currentY + 27
  );

  currentY += 38;

  // --- 3. TABLA DE ÍTEMS CON JSPDF-AUTOTABLE (INCLUYE PESO KG) ---
  const tableRows = order.detalles.map((d, idx) => {
    const hasPeso = d.peso_kg !== null && d.peso_kg !== undefined && Number(d.peso_kg) > 0;
    const codigoCol = d.codigo || (d.material ? 'COTIZ.' : 'PERFIL');
    const descripcionCol =
      d.descripcion || d.material || 'Perfil de aluminio normalizado';
    const pesoCol = hasPeso ? `${Number(d.peso_kg).toFixed(2)} kg` : '—';

    return [
      `${idx + 1}`,
      codigoCol,
      descripcionCol,
      `${d.cantidad} u.`,
      pesoCol,
      formatCurrencyARS(d.precio_unitario),
      formatCurrencyARS(d.subtotal),
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [
      ['#', 'CÓDIGO', 'DESCRIPCIÓN / LÍNEA', 'CANT.', 'PESO (KG)', 'P. UNITARIO', 'SUBTOTAL'],
    ],
    body: tableRows,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
    },
    bodyStyles: {
      textColor: [30, 41, 59],
      fontSize: 8,
      cellPadding: 2.3,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 23, fontStyle: 'bold' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 21, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 26, halign: 'right' },
      6: { cellWidth: 29, halign: 'right', fontStyle: 'bold' },
    },
  });

  const finalTableY = (doc as any).lastAutoTable?.finalY || currentY + 50;
  currentY = finalTableY + 6;

  // --- 4. SECCIÓN OBSERVACIONES Y RESUMEN FINANCIERO ---
  const summaryBoxWidth = 74;
  const summaryBoxX = pageWidth - margin - summaryBoxWidth;

  if (order.notas && order.notas.trim().length > 0) {
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(margin, currentY, summaryBoxX - margin - 6, 28, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(
      esPresupuesto
        ? 'OBSERVACIONES / ACLARACIONES DEL PRESUPUESTO:'
        : 'OBSERVACIONES / CONDICIONES DE ENTREGA:',
      margin + 4,
      currentY + 6
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const splitNotes = doc.splitTextToSize(order.notas, summaryBoxX - margin - 14);
    doc.text(splitNotes, margin + 4, currentY + 11);
  }

  const summaryHeight = order.incluye_iva ? 32 : 24;
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(summaryBoxX, currentY, summaryBoxWidth, summaryHeight, 2, 2, 'FD');

  let summaryLineY = currentY + 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('SUBTOTAL:', summaryBoxX + 4, summaryLineY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrencyARS(order.subtotal), pageWidth - margin - 4, summaryLineY, {
    align: 'right',
  });

  if (order.incluye_iva) {
    summaryLineY += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(37, 99, 235);
    doc.text('IVA (21%):', summaryBoxX + 4, summaryLineY);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrencyARS(order.monto_iva), pageWidth - margin - 4, summaryLineY, {
      align: 'right',
    });
  }

  summaryLineY += 3;
  doc.setDrawColor(203, 213, 225);
  doc.line(summaryBoxX + 4, summaryLineY, pageWidth - margin - 4, summaryLineY);

  summaryLineY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL FINAL:', summaryBoxX + 4, summaryLineY);
  doc.setTextColor(esPresupuesto ? 217 : 16, esPresupuesto ? 119 : 185, esPresupuesto ? 6 : 129);
  doc.text(formatCurrencyARS(order.total_pedido), pageWidth - margin - 4, summaryLineY, {
    align: 'right',
  });

  currentY += summaryHeight + 14;

  // --- 5. FIRMAS DE CONFORMIDAD / APROBACIÓN ---
  const signBoxY = Math.max(currentY, 240);
  const signWidth = (pageWidth - margin * 2 - 20) / 2;

  doc.setDrawColor(148, 163, 184);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(margin + 10, signBoxY, margin + signWidth, signBoxY);
  doc.setLineDashPattern([], 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    esPresupuesto ? 'EMITIDO POR' : 'ENTREGÓ CONFORME',
    margin + signWidth / 2 + 5,
    signBoxY + 5,
    { align: 'center' }
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    esPresupuesto ? 'Aberturas Miño · Oficina Técnica' : 'Aberturas Miño · Control de Depósito',
    margin + signWidth / 2 + 5,
    signBoxY + 9,
    { align: 'center' }
  );

  const sign2X = pageWidth - margin - signWidth;
  doc.setDrawColor(148, 163, 184);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(sign2X, signBoxY, sign2X + signWidth - 10, signBoxY);
  doc.setLineDashPattern([], 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    esPresupuesto ? 'APROBACIÓN DEL CLIENTE' : 'RECIBIÓ CONFORME',
    sign2X + (signWidth - 10) / 2,
    signBoxY + 5,
    { align: 'center' }
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Firma, Aclaración y DNI del Receptor', sign2X + (signWidth - 10) / 2, signBoxY + 9, {
    align: 'center',
  });

  // Pie de página
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    esPresupuesto
      ? `Presupuesto emitido por Aberturas Miño ERP · No reserva stock hasta su confirmación · ${fechaStr}`
      : `Documento no válido como factura. Remito de control interno generado por Aberturas Miño ERP · ${fechaStr}`,
    pageWidth / 2,
    286,
    { align: 'center' }
  );

  // Nombre de archivo adaptado según tipoDocumento
  const safeFilename = esPresupuesto
    ? `Presupuesto_AberturasMino_${order.id}.pdf`
    : `Remito_AberturasMino_${order.tipo}_${order.id}.pdf`;
  doc.save(safeFilename);

  return doc;
}
