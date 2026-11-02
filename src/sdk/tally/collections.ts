import { TallyGatewayClient } from './client';
import { createCollectionRequest, createCustomerDetailedRequest, createStockItemDetailedRequest, createVoucherCollectionRequest } from './requests';
import { TallyParser } from './parser';
import * as TallyTypes from '../../types/tally.types';
import * as Validators from '../../validators/tally.validators';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatTallyDate(rawDate?: string): { iso: string; formatted: string; raw: string } {
  if (!rawDate) return { iso: '', formatted: '', raw: '' };
  const clean = String(rawDate).replace(/[^0-9]/g, '');
  if (clean.length === 8) {
    const yyyy = clean.substring(0, 4);
    const mm = parseInt(clean.substring(4, 6), 10);
    const dd = parseInt(clean.substring(6, 8), 10);
    const monthStr = MONTH_NAMES[mm - 1] || clean.substring(4, 6);
    const shortYy = yyyy.substring(2);
    return {
      iso: `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`,
      formatted: `${dd}-${monthStr}-${shortYy}`,
      raw: clean,
    };
  }
  return { iso: rawDate, formatted: rawDate, raw: clean };
}

function normalizeToYyyyMmDd(dateStr?: string): string {
  if (!dateStr) return '';
  const clean = dateStr.trim();
  if (/^\d{8}$/.test(clean)) return clean;
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean.replace(/-/g, '');
  const parts = clean.split(/[-/ ]/);
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const monthPart = parts[1];
    let yearPart = parts[2];
    if (yearPart.length === 2) yearPart = '20' + yearPart;
    const mIdx = MONTH_NAMES.findIndex(m => m.toLowerCase() === monthPart.toLowerCase());
    const mm = mIdx >= 0 ? String(mIdx + 1).padStart(2, '0') : monthPart.padStart(2, '0');
    return `${yearPart}${mm}${day}`;
  }
  return clean.replace(/[^0-9]/g, '');
}

const parseNumber = (val: any) => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  // Handle attribute-decorated nodes: { "#text": "123", "@_TYPE": "Amount" }
  const raw = typeof val === 'object' && val !== null ? val['#text'] : val;
  if (raw === undefined || raw === null || raw === '') return 0;
  const num = parseFloat(String(raw).replace(/[^0-9.-]+/g, ''));
  return isNaN(num) ? 0 : Math.abs(num);
};

/**
 * Extract the text value from a Tally XML node.
 * Tally nodes often have TYPE attributes, so fast-xml-parser returns objects like:
 *   { "#text": "Accessories", "@_TYPE": "String" }
 * This helper extracts the plain text from either format.
 */
const getValue = (val: any, fallback: string = ''): string => {
  if (val === undefined || val === null) return fallback;
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object' && val !== null) {
    const text = val['#text'];
    if (text !== undefined && text !== null) return String(text).trim();
    return fallback;
  }
  return String(val).trim();
};

const extractAddressLines = (item: any): string[] => {
  let lines: string[] = [];

  // 1. Try LEDMAILINGDETAILS.LIST
  const mailing = item['LEDMAILINGDETAILS.LIST'];
  if (mailing) {
    const mObj = Array.isArray(mailing) ? mailing[0] : mailing;
    const addrList = mObj['ADDRESS.LIST'] || mObj.ADDRESS;
    if (addrList) {
      const rawAddrs = addrList.ADDRESS || addrList;
      if (Array.isArray(rawAddrs)) {
        lines = rawAddrs.map((a: any) => getValue(a)).filter(Boolean);
      } else if (rawAddrs) {
        const v = getValue(rawAddrs);
        if (v) lines.push(v);
      }
    }
  }

  // 2. Fallback to item['ADDRESS.LIST'] or item.ADDRESS or item['OLDADDRESS.LIST']
  if (lines.length === 0) {
    const rawList = item['ADDRESS.LIST'] || item.ADDRESS || item['OLDADDRESS.LIST'];
    if (rawList) {
      const rawAddrs = rawList.ADDRESS || rawList.OLDADDRESS || rawList;
      if (Array.isArray(rawAddrs)) {
        lines = rawAddrs.map((a: any) => getValue(a)).filter(Boolean);
      } else if (rawAddrs) {
        const v = getValue(rawAddrs);
        if (v) lines.push(v);
      }
    }
  }

  return lines;
};

export class TallyCollections {
  constructor(private client: TallyGatewayClient) {}

  public async getCompanies(): Promise<TallyTypes.TallyCompany[]> {
    const xml = createCollectionRequest('Company');
    const response = await this.client.send(xml, 'getCompanies');
    const parsedData = TallyParser.parse(response);
    const items = TallyParser.extractCollection<any>(parsedData, 'COMPANY');

    return items.map(item => {
      const data = {
        name: getValue(item['@_NAME']) || getValue(item['NAME'], 'Unknown'),
        guid: getValue(item['GUID']),
      };
      return Validators.tallyCompanySchema.parse(data);
    });
  }

  public async getLedgers(): Promise<TallyTypes.TallyLedger[]> {
    const xml = createCollectionRequest('Ledger');
    const response = await this.client.send(xml, 'getLedgers');
    const parsedData = TallyParser.parse(response);
    const items = TallyParser.extractCollection<any>(parsedData, 'LEDGER');

    return items.map(item => {
      const data = {
        name: getValue(item['@_NAME']) || getValue(item['NAME']),
        parent: getValue(item['PARENT']),
        openingBalance: parseNumber(item['OPENINGBALANCE']),
        closingBalance: parseNumber(item['CLOSINGBALANCE']),
      };
      return Validators.tallyLedgerSchema.parse(data);
    });
  }

  public async getStockGroups(): Promise<TallyTypes.TallyStockGroup[]> {
    const xml = createCollectionRequest('StockGroup');
    const response = await this.client.send(xml, 'getStockGroups');
    const parsedData = TallyParser.parse(response);
    const items = TallyParser.extractCollection<any>(parsedData, 'STOCKGROUP');

    return items.map(item => {
      const data = {
        name: getValue(item['@_NAME']) || getValue(item['NAME']),
        parent: getValue(item['PARENT']),
      };
      return Validators.tallyStockGroupSchema.parse(data);
    });
  }

  public async getStockCategories(): Promise<TallyTypes.TallyStockCategory[]> {
    const xml = createCollectionRequest('StockCategory');
    const response = await this.client.send(xml, 'getStockCategories');
    const parsedData = TallyParser.parse(response);
    const items = TallyParser.extractCollection<any>(parsedData, 'STOCKCATEGORY');

    return items.map(item => {
      const name = getValue(item['@_NAME']) || getValue(item['NAME']);
      let alias = '';
      let languageAlias = '';

      const langList = item['LANGUAGENAME.LIST'];
      if (langList) {
        const nameList = langList['NAME.LIST'];
        if (nameList && nameList['NAME']) {
          const rawNames = nameList['NAME'];
          if (Array.isArray(rawNames) && rawNames.length > 1) {
            alias = rawNames.slice(1).map((n: any) => getValue(n)).filter(Boolean).join(', ');
          }
        }
      }

      if (!alias && item['MAILINGNAME.LIST']) {
        const m = item['MAILINGNAME.LIST']['MAILINGNAME'];
        if (Array.isArray(m)) {
          alias = m.map((x: any) => getValue(x)).filter((x: string) => x !== name).join(', ');
        } else if (m && getValue(m) !== name) {
          alias = getValue(m);
        }
      }

      const rawParent = getValue(item['PARENT'], 'Primary').trim();
      const parent = rawParent || 'Primary';
      const grouping = parent;

      const data: TallyTypes.TallyStockCategory = {
        name,
        alias,
        languageAlias,
        parent,
        grouping,
        generalDetails: {
          nameAndAlias: alias ? `${name} (${alias})` : name,
          name,
          alias,
          languageAlias,
          groupingOfStockCategory: grouping,
        }
      };
      return Validators.tallyStockCategorySchema.parse(data);
    });
  }


  public async getUnits(): Promise<TallyTypes.TallyUnit[]> {
    const xml = createCollectionRequest('Unit');
    const response = await this.client.send(xml, 'getUnits');
    const parsedData = TallyParser.parse(response);
    const items = TallyParser.extractCollection<any>(parsedData, 'UNIT');

    return items.map(item => {
      const data = {
        name: getValue(item['@_NAME']) || getValue(item['NAME']),
        originalName: getValue(item['ORIGINALNAME']),
      };
      return Validators.tallyUnitSchema.parse(data);
    });
  }

  public async getStockItems(): Promise<TallyTypes.TallyStockItem[]> {
    const xml = createCollectionRequest('Stock Item');
    const response = await this.client.send(xml, 'getStockItems');
    const parsedData = TallyParser.parse(response);
    const items = TallyParser.extractCollection<any>(parsedData, 'STOCKITEM');

    return items.map(item => {
      const data = {
        name: getValue(item['@_NAME']) || getValue(item['NAME']),
        group: getValue(item['PARENT']),
        unit: getValue(item['BASEUNITS']),
        closingQty: parseNumber(item['CLOSINGBALANCE']),
        openingQty: parseNumber(item['OPENINGBALANCE']),
        rate: parseNumber(item['OPENINGRATE']),
        value: parseNumber(item['OPENINGVALUE']),
      };
      return Validators.tallyStockItemSchema.parse(data);
    });
  }

  public async getStockItemsDetailed(itemName?: string): Promise<TallyTypes.TallyStockItemDetailed[]> {
    const xml = createStockItemDetailedRequest(itemName);
    const response = await this.client.send(xml, 'getStockItemsDetailed', 60000);
    const parsedData = TallyParser.parse(response);
    const items = TallyParser.extractCollection<any>(parsedData, 'STOCKITEM');

    return items.map(item => {
      const name = getValue(item['@_NAME']) || getValue(item['NAME']);

      // General Details
      let alias = '';
      const mailingList = item['MAILINGNAME.LIST'];
      if (mailingList) {
        const m = mailingList['MAILINGNAME'];
        if (Array.isArray(m)) {
          alias = m.map((x: any) => getValue(x)).filter(Boolean).join(', ');
        } else if (m) {
          alias = getValue(m);
        }
      }
      const partNumber = alias;
      const description = getValue(item['DESCRIPTION']);
      const notes = getValue(item['NARRATION']);

      // Inventory Details
      const stockGroup = getValue(item['PARENT']);
      const stockCategory = getValue(item['CATEGORY'], 'Not Applicable');
      const unitsOfMeasurement = getValue(item['BASEUNITS']);
      const alternateUnits = getValue(item['ADDITIONALUNITS'], 'Not Applicable');
      const costTracking = getValue(item['ISCOSTTRACKINGON'], 'No');
      const costingMethod = getValue(item['COSTINGMETHOD'], 'Avg. Cost');
      const marketValuationMethod = getValue(item['VALUATIONMETHOD'], 'Avg. Price');
      const rawOpeningBal = getValue(item['OPENINGBALANCE']);
      const openingQty = parseNumber(rawOpeningBal);
      const rawOpeningRate = getValue(item['OPENINGRATE']);
      const openingRate = parseNumber(rawOpeningRate);
      const openingValue = parseNumber(item['OPENINGVALUE']);

      // Standard Buying and Selling Rates
      const stdCostObj = item['STANDARDCOSTLIST.LIST'] 
        ? (Array.isArray(item['STANDARDCOSTLIST.LIST']) ? item['STANDARDCOSTLIST.LIST'][0] : item['STANDARDCOSTLIST.LIST'])
        : null;
      const stdPriceObj = item['STANDARDPRICELIST.LIST']
        ? (Array.isArray(item['STANDARDPRICELIST.LIST']) ? item['STANDARDPRICELIST.LIST'][0] : item['STANDARDPRICELIST.LIST'])
        : null;
      const standardBuyingRate = stdCostObj ? getValue(stdCostObj['RATE']) : '';
      const standardSellingRate = stdPriceObj ? getValue(stdPriceObj['RATE']) : '';

      // Batch allocations / godowns
      const rawBatches = item['BATCHALLOCATIONS.LIST'];
      const batchList = Array.isArray(rawBatches) ? rawBatches : (rawBatches ? [rawBatches] : []);
      const batches = batchList.map((b: any) => ({
        godown: getValue(b['GODOWNNAME']),
        batchName: getValue(b['BATCHNAME']),
        openingBalance: getValue(b['OPENINGBALANCE']),
        openingRate: getValue(b['OPENINGRATE']),
        openingValue: parseNumber(b['OPENINGVALUE']),
      }));

      // Statutory Details (GST, HSN, Tax Rates)
      const hsnObj = item['HSNDETAILS.LIST']
        ? (Array.isArray(item['HSNDETAILS.LIST']) ? item['HSNDETAILS.LIST'][0] : item['HSNDETAILS.LIST'])
        : null;
      const hsnCode = hsnObj ? getValue(hsnObj['HSNCODE']) : '';
      const hsnSource = hsnObj ? getValue(hsnObj['SRCOFHSNDETAILS']) : '';

      const gstObj = item['GSTDETAILS.LIST']
        ? (Array.isArray(item['GSTDETAILS.LIST']) ? item['GSTDETAILS.LIST'][0] : item['GSTDETAILS.LIST'])
        : null;
      const taxability = gstObj ? getValue(gstObj['TAXABILITY'], 'Taxable') : '';
      const calculationType = gstObj ? getValue(gstObj['CALCULATIONTYPE'], 'On Value') : '';

      let igstRate = 0, cgstRate = 0, sgstRate = 0, cessRate = 0;
      if (gstObj && gstObj['STATEWISEDETAILS.LIST']) {
        const sw = gstObj['STATEWISEDETAILS.LIST'];
        const rates = sw['RATEDETAILS.LIST'] || [];
        const rList = Array.isArray(rates) ? rates : [rates];
        for (const r of rList) {
          const head = getValue(r['GSTRATEDUTYHEAD']).toUpperCase();
          const rateVal = parseNumber(r['GSTRATE']);
          if (head.includes('IGST')) igstRate = rateVal;
          else if (head.includes('CGST')) cgstRate = rateVal;
          else if (head.includes('SGST') || head.includes('UTGST')) sgstRate = rateVal;
          else if (head.includes('CESS')) cessRate = rateVal;
        }
      }

      const typeOfSupply = getValue(item['GSTTYPEOFSUPPLY'], 'Goods');
      const inclusiveOfDuties = getValue(item['ISRATEINCLUSIVEVAT'], getValue(item['INCLUSIVETAX'], 'No'));
      const rateOfDuty = parseNumber(item['BASICRATEOFEXCISE']);

      const data: TallyTypes.TallyStockItemDetailed = {
        name,
        generalDetails: {
          name,
          alias,
          partNumber,
          description,
          notes,
        },
        inventoryDetails: {
          stockGroup,
          stockCategory,
          unitsOfMeasurement,
          alternateUnits,
          costTracking,
          costingMethod,
          marketValuationMethod,
          openingBalance: rawOpeningBal,
          openingQty,
          openingRate,
          openingValue,
          standardBuyingRate,
          standardSellingRate,
          batches,
        },
        statutoryDetails: {
          gstHsnDetails: {
            hsnCode,
            hsnSource,
          },
          gstRateDetails: {
            taxability,
            calculationType,
            igstRate,
            cgstRate,
            sgstRate,
            cessRate,
          },
          typeOfSupply,
          inclusiveOfDutiesAndTaxes: inclusiveOfDuties.toLowerCase() === 'yes',
          rateOfDuty,
        }
      };

      return Validators.tallyStockItemDetailedSchema.parse(data);
    });
  }


  public async getCustomers(): Promise<TallyTypes.TallyCustomer[]> {
    const ledgers = await this.getLedgers();
    return ledgers.filter(l => l.parent.toLowerCase().includes('debtor'));
  }

  public async getCustomerLedgers(): Promise<TallyTypes.TallyCustomerDetailed[]> {
    const xml = createCustomerDetailedRequest();
    const response = await this.client.send(xml, 'getCustomerLedgers');
    const parsedData = TallyParser.parse(response);
    const items = TallyParser.extractCollection<any>(parsedData, 'LEDGER');

    return items.map(item => {
      const name = getValue(item['@_NAME']) || getValue(item['NAME']);
      const parent = getValue(item['PARENT']);

      // Mailing details
      const mailingObj = item['LEDMAILINGDETAILS.LIST']
        ? (Array.isArray(item['LEDMAILINGDETAILS.LIST']) ? item['LEDMAILINGDETAILS.LIST'][0] : item['LEDMAILINGDETAILS.LIST'])
        : null;

      const addressLines = extractAddressLines(item);
      const mailingName = mailingObj ? getValue(mailingObj['MAILINGNAME'], name) : name;
      const state = mailingObj ? getValue(mailingObj['STATE']) : (getValue(item['STATENAME']) || getValue(item['PRIORSTATENAME']));
      const country = mailingObj ? getValue(mailingObj['COUNTRY'], 'India') : (getValue(item['COUNTRYNAME']) || getValue(item['COUNTRYOFRESIDENCE'], 'India'));
      const pincode = mailingObj ? getValue(mailingObj['PINCODE']) : (getValue(item['PINCODE']) || getValue(item['OLDPINCODE']));

      // Tax registration details
      const gstin = getValue(item['PARTYGSTIN']);
      const pan = getValue(item['INCOMETAXNUMBER']) || (gstin.length >= 12 ? gstin.substring(2, 12) : '');
      const regType = getValue(item['GSTREGISTRATIONTYPE'], 'Unregistered');

      const gstDetailsObj = item['LEDGSTREGDETAILS.LIST']
        ? (Array.isArray(item['LEDGSTREGDETAILS.LIST']) ? item['LEDGSTREGDETAILS.LIST'][0] : item['LEDGSTREGDETAILS.LIST'])
        : null;
      const placeOfSupply = gstDetailsObj ? getValue(gstDetailsObj['PLACEOFSUPPLY'], state) : state;

      // Banking details
      const rawBankDetails = getValue(item['BANKDETAILS']);
      const provideBankDetails = rawBankDetails.toLowerCase() === 'yes';

      const data: TallyTypes.TallyCustomerDetailed = {
        name,
        parent,
        openingBalance: parseNumber(item['OPENINGBALANCE']),
        closingBalance: parseNumber(item['CLOSINGBALANCE']),
        creditPeriod: getValue(item['BILLCREDITPERIOD']),
        isBillwiseOn: getValue(item['ISBILLWISEON']).toLowerCase() === 'yes',
        mailingDetails: {
          name: mailingName,
          address: addressLines,
          fullAddress: addressLines.join(', '),
          state,
          country,
          pincode,
        },
        bankingDetails: {
          provideBankDetails,
        },
        taxRegistrationDetails: {
          pan,
          registrationType: regType,
          gstin,
          placeOfSupply,
          state,
        },
        contactDetails: {
          contactPerson: getValue(item['LEDGERCONTACT']),
          mobile: getValue(item['LEDGERMOBILE']),
          phone: getValue(item['LEDGERPHONE']),
          email: getValue(item['EMAIL']),
        }
      };

      return Validators.tallyCustomerDetailedSchema.parse(data);
    });
  }


  public async getSuppliers(): Promise<TallyTypes.TallySupplier[]> {
    const ledgers = await this.getLedgers();
    return ledgers.filter(l => l.parent.toLowerCase().includes('creditor'));
  }

  public async getReceivables(): Promise<TallyTypes.TallyLedger[]> {
    const customers = await this.getCustomers();
    return customers.filter(c => (c.closingBalance ?? 0) > 0);
  }

  public async getVouchersByType(type: string, options?: TallyTypes.VoucherQueryOptions): Promise<TallyTypes.TallyVoucher[]> {
    const xml = createVoucherCollectionRequest(type, options?.detailed);
    const response = await this.client.send(xml, `getVouchersByType(${type})`, 60000);
    const parsedData = TallyParser.parse(response);
    const items = TallyParser.extractCollection<any>(parsedData, 'VOUCHER');

    const fromDateYmd = options?.fromDate ? normalizeToYyyyMmDd(options.fromDate) : '';
    const toDateYmd = options?.toDate ? normalizeToYyyyMmDd(options.toDate) : '';
    const partyFilter = options?.party ? options.party.toLowerCase().trim() : '';
    const vchNoFilter = options?.vchNo ? options.vchNo.toLowerCase().trim() : '';
    const monthFilter = options?.month ? options.month.toLowerCase().trim() : '';
    const yearFilter = options?.year ? String(options.year).trim() : '';

    const results: TallyTypes.TallyVoucher[] = [];

    for (const item of items) {
      const vchTypeName = getValue(item['VOUCHERTYPENAME'], type);
      if (vchTypeName.toLowerCase() !== type.toLowerCase()) {
        continue;
      }

      const isOptional = getValue(item['ISOPTIONAL']) === 'Yes';
      const isCancelled = getValue(item['ISCANCELED']) === 'Yes' || getValue(item['ISDELETED']) === 'Yes';

      if (!options?.includeOptional && isOptional) {
        continue;
      }
      if (!options?.includeCancelled && isCancelled) {
        continue;
      }

      const rawDate = getValue(item['DATE']);
      const dateInfo = formatTallyDate(rawDate);
      const vchYmd = dateInfo.raw;

      // Date filtering
      if (fromDateYmd && vchYmd && vchYmd < fromDateYmd) {
        continue;
      }
      if (toDateYmd && vchYmd && vchYmd > toDateYmd) {
        continue;
      }
      if (yearFilter && vchYmd && !vchYmd.startsWith(yearFilter)) {
        continue;
      }
      if (monthFilter) {
        const matchesMonth = dateInfo.iso.toLowerCase().includes(monthFilter) ||
                             dateInfo.formatted.toLowerCase().includes(monthFilter) ||
                             (vchYmd.length === 8 && vchYmd.substring(4, 6) === monthFilter.padStart(2, '0'));
        if (!matchesMonth) {
          continue;
        }
      }

      const vchNo = getValue(item['VOUCHERNUMBER']);
      if (vchNoFilter && !vchNo.toLowerCase().includes(vchNoFilter)) {
        continue;
      }

      const partyLedger = getValue(item['PARTYLEDGERNAME']);
      const partyName = getValue(item['PARTYNAME']);
      const particulars = partyLedger || partyName || 'Cash';

      if (partyFilter && !particulars.toLowerCase().includes(partyFilter)) {
        continue;
      }

      // Amounts: In Tally Sales register:
      // Negative amount indicates party debit (e.g. -18377.00 => Debit Amount: 18377.00)
      // Positive amount indicates credit
      const rawAmtStr = getValue(item['AMOUNT']);
      const parsedAmt = parseFloat(String(rawAmtStr).replace(/[^0-9.-]+/g, '')) || 0;
      let debitAmount = 0;
      let creditAmount = 0;

      if (type.toLowerCase() === 'sales') {
        debitAmount = parsedAmt <= 0 ? Math.abs(parsedAmt) : 0;
        creditAmount = parsedAmt > 0 ? parsedAmt : 0;
      } else if (type.toLowerCase() === 'purchase') {
        creditAmount = parsedAmt <= 0 ? Math.abs(parsedAmt) : 0;
        debitAmount = parsedAmt > 0 ? parsedAmt : 0;
      } else {
        debitAmount = parsedAmt <= 0 ? Math.abs(parsedAmt) : 0;
        creditAmount = parsedAmt > 0 ? parsedAmt : 0;
      }

      // Extract Ledger Entries if detailed
      let ledgerEntries: TallyTypes.TallyLedgerEntry[] = [];
      const rawLedgers = item['ALLLEDGERENTRIES.LIST'] || item['LEDGERENTRIES.LIST'];
      if (rawLedgers) {
        const ledgerList = Array.isArray(rawLedgers) ? rawLedgers : [rawLedgers];
        ledgerEntries = ledgerList.map((l: any) => ({
          ledgerName: getValue(l['LEDGERNAME']),
          amount: parseNumber(l['AMOUNT']),
          isDeemedPositive: getValue(l['ISDEEMEDPOSITIVE']) === 'Yes',
        })).filter((l: any) => l.ledgerName);
      }

      // Extract Inventory Entries if detailed
      let inventoryEntries: TallyTypes.TallyInventoryEntry[] = [];
      const rawInventory = item['ALLINVENTORYENTRIES.LIST'] || item['INVENTORYENTRIES.LIST'];
      if (rawInventory) {
        const inventoryList = Array.isArray(rawInventory) ? rawInventory : [rawInventory];
        inventoryEntries = inventoryList.map((i: any) => ({
          stockItemName: getValue(i['STOCKITEMNAME']),
          billedQty: getValue(i['BILLEDQTY']),
          rate: getValue(i['RATE']),
          amount: parseNumber(i['AMOUNT']),
        })).filter((i: any) => i.stockItemName);
      }

      const data = {
        date: dateInfo.iso || rawDate,
        formattedDate: dateInfo.formatted || rawDate,
        particulars,
        vchType: vchTypeName,
        vchNo,
        debitAmount,
        creditAmount,
        voucherNumber: vchNo,
        voucherType: vchTypeName,
        partyLedgerName: particulars,
        amount: Math.abs(parsedAmt),
        narration: getValue(item['NARRATION']),
        isOptional,
        isCancelled,
        ledgerEntries,
        inventoryEntries,
      };

      results.push(Validators.tallyVoucherSchema.parse(data));
    }

    return results;
  }

  public async getSales(options?: TallyTypes.VoucherQueryOptions): Promise<TallyTypes.TallySale[]> {
    return this.getVouchersByType('Sales', options);
  }

  public async getSalesRegister(options?: TallyTypes.VoucherQueryOptions): Promise<TallyTypes.TallySalesRegisterResponse> {
    const vouchers = await this.getSales(options);
    const totalDebitAmount = vouchers.reduce((sum, v) => sum + (v.debitAmount || 0), 0);
    const totalCreditAmount = vouchers.reduce((sum, v) => sum + (v.creditAmount || 0), 0);

    let fromDateFormatted = '';
    let toDateFormatted = '';
    if (options?.fromDate) fromDateFormatted = formatTallyDate(options.fromDate).formatted;
    if (options?.toDate) toDateFormatted = formatTallyDate(options.toDate).formatted;
    if (!fromDateFormatted && vouchers.length > 0) fromDateFormatted = vouchers[0].formattedDate || '';
    if (!toDateFormatted && vouchers.length > 0) toDateFormatted = vouchers[vouchers.length - 1].formattedDate || '';

    return {
      period: {
        from: options?.fromDate || (vouchers.length > 0 ? vouchers[0].date : ''),
        to: options?.toDate || (vouchers.length > 0 ? vouchers[vouchers.length - 1].date : ''),
        formattedFrom: fromDateFormatted,
        formattedTo: toDateFormatted,
      },
      totalCount: vouchers.length,
      totalDebitAmount: Math.round(totalDebitAmount * 100) / 100,
      totalCreditAmount: Math.round(totalCreditAmount * 100) / 100,
      netAmount: Math.round((totalDebitAmount - totalCreditAmount) * 100) / 100,
      vouchers,
    };
  }

  public async getPurchases(): Promise<TallyTypes.TallyPurchase[]> {
    return this.getVouchersByType('Purchase');
  }

  public async getReceipts(): Promise<TallyTypes.TallyReceipt[]> {
    return this.getVouchersByType('Receipt');
  }

  public async getPayments(): Promise<TallyTypes.TallyPayment[]> {
    return this.getVouchersByType('Payment');
  }

  public async getJournals(): Promise<TallyTypes.TallyJournal[]> {
    return this.getVouchersByType('Journal');
  }

  public async getCreditNotes(): Promise<TallyTypes.TallyCreditNote[]> {
    return this.getVouchersByType('Credit Note');
  }

  public async getDebitNotes(): Promise<TallyTypes.TallyDebitNote[]> {
    return this.getVouchersByType('Debit Note');
  }

  public async getSalesOrders(): Promise<TallyTypes.TallySalesOrder[]> {
    return this.getVouchersByType('Sales Order');
  }

  public async getPurchaseOrders(): Promise<TallyTypes.TallyPurchaseOrder[]> {
    return this.getVouchersByType('Purchase Order');
  }

  public async getOrderAcceptances(): Promise<TallyTypes.TallyOrderAcceptance[]> {
    return this.getVouchersByType('Order Acceptance');
  }

  // Stubs for complex summary reports (Balance Sheet, Profit & Loss, etc.)
  // These usually require custom EXPORT requests with specific REPORTNAME
  
  public async getInventorySummary(): Promise<any> {
    return [];
  }

  public async getStockSummary(): Promise<any> {
    return [];
  }

  public async getDayBook(): Promise<any> {
    return [];
  }

  public async getBalanceSheet(): Promise<any> {
    return [];
  }

  public async getProfitAndLoss(): Promise<any> {
    return [];
  }
}
