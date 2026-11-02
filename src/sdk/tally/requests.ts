import { createEnvelope } from './envelope';

/**
 * Mapping of user-friendly collection names to their Tally TDL TYPE names
 * and the fields to FETCH for each.
 */
const COLLECTION_CONFIG: Record<string, { type: string; fetch: string }> = {
  'Company':       { type: 'Company',       fetch: 'NAME, GUID' },
  'Ledger':        { type: 'Ledger',        fetch: 'NAME, PARENT, OPENINGBALANCE, CLOSINGBALANCE' },
  'Stock Item':    { type: 'Stock Item',    fetch: 'NAME, PARENT, BASEUNITS, OPENINGBALANCE, OPENINGRATE, OPENINGVALUE, CLOSINGBALANCE, CLOSINGRATE, CLOSINGVALUE' },
  'StockGroup':    { type: 'Stock Group',   fetch: 'NAME, PARENT' },
  'StockCategory': { type: 'Stock Category', fetch: 'NAME, PARENT, MAILINGNAME.*, LANGUAGENAME.*' },
  'Unit':          { type: 'Unit',          fetch: 'NAME, ORIGINALNAME' },
  'Voucher':       { type: 'Voucher',       fetch: 'DATE, VOUCHERNUMBER, VOUCHERTYPENAME, PARTYLEDGERNAME, AMOUNT, NARRATION, ALLLEDGERENTRIES.*, ALLINVENTORYENTRIES.*' },
};

/**
 * Create a TDL Collection-based export request.
 * This is the format that actually works with Tally Gateway for fetching master data.
 */
export function createCollectionRequest(collectionName: string, fields: string[] = []): string {
  const config = COLLECTION_CONFIG[collectionName];
  const tdlType = config ? config.type : collectionName;
  const fetchFields = fields.length > 0 ? fields.join(', ') : (config ? config.fetch : '*');
  
  // Use a sanitized collection ID (no spaces, for the TDL NAME attribute)
  const collectionId = collectionName.replace(/\s+/g, '') + 'Collection';

  return `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>${collectionId}</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="${collectionId}" ISMODIFY="No">
            <TYPE>${tdlType}</TYPE>
            <FETCH>${fetchFields}</FETCH>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

export function createExportRequest(reportName: string): string {
  return `<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>${reportName}</REPORTNAME>
        <STATICVARIABLES>
          <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        </STATICVARIABLES>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export function createCustomerDetailedRequest(): string {
  return `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>CustomerDetailedCollection</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="CustomerDetailedCollection" ISMODIFY="No">
            <TYPE>Ledger</TYPE>
            <FETCH>NAME, PARENT, OPENINGBALANCE, CLOSINGBALANCE, BILLCREDITPERIOD, ISBILLWISEON, ADDRESS, STATENAME, PRIORSTATENAME, COUNTRYNAME, COUNTRYOFRESIDENCE, PINCODE, OLDPINCODE, INCOMETAXNUMBER, PARTYGSTIN, GSTREGISTRATIONTYPE, BANKDETAILS, LEDGERCONTACT, LEDGERMOBILE, LEDGERPHONE, EMAIL, LEDMAILINGDETAILS.*, LEDGSTREGDETAILS.*, PAYMENTDETAILS.*</FETCH>
            <FILTER>IsDebtor</FILTER>
          </COLLECTION>
          <SYSTEM TYPE="Formulae" NAME="IsDebtor">$Parent contains "Debtor"</SYSTEM>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

export function createStockItemDetailedRequest(itemName?: string): string {
  const filterXml = itemName
    ? `\n            <FILTER>SpecificItem</FILTER>\n          </COLLECTION>\n          <SYSTEM TYPE="Formulae" NAME="SpecificItem">$Name = "${itemName}"</SYSTEM>`
    : `\n          </COLLECTION>`;

  return `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>StockItemDetailedCollection</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="StockItemDetailedCollection" ISMODIFY="No">
            <TYPE>Stock Item</TYPE>
            <FETCH>NAME, PARENT, CATEGORY, BASEUNITS, ADDITIONALUNITS, COSTINGMETHOD, VALUATIONMETHOD, ISCOSTTRACKINGON, OPENINGBALANCE, OPENINGRATE, OPENINGVALUE, CLOSINGBALANCE, CLOSINGRATE, CLOSINGVALUE, DESCRIPTION, NARRATION, GSTTYPEOFSUPPLY, BASICRATEOFEXCISE, ISRATEINCLUSIVEVAT, MAILINGNAME.*, HSNDETAILS.*, GSTDETAILS.*, STANDARDCOSTLIST.*, STANDARDPRICELIST.*, BATCHALLOCATIONS.*</FETCH>${filterXml}
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
}
export function createVoucherCollectionRequest(voucherType: string, detailed: boolean = false): string {
  const collectionId = `${voucherType.replace(/[^a-zA-Z0-9]/g, '')}VoucherCollection`;
  const fetchFields = detailed
    ? 'DATE, EFFECTIVEDATE, VOUCHERNUMBER, VOUCHERTYPENAME, PARTYLEDGERNAME, PARTYNAME, AMOUNT, NARRATION, ISOPTIONAL, ISCANCELED, ISDELETED, ALLLEDGERENTRIES.*, ALLINVENTORYENTRIES.*'
    : 'DATE, EFFECTIVEDATE, VOUCHERNUMBER, VOUCHERTYPENAME, PARTYLEDGERNAME, PARTYNAME, AMOUNT, NARRATION, ISOPTIONAL, ISCANCELED, ISDELETED';

  return `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>${collectionId}</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="${collectionId}" ISMODIFY="No">
            <TYPE>Voucher</TYPE>
            <FETCH>${fetchFields}</FETCH>
            <FILTER>ByVchType</FILTER>
          </COLLECTION>
          <SYSTEM TYPE="Formulae" NAME="ByVchType">$VoucherTypeName = "${voucherType}"</SYSTEM>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
}
