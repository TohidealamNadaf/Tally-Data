import { createEnvelope } from '../envelope';
import { createCollectionRequest, createExportRequest } from '../requests';

describe('XML Builder Helper Functions', () => {
  it('should create an envelope', () => {
    const xml = createEnvelope('<TEST>Hello</TEST>');
    expect(xml).toContain('<ENVELOPE>');
    expect(xml).toContain('<TEST>Hello</TEST>');
  });

  it('should create a collection request', () => {
    const xml = createCollectionRequest('StockItem');
    expect(xml).toContain('<ACCOUNTTYPE>StockItem</ACCOUNTTYPE>');
  });

  it('should create an export request', () => {
    const xml = createExportRequest('Balance Sheet');
    expect(xml).toContain('<REPORTNAME>Balance Sheet</REPORTNAME>');
  });
});
