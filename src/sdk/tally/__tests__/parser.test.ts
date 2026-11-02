import { TallyParser } from '../parser';
import { TallyParseError } from '../errors';

describe('TallyParser', () => {
  const mockXml = `
    <ENVELOPE>
      <BODY>
        <DATA>
          <COLLECTION>
            <STOCKITEM>
              <NAME>Samsung S25 Ultra</NAME>
              <PARENT>Mobiles</PARENT>
              <BASEUNITS>Nos</BASEUNITS>
            </STOCKITEM>
            <STOCKITEM>
              <NAME>iPhone 15</NAME>
              <PARENT>Mobiles</PARENT>
              <BASEUNITS>Nos</BASEUNITS>
            </STOCKITEM>
          </COLLECTION>
        </DATA>
      </BODY>
    </ENVELOPE>
  `;

  it('should parse valid XML to object', () => {
    const obj = TallyParser.parse(mockXml);
    expect(obj.parsed.ENVELOPE.BODY.DATA.COLLECTION.STOCKITEM).toBeDefined();
  });

  it('should extract collection correctly and always return an array', () => {
    const obj = TallyParser.parse(mockXml);
    const items = TallyParser.extractCollection<any>(obj, 'STOCKITEM');
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBe(2);
    expect(items[0].NAME).toBe('Samsung S25 Ultra');
  });

  it('should handle single item arrays correctly via fast-xml-parser', () => {
    const singleMock = `
      <ENVELOPE>
        <BODY>
          <DATA>
            <COLLECTION>
              <STOCKITEM>
                <NAME>Samsung S25 Ultra</NAME>
              </STOCKITEM>
            </COLLECTION>
          </DATA>
        </BODY>
      </ENVELOPE>
    `;
    const obj = TallyParser.parse(singleMock);
    const items = TallyParser.extractCollection<any>(obj, 'STOCKITEM');
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBe(1);
  });

  it('should throw TallyParseError if LINEERROR exists', () => {
    const errorXml = `
      <ENVELOPE>
        <BODY>
          <DATA>
            <LINEERROR>Invalid Request</LINEERROR>
          </DATA>
        </BODY>
      </ENVELOPE>
    `;
    expect(() => TallyParser.parse(errorXml)).toThrow(TallyParseError);
  });
});
