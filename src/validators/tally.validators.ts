import { z } from 'zod';

export const tallyCompanySchema = z.object({
  name: z.string(),
  guid: z.string().optional(),
});

export const tallyLedgerSchema = z.object({
  name: z.string(),
  parent: z.string(),
  openingBalance: z.number().optional(),
  closingBalance: z.number().optional(),
});

export const tallyStockGroupSchema = z.object({
  name: z.string(),
  parent: z.string().optional(),
});

export const tallyStockCategorySchema = z.object({
  name: z.string(),
  alias: z.string().default(''),
  languageAlias: z.string().default(''),
  parent: z.string().default('Primary'),
  grouping: z.string().default('Primary'),
  generalDetails: z.object({
    nameAndAlias: z.string().default(''),
    name: z.string(),
    alias: z.string().default(''),
    languageAlias: z.string().default(''),
    groupingOfStockCategory: z.string().default('Primary'),
  }).optional(),
});


export const tallyUnitSchema = z.object({
  name: z.string(),
  originalName: z.string().optional(),
});

export const tallyStockItemSchema = z.object({
  name: z.string(),
  group: z.string(),
  unit: z.string(),
  closingQty: z.number().optional(),
  openingQty: z.number().optional(),
  rate: z.number().optional(),
  value: z.number().optional(),
});

export const tallyLedgerEntrySchema = z.object({
  ledgerName: z.string(),
  amount: z.number(),
  isDeemedPositive: z.boolean(),
});

export const tallyInventoryEntrySchema = z.object({
  stockItemName: z.string(),
  billedQty: z.string().optional(),
  rate: z.string().optional(),
  amount: z.number().optional(),
});

export const tallyVoucherSchema = z.object({
  date: z.string(),
  formattedDate: z.string().optional(),
  particulars: z.string().optional(),
  vchType: z.string().optional(),
  vchNo: z.string().optional(),
  debitAmount: z.number().optional().default(0),
  creditAmount: z.number().optional().default(0),
  voucherNumber: z.string(),
  voucherType: z.string(),
  narration: z.string().optional(),
  partyLedgerName: z.string().optional(),
  amount: z.number().optional(),
  isOptional: z.boolean().optional().default(false),
  isCancelled: z.boolean().optional().default(false),
  ledgerEntries: z.array(tallyLedgerEntrySchema).default([]),
  inventoryEntries: z.array(tallyInventoryEntrySchema).default([]),
});

export const tallyCustomerDetailedSchema = z.object({
  name: z.string(),
  parent: z.string(),
  openingBalance: z.number().default(0),
  closingBalance: z.number().default(0),
  creditPeriod: z.string().default(''),
  isBillwiseOn: z.boolean().default(false),
  mailingDetails: z.object({
    name: z.string().default(''),
    address: z.array(z.string()).default([]),
    fullAddress: z.string().default(''),
    state: z.string().default(''),
    country: z.string().default(''),
    pincode: z.string().default(''),
  }),
  bankingDetails: z.object({
    provideBankDetails: z.boolean().default(false),
    accountNumber: z.string().optional().default(''),
    ifscCode: z.string().optional().default(''),
    bankName: z.string().optional().default(''),
  }),
  taxRegistrationDetails: z.object({
    pan: z.string().default(''),
    registrationType: z.string().default(''),
    gstin: z.string().default(''),
    placeOfSupply: z.string().default(''),
    state: z.string().default(''),
  }),
  contactDetails: z.object({
    contactPerson: z.string().optional().default(''),
    mobile: z.string().optional().default(''),
    phone: z.string().optional().default(''),
    email: z.string().optional().default(''),
  }).optional(),
});

export const tallyStockItemDetailedSchema = z.object({
  name: z.string(),
  generalDetails: z.object({
    name: z.string(),
    alias: z.string().default(''),
    partNumber: z.string().default(''),
    description: z.string().default(''),
    notes: z.string().default(''),
  }),
  inventoryDetails: z.object({
    stockGroup: z.string().default(''),
    stockCategory: z.string().default('Not Applicable'),
    unitsOfMeasurement: z.string().default(''),
    alternateUnits: z.string().default('Not Applicable'),
    costTracking: z.string().default('No'),
    costingMethod: z.string().default('Avg. Cost'),
    marketValuationMethod: z.string().default('Avg. Price'),
    openingBalance: z.string().default(''),
    openingQty: z.number().default(0),
    openingRate: z.number().default(0),
    openingValue: z.number().default(0),
    standardBuyingRate: z.string().optional().default(''),
    standardSellingRate: z.string().optional().default(''),
    batches: z.array(z.object({
      godown: z.string().default(''),
      batchName: z.string().default(''),
      openingBalance: z.string().default(''),
      openingRate: z.string().default(''),
      openingValue: z.number().default(0),
    })).default([]),
  }),
  statutoryDetails: z.object({
    gstHsnDetails: z.object({
      hsnCode: z.string().default(''),
      hsnSource: z.string().default(''),
    }),
    gstRateDetails: z.object({
      taxability: z.string().default('Taxable'),
      calculationType: z.string().default('On Value'),
      igstRate: z.number().default(0),
      cgstRate: z.number().default(0),
      sgstRate: z.number().default(0),
      cessRate: z.number().default(0),
    }),
    typeOfSupply: z.string().default('Goods'),
    inclusiveOfDutiesAndTaxes: z.boolean().default(false),
    rateOfDuty: z.number().default(0),
  }),
});


