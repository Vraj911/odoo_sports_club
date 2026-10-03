export interface BillReceiptData {
  id: string;
  date: string;
  server?: string;
  itemsCount?: number;
  paidAmount: number;
  paymentMethod: string;
  items?: Array<{ name: string; qty: number; price: number }>;
  memberName?: string;
  memberId?: string;
  table?: string;
}

export function downloadBillReceipt(data: BillReceiptData) {
  const memberName = data.memberName || "Pratham Patel";
  const memberId = data.memberId || "CC-000123";
  const table = data.table || "Table T-4 (Sunset Terrace)";
  const server = data.server || "Sanjay M.";

  const items = data.items && data.items.length > 0 ? data.items : [
    { name: "Grilled Chicken & Avocado Bowl", qty: 1, price: 420 },
    { name: "Electrolyte Recovery Fizz (Electral)", qty: 2, price: 220 },
    { name: "Charred Paneer Tikka Platter", qty: 1, price: 380 },
    { name: "Craft Draught Pint (500ml)", qty: 1, price: 360 },
  ];

  const subtotal = items.reduce((acc, it) => acc + it.price * it.qty, 0);
  const gst = Math.round(subtotal * 0.05); // 5% GST for restaurant/lounge
  const finalTotal = data.paidAmount || (subtotal + gst);

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice Receipt #${data.id} - Champions Club</title>
  <style>
    @media print {
      body { margin: 0; padding: 20px; background: #fff !important; color: #000 !important; }
      .no-print { display: none !important; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 40px 20px;
      background: #0f172a;
      color: #1e293b;
      display: flex;
      justify-content: center;
    }
    .receipt-card {
      width: 100%;
      max-width: 580px;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      padding: 36px;
      box-sizing: border-box;
    }
    .header {
      border-bottom: 2px dashed #e2e8f0;
      padding-bottom: 20px;
      margin-bottom: 24px;
      text-align: center;
    }
    .club-title {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0b1528;
      margin: 0 0 4px 0;
      text-transform: uppercase;
    }
    .sub-title {
      font-size: 12px;
      color: #64748b;
      margin: 0 0 8px 0;
    }
    .invoice-badge {
      display: inline-block;
      background: #ecfdf5;
      color: #059669;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 9999px;
      border: 1px solid #a7f3d0;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      font-size: 12px;
      margin-bottom: 24px;
      background: #f8fafc;
      padding: 16px;
      border-radius: 10px;
    }
    .meta-item span {
      display: block;
      color: #64748b;
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 2px;
    }
    .meta-item strong {
      color: #0f172a;
      font-size: 13px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-bottom: 24px;
    }
    th {
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      color: #64748b;
      border-bottom: 1px solid #cbd5e1;
      padding: 8px 4px;
    }
    td {
      padding: 12px 4px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    .totals {
      border-top: 2px solid #e2e8f0;
      padding-top: 14px;
      margin-bottom: 24px;
      font-size: 13px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      color: #475569;
    }
    .totals-row.grand {
      font-size: 18px;
      font-weight: 800;
      color: #0b1528;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      margin-top: 10px;
    }
    .footer {
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      border-top: 1px dashed #e2e8f0;
      padding-top: 16px;
    }
    .btn-bar {
      display: flex;
      gap: 10px;
      justify-content: center;
      margin-bottom: 20px;
    }
    .btn {
      background: #0284c7;
      color: #ffffff;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn:hover { background: #0369a1; }
  </style>
</head>
<body>
  <div style="width: 100%; max-width: 580px;">
    <div class="no-print btn-bar">
      <button class="btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
    </div>
    <div class="receipt-card">
      <div class="header">
        <h1 class="club-title">CHAMPIONS SPORTS CLUB</h1>
        <p class="sub-title">Worli Sea Face Promenade, Mumbai · F&B Tax Invoice</p>
        <span class="invoice-badge">PAID & SETTLED · GSTIN: 27AABCC1234F1Z9</span>
      </div>

      <div class="meta-grid">
        <div class="meta-item">
          <span>Bill Number</span>
          <strong>${data.id}</strong>
        </div>
        <div class="meta-item">
          <span>Date & Time</span>
          <strong>${data.date}</strong>
        </div>
        <div class="meta-item">
          <span>Member</span>
          <strong>${memberName} (${memberId})</strong>
        </div>
        <div class="meta-item">
          <span>Area / Server</span>
          <strong>${table} · ${server}</strong>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Item Description</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Rate</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (it) => `
          <tr>
            <td><strong>${it.name}</strong></td>
            <td style="text-align: center;">${it.qty}</td>
            <td style="text-align: right;">₹${it.price}</td>
            <td style="text-align: right;"><strong>₹${it.price * it.qty}</strong></td>
          </tr>`
            )
            .join("")}
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-row">
          <span>Item Subtotal:</span>
          <span>₹${subtotal}</span>
        </div>
        <div class="totals-row">
          <span>Restaurant GST (5%):</span>
          <span>₹${gst}</span>
        </div>
        <div class="totals-row">
          <span>Payment Tendered (${data.paymentMethod}):</span>
          <span style="color: #059669; font-weight: 600;">₹${finalTotal} (Settled)</span>
        </div>
        <div class="totals-row grand">
          <span>Total Paid:</span>
          <span>₹${finalTotal}</span>
        </div>
      </div>

      <div class="footer">
        <p>Thank you for dining at Champions Club Courtside Lounge.</p>
        <p>This is a computer-generated tax invoice receipt for bill #${data.id}.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  // Trigger download of receipt HTML file
  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Invoice-Receipt-${data.id}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Also open print window if popup permitted
  try {
    const printWin = window.open("", "_blank");
    if (printWin) {
      printWin.document.write(htmlContent);
      printWin.document.close();
      printWin.focus();
    }
  } catch {
    // Popup blockers might stop window.open, file download is already executed.
  }
}
