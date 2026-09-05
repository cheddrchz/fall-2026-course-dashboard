from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent
out=root/'visual-evidence';out.mkdir(exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch()
 for width in [360,390,430]:
  page=b.new_page(viewport={'width':width,'height':900},device_scale_factor=2)
  page.goto((root/'index.html').as_uri())
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'Overflow {width}'
  page.screenshot(path=str(out/f'mobile-{width}-night.png'))
  page.locator('[data-nav="theme"]').click()
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.screenshot(path=str(out/f'mobile-{width}-day.png'))
  for nav in ['assignments','checklist','planner']:
   page.locator(f'[data-nav="{nav}"]').click()
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'{nav} overflow {width}'
  print(f'{width}px: day/night and navigation overflow PASS')
  page.close()
 page=b.new_page(viewport={'width':1440,'height':1000})
 page.goto((root/'index.html').as_uri());page.screenshot(path=str(out/'desktop.png'))
 assert page.locator('#calendar').is_visible()
 assert not page.locator('#mobileNav').is_visible()
 print('1440px desktop calendar visible; mobile UI hidden PASS')
 b.close()
print(out)
