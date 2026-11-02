/**
 * Test different Tally XML export formats for Stock Items
 * Run: npx tsx scripts/test-formats.ts
 */
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const TALLY_URL = 'http://localhost:9000';

// Format 1: TDL Collection-based request (the standard Tally way to fetch any collection)
const FORMAT_TDL_COLLECTION = `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>Stock Items</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="Stock Items" ISMODIFY="No">
            <TYPE>Stock Item</TYPE>
            <FETCH>NAME, PARENT, BASEUNITS, OPENINGBALANCE, OPENINGRATE, OPENINGVALUE, CLOSINGBALANCE, CLOSINGRATE, CLOSINGVALUE</FETCH>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;

// Format 2: Simpler TDL Collection (minimal)
const FORMAT_TDL_SIMPLE = `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>StockItemCollection</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="StockItemCollection" ISMODIFY="No">
            <TYPE>Stock Item</TYPE>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;

// Format 3: List of Accounts with "Stock Items" (double check the account type name)
const FORMAT_LIST_ACCOUNTS = `<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>List of Accounts</REPORTNAME>
        <STATICVARIABLES>
          <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
          <ACCOUNTTYPE>Stock Items</ACCOUNTTYPE>
        </STATICVARIABLES>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`;

const formats = [
  { name: 'TDL Collection (Full)', xml: FORMAT_TDL_COLLECTION },
  { name: 'TDL Collection (Simple)', xml: FORMAT_TDL_SIMPLE },
  { name: 'List of Accounts (Stock Items plural)', xml: FORMAT_LIST_ACCOUNTS },
];

async function testFormat(name: string, xml: string, index: number) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`FORMAT ${index + 1}: ${name}`);
  console.log('='.repeat(60));
  
  try {
    const response = await axios.post(TALLY_URL, xml, {
      headers: { 'Content-Type': 'text/xml' },
      timeout: 15000,
      responseType: 'text',
    });
    
    const rawXml: string = response.data;
    
    // Save each response
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    fs.writeFileSync(path.join(logDir, `response_format_${index + 1}.xml`), rawXml);
    
    console.log(`HTTP Status: ${response.status}`);
    console.log(`Response Length: ${rawXml.length} chars`);
    console.log(`Has <STOCKITEM>: ${rawXml.includes('<STOCKITEM')}`);
    console.log(`Has <COLLECTION>: ${rawXml.includes('<COLLECTION')}`);
    console.log(`Has <TALLYMESSAGE>: ${rawXml.includes('<TALLYMESSAGE')}`);
    console.log(`Has <LINEERROR>: ${rawXml.includes('<LINEERROR>')}`);
    console.log(`Has IMPORTDATA: ${rawXml.includes('IMPORTDATA')}`);
    console.log(`\nFirst 500 chars:\n${rawXml.substring(0, 500)}`);
    
  } catch (error: any) {
    console.error(`ERROR: ${error.message}`);
  }
}

async function main() {
  console.log('Testing 3 different XML export formats against Tally...\n');
  
  for (let i = 0; i < formats.length; i++) {
    await testFormat(formats[i].name, formats[i].xml, i);
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('ALL TESTS COMPLETE. Check logs/ for saved responses.');
  console.log('='.repeat(60));
}

main();
