/**
 * Quick test: parse the saved response_format_1.xml and check structure
 * Run: npx tsx scripts/verify-parse.ts
 */
import fs from 'fs';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';

const xml = fs.readFileSync(path.join(process.cwd(), 'logs', 'response_format_1.xml'), 'utf-8');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseTagValue: true,
  parseAttributeValue: true,
  trimValues: true,
  cdataPropName: '__cdata',
  isArray: (name) => ['LEDGER', 'STOCKITEM', 'STOCKGROUP', 'STOCKCATEGORY', 'UNIT', 'VOUCHER', 'COMPANY'].includes(name),
});

const parsed = parser.parse(xml);

const collection = parsed?.ENVELOPE?.BODY?.DATA?.COLLECTION;
console.log('COLLECTION keys:', collection ? Object.keys(collection) : 'MISSING');

if (collection?.STOCKITEM) {
  const items = collection.STOCKITEM;
  console.log(`Found ${items.length} stock items\n`);
  
  // Show first item's full structure
  console.log('=== FIRST STOCK ITEM (full structure) ===');
  console.log(JSON.stringify(items[0], null, 2));
  
  console.log('\n=== KEY ACCESS TEST (first item) ===');
  const item = items[0];
  console.log('item["@_NAME"]:', item['@_NAME']);
  console.log('item["NAME"]:', item['NAME']);
  console.log('item["PARENT"]:', item['PARENT']);
  console.log('typeof item["PARENT"]:', typeof item['PARENT']);
  console.log('item["BASEUNITS"]:', item['BASEUNITS']);
  console.log('typeof item["BASEUNITS"]:', typeof item['BASEUNITS']);
  console.log('item["OPENINGBALANCE"]:', item['OPENINGBALANCE']);
  console.log('item["CLOSINGBALANCE"]:', item['CLOSINGBALANCE']);
  console.log('item["OPENINGVALUE"]:', item['OPENINGVALUE']);
  
  // Check the Samsung item which has actual closing balance
  const samsung = items.find((i: any) => (i['@_NAME'] || '').includes('Samsung S25'));
  if (samsung) {
    console.log('\n=== SAMSUNG S25 (has closing balance) ===');
    console.log(JSON.stringify(samsung, null, 2));
  }
} else {
  console.log('NO STOCKITEM found in COLLECTION');
  console.log('Full DATA:', JSON.stringify(parsed?.ENVELOPE?.BODY?.DATA, null, 2).substring(0, 500));
}
