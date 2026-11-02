import urllib.request
import json
import time
import re
import xml.etree.ElementTree as ET
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# Design Tokens
font_title = Font(name="Calibri", size=15, bold=True, color="1F4E78")
font_sub = Font(name="Calibri", size=10, italic=True, color="595959")
font_hdr = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
font_bold = Font(name="Calibri", size=11, bold=True, color="000000")
font_regular = Font(name="Calibri", size=11, color="000000")
font_code = Font(name="Consolas", size=10, color="0F172A")

fill_hdr = PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid")
fill_alt = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
fill_ok = PatternFill(start_color="E6F4EA", end_color="E6F4EA", fill_type="solid")
font_ok = Font(name="Calibri", size=10, bold=True, color="137333")
fill_stub = PatternFill(start_color="FFF8E1", end_color="FFF8E1", fill_type="solid")
font_stub = Font(name="Calibri", size=10, bold=True, color="B78103")

thin_side = Side(border_style="thin", color="E2E8F0")
border_cell = Border(left=thin_side, right=thin_side, top=thin_side, bottom=thin_side)

def fetch_api(route, timeout=15):
    url = f"http://localhost:3000/api/tally/{route}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            raw = res.read().decode("utf-8")
            data = json.loads(raw)
            return True, data, None
    except Exception as e:
        return False, None, str(e)

def fetch_tdl_master(m_type, fields, timeout=10):
    col_id = m_type.replace(' ', '') + 'Col'
    fetch_str = ', '.join(fields)
    xml = f"""<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>{col_id}</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="{col_id}" ISMODIFY="No">
            <TYPE>{m_type}</TYPE>
            <FETCH>{fetch_str}</FETCH>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>"""
    try:
        req = urllib.request.Request('http://localhost:9000', data=xml.encode('utf-8'), headers={'Content-Type': 'text/xml'})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            raw = r.read().decode('utf-8', errors='ignore')
            raw = re.sub(r'&#[0-9]+;', '', raw)
            root = ET.fromstring(raw)
            tag = m_type.upper().replace(' ', '')
            items = []
            for elem in root.iter():
                if elem.tag.upper() == tag:
                    d = {}
                    name_attr = elem.attrib.get('NAME')
                    if name_attr:
                        d['name'] = name_attr
                    for child in elem:
                        c_tag = child.tag.lower()
                        c_txt = child.text.strip() if child.text else ''
                        if c_tag == 'name' and 'name' not in d:
                            d['name'] = c_txt
                        elif c_tag != 'name':
                            d[c_tag] = c_txt
                    if d:
                        items.append(d)
            return True, items, None
    except Exception as e:
        return False, None, str(e)

def add_sheet_for_records(wb, title, records, route_info):
    # Excel worksheet title max length is 31 chars
    safe_title = title[:31]
    ws = wb.create_sheet(title=safe_title)
    ws.views.sheetView[0].showGridLines = True
    
    # Title row
    ws.cell(row=1, column=1, value=f"{safe_title} (Live Data from Tally)").font = font_title
    ws.cell(row=2, column=1, value=f"Source: {route_info} | Total Records: {len(records)}").font = font_sub
    ws.row_dimensions[1].height = 24
    ws.row_dimensions[2].height = 18

    if not records:
        ws.cell(row=4, column=1, value="No records found in Tally.").font = font_sub
        return

    # Determine headers
    keys = []
    for r in records[:100]:
        if isinstance(r, dict):
            for k in r.keys():
                if k not in keys:
                    keys.append(k)
        else:
            keys = ["Value"]
            break

    hdr_row = 4
    ws.row_dimensions[hdr_row].height = 25
    
    # S.No header
    cell = ws.cell(row=hdr_row, column=1, value="S.No")
    cell.font = font_hdr
    cell.fill = fill_hdr
    cell.alignment = Alignment(horizontal="center", vertical="center")
    cell.border = border_cell

    for c_idx, k in enumerate(keys, 2):
        cell = ws.cell(row=hdr_row, column=c_idx, value=k.upper())
        cell.font = font_hdr
        cell.fill = fill_hdr
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = border_cell

    # Populate rows
    curr_row = 5
    for idx, item in enumerate(records, 1):
        ws.row_dimensions[curr_row].height = 19
        c = ws.cell(row=curr_row, column=1, value=idx)
        c.font = font_regular
        c.border = border_cell
        c.alignment = Alignment(horizontal="center", vertical="center")
        if curr_row % 2 == 0:
            c.fill = fill_alt

        for c_idx, k in enumerate(keys, 2):
            val = item.get(k, "") if isinstance(item, dict) else str(item)
            if isinstance(val, (list, dict)):
                val = json.dumps(val)
            c = ws.cell(row=curr_row, column=c_idx, value=val)
            c.border = border_cell
            if isinstance(val, (int, float)):
                c.alignment = Alignment(horizontal="right", vertical="center")
                c.font = font_regular
                c.number_format = "#,##0.00" if isinstance(val, float) else "#,##0"
            else:
                c.alignment = Alignment(horizontal="left", vertical="center")
                c.font = font_regular
            if curr_row % 2 == 0:
                c.fill = fill_alt
        curr_row += 1

    max_col = len(keys) + 1
    ws.auto_filter.ref = f"A4:{get_column_letter(max_col)}{curr_row-1}"
    ws.freeze_panes = "B5"
    
    ws.column_dimensions["A"].width = 8
    for c_idx, k in enumerate(keys, 2):
        col_letter = get_column_letter(c_idx)
        ws.column_dimensions[col_letter].width = max(len(k) + 6, 18)

def main():
    print("=" * 65, flush=True)
    print("EXECUTING ALL MASTERS & ROUTES TO EXCEL", flush=True)
    print("=" * 65, flush=True)
    
    wb = openpyxl.Workbook()
    
    # Overview Sheet
    ws_index = wb.active
    ws_index.title = "Overview & Summary"
    ws_index.views.sheetView[0].showGridLines = True
    
    ws_index.cell(row=1, column=1, value="Tally Live Data & Masters Complete Export").font = font_title
    ws_index.cell(row=2, column=1, value=f"Generated on {time.strftime('%Y-%m-%d %H:%M:%S')} | Connected to Tally Gateway on Port 9000").font = font_sub
    ws_index.row_dimensions[1].height = 26
    ws_index.row_dimensions[2].height = 18

    idx_headers = ["S.No", "Module / Category", "Master / Route Name", "Source / Endpoint", "Record Count", "Status", "Sheet Name"]
    ws_index.row_dimensions[4].height = 26
    for c_idx, h in enumerate(idx_headers, 1):
        c = ws_index.cell(row=4, column=c_idx, value=h)
        c.font = font_hdr
        c.fill = fill_hdr
        c.alignment = Alignment(horizontal="center", vertical="center")
        c.border = border_cell

    # Definitions of all tasks to execute
    tasks = [
        # (category, name, type, source_identifier, sheet_title, extra_fields)
        ("Master (Accounting)", "Companies", "api", "companies", "Companies", None),
        ("Master (Accounting)", "Ledgers", "api", "ledgers", "Ledgers", None),
        ("Master (Accounting)", "Customers (Debtors)", "api", "customers", "Customers", None),
        ("Master (Accounting)", "Suppliers (Creditors)", "api", "suppliers", "Suppliers", None),
        ("Master (Accounting)", "Receivables", "api", "receivables", "Receivables", None),
        ("Master (Inventory)", "Stock Items", "api", "stock-items", "Stock Items", None),
        ("Master (Inventory)", "Stock Groups", "api", "stock-groups", "Stock Groups", None),
        ("Master (Inventory)", "Stock Categories", "api", "stock-categories", "Stock Categories", None),
        ("Master (Inventory)", "Units of Measure", "api", "units", "Units", None),
        
        # Direct TDL Masters
        ("Master (Accounting)", "Voucher Types", "tdl", "Voucher Type", "Voucher Types", ['NAME', 'PARENT', 'NUMBERINGMETHOD']),
        ("Master (Cost Centres)", "Cost Categories", "tdl", "Cost Category", "Cost Categories", ['NAME']),
        
        # API Transaction Routes
        ("Transaction", "Sales Vouchers", "api", "sales", "Sales", None),
        ("Transaction", "Purchase Vouchers", "api", "purchases", "Purchases", None),
        ("Transaction", "Receipt Vouchers", "api", "receipts", "Receipts", None),
        ("Transaction", "Payment Vouchers", "api", "payments", "Payments", None),
        ("Transaction", "Journal Vouchers", "api", "journals", "Journals", None),
        ("Transaction", "Credit Notes", "api", "credit-notes", "Credit Notes", None),
        ("Transaction", "Debit Notes", "api", "debit-notes", "Debit Notes", None),
        ("Order", "Sales Orders", "api", "sales-orders", "Sales Orders", None),
        ("Order", "Purchase Orders", "api", "purchase-orders", "Purchase Orders", None),
        ("Order", "Order Acceptances", "api", "order-acceptances", "Order Acceptances", None),
        
        # Report Routes
        ("Report", "Day Book", "api", "daybook", "Day Book", None),
        ("Report", "Stock Summary", "api", "stock-summary", "Stock Summary", None),
        ("Report", "Inventory Summary", "api", "inventory-summary", "Inventory Summary", None),
        ("Report", "Balance Sheet", "api", "balance-sheet", "Balance Sheet", None),
        ("Report", "Profit & Loss", "api", "profit-loss", "Profit & Loss", None),
    ]

    r_idx = 5
    for s_no, (cat, name, query_type, source_id, sheet_name, extra_fields) in enumerate(tasks, 1):
        print(f"[{s_no:02d}/{len(tasks)}] Fetching {name} ({source_id}) ...", end=" ", flush=True)
        
        if query_type == "api":
            source_label = f"/api/tally/{source_id}"
            success, data, err = fetch_api(source_id, timeout=12)
        else:
            source_label = f"TDL <TYPE>{source_id}</TYPE>"
            success, data, err = fetch_tdl_master(source_id, extra_fields, timeout=10)

        count = len(data) if (success and isinstance(data, list)) else (1 if (success and data) else 0)
        
        if success and count > 0:
            status_text = "Live Data Extracted"
            add_sheet_for_records(wb, sheet_name, data, source_label)
            sheet_col_val = sheet_name
        elif success and count == 0:
            status_text = "Empty / Report Stub"
            sheet_col_val = "-"
        else:
            status_text = f"Skipped ({str(err)[:22]})"
            sheet_col_val = "-"

        print(f"-> {status_text} [{count} records]", flush=True)

        # Record in Index
        ws_index.row_dimensions[r_idx].height = 22
        vals = [s_no, cat, name, source_label, count, status_text, sheet_col_val]
        for c_idx, val in enumerate(vals, 1):
            c = ws_index.cell(row=r_idx, column=c_idx, value=val)
            c.border = border_cell
            if c_idx in (1, 2):
                c.alignment = Alignment(horizontal="center", vertical="center")
                c.font = font_regular if c_idx == 1 else font_bold
            elif c_idx in (3, 4):
                c.alignment = Alignment(horizontal="left", vertical="center")
                c.font = font_regular if c_idx == 3 else font_code
            elif c_idx == 5:
                c.alignment = Alignment(horizontal="right", vertical="center")
                c.font = font_bold
                c.number_format = "#,##0"
            elif c_idx == 6:
                c.alignment = Alignment(horizontal="center", vertical="center")
                if "Live Data" in str(val):
                    c.fill = fill_ok
                    c.font = font_ok
                else:
                    c.fill = fill_stub
                    c.font = font_stub
            elif c_idx == 7:
                c.alignment = Alignment(horizontal="center", vertical="center")
                c.font = font_code

            if r_idx % 2 == 0 and c_idx != 6:
                c.fill = fill_alt

        r_idx += 1

    # Format Index column widths
    ws_index.column_dimensions["A"].width = 8
    ws_index.column_dimensions["B"].width = 22
    ws_index.column_dimensions["C"].width = 28
    ws_index.column_dimensions["D"].width = 30
    ws_index.column_dimensions["E"].width = 16
    ws_index.column_dimensions["F"].width = 24
    ws_index.column_dimensions["G"].width = 20
    ws_index.auto_filter.ref = f"A4:G{r_idx-1}"
    ws_index.freeze_panes = "C5"

    output_path = r"e:\Tally-Data\Tally_Live_Data_Export.xlsx"
    wb.save(output_path)
    print("\n" + "=" * 65, flush=True)
    print(f"COMPLETE: Excel file saved to: {output_path}", flush=True)
    print("=" * 65, flush=True)

if __name__ == "__main__":
    main()
