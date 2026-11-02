import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def create_tally_masters_excel():
    wb = openpyxl.Workbook()
    
    # Setup styles
    font_title = Font(name="Calibri", size=16, bold=True, color="1F4E78")
    font_subtitle = Font(name="Calibri", size=11, italic=True, color="595959")
    font_header = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    font_bold = Font(name="Calibri", size=11, bold=True, color="000000")
    font_regular = Font(name="Calibri", size=11, color="000000")
    font_code = Font(name="Consolas", size=10, color="0F172A")
    
    fill_header = PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid")
    fill_alt_row = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
    fill_status_implemented = PatternFill(start_color="E6F4EA", end_color="E6F4EA", fill_type="solid")
    font_status_implemented = Font(name="Calibri", size=10, bold=True, color="137333")
    
    fill_status_ready = PatternFill(start_color="E8F0FE", end_color="E8F0FE", fill_type="solid")
    font_status_ready = Font(name="Calibri", size=10, bold=True, color="1A73E8")

    thin_border_side = Side(border_style="thin", color="E2E8F0")
    border_data = Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=thin_border_side)
    border_header = Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=thin_border_side)

    # -------------------------------------------------------------
    # Sheet 1: Master Directory
    # -------------------------------------------------------------
    ws1 = wb.active
    ws1.title = "Tally Masters List"
    ws1.views.sheetView[0].showGridLines = True

    # Title Banner
    ws1.cell(row=1, column=1, value="Comprehensive List of Tally Masters").font = font_title
    ws1.cell(row=2, column=1, value="Applicable to TallyPrime & Tally.ERP 9 — Includes TDL XML Collection Types & Integration Mapping").font = font_subtitle
    ws1.row_dimensions[1].height = 26
    ws1.row_dimensions[2].height = 18

    headers = [
        "S.No",
        "Master Category",
        "Master Name",
        "TDL Collection <TYPE>",
        "Description & Function in Tally",
        "Key Attributes / Fields",
        "Current API Status",
        "API Route in Tally-Data"
    ]

    header_row = 4
    ws1.row_dimensions[header_row].height = 26

    for col_idx, header in enumerate(headers, 1):
        cell = ws1.cell(row=header_row, column=col_idx, value=header)
        cell.font = font_header
        cell.fill = fill_header
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = border_header

    data = [
        # Accounting Masters
        (1, "Accounting", "Company", "Company", "Root company entity, financial periods, statutory details, address", "NAME, GUID, BOOKSFROM, STARTINGFROM, ADDRESS", "Implemented", "/api/tally/companies"),
        (2, "Accounting", "Group", "Group", "Hierarchical classification of accounts (Assets, Liabilities, Incomes, Expenses)", "NAME, PARENT, ISSUBLEDGER, ISREVENUE", "Ready in SDK", "Direct via SDK / API"),
        (3, "Accounting", "Ledger", "Ledger", "Individual financial account heads (Customers, Vendors, Bank, Sales, Expense, Tax)", "NAME, PARENT, OPENINGBALANCE, CLOSINGBALANCE, GSTIN, ADDRESS", "Implemented", "/api/tally/ledgers"),
        (4, "Accounting", "Customers (Ledger)", "Ledger", "Sundry Debtors accounts representing customer profiles", "NAME, PARENT, CLOSINGBALANCE, GSTIN, BILLDETAILS", "Implemented", "/api/tally/customers"),
        (5, "Accounting", "Suppliers (Ledger)", "Ledger", "Sundry Creditors accounts representing vendor/supplier profiles", "NAME, PARENT, CLOSINGBALANCE, GSTIN, BANKDETAILS", "Implemented", "/api/tally/suppliers"),
        (6, "Accounting", "Voucher Type", "Voucher Type", "Templates/definitions for transactions (Sales, Purchase, Payment, Receipt, Journal)", "NAME, PARENT, NUMBERINGMETHOD, PREVENTDUPLICATES", "Ready in SDK", "Direct via SDK / API"),
        (7, "Accounting", "Currency", "Currency", "Base and foreign currencies with symbol, decimals, and exchange rates", "NAME, ORIGINALNAME, SYMBOL, DECIMALPLACES, INWORDDETAILS", "Ready in SDK", "Direct via SDK / API"),
        (8, "Accounting", "Budget", "Budget", "Financial targets set on Groups, Ledgers, or Cost Centres for variance analysis", "NAME, PERIODFROM, PERIODTO, GROUPDETAILS, LEDGERDETAILS", "Ready in SDK", "Direct via SDK / API"),
        (9, "Accounting", "Scenario", "Scenario", "Provisional reporting master to view forecasts without affecting actual accounts", "NAME, INCLUDES, EXCLUDES", "Ready in SDK", "Direct via SDK / API"),

        # Inventory Masters
        (10, "Inventory", "Stock Group", "Stock Group", "High-level classification of items (e.g. Raw Material, Finished Goods, Brands)", "NAME, PARENT, SHOULDADDITEMS", "Implemented", "/api/tally/stock-groups"),
        (11, "Inventory", "Stock Category", "Stock Category", "Parallel classification across stock groups (e.g. Dimensions, Models, Quality)", "NAME, PARENT", "Implemented", "/api/tally/stock-categories"),
        (12, "Inventory", "Stock Item", "Stock Item", "Physical goods, trading products, consumables, or service items", "NAME, PARENT, BASEUNITS, OPENINGBALANCE, OPENINGRATE, CLOSINGBALANCE", "Implemented", "/api/tally/stock-items"),
        (13, "Inventory", "Unit of Measure", "Unit", "Measurement units (Simple: Nos, Kgs, Box; Compound: 1 Box = 10 Nos)", "NAME, ORIGINALNAME, DECIMALPLACES", "Implemented", "/api/tally/units"),
        (14, "Inventory", "Godown / Location", "Godown", "Physical storage locations, warehouses, stores, factory floors, racks", "NAME, PARENT, ADDRESS, PINCODE", "Ready in SDK", "Direct via SDK / API"),
        (15, "Inventory", "Batch / Lot", "Batch", "Batch numbers, manufacturing dates, expiry dates associated with items", "NAME, PARENT, EXPIRYDATE, MFGDATE", "Ready in SDK", "Direct via SDK / API"),
        (16, "Inventory", "Tariff / HSN Classification", "Tariff / HSN", "HSN/SAC code master and associated GST rates for inventory items", "NAME, HSNCODE, GSTRATE", "Ready in SDK", "Direct via SDK / API"),

        # Cost / Profit Centre Masters
        (17, "Cost Centres", "Cost Category", "Cost Category", "Parallel allocation dimensions (e.g. Projects, Branches, Salespersons)", "NAME, ALLOCATEREVENUE, ALLOCATENONREVENUE", "Ready in SDK", "Direct via SDK / API"),
        (18, "Cost Centres", "Cost Centre", "Cost Centre", "Sub-units/units under a Cost Category to track income and expenditure", "NAME, CATEGORY, PARENT", "Ready in SDK", "Direct via SDK / API"),

        # Payroll Masters
        (19, "Payroll", "Employee", "Employee", "Staff profile containing personal info, DOJ, PAN, Bank details, PF/ESI numbers", "NAME, PARENT, EMPLOYEENO, DOJ, DESIGNATION, PAN", "Ready in SDK", "Direct via SDK / API"),
        (20, "Payroll", "Employee Group", "Cost Centre", "Departmental or designation grouping of employees (e.g. Sales, Production)", "NAME, CATEGORY, PARENT", "Ready in SDK", "Direct via SDK / API"),
        (21, "Payroll", "Pay Head", "Pay Head", "Earnings, deductions, and statutory contributions (Basic, HRA, PF, ESI, TDS)", "NAME, PAYHEADTYPE, CALCULATIONTYPE, GRATUITYELIGIBLE", "Ready in SDK", "Direct via SDK / API"),
        (22, "Payroll", "Attendance / Production Type", "Attendance Type", "Units of measuring attendance and production (Present, Absent, Overtime, Units)", "NAME, PERIODTYPE, PRODUCTIONUNIT", "Ready in SDK", "Direct via SDK / API"),
        (23, "Payroll", "Salary Details", "Salary Details", "Configured compensation package mapping pay heads to employees or groups", "NAME, EFFECTIVEDATE, PAYHEADALLOCATION", "Ready in SDK", "Direct via SDK / API"),

        # Statutory Masters
        (24, "Statutory", "GST Classification", "GST Classification", "Standard GST rate profiles and HSN/SAC classifications", "NAME, HSNCODE, IGSTRATE, CGSTRATE, SGSTRATE", "Ready in SDK", "Direct via SDK / API"),
        (25, "Statutory", "TCS Nature of Goods", "TCS Nature of Goods", "TCS section codes (e.g. 206C), threshold limits, and rates", "NAME, SECTION, RATE, THRESHOLDLIMIT", "Ready in SDK", "Direct via SDK / API"),
        (26, "Statutory", "TDS Nature of Payment", "TDS Nature of Payment", "TDS section codes (e.g. 194C, 194J), payment limits, and rates", "NAME, SECTION, RATE, THRESHOLDLIMIT", "Ready in SDK", "Direct via SDK / API")
    ]

    current_row = header_row + 1
    for item in data:
        ws1.row_dimensions[current_row].height = 22
        for col_idx, val in enumerate(item, 1):
            cell = ws1.cell(row=current_row, column=col_idx, value=val)
            cell.border = border_data
            
            # Alignments & formatting
            if col_idx in (1, 2):
                cell.alignment = Alignment(horizontal="center", vertical="center")
                cell.font = font_bold if col_idx == 2 else font_regular
            elif col_idx in (3,):
                cell.alignment = Alignment(horizontal="left", vertical="center")
                cell.font = font_bold
            elif col_idx in (4,):
                cell.alignment = Alignment(horizontal="center", vertical="center")
                cell.font = font_code
            elif col_idx in (5, 6):
                cell.alignment = Alignment(horizontal="left", vertical="center")
                cell.font = font_regular
            elif col_idx == 7:
                cell.alignment = Alignment(horizontal="center", vertical="center")
                if val == "Implemented":
                    cell.fill = fill_status_implemented
                    cell.font = font_status_implemented
                else:
                    cell.fill = fill_status_ready
                    cell.font = font_status_ready
            elif col_idx == 8:
                cell.alignment = Alignment(horizontal="left", vertical="center")
                cell.font = font_code

            # Zebra banding
            if current_row % 2 == 0 and col_idx != 7:
                cell.fill = fill_alt_row

        current_row += 1

    # Add Auto Filter & Freeze Panes
    ws1.auto_filter.ref = f"A{header_row}:H{current_row-1}"
    ws1.freeze_panes = "C5"

    # Column widths
    col_widths = {
        "A": 8,
        "B": 18,
        "C": 24,
        "D": 26,
        "E": 48,
        "F": 42,
        "G": 20,
        "H": 28
    }
    for col, width in col_widths.items():
        ws1.column_dimensions[col].width = width

    # -------------------------------------------------------------
    # Sheet 2: XML Integration Cheat Sheet
    # -------------------------------------------------------------
    ws2 = wb.create_sheet(title="TDL Collection Guide")
    ws2.views.sheetView[0].showGridLines = True

    ws2.cell(row=1, column=1, value="Tally XML / TDL Collection Request Templates").font = font_title
    ws2.cell(row=2, column=1, value="How to query any Master via HTTP POST to Tally Gateway (Default port: 9000)").font = font_subtitle
    ws2.row_dimensions[1].height = 26
    ws2.row_dimensions[2].height = 18

    headers2 = ["Master Type", "TDL <TYPE>", "Collection XML Payload Snippet", "TypeScript SDK Call in Tally-Data"]
    ws2.row_dimensions[4].height = 26
    for col_idx, h in enumerate(headers2, 1):
        cell = ws2.cell(row=4, column=col_idx, value=h)
        cell.font = font_header
        cell.fill = fill_header
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = border_header

    tdl_snippets = [
        ("Ledger", "Ledger", '<COLLECTION NAME="LedgerCol">\n  <TYPE>Ledger</TYPE>\n  <FETCH>NAME, PARENT, OPENINGBALANCE, CLOSINGBALANCE</FETCH>\n</COLLECTION>', "createCollectionRequest('Ledger')"),
        ("Stock Item", "Stock Item", '<COLLECTION NAME="StockItemCol">\n  <TYPE>Stock Item</TYPE>\n  <FETCH>NAME, PARENT, BASEUNITS, OPENINGBALANCE, CLOSINGBALANCE</FETCH>\n</COLLECTION>', "createCollectionRequest('Stock Item')"),
        ("Godown / Warehouse", "Godown", '<COLLECTION NAME="GodownCol">\n  <TYPE>Godown</TYPE>\n  <FETCH>NAME, PARENT, ADDRESS</FETCH>\n</COLLECTION>', "createCollectionRequest('Godown', ['NAME', 'PARENT', 'ADDRESS'])"),
        ("Group", "Group", '<COLLECTION NAME="GroupCol">\n  <TYPE>Group</TYPE>\n  <FETCH>NAME, PARENT, ISSUBLEDGER</FETCH>\n</COLLECTION>', "createCollectionRequest('Group', ['NAME', 'PARENT'])"),
        ("Cost Centre", "Cost Centre", '<COLLECTION NAME="CostCentreCol">\n  <TYPE>Cost Centre</TYPE>\n  <FETCH>NAME, CATEGORY, PARENT</FETCH>\n</COLLECTION>', "createCollectionRequest('Cost Centre', ['NAME', 'CATEGORY', 'PARENT'])"),
        ("Employee", "Employee", '<COLLECTION NAME="EmployeeCol">\n  <TYPE>Employee</TYPE>\n  <FETCH>NAME, EMPLOYEENO, DESIGNATION, DOJ, PAN</FETCH>\n</COLLECTION>', "createCollectionRequest('Employee', ['NAME', 'EMPLOYEENO', 'DESIGNATION'])"),
        ("Voucher Type", "Voucher Type", '<COLLECTION NAME="VoucherTypeCol">\n  <TYPE>Voucher Type</TYPE>\n  <FETCH>NAME, PARENT, NUMBERINGMETHOD</FETCH>\n</COLLECTION>', "createCollectionRequest('Voucher Type', ['NAME', 'PARENT'])"),
        ("Currency", "Currency", '<COLLECTION NAME="CurrencyCol">\n  <TYPE>Currency</TYPE>\n  <FETCH>NAME, ORIGINALNAME, SYMBOL, DECIMALPLACES</FETCH>\n</COLLECTION>', "createCollectionRequest('Currency', ['NAME', 'SYMBOL'])")
    ]

    r = 5
    for row_data in tdl_snippets:
        ws2.row_dimensions[r].height = 48
        for col_idx, val in enumerate(row_data, 1):
            cell = ws2.cell(row=r, column=col_idx, value=val)
            cell.border = border_data
            if col_idx in (1, 2):
                cell.alignment = Alignment(horizontal="center", vertical="center")
                cell.font = font_bold if col_idx == 1 else font_code
            else:
                cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
                cell.font = font_code
        if r % 2 == 0:
            for c in range(1, 5):
                ws2.cell(row=r, column=c).fill = fill_alt_row
        r += 1

    ws2.column_dimensions["A"].width = 24
    ws2.column_dimensions["B"].width = 20
    ws2.column_dimensions["C"].width = 56
    ws2.column_dimensions["D"].width = 44
    ws2.freeze_panes = "C5"

    output_path = r"e:\Tally-Data\Tally_Masters_List.xlsx"
    wb.save(output_path)
    print(f"Successfully generated: {output_path}")

if __name__ == "__main__":
    create_tally_masters_excel()
