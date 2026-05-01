const PDFDocument = require('pdfkit');

export interface InvoiceData {
  orderNumber: string;
  orderDate: string;
  customerName: string;
  customerEmail: string;
  customerCountry?: string;
  customerId?: string;
  logoUrl?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    details?: string[];
  }[];
  subtotal: number;
  tax: number;
  total: number;
  paymentStatus: string;
  paymentMethod?: string;
  transactionId: string;
  companyName: string;
  companyAddress: string;
  companyCity?: string;
  companyEmail: string;
  companyPhone: string;
}

export class InvoiceGenerator {
  formatDate(date: Date): string {
    return date
      ? new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '';
  }

  async generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ size: 'A4', margin: 0 });

      const buffers: any[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      /* =========================
         HEADER (DARK GREEN BAR)
      ========================== */

      doc.rect(0, 0, 595, 120).fill('#0f3d3e');

      // --- Logo: use settings logo if available, else white rounded square with first letter ---
      const logoX = 40;
      const logoY = 30;
      const logoSize = 50;

      if (data.logoUrl) {
        try {
          doc.image(data.logoUrl, logoX, logoY, { fit: [logoSize, logoSize] });
        } catch {
          doc.roundedRect(logoX, logoY, logoSize, logoSize, 10).fill('#ffffff');
          const letter = data.companyName.charAt(0).toUpperCase();
          doc.fillColor('#0f3d3e').font('Helvetica-Bold').fontSize(24)
            .text(letter, logoX, logoY + 13, { width: logoSize, align: 'center' });
        }
      } else {
        doc.roundedRect(logoX, logoY, logoSize, logoSize, 10).fill('#ffffff');
        const letter = data.companyName.charAt(0).toUpperCase();
        doc.fillColor('#0f3d3e').font('Helvetica-Bold').fontSize(24)
          .text(letter, logoX, logoY + 13, { width: logoSize, align: 'center' });
      }

      // Company name (bold, large)
      const textX = logoX + logoSize + 14;
      doc.fillColor('#ffffff')
        .font('Helvetica-Bold')
        .fontSize(16)
        .text(data.companyName, textX, logoY + 4);

      // Address lines
      doc.fillColor('#ffffff')
        .font('Helvetica')
        .fontSize(9)
        .text(data.companyAddress, textX, logoY + 26)
        .text(data.companyCity || '', textX, logoY + 39)
        .text(`${data.companyPhone} | ${data.companyEmail}`, textX, logoY + 52);

      // INVOICE label — right side, vertically centered
      doc.fillColor('#ffffff')
        .font('Helvetica-Bold')
        .fontSize(28)
        .text('INVOICE', 380, 30, { width: 175, align: 'right' });

      doc.fillColor('#ffffff')
        .font('Helvetica')
        .fontSize(10)
        .text(data.orderNumber, 380, 68, { width: 175, align: 'right' });

      /* =========================
         BILL TO + INVOICE DETAILS
      ========================== */

      doc.fillColor('#000000');
      const sectionY = 148;

      // Thin separator line
      doc.moveTo(40, sectionY).lineTo(555, sectionY).strokeColor('#e5e7eb').lineWidth(0.5).stroke();

      // LEFT — BILL TO
      doc.fillColor('#6b7280')
        .font('Helvetica')
        .fontSize(8)
        .text('BILL TO', 40, sectionY + 18);

      doc.fillColor('#000000')
        .font('Helvetica-Bold')
        .fontSize(10)
        .text(data.customerName, 40, sectionY + 32);

      doc.fillColor('#000000')
        .font('Helvetica')
        .fontSize(9)
        .text(data.customerEmail, 40, sectionY + 48);

      if (data.customerCountry) {
        doc.text(data.customerCountry, 40, sectionY + 62);
      }

      if (data.customerId) {
        // Customer ID badge (light green pill)
        const badgeTextY = sectionY + (data.customerCountry ? 80 : 66);
        const badgeW = 70;
        const badgeH = 18;
        doc.roundedRect(40, badgeTextY - 3, badgeW, badgeH, 4).fill('#d1fae5');
        doc.fillColor('#065f46')
          .font('Helvetica-Bold')
          .fontSize(8)
          .text(data.customerId, 46, badgeTextY + 1);
      }

      // RIGHT — INVOICE DETAILS (right-aligned labels + values)
      const detailLabelX = 370;
      const detailValueX = 460;
      const detailWidth = 95;

      doc.fillColor('#6b7280')
        .font('Helvetica')
        .fontSize(8)
        .text('INVOICE DETAILS', detailValueX, sectionY + 18, { width: detailWidth, align: 'right' });

      // Date
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(9)
        .text('Date:', detailLabelX, sectionY + 34, { continued: false });
      doc.font('Helvetica')
        .text(data.orderDate, detailLabelX + 30, sectionY + 34, { width: detailWidth + (detailValueX - detailLabelX - 30), align: 'right' });

      // Order ID
      doc.font('Helvetica-Bold')
        .text('Order ID:', detailLabelX, sectionY + 50, { continued: false });
      doc.font('Helvetica')
        .text(data.orderNumber, detailLabelX + 46, sectionY + 50, { width: detailWidth + (detailValueX - detailLabelX - 46), align: 'right' });

      // Payment
      const paymentText = data.paymentMethod ? data.paymentMethod : data.paymentStatus;
      doc.font('Helvetica-Bold')
        .text('Payment:', detailLabelX, sectionY + 66, { continued: false });
      doc.font('Helvetica')
        .text(paymentText, detailLabelX + 44, sectionY + 66, { width: detailWidth + (detailValueX - detailLabelX - 44), align: 'right' });

      /* =========================
         TABLE HEADER
      ========================== */

      const tableY = sectionY + 120;

      // Thin line above table header
      doc.moveTo(40, tableY - 8).lineTo(555, tableY - 8).strokeColor('#e5e7eb').lineWidth(0.5).stroke();

      // Column positions
      const col = {
        desc: 40,
        qty: 360,
        rate: 430,
        amount: 510,
      };

      // Header labels (grey, small caps style)
      doc.fillColor('#6b7280')
        .font('Helvetica-Bold')
        .fontSize(8)
        .text('DESCRIPTION', col.desc, tableY)
        .text('QTY', col.qty, tableY, { width: 50, align: 'center' })
        .text('RATE', col.rate, tableY, { width: 50, align: 'right' })
        .text('AMOUNT', col.amount, tableY, { width: 45, align: 'right' });

      // Thin line below header
      const headerLineY = tableY + 14;
      doc.moveTo(40, headerLineY).lineTo(555, headerLineY).strokeColor('#d1d5db').lineWidth(0.5).stroke();

      /* =========================
         TABLE ROWS
      ========================== */

      let y = headerLineY + 14;

      data.items.forEach((item) => {
        // Bold description
        doc.fillColor('#000000')
          .font('Helvetica-Bold')
          .fontSize(9)
          .text(item.description, col.desc, y, { width: 300 });

        doc.font('Helvetica')
          .fontSize(9)
          .text(item.quantity.toString(), col.qty, y, { width: 50, align: 'center' })
          .text(`$${item.unitPrice.toFixed(2)}`, col.rate, y, { width: 50, align: 'right' })
          .text(`$${item.total.toFixed(2)}`, col.amount, y, { width: 45, align: 'right' });

        y += 16;

        // Sub-details (Tutor, Date/Time, etc.)
        if (item.details && item.details.length > 0) {
          doc.fillColor('#374151').font('Helvetica').fontSize(8);
          item.details.forEach((detail) => {
            doc.text(detail, col.desc, y, { width: 310 });
            y += 13;
          });
        }

        y += 6;
      });

      /* =========================
         TOTALS SECTION
      ========================== */

      const totalsY = y + 20;

      // Thin separator before totals
      doc.moveTo(40, totalsY - 10).lineTo(555, totalsY - 10).strokeColor('#e5e7eb').lineWidth(0.5).stroke();

      const totLabelX = 390;
      const totValueX = 465;
      const totValueW = 90;

      // Subtotal
      doc.fillColor('#000000').font('Helvetica').fontSize(9)
        .text('Subtotal', totLabelX, totalsY)
        .text(`$${data.subtotal.toFixed(2)}`, totValueX, totalsY, { width: totValueW, align: 'right' });

      // Tax
      doc.text('Tax', totLabelX, totalsY + 20)
        .text(`$${data.tax.toFixed(2)}`, totValueX, totalsY + 20, { width: totValueW, align: 'right' });

      // Thin line before TOTAL
      doc.moveTo(totLabelX, totalsY + 38).lineTo(555, totalsY + 38).strokeColor('#d1d5db').lineWidth(0.5).stroke();

      // TOTAL (bold, larger, teal value)
      doc.font('Helvetica-Bold').fontSize(12)
        .fillColor('#000000')
        .text('TOTAL', totLabelX, totalsY + 46);

      doc.fillColor('#0f3d3e')
        .font('Helvetica-Bold')
        .fontSize(14)
        .text(`$${data.total.toFixed(2)}`, totValueX, totalsY + 44, { width: totValueW, align: 'right' });

      /* =========================
         STATUS BADGE + TRANSACTION ID
      ========================== */

      const badgeRowY = totalsY + 90;

      // Thin line above badge row
      doc.moveTo(40, badgeRowY - 10).lineTo(555, badgeRowY - 10).strokeColor('#e5e7eb').lineWidth(0.5).stroke();

      // Status badge (green pill)
      const statusLabel = data.paymentStatus.toUpperCase();
      const badgePadX = 14;
      const badgeHeight = 20;
      doc.roundedRect(40, badgeRowY, 95, badgeHeight, 5).fill('#d1fae5');
      doc.fillColor('#065f46')
        .font('Helvetica-Bold')
        .fontSize(8)
        .text(statusLabel, 40 + badgePadX, badgeRowY + 6, { width: 95 - badgePadX * 2, align: 'center' });

      // Transaction ID — right side
      doc.fillColor('#000000')
        .font('Helvetica-Bold')
        .fontSize(8)
        .text('Transaction ID: ', 340, badgeRowY + 6, { continued: true })
        .font('Helvetica')
        .text(data.transactionId);

      /* =========================
         FOOTER
      ========================== */

      // Thin line above footer
      doc.moveTo(40, 730).lineTo(555, 730).strokeColor('#e5e7eb').lineWidth(0.5).stroke();

      doc.fillColor('#9ca3af')
        .font('Helvetica')
        .fontSize(7.5)
        .text(
          'This is a computer-generated invoice and does not require a signature.',
          40, 740,
          { align: 'center', width: 515 }
        )
        .text(`${data.companyName}, Texas, US`, 40, 754, { align: 'center', width: 515 });

      doc.end();
    });
  }
}