/**
 * Tally Data Studio — Frontend Application Logic
 * Fetches live Tally routes and converts to formatted Excel workbooks.
 */

// Application State
const state = {
  activeRoute: '/api/tally/sales/register',
  activeType: 'sales-register',
  activeTitle: 'Sales Register',
  activeDesc: 'Complete Sales Voucher Register matching Tally columns (Date, Particulars, Vch Type, Vch No, Debit Amount, Credit Amount)',
  rawData: [],
  tableData: [],
  filteredData: [],
  currentPage: 1,
  pageSize: 50,
  latency: 0,
  isGatewayOnline: false,
};

// DOM Elements
const elements = {
  activeTitle: document.getElementById('active-title'),
  activeDesc: document.getElementById('active-desc'),
  activeRouteBadge: document.getElementById('active-route-badge'),
  gatewayStatus: document.getElementById('gateway-status'),
  gatewayStatusText: document.getElementById('gateway-status-text'),
  
  // Filters
  filterMonth: document.getElementById('filter-month'),
  filterFromDate: document.getElementById('filter-from-date'),
  filterToDate: document.getElementById('filter-to-date'),
  filterParty: document.getElementById('filter-party'),
  filterMonthContainer: document.getElementById('filter-month-container'),
  filterFromContainer: document.getElementById('filter-from-container'),
  filterToContainer: document.getElementById('filter-to-container'),
  filterPartyContainer: document.getElementById('filter-party-container'),
  btnFetch: document.getElementById('btn-fetch'),
  
  // Metrics
  metricRecords: document.getElementById('metric-records'),
  metricDebitVal: document.getElementById('metric-debit-val'),
  metricDebitLabel: document.getElementById('metric-debit-label'),
  metricCreditVal: document.getElementById('metric-credit-val'),
  metricCreditLabel: document.getElementById('metric-credit-label'),
  metricLatency: document.getElementById('metric-latency'),
  
  // Table & Toolbar
  tableSearch: document.getElementById('table-search'),
  tableHead: document.getElementById('table-head'),
  tableBody: document.getElementById('table-body'),
  filteredCount: document.getElementById('filtered-count'),
  rowsPerPage: document.getElementById('rows-per-page'),
  btnPrevPage: document.getElementById('btn-prev-page'),
  btnNextPage: document.getElementById('btn-next-page'),
  pageIndicator: document.getElementById('page-indicator'),
  footerStatusText: document.getElementById('footer-status-text'),
  
  // Action Buttons
  btnExportExcel: document.getElementById('btn-export-excel'),
  btnExportCsv: document.getElementById('btn-export-csv'),
  btnCopyJson: document.getElementById('btn-copy-json'),
  btnMasterExport: document.getElementById('btn-master-export'),
  
  // Master Modal
  modalMaster: document.getElementById('modal-master-export'),
  btnCloseModal: document.getElementById('btn-close-modal'),
  btnCancelModal: document.getElementById('btn-cancel-modal'),
  btnStartMasterExport: document.getElementById('btn-start-master-export'),
  masterProgressBar: document.getElementById('master-progress-bar'),
  masterProgressText: document.getElementById('master-progress-text'),
  masterProgressBox: document.getElementById('master-progress-box'),
  
  // Toast
  toastContainer: document.getElementById('toast-container'),
};

// Currency Formatter
const formatINR = (val) => {
  const num = parseFloat(val) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num);
};

const formatNumber = (val) => {
  const num = parseFloat(val) || 0;
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
  }).format(num);
};

// Toast Notification
function showToast(message, type = 'info', duration = 3500) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-msg">${message}</span>
  `;
  elements.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Check Tally Gateway Health
async function checkGatewayHealth() {
  try {
    const res = await fetch('/api/tally/health');
    const data = await res.json();
    if (res.ok && data.status === 'OK') {
      state.isGatewayOnline = true;
      elements.gatewayStatus.className = 'status-indicator-badge online';
      elements.gatewayStatusText.textContent = `Tally Gateway Online (${data.host || 'localhost'}:${data.port || 9000})`;
    } else {
      throw new Error(data.message || 'Offline');
    }
  } catch (err) {
    state.isGatewayOnline = false;
    elements.gatewayStatus.className = 'status-indicator-badge offline';
    elements.gatewayStatusText.textContent = 'Tally Gateway Disconnected';
  }
}

// Adjust filter visibility based on active route
function updateFilterVisibility() {
  const isVoucherRoute = [
    'sales-register', 'sales', 'purchases', 'receipts', 'payments', 
    'credit-notes', 'debit-notes', 'journals', 'sales-orders', 'purchase-orders'
  ].includes(state.activeType);

  elements.filterMonthContainer.style.display = isVoucherRoute ? 'flex' : 'none';
  elements.filterFromContainer.style.display = isVoucherRoute ? 'flex' : 'none';
  elements.filterToContainer.style.display = isVoucherRoute ? 'flex' : 'none';
  elements.filterPartyContainer.style.display = isVoucherRoute ? 'flex' : 'none';

  // Metric card labels
  if (isVoucherRoute) {
    elements.metricDebitLabel.textContent = 'Total Debit (₹)';
    elements.metricCreditLabel.textContent = 'Total Credit (₹)';
    document.getElementById('metric-debit-card').style.display = 'flex';
    document.getElementById('metric-credit-card').style.display = 'flex';
  } else if (state.activeType === 'stock-items-detailed' || state.activeType === 'stock-items') {
    elements.metricDebitLabel.textContent = 'Total Opening Value';
    elements.metricCreditLabel.textContent = 'Total Quantity';
    document.getElementById('metric-debit-card').style.display = 'flex';
    document.getElementById('metric-credit-card').style.display = 'flex';
  } else if (state.activeType === 'customer-ledgers' || state.activeType === 'customers' || state.activeType === 'receivables') {
    elements.metricDebitLabel.textContent = 'Total Receivables (₹)';
    elements.metricCreditLabel.textContent = 'Total Closing (₹)';
    document.getElementById('metric-debit-card').style.display = 'flex';
    document.getElementById('metric-credit-card').style.display = 'flex';
  } else {
    document.getElementById('metric-debit-card').style.display = 'none';
    document.getElementById('metric-credit-card').style.display = 'none';
  }
}

// Build Query URL
function buildQueryUrl() {
  const url = new URL(state.activeRoute, window.location.origin);
  const isVoucherRoute = [
    'sales-register', 'sales', 'purchases', 'receipts', 'payments', 
    'credit-notes', 'debit-notes', 'journals', 'sales-orders', 'purchase-orders'
  ].includes(state.activeType);

  if (isVoucherRoute) {
    const month = elements.filterMonth.value;
    const fromDate = elements.filterFromDate.value;
    const toDate = elements.filterToDate.value;
    const party = elements.filterParty.value.trim();

    if (month) {
      url.searchParams.set('month', month);
    } else {
      if (fromDate) url.searchParams.set('fromDate', fromDate);
      if (toDate) url.searchParams.set('toDate', toDate);
    }
    if (party) url.searchParams.set('party', party);
  }

  return url.toString();
}

// Fetch Active Route Data
async function fetchData() {
  elements.btnFetch.classList.add('loading');
  elements.btnFetch.disabled = true;
  elements.btnFetch.innerHTML = `
    <svg class="btn-icon spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
    <span>Fetching...</span>
  `;

  const startTime = performance.now();
  try {
    const queryUrl = buildQueryUrl();
    const res = await fetch(queryUrl);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    state.latency = Math.round(performance.now() - startTime);
    state.rawData = data;

    // Normalize data into table rows
    if (data && data.vouchers && Array.isArray(data.vouchers)) {
      state.tableData = data.vouchers;
      updateMetrics(data.totalCount, data.totalDebitAmount, data.totalCreditAmount);
    } else if (Array.isArray(data)) {
      state.tableData = data;
      calculateArrayMetrics(data);
    } else {
      state.tableData = [data];
      updateMetrics(1, 0, 0);
    }

    applySearchFilter();
    showToast(`Fetched ${state.tableData.length} records in ${state.latency}ms`, 'success');
  } catch (err) {
    console.error('Fetch error:', err);
    showToast(`Fetch error: ${err.message}`, 'error', 5000);
    elements.tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <div class="empty-content">
            <p class="empty-title" style="color: #fb7185;">Failed to Fetch Data</p>
            <p class="empty-subtitle">${err.message}</p>
          </div>
        </td>
      </tr>
    `;
  } finally {
    elements.btnFetch.classList.remove('loading');
    elements.btnFetch.disabled = false;
    elements.btnFetch.innerHTML = `
      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="23 4 23 10 17 10"/>
        <polyline points="1 20 1 14 7 14"/>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
      </svg>
      <span>Fetch Live Data</span>
    `;
  }
}

// Update Metric Cards
function updateMetrics(count, debit, credit) {
  elements.metricRecords.textContent = formatNumber(count || 0);
  elements.metricDebitVal.textContent = formatINR(debit || 0);
  elements.metricCreditVal.textContent = formatINR(credit || 0);
  elements.metricLatency.textContent = `${state.latency} ms`;
}

// Calculate Metrics for Generic Arrays
function calculateArrayMetrics(items) {
  let totalDebit = 0;
  let totalCredit = 0;

  if (state.activeType.includes('sales') || state.activeType.includes('purchase')) {
    items.forEach(item => {
      totalDebit += parseFloat(item.debitAmount || item.amount || 0);
      totalCredit += parseFloat(item.creditAmount || 0);
    });
  } else if (state.activeType === 'stock-items-detailed' || state.activeType === 'stock-items') {
    items.forEach(item => {
      totalDebit += parseFloat(item.inventoryDetails?.openingValue || item.value || 0);
      totalCredit += parseFloat(item.inventoryDetails?.openingQty || item.closingQty || 0);
    });
  } else if (state.activeType === 'customer-ledgers' || state.activeType === 'customers' || state.activeType === 'receivables') {
    items.forEach(item => {
      totalDebit += parseFloat(item.closingBalance || 0);
      totalCredit += parseFloat(item.openingBalance || 0);
    });
  }

  updateMetrics(items.length, totalDebit, totalCredit);
}

// Apply Table Search Filter
function applySearchFilter() {
  const query = elements.tableSearch.value.toLowerCase().trim();
  if (!query) {
    state.filteredData = [...state.tableData];
  } else {
    state.filteredData = state.tableData.filter(row => {
      return Object.values(row).some(val => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'object') return JSON.stringify(val).toLowerCase().includes(query);
        return String(val).toLowerCase().includes(query);
      });
    });
  }

  state.currentPage = 1;
  renderTable();
}

// Render Table with Pagination
function renderTable() {
  const totalRows = state.filteredData.length;
  elements.filteredCount.textContent = `Showing ${totalRows} of ${state.tableData.length} rows`;

  if (totalRows === 0) {
    elements.tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <div class="empty-content">
            <p class="empty-title">No Matching Records</p>
            <p class="empty-subtitle">Try adjusting your search or date range filters.</p>
          </div>
        </td>
      </tr>
    `;
    updatePaginationControls(0);
    return;
  }

  // Get current page slice
  const pageSize = parseInt(elements.rowsPerPage.value, 10);
  const totalPages = Math.ceil(totalRows / pageSize) || 1;
  const startIdx = (state.currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalRows);
  const pageRows = state.filteredData.slice(startIdx, endIdx);

  // Render headers and rows based on route type
  renderHeadersAndRows(pageRows);
  updatePaginationControls(totalPages);
}

// Render Headers and Body Rows
function renderHeadersAndRows(rows) {
  const type = state.activeType;

  // 1. Sales Register / Vouchers
  if (type === 'sales-register' || type === 'sales' || type === 'purchases' || type === 'receipts' || type === 'payments' || type === 'credit-notes' || type === 'debit-notes' || type === 'journals') {
    elements.tableHead.innerHTML = `
      <tr>
        <th>Date</th>
        <th>Particulars</th>
        <th>Vch Type</th>
        <th>Vch No.</th>
        <th style="text-align: right;">Debit Amount</th>
        <th style="text-align: right;">Credit Amount</th>
        <th>Narration</th>
      </tr>
    `;

    elements.tableBody.innerHTML = rows.map(r => `
      <tr>
        <td class="cell-date">${r.formattedDate || r.date || ''}</td>
        <td style="font-weight: 500;">${r.particulars || r.partyLedgerName || ''}</td>
        <td><span class="badge badge-indigo">${r.vchType || r.voucherType || ''}</span></td>
        <td class="cell-vchno">${r.vchNo || r.voucherNumber || ''}</td>
        <td class="cell-amount cell-debit">${r.debitAmount ? formatNumber(r.debitAmount) : ''}</td>
        <td class="cell-amount cell-credit">${r.creditAmount ? formatNumber(r.creditAmount) : ''}</td>
        <td style="color: var(--text-muted); font-size: 0.78rem; max-width: 250px; overflow: hidden; text-overflow: ellipsis;">${r.narration || ''}</td>
      </tr>
    `).join('');
    return;
  }

  // 2. Customer Ledgers Detailed
  if (type === 'customer-ledgers') {
    elements.tableHead.innerHTML = `
      <tr>
        <th>Customer Name</th>
        <th>Parent Group</th>
        <th style="text-align: right;">Closing Balance</th>
        <th>State</th>
        <th>GSTIN</th>
        <th>PAN</th>
        <th>Full Address</th>
      </tr>
    `;

    elements.tableBody.innerHTML = rows.map(r => `
      <tr>
        <td style="font-weight: 600; color: #ffffff;">${r.name || ''}</td>
        <td><span class="badge badge-indigo">${r.parent || ''}</span></td>
        <td class="cell-amount ${(r.closingBalance || 0) >= 0 ? 'cell-debit' : 'cell-credit'}">${formatNumber(r.closingBalance || 0)}</td>
        <td>${r.mailingDetails?.state || r.taxRegistrationDetails?.state || ''}</td>
        <td class="cell-vchno">${r.taxRegistrationDetails?.gstin || ''}</td>
        <td class="cell-vchno">${r.taxRegistrationDetails?.pan || ''}</td>
        <td style="color: var(--text-muted); font-size: 0.78rem; max-width: 260px; overflow: hidden; text-overflow: ellipsis;">${r.mailingDetails?.fullAddress || ''}</td>
      </tr>
    `).join('');
    return;
  }

  // 3. Stock Items Detailed
  if (type === 'stock-items-detailed') {
    elements.tableHead.innerHTML = `
      <tr>
        <th>Item Name</th>
        <th>Stock Group</th>
        <th>Stock Category</th>
        <th>Units</th>
        <th>HSN/SAC</th>
        <th>Taxability</th>
        <th style="text-align: right;">IGST Rate</th>
        <th style="text-align: right;">Opening Qty</th>
        <th style="text-align: right;">Opening Value</th>
      </tr>
    `;

    elements.tableBody.innerHTML = rows.map(r => `
      <tr>
        <td style="font-weight: 600; color: #ffffff;">${r.name || ''}</td>
        <td><span class="badge badge-indigo">${r.inventoryDetails?.stockGroup || ''}</span></td>
        <td>${r.inventoryDetails?.stockCategory || ''}</td>
        <td>${r.inventoryDetails?.unitsOfMeasurement || ''}</td>
        <td class="cell-vchno">${r.statutoryDetails?.gstHsnDetails?.hsnCode || ''}</td>
        <td>${r.statutoryDetails?.gstRateDetails?.taxability || ''}</td>
        <td style="text-align: right; font-family: var(--font-mono);">${r.statutoryDetails?.gstRateDetails?.igstRate ? r.statutoryDetails.gstRateDetails.igstRate + '%' : ''}</td>
        <td style="text-align: right; font-family: var(--font-mono);">${formatNumber(r.inventoryDetails?.openingQty || 0)}</td>
        <td class="cell-amount cell-debit">${formatNumber(r.inventoryDetails?.openingValue || 0)}</td>
      </tr>
    `).join('');
    return;
  }

  // 4. Stock Categories
  if (type === 'stock-categories') {
    elements.tableHead.innerHTML = `
      <tr>
        <th>Category Name</th>
        <th>Alias</th>
        <th>Language Alias</th>
        <th>Grouping of Stock Category</th>
      </tr>
    `;

    elements.tableBody.innerHTML = rows.map(r => `
      <tr>
        <td style="font-weight: 600; color: #ffffff;">${r.name || ''}</td>
        <td>${r.alias || ''}</td>
        <td>${r.languageAlias || ''}</td>
        <td><span class="badge badge-emerald">${r.grouping || r.parent || 'Primary'}</span></td>
      </tr>
    `).join('');
    return;
  }

  // 5. Default Fallback Table for any other route
  const firstRow = rows[0] || {};
  const keys = Object.keys(firstRow).filter(k => typeof firstRow[k] !== 'object').slice(0, 7);

  elements.tableHead.innerHTML = `
    <tr>
      ${keys.map(k => `<th>${k.toUpperCase()}</th>`).join('')}
    </tr>
  `;

  elements.tableBody.innerHTML = rows.map(r => `
    <tr>
      ${keys.map(k => `<td>${r[k] !== undefined && r[k] !== null ? r[k] : ''}</td>`).join('')}
    </tr>
  `).join('');
}

// Pagination Controls
function updatePaginationControls(totalPages) {
  elements.pageIndicator.textContent = `Page ${state.currentPage} of ${Math.max(totalPages, 1)}`;
  elements.btnPrevPage.disabled = state.currentPage <= 1;
  elements.btnNextPage.disabled = state.currentPage >= totalPages;
}

// Flatten Row for Excel Export
function flattenRowForExcel(row, type) {
  if (type === 'sales-register' || type === 'sales' || type === 'purchases' || type === 'receipts' || type === 'payments' || type === 'credit-notes' || type === 'debit-notes' || type === 'journals') {
    return {
      'Date': row.formattedDate || row.date || '',
      'ISO Date': row.date || '',
      'Particulars': row.particulars || row.partyLedgerName || '',
      'Voucher Type': row.vchType || row.voucherType || '',
      'Voucher Number': row.vchNo || row.voucherNumber || '',
      'Debit Amount': row.debitAmount || 0,
      'Credit Amount': row.creditAmount || 0,
      'Net Amount': row.amount || 0,
      'Narration': row.narration || '',
    };
  }

  if (type === 'customer-ledgers') {
    return {
      'Customer Name': row.name || '',
      'Parent Group': row.parent || '',
      'Closing Balance': row.closingBalance || 0,
      'Opening Balance': row.openingBalance || 0,
      'Credit Period': row.creditPeriod || '',
      'Address': (row.mailingDetails?.address || []).join(', '),
      'Full Address': row.mailingDetails?.fullAddress || '',
      'State': row.mailingDetails?.state || row.taxRegistrationDetails?.state || '',
      'Country': row.mailingDetails?.country || '',
      'Pincode': row.mailingDetails?.pincode || '',
      'GSTIN': row.taxRegistrationDetails?.gstin || '',
      'PAN': row.taxRegistrationDetails?.pan || '',
      'Registration Type': row.taxRegistrationDetails?.registrationType || '',
      'Place of Supply': row.taxRegistrationDetails?.placeOfSupply || '',
      'Bank Name': row.bankingDetails?.bankName || '',
      'Account Number': row.bankingDetails?.accountNumber || '',
      'IFSC Code': row.bankingDetails?.ifscCode || '',
    };
  }

  if (type === 'stock-items-detailed') {
    return {
      'Item Name': row.name || '',
      'Stock Group': row.inventoryDetails?.stockGroup || '',
      'Stock Category': row.inventoryDetails?.stockCategory || '',
      'Base Units': row.inventoryDetails?.unitsOfMeasurement || '',
      'Alternate Units': row.inventoryDetails?.alternateUnits || '',
      'HSN Code': row.statutoryDetails?.gstHsnDetails?.hsnCode || '',
      'Taxability': row.statutoryDetails?.gstRateDetails?.taxability || '',
      'Calculation Type': row.statutoryDetails?.gstRateDetails?.calculationType || '',
      'IGST Rate (%)': row.statutoryDetails?.gstRateDetails?.igstRate || 0,
      'CGST Rate (%)': row.statutoryDetails?.gstRateDetails?.cgstRate || 0,
      'SGST Rate (%)': row.statutoryDetails?.gstRateDetails?.sgstRate || 0,
      'Type of Supply': row.statutoryDetails?.typeOfSupply || '',
      'Opening Quantity': row.inventoryDetails?.openingQty || 0,
      'Opening Rate': row.inventoryDetails?.openingRate || 0,
      'Opening Value': row.inventoryDetails?.openingValue || 0,
      'Costing Method': row.inventoryDetails?.costingMethod || '',
      'Market Valuation': row.inventoryDetails?.marketValuationMethod || '',
    };
  }

  if (type === 'stock-categories') {
    return {
      'Category Name': row.name || '',
      'Alias': row.alias || '',
      'Language Alias': row.languageAlias || '',
      'Grouping of Stock Category': row.grouping || row.parent || 'Primary',
    };
  }

  // Generic flat export
  const flat = {};
  for (const [k, v] of Object.entries(row)) {
    if (typeof v !== 'object') {
      flat[k] = v;
    } else if (v && !Array.isArray(v)) {
      for (const [subK, subV] of Object.entries(v)) {
        if (typeof subV !== 'object') {
          flat[`${k}_${subK}`] = subV;
        }
      }
    }
  }
  return flat;
}

// Export Current Table to Excel
function exportCurrentToExcel() {
  if (!state.filteredData || state.filteredData.length === 0) {
    showToast('No data available to export. Fetch live data first.', 'error');
    return;
  }

  if (typeof XLSX === 'undefined') {
    showToast('SheetJS Excel library is still loading. Please wait a moment...', 'error');
    return;
  }

  try {
    const flattened = state.filteredData.map(r => flattenRowForExcel(r, state.activeType));
    const ws = XLSX.utils.json_to_sheet(flattened);

    // Auto-fit column widths
    const colWidths = [];
    if (flattened.length > 0) {
      const keys = Object.keys(flattened[0]);
      keys.forEach(k => {
        let maxLen = k.length;
        flattened.forEach(row => {
          const valStr = String(row[k] || '');
          if (valStr.length > maxLen) maxLen = Math.min(valStr.length, 50);
        });
        colWidths.push({ wch: Math.max(maxLen + 3, 12) });
      });
      ws['!cols'] = colWidths;
    }

    const wb = XLSX.utils.book_new();
    const sheetName = state.activeTitle.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `Tally_${sheetName}_${dateStr}.xlsx`;

    try {
      XLSX.writeFile(wb, fileName);
    } catch (e) {
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
    showToast(`Successfully downloaded "${fileName}"`, 'success');
  } catch (err) {
    console.error('Excel Export Error:', err);
    showToast(`Excel export failed: ${err.message}`, 'error');
  }
}

// Export to CSV
function exportToCsv() {
  if (!state.filteredData || state.filteredData.length === 0) {
    showToast('No data available to export.', 'error');
    return;
  }
  try {
    const flattened = state.filteredData.map(r => flattenRowForExcel(r, state.activeType));
    const ws = XLSX.utils.json_to_sheet(flattened);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Tally_${state.activeType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('CSV downloaded successfully', 'success');
  } catch (err) {
    showToast(`CSV export failed: ${err.message}`, 'error');
  }
}

// Copy JSON
function copyJson() {
  if (!state.filteredData || state.filteredData.length === 0) {
    showToast('No data available to copy.', 'error');
    return;
  }
  navigator.clipboard.writeText(JSON.stringify(state.filteredData, null, 2))
    .then(() => showToast('Copied JSON data to clipboard!', 'success'))
    .catch(err => showToast(`Failed to copy: ${err.message}`, 'error'));
}

// Master Multi-Sheet Workbook Export
async function exportMasterWorkbook() {
  const selectedCheckboxes = Array.from(document.querySelectorAll('input[name="master-module"]:checked'));
  if (selectedCheckboxes.length === 0) {
    showToast('Please select at least one module for the master workbook.', 'error');
    return;
  }

  const moduleMap = {
    'sales': { route: '/api/tally/sales/register?month=2026-04', sheet: 'Sales_Register', type: 'sales-register', name: 'Sales Register' },
    'customers': { route: '/api/tally/customer-ledgers', sheet: 'Customer_Ledgers', type: 'customer-ledgers', name: 'Customer Ledgers' },
    'stock-items': { route: '/api/tally/stock-items/detailed', sheet: 'Stock_Items', type: 'stock-items-detailed', name: 'Stock Items' },
    'categories': { route: '/api/tally/stock-categories', sheet: 'Stock_Categories', type: 'stock-categories', name: 'Stock Categories' },
    'ledgers': { route: '/api/tally/ledgers', sheet: 'All_Ledgers', type: 'ledgers', name: 'All Ledgers' },
    'purchases': { route: '/api/tally/purchases', sheet: 'Purchases', type: 'purchases', name: 'Purchases' },
  };

  elements.masterProgressBox.classList.remove('hidden');
  elements.btnStartMasterExport.disabled = true;

  try {
    const wb = XLSX.utils.book_new();
    const total = selectedCheckboxes.length;
    let completed = 0;

    for (const cb of selectedCheckboxes) {
      const mod = moduleMap[cb.value];
      if (!mod) continue;

      elements.masterProgressText.textContent = `Fetching ${mod.name}... (${completed + 1}/${total})`;
      elements.masterProgressBar.style.width = `${((completed) / total) * 100}%`;

      const res = await fetch(mod.route);
      const data = await res.json();
      let records = [];
      if (data && data.vouchers && Array.isArray(data.vouchers)) {
        records = data.vouchers;
      } else if (Array.isArray(data)) {
        records = data;
      } else if (data) {
        records = [data];
      }

      const flatRecords = records.map(r => flattenRowForExcel(r, mod.type));
      const ws = XLSX.utils.json_to_sheet(flatRecords);

      // Auto col widths
      if (flatRecords.length > 0) {
        const colWidths = Object.keys(flatRecords[0]).map(k => ({ wch: Math.max(k.length + 3, 14) }));
        ws['!cols'] = colWidths;
      }

      XLSX.utils.book_append_sheet(wb, ws, mod.sheet);
      completed++;
    }

    elements.masterProgressBar.style.width = '100%';
    elements.masterProgressText.textContent = 'Generating Excel Workbook...';

    const fileName = `Tally_Master_Data_Workbook_${new Date().toISOString().split('T')[0]}.xlsx`;
    try {
      XLSX.writeFile(wb, fileName);
    } catch (e) {
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }

    showToast(`Master Workbook "${fileName}" downloaded successfully!`, 'success', 5000);
    closeModal();
  } catch (err) {
    console.error('Master export error:', err);
    showToast(`Master export failed: ${err.message}`, 'error', 5000);
  } finally {
    elements.btnStartMasterExport.disabled = false;
    elements.masterProgressBox.classList.add('hidden');
    elements.masterProgressBar.style.width = '0%';
  }
}

function openModal() {
  elements.modalMaster.classList.remove('hidden');
}

function closeModal() {
  elements.modalMaster.classList.add('hidden');
}

// Setup Event Listeners
function initEventListeners() {
  // Sidebar Route Selection
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      state.activeRoute = btn.getAttribute('data-route');
      state.activeType = btn.getAttribute('data-type');
      state.activeTitle = btn.getAttribute('data-title');
      state.activeDesc = btn.getAttribute('data-desc');

      elements.activeTitle.textContent = state.activeTitle;
      elements.activeDesc.textContent = state.activeDesc;
      elements.activeRouteBadge.textContent = `GET ${state.activeRoute}`;

      updateFilterVisibility();
      fetchData();
    });
  });

  // Fetch Button
  elements.btnFetch.addEventListener('click', fetchData);

  // Month select change
  elements.filterMonth.addEventListener('change', () => {
    const val = elements.filterMonth.value;
    if (val === '2026-04') {
      elements.filterFromDate.value = '2026-04-01';
      elements.filterToDate.value = '2026-04-30';
    } else if (val === '2026-05') {
      elements.filterFromDate.value = '2026-05-01';
      elements.filterToDate.value = '2026-05-31';
    } else if (val === '2026-06') {
      elements.filterFromDate.value = '2026-06-01';
      elements.filterToDate.value = '2026-06-30';
    }
    fetchData();
  });

  // Date inputs change
  elements.filterFromDate.addEventListener('change', () => {
    elements.filterMonth.value = '';
    fetchData();
  });
  elements.filterToDate.addEventListener('change', () => {
    elements.filterMonth.value = '';
    fetchData();
  });

  // Party search input Enter key
  elements.filterParty.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') fetchData();
  });

  // Client-side table search
  elements.tableSearch.addEventListener('input', applySearchFilter);

  // Pagination
  elements.rowsPerPage.addEventListener('change', () => {
    state.currentPage = 1;
    renderTable();
  });

  elements.btnPrevPage.addEventListener('click', () => {
    if (state.currentPage > 1) {
      state.currentPage--;
      renderTable();
    }
  });

  elements.btnNextPage.addEventListener('click', () => {
    const pageSize = parseInt(elements.rowsPerPage.value, 10);
    const totalPages = Math.ceil(state.filteredData.length / pageSize);
    if (state.currentPage < totalPages) {
      state.currentPage++;
      renderTable();
    }
  });

  // Export buttons
  elements.btnExportExcel.addEventListener('click', exportCurrentToExcel);
  elements.btnExportCsv.addEventListener('click', exportToCsv);
  elements.btnCopyJson.addEventListener('click', copyJson);

  // Modal controls
  elements.btnMasterExport.addEventListener('click', openModal);
  elements.btnCloseModal.addEventListener('click', closeModal);
  elements.btnCancelModal.addEventListener('click', closeModal);
  elements.btnStartMasterExport.addEventListener('click', exportMasterWorkbook);

  // Close modal when clicking outside
  elements.modalMaster.addEventListener('click', (e) => {
    if (e.target === elements.modalMaster) closeModal();
  });
}

// App Initialization
async function init() {
  initEventListeners();
  updateFilterVisibility();
  await checkGatewayHealth();
  await fetchData();
  
  // Periodic health check
  setInterval(checkGatewayHealth, 15000);
}

document.addEventListener('DOMContentLoaded', init);
