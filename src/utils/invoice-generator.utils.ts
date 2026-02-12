const PDFDocument = require('pdfkit');

export interface InvoiceData {
  orderNumber: string;
  orderDate: string;
  customerName: string;
  customerEmail: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentStatus: string;
  transactionId: string;
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export class InvoiceGenerator {
  async generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      const buffers: any[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers as any)));

      /* =========================
         HEADER
      ========================== */

      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(data.companyName, 50, 50);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(data.companyAddress)
        .text(data.companyEmail)
        .text(data.companyPhone);

      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('INVOICE', 400, 50, { align: 'right' });

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Order #: ${data.orderNumber}`, { align: 'right' })
        .text(`Date: ${data.orderDate}`, { align: 'right' });

      doc.moveDown(2);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1.5);

      /* =========================
         BILL TO
      ========================== */

     const billToX = 50;
const billToY = doc.y;

doc
  .fontSize(11)
  .font('Helvetica-Bold')
  .text('BILL TO', billToX, billToY);

doc
  .fontSize(10)
  .font('Helvetica')
  .text(data.customerName, billToX, billToY + 15)
  .text(data.customerEmail, billToX, billToY + 30);

doc.moveDown(2);

      /* =========================
         TABLE HEADER
      ========================== */

      const tableTop = doc.y;

this.tableRow(
  doc,
  tableTop,
  'DESCRIPTION',
  'QTY',
  'UNIT PRICE',
  'TOTAL',
  true
);

let y = tableTop + 25;

for (const item of data.items) {
  const unitPrice = Number(item.unitPrice) || 0;
  const total = Number(item.total) || 0;

  this.tableRow(
    doc,
    y,
    item.description,
    item.quantity.toString(),
    `$${unitPrice.toFixed(2)}`,
    `$${total.toFixed(2)}`
  );

  y += 25;
}

doc.moveDown(2);

      /* =========================
         TOTALS
      ========================== */

      const totalsX = 350;

      const subtotal = Number(data.subtotal) || 0;
      const tax = Number(data.tax) || 0;
      const total = Number(data.total) || 0;

      doc
        .fontSize(10)
        .text('Subtotal', totalsX, y)
        .text(`$${subtotal.toFixed(2)}`, 500, y, { align: 'right' });

      y += 18;

      doc
        .text('Tax', totalsX, y)
        .text(`$${tax.toFixed(2)}`, 500, y, { align: 'right' });

      y += 18;

      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text('Total', totalsX, y)
        .text(`$${total.toFixed(2)}`, 500, y, { align: 'right' });

      doc.moveDown(2);

   

      /* =========================
   PAYMENT INFO (LEFT SIDE)
========================= */

const paymentStartY = y + 40; // push below totals safely

doc
  .fontSize(11)
  .font('Helvetica-Bold')
  .text('PAYMENT', 50, paymentStartY);

doc
  .fontSize(10)
  .font('Helvetica')
  .text(`Transaction ID: ${data.transactionId || 'N/A'}`, 50, paymentStartY + 15)
  .text(`Status: ${data.paymentStatus}`, 50, paymentStartY + 30);

      /* =========================
         FOOTER
      ========================== */

      doc
        .fontSize(9)
        .fillColor('#555')
        .text('Thank you for your business.', { align: 'center' })
        .text('This invoice was generated electronically.', {
          align: 'center',
        });

      doc.end();
    });
  }

  private tableRow(
    doc: any,
    y: number,
    col1: string,
    col2: string,
    col3: string,
    col4: string,
    header = false
  ) {
    doc
      .font(header ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(10)
      .text(col1, 50, y, { width: 250 })
      .text(col2, 320, y, { width: 50, align: 'center' })
      .text(col3, 380, y, { width: 80, align: 'right' })
      .text(col4, 470, y, { width: 80, align: 'right' });

    doc.moveTo(50, y + 18).lineTo(550, y + 18).stroke();
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
