import type { Payslip } from "@/features/hr/types";

function formatINR(val: number): string {
  return "₹" + Math.round(val).toLocaleString("en-IN");
}

export function downloadOfficialPayslip(payslip: Payslip) {
  const earningsRows = payslip.earnings
    .map(
      (e) => `
      <tr>
        <td style="padding: 9px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155;">${e.label}</td>
        <td style="padding: 9px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; font-family: monospace; font-weight: 600; color: #0f172a;">${formatINR(e.amount)}</td>
      </tr>
    `
    )
    .join("");

  const deductionsRows = payslip.deductions
    .map(
      (d) => `
      <tr>
        <td style="padding: 9px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155;">${d.label}</td>
        <td style="padding: 9px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; font-family: monospace; font-weight: 600; color: #be123c;">${formatINR(d.amount)}</td>
      </tr>
    `
    )
    .join("");

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payslip ${payslip.id} - ${payslip.employeeName} (${payslip.month})</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    @media print {
      body { margin: 0; padding: 0; background: #fff !important; }
      .no-print { display: none !important; }
      .sheet { box-shadow: none !important; border: 1px solid #cbd5e1 !important; margin: 0 !important; max-width: 100% !important; }
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 30px 16px;
      background: #0b1329;
      color: #0f172a;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .no-print-toolbar {
      width: 100%;
      max-width: 800px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding: 12px 18px;
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      color: #fff;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #d5f63a;
      color: #0f172a;
      font-weight: 700;
      font-size: 13px;
      padding: 8px 18px;
      border-radius: 8px;
      text-decoration: none;
      cursor: pointer;
      border: none;
      transition: background 0.2s;
    }
    .btn:hover { background: #bfe524; }
    .sheet {
      width: 100%;
      max-width: 800px;
      background: #ffffff;
      border-radius: 14px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
      border: 1px solid #e2e8f0;
      padding: 36px 42px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .club-title {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0f172a;
      margin: 0 0 4px 0;
    }
    .club-sub {
      font-size: 11px;
      color: #64748b;
      margin: 0;
      line-height: 1.5;
    }
    .doc-badge {
      text-align: right;
    }
    .doc-title {
      font-size: 16px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #1e40af;
      margin: 0 0 4px 0;
    }
    .doc-meta {
      font-size: 12px;
      font-weight: 600;
      color: #334155;
      margin: 0;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px 28px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      padding: 3px 0;
      border-bottom: 1px dashed #e2e8f0;
    }
    .info-label { color: #64748b; font-weight: 500; }
    .info-value { color: #0f172a; font-weight: 700; }
    .tables-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 14px;
      border-bottom: 2px solid #cbd5e1;
    }
    .summary-card {
      background: #f0fdf4;
      border: 1.5px solid #86efac;
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }
    .net-pay-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .net-pay-amount {
      font-size: 26px;
      font-weight: 900;
      color: #15803d;
      font-family: monospace;
    }
    .net-pay-words {
      font-size: 12px;
      color: #166534;
      font-style: italic;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #64748b;
    }
    .stamp {
      display: inline-block;
      border: 1.5px solid #16a34a;
      color: #16a34a;
      font-weight: 800;
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="no-print-toolbar no-print">
    <div>
      <strong style="color: #d5f63a; font-size: 14px;">Official Salary Slip Preview</strong>
      <span style="font-size: 12px; opacity: 0.8; margin-left: 8px;">${payslip.id} · ${payslip.employeeName}</span>
    </div>
    <div style="display: flex; gap: 10px;">
      <button class="btn" onclick="window.print()">
        🖨️ Print / Save as PDF
      </button>
    </div>
  </div>

  <div class="sheet">
    <div class="header">
      <div>
        <h1 class="club-title">CHAMPIONS CLUB & RESORTS</h1>
        <p class="club-sub">
          Clubhouse Road, Off Western Express Highway, Goregaon East, Mumbai 400063<br>
          GSTIN: 27AABCC1234F1Z5 · HR & Payroll Dept
        </p>
      </div>
      <div class="doc-badge">
        <h2 class="doc-title">Payslip / Salary Voucher</h2>
        <p class="doc-meta">Month: ${payslip.month}</p>
        <p class="doc-meta" style="color: #64748b; font-family: monospace; font-size: 11px;">Ref: ${payslip.id}</p>
      </div>
    </div>

    <div class="info-grid">
      <div>
        <div class="info-row">
          <span class="info-label">Employee ID</span>
          <span class="info-value" style="font-family: monospace;">${payslip.employeeId}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Employee Name</span>
          <span class="info-value">${payslip.employeeName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Department</span>
          <span class="info-value">${payslip.department.replace("_", " ")}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Designation / Role</span>
          <span class="info-value">${payslip.roleTitle}</span>
        </div>
      </div>
      <div>
        <div class="info-row">
          <span class="info-label">Pay Period</span>
          <span class="info-value">${payslip.payPeriod}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Disbursement Date</span>
          <span class="info-value">${payslip.payDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Bank & Account</span>
          <span class="info-value">${payslip.bankName} (${payslip.accountNumberMasked})</span>
        </div>
        <div class="info-row">
          <span class="info-label">PAN / UAN</span>
          <span class="info-value" style="font-family: monospace;">${payslip.pan} / ${payslip.uan}</span>
        </div>
      </div>
    </div>

    <div class="tables-container">
      <!-- Earnings Table -->
      <div>
        <table>
          <thead>
            <tr>
              <th style="text-align: left;">Earnings Head</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${earningsRows}
            <tr style="background: #f8fafc; font-weight: 700;">
              <td style="padding: 10px 14px; font-size: 13px; color: #0f172a;">Gross Total Earnings</td>
              <td style="padding: 10px 14px; font-size: 13px; text-align: right; font-family: monospace; color: #0f172a;">${formatINR(payslip.grossEarnings)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Deductions Table -->
      <div>
        <table>
          <thead>
            <tr>
              <th style="text-align: left;">Deduction Head</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${deductionsRows}
            <tr style="background: #f8fafc; font-weight: 700;">
              <td style="padding: 10px 14px; font-size: 13px; color: #0f172a;">Total Deductions</td>
              <td style="padding: 10px 14px; font-size: 13px; text-align: right; font-family: monospace; color: #be123c;">${formatINR(payslip.totalDeductions)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Summary Box -->
    <div class="summary-card">
      <div class="net-pay-row">
        <div>
          <span style="font-size: 12px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">Net Salary Disbursed</span>
          <div class="net-pay-words">In Words: <strong>${payslip.netPayInWords}</strong></div>
        </div>
        <div class="net-pay-amount">${formatINR(payslip.netPay)}</div>
      </div>
    </div>

    <div class="footer">
      <div>
        <p style="margin: 0 0 2px 0;">This is an authenticated computer-generated payroll voucher.</p>
        <p style="margin: 0;">Governed under Maharashtra Shops & Commercial Establishments Act.</p>
      </div>
      <div class="stamp">
        ✓ Salary Disbursed
      </div>
    </div>
  </div>
</body>
</html>`;

  // 1. Download HTML file
  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Payslip-${payslip.id}-${payslip.employeeId}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // 2. Open print view window for instant Print/Save to PDF
  try {
    const printWin = window.open("", "_blank");
    if (printWin) {
      printWin.document.write(htmlContent);
      printWin.document.close();
      printWin.focus();
    }
  } catch {
    // Popup blockers might stop window.open, file download is already executed
  }
}
