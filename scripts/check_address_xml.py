import urllib.request
import re

def check_sales_address():
    xml = """<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>SalesAddrCol</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="SalesAddrCol" ISMODIFY="No">
            <TYPE>Voucher</TYPE>
            <FETCH>VOUCHERNUMBER, VOUCHERTYPENAME, PARTYLEDGERNAME, BASICBUYERNAME, BASICBUYERADDRESS, CONSIGNEEMAILINGNAME, BASICSHIPPEDBYADDRESS, STATENAME, CONSIGNEESTATENAME, PARTYGSTIN, CONSIGNEEGSTIN</FETCH>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>"""
    req = urllib.request.Request('http://localhost:9000', data=xml.encode('utf-8'), headers={'Content-Type': 'text/xml'})
    with urllib.request.urlopen(req, timeout=15) as r:
        raw = r.read().decode('utf-8', errors='ignore')
        raw = re.sub(r'&#[0-9]+;', '', raw)
        for m in re.finditer(r'<VOUCHER[^>]*>.*?</VOUCHER>', raw, re.DOTALL):
            snippet = m.group(0)
            if '<VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>' in snippet:
                print("--- Found Sales Voucher Address Info ---")
                print(snippet)
                break

if __name__ == '__main__':
    check_sales_address()
