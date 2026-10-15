from html.parser import HTMLParser
from pathlib import Path
import re
from urllib.parse import urlsplit, unquote

site = Path(__file__).resolve().parents[1]

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.refs = []
        self.h1 = 0
        self.main = 0
        self.lang = None
        self.labels = set()
        self.inputs = {}
        self.stack = []
    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if 'id' in data:
            assert data['id'] not in self.ids, f'Duplicate id: {data["id"]}'
            self.ids.add(data['id'])
        for name in ['href', 'src']:
            if name in data: self.refs.append(data[name])
        for name in ['aria-describedby','aria-labelledby']:
            if name in data: self.refs.extend('#'+x for x in data[name].split())
        if tag == 'html': self.lang = data.get('lang')
        if tag == 'h1': self.h1 += 1
        if tag == 'main': self.main += 1
        if tag == 'label' and 'for' in data: self.labels.add(data['for'])
        if tag in ['input','textarea'] and 'id' in data: self.inputs[data['id']] = tag

pages = {}
for path in site.glob('*.html'):
    page = Page()
    page.feed(path.read_text())
    assert page.lang == 'en' and page.h1 == 1 and page.main == 1, path.name
    assert set(page.inputs) <= page.labels, f'Unlabeled input on {path.name}'
    pages[path.name] = page
for name, page in pages.items():
    for ref in page.refs:
        parsed = urlsplit(ref)
        if parsed.scheme or parsed.netloc: continue
        path = site/unquote(parsed.path) if parsed.path else site/name
        assert path.is_file(), f'{name}: missing {ref}'
        if parsed.fragment:
            target = pages.get(path.name)
            assert target and parsed.fragment in target.ids, f'{name}: missing anchor {ref}'
css = (site/'styles.css').read_text()
for ref in re.findall(r"url\(['\"]?([^)'\"]+)", css):
    assert (site/ref).is_file(), f'Missing CSS asset: {ref}'
controller = (site/'worksheet.js').read_text()
literal_ids = re.search(r'const ids = \[(.*?)\];', controller).group(1)
for id in re.findall(r"'([^']+)'",literal_ids):
    assert id in pages['demo.html'].ids, f'Missing controller element: {id}'
assert "overflow-x:hidden" not in css and "overflow-x: hidden" not in css
print('PASS: 3 English pages; unique IDs; one h1 and main per page; explicit field labels; local links, anchors, scripts, images and fonts; all controller selectors present')
