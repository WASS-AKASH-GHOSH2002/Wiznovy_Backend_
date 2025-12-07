import PDFDocument from 'pdfkit';

const titleFontSize = 24;
const subTitleFontSize = 14;
const leadingFontSize = 13;
const contentFontSize = 11;
const tableHeaderFontSize = 12;
const footerFontSize = 10;

const paperSizeHeight = 841.89;
const paperSizeWidth = 595.28;
const paperMargin = 40;
const lineSpacing = 18;
const bottomGap = 25;

export async function createInvoice(invoice) {
  let doc = new PDFDocument({
    size: [paperSizeWidth, paperSizeHeight],
    margin: paperMargin,
  });

  generateHeader(doc, invoice, 60);
  await generateOrderInformation(doc, invoice, 210);
  generateInvoiceTable(doc, invoice, 330);
  generateFooter(doc);
  return doc;
}

function generateHeader(doc, invoice, top) {
  const leftX = paperMargin;
  const rightX = paperSizeWidth - paperMargin - 150;

  doc
    .fillColor('#2c3e50')
    .fontSize(titleFontSize)
    .font('Helvetica-Bold')
    .text('INVOICE', { align: 'center' })
    .moveDown(0.5)
    .fontSize(subTitleFontSize)
    .font('Helvetica')
    .fillColor('#000');

  // Left Column - Company Info
  doc
    .fontSize(leadingFontSize)
    .font('Helvetica-Bold')
    .fillColor('blue')
    .text(invoice.invoiceNumber, leftX, top + lineSpacing * 2)
    .fillColor('black')
    .text(invoice.businessName, leftX, top + lineSpacing * 3)
    .font('Helvetica');

  // Split address into lines of max 36 characters
  const maxLineLength = 36;
  const addressLines = [];
  let addressText = invoice.address || '';

  while (addressText.length > 0) {
    addressLines.push(addressText.substring(0, maxLineLength));
    addressText = addressText.substring(maxLineLength);
  }

  // Draw address lines
  addressLines.forEach((line, index) => {
    doc.text(line, leftX, top + lineSpacing * (4 + index));
  });

  // Right Column - Client Info
  doc
    .fontSize(contentFontSize)
    .font('Helvetica-Bold')
    .fillColor('red')
    .text('Bill To:', rightX, top + lineSpacing * 2)
    .fillColor('black')
    .font('Helvetica-Bold')
    .text(`${invoice?.buyerNamer},`, rightX, top + lineSpacing * 3)
    .font('Helvetica')
    .text(invoice.designation, rightX, top + lineSpacing * 4);
}

async function generateOrderInformation(doc, invoice, top) {
  const leftX = paperMargin;
  doc
    .fontSize(contentFontSize)
    .font('Helvetica-Bold')
    .text(`Invoice Date: ${formatDate(invoice.paymentDate)}`, leftX, top)
    .text(`Subject: Hire India ${invoice.planName} Plan`, leftX, top + lineSpacing)
    .text(`Sale Agent: Hire India`, leftX, top + lineSpacing * 2)
}

function generateInvoiceTable(doc, invoice, y) {
  const labelX = 350;
  const valueX = 500;

  doc.font('Helvetica-Bold').fontSize(tableHeaderFontSize);
  generateTableRow(doc, y, 'Item', 'Coins Purchased', 'Amount(INR)', true);
  generateHr(doc, y + lineSpacing);

  doc.font('Helvetica').fontSize(contentFontSize);
  let position = y + lineSpacing * 2;
  generateTableRow(
    doc,
    position,
    `Hire India ${invoice.planName} Plan`,
    invoice.purchasedCoin,
    invoice.total.toFixed(2),
  );

  let taxPosition = position + lineSpacing;
  // taxPosition += invoice.tax.length * lineSpacing + 20;

  doc.font('Helvetica-Bold');
  generateAlignedText(
    doc,
    taxPosition + lineSpacing ,
    'Total Paid:',
    invoice.total,
    labelX,
    valueX,
  );
}

function generateAlignedText(doc, y, label, amount, labelX, valueX) {
  doc
    .fontSize(contentFontSize)
    .text(label, labelX, y, { width: valueX - labelX - 10, align: 'right' })
    .text(formatCurrency(amount), valueX, y, { align: 'right' });
}

function generateTableRow(doc, y, item, coins, amount, isHeader = false) {
  const fontStyle = isHeader ? 'Helvetica-Bold' : 'Helvetica';
  const fontSize = isHeader ? tableHeaderFontSize : contentFontSize;

  doc
    .font(fontStyle)
    .fontSize(fontSize)
    .text(item, paperMargin, y, { width: 250 })
    .text(coins, paperMargin + 200, y, { width: 250, align: 'center' })
    .text(amount, paperMargin + 430, y, { width: 80, align: 'right' });
}

function generateTableTotal(doc, y, title, total, emphasize = false) {
  doc
    .fontSize(contentFontSize)
    .font(emphasize ? 'Helvetica-Bold' : 'Helvetica')
    .text(title, 300, y, { width: 200, align: 'right' })
    .text(total, 510, y, { width: 60, align: 'right' });
}

function generateFooter(doc) {
  const footerText =
    'This is a computer-generated invoice and requires no signature or stamp.';
  const footerY = doc.page.height - doc.page.margins.bottom - 30;

  doc
    .fontSize(footerFontSize)
    .fillColor('#555')
    .text(footerText, doc.page.margins.left, footerY, {
      width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
      align: 'center',
    });
}

function formatCurrency(amount) {
  return `${parseFloat(amount).toFixed(2)}`;
}

function generateHr(doc, y) {
  doc
    .strokeColor('#cccccc')
    .lineWidth(1)
    .moveTo(paperMargin, y)
    .lineTo(paperSizeWidth - paperMargin, y)
    .stroke();
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear().toString().slice(-2);

  let daySuffix = 'th';
  if (day === 1 || day === 21 || day === 31) daySuffix = 'st';
  else if (day === 2 || day === 22) daySuffix = 'nd';
  else if (day === 3 || day === 23) daySuffix = 'rd';

  return `${day}${daySuffix} ${month}, ${year}`;
}
