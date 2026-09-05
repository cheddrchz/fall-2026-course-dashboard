import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]

class MobileTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pw = sync_playwright().start()
        cls.browser = cls.pw.chromium.launch()

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()

    def setUp(self):
        self.context = self.browser.new_context(viewport={"width":390,"height":844}, timezone_id='America/Detroit')
        self.page = self.context.new_page()
        self.errors=[]
        self.page.on('pageerror', lambda e: self.errors.append(str(e)))
        self.page.clock.install(time=1788642000)
        self.page.goto((ROOT/'index.html').as_uri())

    def tearDown(self):
        self.assertEqual(self.errors, [])
        self.context.close()

    def test_add_assignment_and_navigation(self):
        self.page.locator('.mobile-add').click()
        self.assertTrue(self.page.locator('#assignmentModal').is_visible())
        self.page.locator('#assignmentTitle').fill('Mobile QA assignment')
        self.page.locator('#assignmentDate').fill('2026-09-07')
        self.page.locator('#assignmentSave').click()
        self.assertFalse(self.page.locator('#assignmentModal').is_visible())
        self.page.locator('#mobileNav [data-nav="planner"]').click()
        self.assertIn('Mobile QA assignment', self.page.locator('.mobile-card-title').all_text_contents())
        self.page.locator('.mobile-card-link').filter(has_text='Mobile QA assignment').click()
        self.assertTrue(self.page.locator('#assignmentScreen').is_visible())
        self.assertFalse(self.page.locator('#mobilePlanner').is_visible())
        self.page.locator('#mobileNav [data-nav="checklist"]').click()
        self.assertTrue(self.page.locator('#todayScreen').is_visible())
        self.assertFalse(self.page.locator('#assignmentScreen').is_visible())
        self.page.locator('#mobileNav [data-nav="assignments"]').click()
        self.assertTrue(self.page.locator('#assignmentScreen').is_visible())
        self.assertFalse(self.page.locator('#todayScreen').is_visible())
        self.page.locator('#mobileNav [data-nav="theme"]').click()
        self.assertTrue(self.page.locator('body').evaluate('(e)=>e.classList.contains("dayMode")'))
        self.page.locator('#mobileNav [data-nav="planner"]').click()
        self.page.reload()
        self.assertIn('Mobile QA assignment', self.page.locator('.mobile-card-title').all_text_contents())
        self.assertTrue(self.page.locator('body').evaluate('(e)=>e.classList.contains("dayMode")'))

    def test_existing_saved_data_links_and_crud_survive(self):
        self.page.evaluate('''() => {
          localStorage.setItem('moodle-0-1','https://moodle.oakland.edu/course/view.php?id=42');
          localStorage.setItem('checked-2026-09-06-MGT 526 / MGT 4230-Quiz 1','1');
          localStorage.setItem('dashboard-courses', JSON.stringify(courses));
        }''')
        self.page.reload()
        self.assertNotIn('Quiz 1', self.page.locator('.mobile-card-title').all_text_contents())
        self.page.locator('[data-nav="assignments"]').click()
        item=self.page.locator('.assignmentItem').filter(has=self.page.locator('b',has_text='Quiz 1')).first
        self.page.evaluate('window.open=(url)=>{window.qaOpened=url;}')
        item.get_by_role('button',name='Open in Moodle',exact=True).click()
        self.assertEqual(self.page.evaluate('window.qaOpened'), 'https://moodle.oakland.edu/course/view.php?id=42')
        item.get_by_role('button',name='Edit assignment',exact=True).click()
        self.page.locator('#assignmentTitle').fill('Edited Quiz 1')
        self.page.locator('#assignmentSave').click()
        self.assertTrue(self.page.locator('.assignmentItem').filter(has_text='Edited Quiz 1').is_visible())
        self.page.on('dialog',lambda dialog: dialog.accept())
        self.page.locator('.assignmentItem').filter(has_text='Edited Quiz 1').get_by_role('button',name='Delete',exact=True).click()
        self.assertEqual(self.page.locator('.assignmentItem').filter(has_text='Edited Quiz 1').count(),0)
        self.page.reload()
        self.assertNotIn('Edited Quiz 1',self.page.evaluate('JSON.stringify(courses)'))

    def test_download_entrypoint_matches_and_source_data_unchanged(self):
        import subprocess
        self.assertEqual((ROOT/'index.html').read_bytes(),(ROOT/'Fall-2026-Course-Dashboard.html').read_bytes())
        base=subprocess.check_output(['git','show','8141de5:index.html'],cwd=ROOT).decode('utf-8')
        current=(ROOT/'index.html').read_text(encoding='utf-8')
        self.assertEqual(base.split('<script>')[1].split('</script>')[0],current.split('<script>')[1].split('</script>')[0])

    def test_inline_completion_persists_and_undo_restores(self):
        button = self.page.locator('.mobile-complete').first
        title = button.get_attribute('aria-label').removeprefix('Complete ')
        count = self.page.locator('.mobile-card').count()
        button.click()
        self.assertEqual(self.page.locator('.mobile-card').count(), count-1)
        self.page.locator('#mobileUndo').click()
        self.assertEqual(self.page.locator('.mobile-card').count(), count)
        self.page.locator('.mobile-complete').first.click()
        self.page.reload()
        self.assertNotIn(title, self.page.locator('.mobile-card-title').all_text_contents())

    def test_filter_month_and_week_navigation(self):
        self.page.locator('[data-filter="BIS 3000"]').click()
        self.assertEqual(set(self.page.locator('.mobile-course-label').all_text_contents()), {'BIS 3000'})
        self.page.locator('[data-month="1"]').click()
        self.assertIn('October', self.page.locator('.mobile-month-row h2').inner_text())
        self.page.locator('[data-month="-1"]').click()
        self.page.locator('[data-week="1"]').click()
        self.page.locator('[data-week="1"]').click()
        self.assertIn('13', self.page.locator('.mobile-week').inner_text())
        self.page.locator('[data-date="2026-09-13"]').click()
        self.assertEqual(self.page.locator('[data-date="2026-09-13"]').get_attribute('aria-pressed'), 'true')
        self.page.locator('[data-mode="day"]').click()
        self.assertEqual(self.page.locator('.mobile-group').count(), 1)
        self.assertIn('Academic Integrity', self.page.locator('.mobile-card-title').inner_text())
        self.page.locator('[data-mode="agenda"]').click()
        self.assertGreater(self.page.locator('.mobile-group').count(), 1)

    def test_mobile_agenda_and_desktop_preserved(self):
        self.assertTrue(self.page.locator('#mobilePlanner').is_visible(), 'Mobile planner should be visible')
        self.assertEqual(self.page.locator('#mobilePlanner h1').inner_text(), 'Your semester.')
        self.assertTrue(self.page.locator('.mobile-card').count()>0)
        self.assertFalse(self.page.locator('body > header').is_visible())
        self.page.set_viewport_size({'width':1440,'height':1000})
        self.assertFalse(self.page.locator('#mobilePlanner').is_visible())
        self.assertTrue(self.page.locator('#calendar').is_visible())

if __name__ == '__main__':
    unittest.main()
