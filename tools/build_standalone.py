"""Build standalone.html: index.html with data/sample-boxes.json embedded, so the demo
opens with a double-click (no web server) and works as a single file on GitHub Pages.
Usage: python3 tools/build_standalone.py"""
import json, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
page = (root / "index.html").read_text()
seed = json.loads((root / "data" / "sample-boxes.json").read_text())["boxes"]
marker = "<script>\n(() => {"
assert marker in page, "main script not found"
inject = "<script>window.__CRYO_SAMPLE=" + json.dumps(seed, separators=(",", ":")).replace("</", "<\\/") + ";</script>\n"
head = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        '<style>body{margin:0;font:14px system-ui}[hidden]{display:none!important}img{max-width:100%}</style>\n</head>\n<body>\n')
body = page.replace('<meta charset="utf-8">\n', "", 1).replace(marker, inject + marker, 1)
(root / "standalone.html").write_text(head + body + "\n</body>\n</html>\n")
print("wrote standalone.html")
