import urllib.request
import xml.etree.ElementTree as ET

masters = [
    ('Godown', 'Godown', ['NAME', 'PARENT', 'ADDRESS']),
    ('Group', 'Group', ['NAME', 'PARENT', 'ISSUBLEDGER']),
    ('Voucher Type', 'Voucher Type', ['NAME', 'PARENT', 'NUMBERINGMETHOD']),
    ('Cost Centre', 'Cost Centre', ['NAME', 'CATEGORY', 'PARENT']),
    ('Cost Category', 'Cost Category', ['NAME']),
    ('Currency', 'Currency', ['NAME', 'ORIGINALNAME', 'SYMBOL']),
    ('Employee', 'Employee', ['NAME', 'PARENT', 'EMPLOYEENO', 'DESIGNATION']),
    ('Attendance Type', 'Attendance Type', ['NAME', 'PERIODTYPE']),
    ('GST Classification', 'GST Classification', ['NAME', 'HSNCODE']),
]

def query_tdl(m_type, fields):
    col_id = m_type.replace(' ', '') + 'Col'
    fetch_str = ', '.join(fields)
    xml = f"""<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>{col_id}</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="{col_id}" ISMODIFY="No">
            <TYPE>{m_type}</TYPE>
            <FETCH>{fetch_str}</FETCH>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>"""
    req = urllib.request.Request('http://localhost:9000', data=xml.encode('utf-8'), headers={'Content-Type': 'text/xml'})
    with urllib.request.urlopen(req, timeout=10) as r:
        res = r.read().decode('utf-8', errors='ignore')
        root = ET.fromstring(res)
        # Search all descendants
        tag = m_type.upper().replace(' ', '')
        items = []
        for elem in root.iter():
            if elem.tag.upper() == tag:
                item = {}
                # check attribute @_NAME
                name_attr = elem.attrib.get('NAME')
                if name_attr:
                    item['name'] = name_attr
                for child in elem:
                    child_name = child.tag.upper()
                    child_text = child.text.strip() if child.text else ''
                    if child_name == 'NAME' and 'name' not in item:
                        item['name'] = child_text
                    elif child_name != 'NAME':
                        item[child.tag.lower()] = child_text
                if item:
                    items.append(item)
        return items

for m_label, m_type, fields in masters:
    try:
        data = query_tdl(m_type, fields)
        print(f"{m_label:20}: {len(data)} items")
        if len(data) > 0:
            print("   sample:", data[0])
    except Exception as e:
        print(f"{m_label:20}: Error ({e})")
