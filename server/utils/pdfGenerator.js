const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateInvoicePDF = (invoiceData) => {
  return new Promise((resolve, reject) => {
    try {
      // Create uploads directory if it doesn't exist
      const uploadDir = path.join(__dirname, '../uploads/invoices');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileName = `${invoiceData.billNumber}.pdf`;
      const filePath = path.join(uploadDir, fileName);

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40
      });

      // Pipe to file
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
      doc.moveDown(0.5);
      
      // Company Info
      doc.fontSize(12).font('Helvetica-Bold').text('BREEZE TECHNIQUES', { align: 'center' });
      doc.fontSize(10).font('Helvetica').text('Pneumatic Equipment Supplier', { align: 'center' });
      doc.fontSize(9).text('Contact: +91-XXXX-XXXX-XX | Email: info@breeze.tech', { align: 'center' });
      doc.moveDown(1);

      // Bill Details
      doc.fontSize(11).font('Helvetica-Bold').text('Bill Number:', { continued: true });
      doc.fontSize(11).font('Helvetica').text(` ${invoiceData.billNumber}`);
      
      doc.fontSize(11).font('Helvetica-Bold').text('Bill Date:', { continued: true });
      doc.fontSize(11).font('Helvetica').text(` ${new Date(invoiceData.invoiceDate).toLocaleDateString()}`);
      
      if (invoiceData.dueDate) {
        doc.fontSize(11).font('Helvetica-Bold').text('Due Date:', { continued: true });
        doc.fontSize(11).font('Helvetica').text(` ${new Date(invoiceData.dueDate).toLocaleDateString()}`);
      }
      doc.moveDown(1);

      // Customer Details
      doc.fontSize(11).font('Helvetica-Bold').text('Bill To:');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Name: ${invoiceData.customerName}`);
      if (invoiceData.customerPhone) doc.text(`Phone: ${invoiceData.customerPhone}`);
      if (invoiceData.customerEmail) doc.text(`Email: ${invoiceData.customerEmail}`);
      if (invoiceData.customerAddress) doc.text(`Address: ${invoiceData.customerAddress}`);
      if (invoiceData.customerGST) doc.text(`GST: ${invoiceData.customerGST}`);
      doc.moveDown(1);

      // Items Table Header
      const tableTop = doc.y;
      const col1 = 50;
      const col2 = 200;
      const col3 = 280;
      const col4 = 360;
      const col5 = 480;

      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Item', col1, tableTop);
      doc.text('Qty', col2, tableTop);
      doc.text('Rate', col3, tableTop);
      doc.text('GST %', col4, tableTop);
      doc.text('Amount', col5, tableTop);

      // Draw line
      doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();

      // Items
      let yPos = tableTop + 30;
      doc.fontSize(9).font('Helvetica');

      invoiceData.items.forEach((item) => {
        doc.text(item.itemName, col1, yPos, { width: 140 });
        doc.text(item.quantity.toString(), col2, yPos);
        doc.text(`₹${item.rate.toFixed(2)}`, col3, yPos);
        doc.text(`${item.gst}%`, col4, yPos);
        doc.text(`₹${item.amount.toFixed(2)}`, col5, yPos);
        yPos += 25;
      });

      // Draw line
      doc.moveTo(50, yPos).lineTo(550, yPos).stroke();
      yPos += 10;

      // Totals
      const totalCol = 400;
      const amountCol = 480;

      doc.fontSize(10).font('Helvetica');
      doc.text('Subtotal:', totalCol, yPos);
      doc.text(`₹${invoiceData.subtotal.toFixed(2)}`, amountCol, yPos, { align: 'right', width: 50 });
      yPos += 20;

      doc.text('GST Total:', totalCol, yPos);
      doc.text(`₹${invoiceData.gstTotal.toFixed(2)}`, amountCol, yPos, { align: 'right', width: 50 });
      yPos += 20;

      if (invoiceData.discount > 0) {
        doc.text('Discount:', totalCol, yPos);
        doc.text(`-₹${invoiceData.discount.toFixed(2)}`, amountCol, yPos, { align: 'right', width: 50 });
        yPos += 20;
      }

      if (invoiceData.shippingCharges > 0) {
        doc.text('Shipping:', totalCol, yPos);
        doc.text(`₹${invoiceData.shippingCharges.toFixed(2)}`, amountCol, yPos, { align: 'right', width: 50 });
        yPos += 20;
      }

      // Draw line before grand total
      doc.moveTo(380, yPos).lineTo(550, yPos).stroke();
      yPos += 10;

      // Grand Total
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('Grand Total:', totalCol, yPos);
      doc.text(`₹${invoiceData.grandTotal.toFixed(2)}`, amountCol, yPos, { align: 'right', width: 50 });
      yPos += 25;

      // Payment Status
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Payment Status:', 50, yPos);
      doc.fontSize(10).font('Helvetica');
      doc.text(invoiceData.paymentStatus.toUpperCase(), 200, yPos);
      yPos += 30;

      // Notes
      if (invoiceData.notes) {
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Notes:', 50, yPos);
        doc.fontSize(9).font('Helvetica');
        doc.text(invoiceData.notes, 50, yPos + 20, { width: 450 });
        yPos += 60;
      }

      // Footer
      doc.moveTo(50, yPos).lineTo(550, yPos).stroke();
      doc.fontSize(8).font('Helvetica').text(
        'Thank you for your business! This is a computer-generated invoice.',
        50, yPos + 10,
        { align: 'center' }
      );

      // Close document
      doc.end();

      stream.on('finish', () => {
        resolve({
          success: true,
          fileName,
          filePath,
          downloadUrl: `/uploads/invoices/${fileName}`
        });
      });

      stream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateInvoicePDF };
