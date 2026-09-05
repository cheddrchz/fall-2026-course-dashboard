"""Embed mobile sources so both HTML downloads remain self-contained."""
from pathlib import Path
root = Path(__file__).resolve().parent
start = '<!-- MOBILE PLANNER START -->'
end = '<!-- MOBILE PLANNER END -->'
html = (root/'index.html').read_text(encoding='utf-8')
if start in html:
    a, rest = html.split(start, 1)
    _, b = rest.split(end, 1)
    html = a+b
block = start+'\n<style>\n'+(root/'mobile.css').read_text(encoding='utf-8')+'\n</style>\n<script>\n'+(root/'mobile.js').read_text(encoding='utf-8')+'\n</script>\n'+end
html = html.replace('</body>', block+'</body>')
for name in ['index.html','Fall-2026-Course-Dashboard.html']:
    (root/name).write_text(html, encoding='utf-8')
print('Built both self-contained HTML entrypoints.')
