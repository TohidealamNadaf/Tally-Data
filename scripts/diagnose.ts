/**
 * Standalone Tally Diagnostic Script
 * Bypasses Express server entirely — talks directly to Tally Gateway
 * Run: npx tsx scripts/diagnose.ts
 */
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const TALLY_URL = 'http://localhost:9000';

const REQUEST_XML = `<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>List of Accounts</REPORTNAME>
        <STATICVARIABLES>
          <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
          <ACCOUNTTYPE>Stock Item</ACCOUNTTYPE>
        </STATICVARIABLES>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`;

async function diagnose() {
  console.log('========================================================');
  console.log('TALLY STOCK ITEMS DIAGNOSTIC');
  console.log('========================================================');
  
  console.log('\n--- STEP 1: REQUEST XML ---');
  console.log(REQUEST_XML);
  
  console.log('\n--- STEP 2: SENDING TO TALLY ---');
  console.log(`POST ${TALLY_URL}`);
  
  try {
    const response = await axios.post(TALLY_URL, REQUEST_XML, {
      headers: { 'Content-Type': 'text/xml' },
      timeout: 15000,
      responseType: 'text',
    });
    
    const rawXml: string = response.data;
    
    console.log(`\nHTTP Status: ${response.status}`);
    console.log(`Response Length: ${rawXml.length} characters`);
    
    // Save to file
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    fs.writeFileSync(path.join(logDir, 'response.xml'), rawXml);
    console.log(`Saved raw XML to logs/response.xml`);
    
    console.log('\n--- STEP 3: RAW XML (first 2000 chars) ---');
    console.log(rawXml.substring(0, 2000));
    if (rawXml.length > 2000) console.log(`... (${rawXml.length - 2000} more characters)`);
    
    console.log('\n--- STEP 4: TAG DIAGNOSTICS ---');
    console.log(`Has <LINEERROR>:      ${rawXml.includes('<LINEERROR>')}`);
    console.log(`Has <COLLECTION>:     ${rawXml.includes('<COLLECTION')}`);
    console.log(`Has <STOCKITEM>:      ${rawXml.includes('<STOCKITEM')}`);
    console.log(`Has <STOCKITEMNAME>:  ${rawXml.includes('<STOCKITEMNAME>')}`);
    console.log(`Has <DATA>:           ${rawXml.includes('<DATA>')}`);
    console.log(`Has <TALLYMESSAGE>:   ${rawXml.includes('<TALLYMESSAGE')}`);
    console.log(`Has <DSPACCNAME>:     ${rawXml.includes('<DSPACCNAME>')}`);
    console.log(`Has NAME=:            ${rawXml.includes('NAME=')}`);
    
    // Check company context
    const companyMatch = rawXml.match(/<SVCURRENTCOMPANY[^>]*>([^<]+)<\/SVCURRENTCOMPANY>/i);
    console.log(`Company Context:      ${companyMatch ? companyMatch[1].trim() : 'NOT FOUND'}`);
    
    // Try parsing
    console.log('\n--- STEP 5: PARSED STRUCTURE ---');
    const { XMLParser } = await import('fast-xml-parser');
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseTagValue: true,
      parseAttributeValue: true,
      trimValues: true,
    });
    
    const parsed = parser.parse(rawXml);
    
    // Walk the structure
    console.log('Top-level keys:', Object.keys(parsed));
    
    if (parsed.ENVELOPE) {
      console.log('ENVELOPE keys:', Object.keys(parsed.ENVELOPE));
      if (parsed.ENVELOPE.BODY) {
        console.log('BODY keys:', Object.keys(parsed.ENVELOPE.BODY));
        if (parsed.ENVELOPE.BODY.DATA) {
          console.log('DATA keys:', Object.keys(parsed.ENVELOPE.BODY.DATA));
          if (parsed.ENVELOPE.BODY.DATA.COLLECTION) {
            const coll = parsed.ENVELOPE.BODY.DATA.COLLECTION;
            console.log('COLLECTION keys:', Object.keys(coll));
            console.log('COLLECTION value (first 500 chars):', JSON.stringify(coll).substring(0, 500));
          } else {
            console.log('DATA.COLLECTION is MISSING');
            console.log('DATA value (first 1000 chars):', JSON.stringify(parsed.ENVELOPE.BODY.DATA).substring(0, 1000));
          }
        } else {
          console.log('BODY.DATA is MISSING');
          console.log('BODY value (first 1000 chars):', JSON.stringify(parsed.ENVELOPE.BODY).substring(0, 1000));
        }
      } else {
        console.log('ENVELOPE.BODY is MISSING');
        console.log('ENVELOPE value (first 1000 chars):', JSON.stringify(parsed.ENVELOPE).substring(0, 1000));
      }
    } else {
      console.log('No ENVELOPE key found.');
      console.log('Full parsed (first 1000 chars):', JSON.stringify(parsed).substring(0, 1000));
    }
    
    console.log('\n========================================================');
    console.log('DIAGNOSTIC COMPLETE. Check logs/response.xml for full XML.');
    console.log('========================================================');
    
  } catch (error: any) {
    console.error('\n--- ERROR ---');
    if (error.code === 'ECONNREFUSED') {
      console.error('Cannot connect to Tally Gateway at', TALLY_URL);
      console.error('Make sure Tally is running and the gateway port is correct.');
    } else {
      console.error('Error:', error.message);
      if (error.response) {
        console.error('Response Status:', error.response.status);
        console.error('Response Data:', error.response.data?.substring?.(0, 500));
      }
    }
  }
}

diagnose();
