import PDFDocument from "pdfkit";

export function buildInvoicePdfBuffer(order) {
  const lineItems = order.order_items || [];

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text("TWOWAY CEYLON Invoice", { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Invoice No: ${order.invoice_number}`);
    doc.text(`Order No: ${order.order_number}`);
    doc.text(`Order Date: ${new Date(order.created_at).toLocaleString()}`);
    doc.moveDown();
    doc.text(`Customer: ${order.customer_name}`);
    doc.text(`Email: ${order.customer_email}`);
    doc.text(`Phone: ${order.customer_phone || "-"}`);
    doc.text(`Address: ${order.shipping_address || "-"}`);
    doc.moveDown();
    doc.text(`Payment Method: ${order.payment_method}`);
    doc.text(`Payment Status: ${order.payment_status}`);
    doc.text(`Order Status: ${order.status}`);
    doc.moveDown();
    doc.fontSize(14).text("Line items");
    doc.fontSize(11);
    if (!lineItems.length) {
      doc.text("(No line items)");
    } else {
      lineItems.forEach((row, i) => {
        const title = row.product_title || "Item";
        const qty = row.quantity;
        const unit = Number(row.unit_price).toFixed(2);
        const line = Number(row.line_total).toFixed(2);
        doc.text(`${i + 1}. ${title} × ${qty} @ LKR ${unit} = LKR ${line}`);
      });
    }
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Subtotal: LKR ${Number(order.subtotal_amount).toFixed(2)}`);
    doc.text(`Shipping: LKR ${Number(order.shipping_amount).toFixed(2)}`);
    doc.text(`Discount: LKR ${Number(order.discount_amount).toFixed(2)}`);
    doc.moveDown();
    doc.fontSize(14).text(`Total: LKR ${Number(order.total_amount).toFixed(2)}`);
    doc.end();
  });
}
