import { XMLParser } from 'fast-xml-parser';
import { TallyParseError } from './errors';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseTagValue: true,
  parseAttributeValue: true,
  trimValues: true,
  cdataPropName: '__cdata',
  isArray: (name, jpath, isLeafNode, isAttribute) => {
    // Specify which nodes should always be arrays to avoid type issues
    const arrayNodes = [
      'LEDGER', 'STOCKITEM', 'STOCKGROUP', 'STOCKCATEGORY', 'UNIT', 
      'VOUCHER', 'COMPANY'
    ];
    return arrayNodes.includes(name);
  }
});

export interface TallyDiagnostics {
  xmlLength: number;
  hasLineError: boolean;
  hasCollection: boolean;
  hasStockItem: boolean;
  hasStockItemName: boolean;
  hasData: boolean;
  hasTallyMessage: boolean;
  companyContext: string | null;
}

export class ParserMismatchError extends Error {
  constructor(message: string, public readonly diagnostics: TallyDiagnostics) {
    super(message);
    this.name = 'ParserMismatchError';
  }
}

export class TallyParser {
  /**
   * Run raw diagnostics on the XML string
   */
  public static inspect(xml: string): TallyDiagnostics {
    const diagnostics: TallyDiagnostics = {
      xmlLength: xml.length,
      hasLineError: xml.includes('<LINEERROR>'),
      hasCollection: xml.includes('<COLLECTION>'),
      hasStockItem: xml.includes('<STOCKITEM') || xml.includes('<STOCK ITEM'),
      hasStockItemName: xml.includes('<STOCKITEMNAME>'),
      hasData: xml.includes('<DATA>'),
      hasTallyMessage: xml.includes('<TALLYMESSAGE'),
      companyContext: null
    };

    // Extract company context if present (e.g., <SVCURRENTCOMPANY>Compserv Demo</SVCURRENTCOMPANY>)
    const companyMatch = xml.match(/<SVCURRENTCOMPANY[^>]*>([^<]+)<\/SVCURRENTCOMPANY>/i);
    if (companyMatch && companyMatch[1]) {
      diagnostics.companyContext = companyMatch[1].trim();
    }

    console.log('\n========================================================');
    console.log('XML DIAGNOSTICS');
    console.log(`Length: ${diagnostics.xmlLength}`);
    console.log(`Has <LINEERROR>: ${diagnostics.hasLineError}`);
    console.log(`Has <COLLECTION>: ${diagnostics.hasCollection}`);
    console.log(`Has <STOCKITEM>: ${diagnostics.hasStockItem}`);
    console.log(`Has <STOCKITEMNAME>: ${diagnostics.hasStockItemName}`);
    console.log(`Has <DATA>: ${diagnostics.hasData}`);
    console.log(`Has <TALLYMESSAGE>: ${diagnostics.hasTallyMessage}`);
    console.log(`Company Context: ${diagnostics.companyContext || 'Not Found'}`);
    console.log('========================================================\n');

    return diagnostics;
  }

  /**
   * Parse Tally XML response into a JavaScript object
   */
  public static parse(xml: string, enforceDataMatch: boolean = false): { parsed: any, diagnostics: TallyDiagnostics } {
    try {
      if (!xml || xml.trim() === '') {
        throw new TallyParseError('Empty XML response received', xml);
      }
      
      const diagnostics = this.inspect(xml);

      const parsed = parser.parse(xml);
      
      // Basic check for Tally error responses
      if (parsed?.ENVELOPE?.BODY?.DATA?.LINEERROR) {
        throw new TallyParseError(`Tally returned an error: ${parsed.ENVELOPE.BODY.DATA.LINEERROR}`, xml);
      }
      
      return { parsed, diagnostics };
    } catch (error) {
      if (error instanceof TallyParseError || error instanceof ParserMismatchError) {
        throw error;
      }
      throw new TallyParseError(`Failed to parse Tally XML: ${(error as Error).message}`, xml);
    }
  }

  /**
   * Extract collection items from the parsed XML
   */
  public static extractCollection<T>(parsedData: { parsed: any, diagnostics: TallyDiagnostics }, collectionType: string): T[] {
    const { parsed, diagnostics } = parsedData;
    try {
      const data = parsed?.ENVELOPE?.BODY?.DATA?.COLLECTION;
      
      if (!data) {
        // If raw XML has data but parser didn't map it correctly
        if (diagnostics.hasCollection || diagnostics.hasData) {
          throw new ParserMismatchError(
            `Parser mismatch: XML contains data but parser failed to map COLLECTION for ${collectionType}`,
            diagnostics
          );
        }
        return [];
      }

      // Tally sometimes uses spaces in XML keys e.g., "STOCK ITEM" vs "STOCKITEM"
      let items = data[collectionType];
      
      if (!items) {
        // Fallback for spaced keys
        const spacedKey = collectionType.replace(/([A-Z])/g, ' $1').trim().toUpperCase();
        if (data[spacedKey]) {
          items = data[spacedKey];
        } else if (data[collectionType.toUpperCase()]) {
          items = data[collectionType.toUpperCase()];
        }
      }

      if (!items) {
        // Check if raw XML contained the item but we missed it in the parser
        const tagPresence = diagnostics.xmlLength > 0 && 
          (xmlStr => xmlStr.includes(`<${collectionType.toUpperCase()}`) || 
                     xmlStr.includes(`<${collectionType.toUpperCase().replace(' ', '')}`))
                     (JSON.stringify(parsed)); // Crude check but gives an idea
        
        // Actually, we already have diagnostics for stockitem
        if (collectionType.toUpperCase() === 'STOCKITEM' && (diagnostics.hasStockItem || diagnostics.hasStockItemName)) {
           throw new ParserMismatchError(
            `Parser mismatch: XML contains ${collectionType} but parser returned undefined.`,
            diagnostics
          );
        }
        return [];
      }

      // fast-xml-parser is configured to always return arrays for these types
      return Array.isArray(items) ? items : [items];
    } catch (error) {
      if (error instanceof ParserMismatchError) {
        throw error;
      }
      throw new TallyParseError(`Failed to extract collection ${collectionType}`, JSON.stringify(parsed));
    }
  }
}
