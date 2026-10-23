import base64, json, sys

raw = open('/tmp/ele-c.txt', 'rb').read().decode().strip()
parts = raw.split('.')

def b64urldecode(s):
    s = s.replace('-', '+').replace('_', '/')
    return base64.b64decode(s + '=' * (-len(s) % 4))

payload = json.loads(b64urldecode(parts[1]))
json.dump(payload, open('/tmp/ele-config.json', 'w'), ensure_ascii=False, indent=1)
print("chaves:", list(payload.keys()))
for pl in payload.get('pl', []):
    print("ELEICAO cd=%s cdpr=%s c=%s dt=%s" % (pl.get('cd'), pl.get('cdpr'), pl.get('c'), pl.get('dt')))
    for e in pl.get('e', []):
        print("   e: cd=%s cd2=%s cargos=%s dt=%s" % (e.get('cd'), e.get('cdt2'), e.get('cg'), e.get('dt')))
