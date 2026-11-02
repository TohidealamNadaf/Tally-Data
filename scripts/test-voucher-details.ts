import { XMLParser } from 'fast-xml-parser';
import axios from 'axios';

const xml = `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>VoucherCollection</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="VoucherCollection" ISMODIFY="No">
            <TYPE>Voucher</TYPE>
            <FETCH>DATE, VOUCHERNUMBER, VOUCHERTYPENAME, PARTYLEDGERNAME, AMOUNT, NARRATION, ALLLEDGERENTRIES.*, ALLINVENTORYENTRIES.*</FETCH>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;

async function testVoucher() {
  try {
    const res = await axios.post('http://localhost:9000', xml, {
      headers: { 'Content-Type': 'text/xml' }
    });
    
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
    });
    const parsed = parser.parse(res.data);
    const vouchers = parsed?.ENVELOPE?.BODY?.DATA?.COLLECTION?.VOUCHER;
    
    if (vouchers) {
        const vList = Array.isArray(vouchers) ? vouchers : [vouchers];
        const sales = vList.filter(v => v.VOUCHERTYPENAME?.['#text'] === 'Sales' || v.VOUCHERTYPENAME === 'Sales');
        if (sales.length > 0) {
           console.log("Found Sales Voucher!");
           console.log("Has ALLLEDGERENTRIES.LIST?", !!sales[0]['ALLLEDGERENTRIES.LIST']);
           console.log("Has ALLINVENTORYENTRIES.LIST?", !!sales[0]['ALLINVENTORYENTRIES.LIST']);
           
           if (sales[0]['ALLLEDGERENTRIES.LIST']) {
               console.log("LEDGER ENTRIES:", JSON.stringify(sales[0]['ALLLEDGERENTRIES.LIST'], null, 2));
           }
           if (sales[0]['ALLINVENTORYENTRIES.LIST']) {
               console.log("INVENTORY ENTRIES:", JSON.stringify(sales[0]['ALLINVENTORYENTRIES.LIST'], null, 2));
           }
        } else {
           console.log("No Sales Vouchers found.");
        }
    } else {
        console.log("No VOUCHER found");
    }
  } catch (err) {
    console.error(err);
  }
}

testVoucher();
