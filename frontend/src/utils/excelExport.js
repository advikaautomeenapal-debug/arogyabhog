/**
 * Pure JavaScript OpenXML (.xlsx) Excel Generator for Arogya Bhog
 * Zero-dependency: builds a valid OpenXML spreadsheet package (PKZIP method 0)
 * 100% compliant with Microsoft Excel, Apple Numbers, LibreOffice Calc & Google Sheets.
 */

// CRC32 Lookup Table
const CRC32_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  CRC32_TABLE[i] = c;
}

function crc32(buffer) {
  let crc = -1;
  for (let i = 0; i < buffer.length; i++) {
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ buffer[i]) & 0xFF];
  }
  return (crc ^ -1) >>> 0;
}

// Minimal In-Memory ZIP (Method 0: Store)
function createZip(files) {
  const localHeaders = [];
  const centralDirs = [];
  let offset = 0;

  const enc = new TextEncoder();

  for (const file of files) {
    const nameBytes = enc.encode(file.name);
    const contentBytes = typeof file.content === 'string' ? enc.encode(file.content) : file.content;
    const fileCrc = crc32(contentBytes);
    const size = contentBytes.length;

    // Local file header (30 bytes + name + content)
    const lh = new Uint8Array(30 + nameBytes.length + size);
    const dvLh = new DataView(lh.buffer);
    dvLh.setUint32(0, 0x04034b50, true);  // Local header signature
    dvLh.setUint16(4, 20, true);          // Version needed: 2.0
    dvLh.setUint16(6, 0, true);           // Flags
    dvLh.setUint16(8, 0, true);           // Compression: Store (0)
    dvLh.setUint16(10, 0x6800, true);     // Time (13:00)
    dvLh.setUint16(12, 0x5821, true);     // Date (2024-01-01)
    dvLh.setUint32(14, fileCrc, true);    // CRC-32
    dvLh.setUint32(18, size, true);       // Compressed size
    dvLh.setUint32(22, size, true);       // Uncompressed size
    dvLh.setUint16(26, nameBytes.length, true); // Name length
    dvLh.setUint16(28, 0, true);          // Extra field length
    lh.set(nameBytes, 30);
    lh.set(contentBytes, 30 + nameBytes.length);

    localHeaders.push(lh);

    // Central directory header (46 bytes + name)
    const cd = new Uint8Array(46 + nameBytes.length);
    const dvCd = new DataView(cd.buffer);
    dvCd.setUint32(0, 0x02014b50, true);  // Central header signature
    dvCd.setUint16(4, 20, true);          // Version made by
    dvCd.setUint16(6, 20, true);          // Version needed
    dvCd.setUint16(8, 0, true);           // Flags
    dvCd.setUint16(10, 0, true);          // Compression: 0
    dvCd.setUint16(12, 0x6800, true);     // Time
    dvCd.setUint16(14, 0x5821, true);     // Date
    dvCd.setUint32(16, fileCrc, true);    // CRC-32
    dvCd.setUint32(20, size, true);       // Compressed size
    dvCd.setUint32(24, size, true);       // Uncompressed size
    dvCd.setUint16(28, nameBytes.length, true);
    dvCd.setUint16(30, 0, true);          // Extra field length
    dvCd.setUint16(32, 0, true);          // Comment length
    dvCd.setUint16(34, 0, true);          // Disk start
    dvCd.setUint16(36, 0, true);          // Internal attrs
    dvCd.setUint32(38, 0, true);          // External attrs
    dvCd.setUint32(42, offset, true);     // Relative offset of local header
    cd.set(nameBytes, 46);

    centralDirs.push(cd);

    offset += lh.length;
  }

  const cdOffset = offset;
  let cdSize = 0;
  for (const cd of centralDirs) cdSize += cd.length;

  // End of central directory record (22 bytes)
  const eocd = new Uint8Array(22);
  const dvEocd = new DataView(eocd.buffer);
  dvEocd.setUint32(0, 0x06054b50, true); // EOCD signature
  dvEocd.setUint16(4, 0, true);          // Number of this disk
  dvEocd.setUint16(6, 0, true);          // Disk with start of CD
  dvEocd.setUint16(8, files.length, true);// Total entries on this disk
  dvEocd.setUint16(10, files.length, true);// Total entries overall
  dvEocd.setUint32(12, cdSize, true);    // Size of central directory
  dvEocd.setUint32(16, cdOffset, true);  // Offset of CD
  dvEocd.setUint16(20, 0, true);         // Comment length

  // Combine into single Uint8Array
  let totalLength = offset + cdSize + 22;
  const zip = new Uint8Array(totalLength);
  let pos = 0;
  for (const lh of localHeaders) {
    zip.set(lh, pos);
    pos += lh.length;
  }
  for (const cd of centralDirs) {
    zip.set(cd, pos);
    pos += cd.length;
  }
  zip.set(eocd, pos);

  return zip;
}

function escapeXml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getColumnLetter(colIndex) {
  let letter = '';
  while (colIndex >= 0) {
    letter = String.fromCharCode((colIndex % 26) + 65) + letter;
    colIndex = Math.floor(colIndex / 26) - 1;
  }
  return letter;
}

/**
 * All 28 Required Columns for Arogya Bhog Orders
 */
export const EXCEL_ORDER_COLUMNS = [
  'Order ID',
  'Order Date & Time',
  'Customer Name',
  'Customer Mobile Number',
  'Delivery Address',
  'PIN Code',
  'Product Variant / Blend Name',
  'Order Type (Pre-blend / Custom Blend)',
  'Package Size (kg)',
  'Quantity',
  'Total Weight (kg)',
  'Selling Price per kg (₹)',
  'Total Order Amount (₹)',
  'Payment Status',
  'Payment Method',
  'Transaction Reference / UPI Note',
  'Delivery Status',
  'Assigned Delivery Person',
  'Expected Delivery Date',
  'Completion Date & Time',
  'Raw Ingredient Cost (₹)',
  'Packaging Cost (₹)',
  'Milling Cost (₹)',
  'Delivery Cost (₹)',
  'Total Operational Cost (₹)',
  'Gross Profit (₹)',
  'Net Contribution / Profit Margin (%)',
  'Order Notes / Special Instructions'
];

/**
 * Maps an order object into the 28 required column values
 */
export function formatOrderToRow(order) {
  const items = order.items || [];
  const variantNames = items.map(i => i.name).join('; ') || 'Standard Chakki Blend';
  const orderType = items.some(i => i.isCustom) ? 'Custom Blend' : 'Pre-blend';
  const packageSizes = items.map(i => `${i.batchSizeKg || 5} kg`).join('; ');
  const totalQty = items.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);
  const totalWeight = items.reduce((sum, i) => sum + ((Number(i.batchSizeKg) || 5) * (Number(i.quantity) || 1)), 0);
  const sellingPrices = items.map(i => `₹${i.pricePerKg || 0}`).join('; ');
  
  const cb = order.costBreakdown || {};
  const marginStr = cb.profitMarginPercent !== undefined && cb.profitMarginPercent !== null
    ? `${cb.profitMarginPercent}%`
    : (cb.netContribution !== undefined && order.totalAmount > 0
        ? `${((cb.netContribution / order.totalAmount) * 100).toFixed(1)}%`
        : '—');

  const completionDate = order.completedAt
    ? new Date(order.completedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    : (['Delivered', 'Completed'].includes(order.orderStatus)
        ? new Date(order.updatedAt || order.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        : '—');

  const expectedDate = order.expectedDeliveryDate
    ? new Date(order.expectedDeliveryDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })
    : 'Tomorrow';

  const orderDate = new Date(order.placedAt || order.createdAt || Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  return [
    order.orderNumber || '',
    orderDate,
    order.customerName || '',
    order.customerContact || order.customerPhone || '',
    order.customerAddress || '',
    order.customerPincode || '',
    variantNames,
    orderType,
    packageSizes,
    totalQty,
    totalWeight,
    sellingPrices,
    order.totalAmount || 0,
    order.paymentStatus || 'Pending',
    order.paymentMethod || 'UPI',
    order.transactionRef || order.upiTransactionNote || '—',
    order.orderStatus || 'Pending',
    order.assignedDeliveryPersonName || order.assignedDP || 'Unassigned',
    expectedDate,
    completionDate,
    cb.rawIngredientCost !== undefined ? cb.rawIngredientCost : '—',
    cb.packagingCost !== undefined ? cb.packagingCost : '—',
    cb.millingCost !== undefined ? cb.millingCost : '—',
    cb.deliveryCost !== undefined ? cb.deliveryCost : '—',
    cb.totalOperationalCost !== undefined ? cb.totalOperationalCost : '—',
    cb.grossProfit !== undefined ? cb.grossProfit : '—',
    marginStr,
    order.customerNotes || order.adminNotes || 'None'
  ];
}

/**
 * Builds and downloads an OpenXML .xlsx file from a list of orders
 * @param {Array} orders - List of order objects
 * @param {string} customFilename - Optional custom filename
 */
export function exportOrdersToExcel(orders, customFilename = null) {
  if (!orders || orders.length === 0) {
    alert('No orders selected for export.');
    return;
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = customFilename || `ArogyaBhog_Orders_${dateStr}.xlsx`;

  // Build rows XML
  const rows = [];

  // Header Row (Row 1)
  let headerCells = '';
  EXCEL_ORDER_COLUMNS.forEach((col, idx) => {
    const cellRef = `${getColumnLetter(idx)}1`;
    headerCells += `<c r="${cellRef}" t="inlineStr" s="1"><is><t>${escapeXml(col)}</t></is></c>`;
  });
  rows.push(`<row r="1" spans="1:${EXCEL_ORDER_COLUMNS.length}">${headerCells}</row>`);

  // Data Rows (Row 2 onwards)
  orders.forEach((order, rIdx) => {
    const rowNum = rIdx + 2;
    const rowData = formatOrderToRow(order);
    let cells = '';

    rowData.forEach((val, cIdx) => {
      const cellRef = `${getColumnLetter(cIdx)}${rowNum}`;
      if (typeof val === 'number') {
        cells += `<c r="${cellRef}"><v>${val}</v></c>`;
      } else {
        cells += `<c r="${cellRef}" t="inlineStr"><is><t>${escapeXml(val)}</t></is></c>`;
      }
    });

    rows.push(`<row r="${rowNum}" spans="1:${EXCEL_ORDER_COLUMNS.length}">${cells}</row>`);
  });

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetViews>
    <sheetView tabSelected="1" workbookViewId="0">
      <pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>
    </sheetView>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  <cols>
    <col min="1" max="1" width="16" customWidth="1"/>
    <col min="2" max="2" width="22" customWidth="1"/>
    <col min="3" max="3" width="22" customWidth="1"/>
    <col min="4" max="4" width="16" customWidth="1"/>
    <col min="5" max="5" width="35" customWidth="1"/>
    <col min="6" max="6" width="12" customWidth="1"/>
    <col min="7" max="7" width="30" customWidth="1"/>
    <col min="8" max="8" width="18" customWidth="1"/>
    <col min="9" max="9" width="16" customWidth="1"/>
    <col min="10" max="10" width="10" customWidth="1"/>
    <col min="11" max="11" width="16" customWidth="1"/>
    <col min="12" max="12" width="18" customWidth="1"/>
    <col min="13" max="13" width="18" customWidth="1"/>
    <col min="14" max="14" width="16" customWidth="1"/>
    <col min="15" max="15" width="16" customWidth="1"/>
    <col min="16" max="16" width="28" customWidth="1"/>
    <col min="17" max="17" width="16" customWidth="1"/>
    <col min="18" max="18" width="22" customWidth="1"/>
    <col min="19" max="19" width="20" customWidth="1"/>
    <col min="20" max="20" width="22" customWidth="1"/>
    <col min="21" max="21" width="18" customWidth="1"/>
    <col min="22" max="22" width="16" customWidth="1"/>
    <col min="23" max="23" width="16" customWidth="1"/>
    <col min="24" max="24" width="16" customWidth="1"/>
    <col min="25" max="25" width="22" customWidth="1"/>
    <col min="26" max="26" width="16" customWidth="1"/>
    <col min="27" max="27" width="24" customWidth="1"/>
    <col min="28" max="28" width="30" customWidth="1"/>
  </cols>
  <sheetData>
    ${rows.join('\n    ')}
  </sheetData>
</worksheet>`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="ArogyaBhog Orders" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><color rgb="FF111111"/><sz val="11"/><name val="Calibri"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF2CA50"/></patternFill></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
  </cellXfs>
</styleSheet>`;

  const files = [
    { name: '[Content_Types].xml', content: contentTypesXml },
    { name: '_rels/.rels', content: rootRelsXml },
    { name: 'xl/_rels/workbook.xml.rels', content: workbookRelsXml },
    { name: 'xl/workbook.xml', content: workbookXml },
    { name: 'xl/styles.xml', content: stylesXml },
    { name: 'xl/worksheets/sheet1.xml', content: sheetXml }
  ];

  const zipBytes = createZip(files);
  const blob = new Blob([zipBytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
