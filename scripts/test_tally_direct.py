import urllib.request
import xml.etree.ElementTree as ET

def test_tally():
    xml_req = """<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>CompanyCol</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="CompanyCol" ISMODIFY="No">
            <TYPE>Company</TYPE>
            <FETCH>NAME, GUID, BOOKSFROM, STARTINGFROM</FETCH>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>"""

    req = urllib.request.Request(
        "http://localhost:9000",
        data=xml_req.encode("utf-8"),
        headers={"Content-Type": "text/xml"}
    )
    
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            resp_data = res.read().decode("utf-8", errors="ignore")
            print(f"Status: {res.status}, Length: {len(resp_data)}")
            print("Preview:\n", resp_data[:500])
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_tally()
