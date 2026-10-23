import base64, json, sys

def decode_jws(path):
    raw = open(path, 'rb').read().decode().strip()
    parts = raw.split('.')
    if len(parts) < 2:
        return None
    s = parts[1].replace('-', '+').replace('_', '/')
    return json.loads(base64.b64decode(s + '=' * (-len(s) % 4)))

name = sys.argv[1]
out = sys.argv[2] if len(sys.argv) > 2 else None
data = decode_jws(name)
if out:
    json.dump(data, open(out, 'w'), ensure_ascii=False, indent=1)
    print("salvo em", out)
else:
    print(json.dumps(data, ensure_ascii=False, indent=1)[:6000])
