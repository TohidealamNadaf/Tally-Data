export interface TallyCompany {
  name: string;
  guid?: string;
}

export interface TallyLedger {
  name: string;
  parent: string;
  openingBalance?: number;
  closingBalance?: number;
}

export interface TallyStockGroup {
  name: string;
  parent?: string;
}

export interface TallyStockCategory {
  name: string;
  alias?: string;
  languageAlias?: string;
  parent?: string;
  grouping?: string;
  generalDetails?: {
    nameAndAlias: string;
    name: string;
    alias: string;
    languageAlias: string;
    groupingOfStockCategory: string;
  };
}


export interface TallyUnit {
  name: string;
  originalName?: string;
}

export interface TallyStockItem {
  name: string;
  group: string;
  unit: string;
  closingQty?: number;
  openingQty?: number;
  rate?: number;
  value?: number;
}

export interface TallyStockItemDetailed {
  name: string;
  generalDetails: {
    name: string;
    alias: string;
    partNumber: string;
    description: string;
    notes: string;
  };
  inventoryDetails: {
    stockGroup: string;
    stockCategory: string;
    unitsOfMeasurement: string;
    alternateUnits: string;
    costTracking: string;
    costingMethod: string;
    marketValuationMethod: string;
    openingBalance: string;
    openingQty: number;
    openingRate: number;
    openingValue: number;
    standardBuyingRate?: string;
    standardSellingRate?: string;
    batches: Array<{
      godown: string;
      batchName: string;
      openingBalance: string;
      openingRate: string;
      openingValue: number;
    }>;
  };
  statutoryDetails: {
    gstHsnDetails: {
      hsnCode: string;
      hsnSource: string;
    };
    gstRateDetails: {
      taxability: string;
      calculationType: string;
      igstRate: number;
      cgstRate: number;
      sgstRate: number;
      cessRate: number;
    };
    typeOfSupply: string;
    inclusiveOfDutiesAndTaxes: boolean;
    rateOfDuty: number;
  };
}


export interface TallyCustomer extends TallyLedger {}
export interface TallySupplier extends TallyLedger {}

export interface TallyCustomerDetailed {
  name: string;
  parent: string;
  openingBalance: number;
  closingBalance: number;
  creditPeriod: string;
  isBillwiseOn: boolean;
  mailingDetails: {
    name: string;
    address: string[];
    fullAddress: string;
    state: string;
    country: string;
    pincode: string;
  };
  bankingDetails: {
    provideBankDetails: boolean;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
  };
  taxRegistrationDetails: {
    pan: string;
    registrationType: string;
    gstin: string;
    placeOfSupply: string;
    state: string;
  };
  contactDetails?: {
    contactPerson?: string;
    mobile?: string;
    phone?: string;
    email?: string;
  };
}

export interface TallyLedgerEntry {
  ledgerName: string;
  amount: number;
  isDeemedPositive: boolean;
}

export interface TallyInventoryEntry {
  stockItemName: string;
  billedQty?: string;
  rate?: string;
  amount?: number;
}

export interface TallyVoucher {
  date: string;
  formattedDate?: string;
  particulars?: string;
  vchType?: string;
  vchNo?: string;
  debitAmount?: number;
  creditAmount?: number;
  voucherNumber: string;
  voucherType: string;
  narration?: string;
  partyLedgerName?: string;
  amount?: number;
  isOptional?: boolean;
  isCancelled?: boolean;
  ledgerEntries?: TallyLedgerEntry[];
  inventoryEntries?: TallyInventoryEntry[];
}

export interface TallySale extends TallyVoucher {}
export interface TallyPurchase extends TallyVoucher {}
export interface TallyReceipt extends TallyVoucher {}
export interface TallyPayment extends TallyVoucher {}
export interface TallyJournal extends TallyVoucher {}
export interface TallyCreditNote extends TallyVoucher {}
export interface TallyDebitNote extends TallyVoucher {}
export interface TallySalesOrder extends TallyVoucher {}
export interface TallyPurchaseOrder extends TallyVoucher {}
export interface TallyOrderAcceptance extends TallyVoucher {}

export interface VoucherQueryOptions {
  fromDate?: string;
  toDate?: string;
  month?: string;
  year?: string | number;
  party?: string;
  vchNo?: string;
  includeOptional?: boolean;
  includeCancelled?: boolean;
  detailed?: boolean;
}

export interface TallySalesRegisterResponse {
  period: {
    from?: string;
    to?: string;
    formattedFrom?: string;
    formattedTo?: string;
  };
  totalCount: number;
  totalDebitAmount: number;
  totalCreditAmount: number;
  netAmount: number;
  vouchers: TallySale[];
}

export interface TallyInventorySummary {
  // Add fields based on requirement
}

export interface TallyStockSummary {
  // Add fields based on requirement
}

export interface TallyDayBook {
  // Add fields based on requirement
}

export interface TallyBalanceSheet {
  // Add fields based on requirement
}

export interface TallyProfitAndLoss {
  // Add fields based on requirement
}
