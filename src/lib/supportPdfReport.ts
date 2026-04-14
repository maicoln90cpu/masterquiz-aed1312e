import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SupportAction } from '@/contexts/SupportModeContext';

interface ReportData {
  userName: string;
  userEmail: string;
  planType: string;
  startTime: Date;
  duration: string;
  actions: SupportAction[];
}

export const generateSupportPdfReport = async (data: ReportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // ── Header background ──
  doc.setFillColor(22, 163, 74); // green-600
  doc.rect(0, 0, pageWidth, 40, 'F');

  // ── Logo text (since we can't easily embed image) ──
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('MasterQuiz', 14, 18);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Relatório de Sessão de Suporte', 14, 28);

  // Date on right
  doc.setFontSize(9);
  doc.text(
    `Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
    pageWidth - 14, 28,
    { align: 'right' }
  );

  // ── User info section ──
  let y = 52;
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Dados do Usuário', 14, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const infoLines = [
    ['Usuário', data.userName],
    ['Email', data.userEmail],
    ['Plano', data.planType.toUpperCase()],
    ['Início da Sessão', data.startTime.toLocaleString('pt-BR')],
    ['Duração', data.duration],
    ['Total de Ações', String(data.actions.length)],
  ];

  for (const [label, value] of infoLines) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 55, y);
    y += 6;
  }

  // ── Separator ──
  y += 4;
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y, pageWidth - 14, y);
  y += 8;

  // ── Actions table ──
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 50, 50);
  doc.text('Ações Realizadas', 14, y);
  y += 4;

  const tableData = data.actions.map((action, i) => [
    String(i + 1),
    action.timestamp.toLocaleTimeString('pt-BR'),
    action.action,
    action.details || '-',
    action.resourceId ? `${action.resourceId.slice(0, 8)}...` : '-',
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Hora', 'Ação', 'Detalhe', 'ID Recurso']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [22, 163, 74],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [50, 50, 50],
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 22 },
      2: { cellWidth: 55 },
      3: { cellWidth: 60 },
      4: { cellWidth: 28 },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (hookData) => {
      // Footer on each page
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `MasterQuiz — Relatório de Suporte — Página ${hookData.pageNumber} de ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    },
  });

  // ── Save ──
  const fileName = `suporte-${data.userEmail.split('@')[0]}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);

  return fileName;
};
