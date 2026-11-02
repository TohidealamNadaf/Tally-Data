/**
 * Creates the base Tally XML Envelope
 */
export function createEnvelope(requestData: string): string {
  return `<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>ODBC Report</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
        ${requestData}
      </REQUESTDATA>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export function createImportEnvelope(requestData: string): string {
  return `<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
        ${requestData}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}
