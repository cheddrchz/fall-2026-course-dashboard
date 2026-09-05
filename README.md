# Fall 2026 course dashboard

The existing dashboard now has a mobile-first agenda at widths up to 950px. Desktop retains the original calendar.

## Mobile
- Agenda and selected-day views, month/week navigation, and class filters
- Inline completion with an eight-second Undo action
- Bottom navigation for Planner, Checklist, Assignments, and day/night theme
- Existing assignment editing, Moodle links, and browser-local saved data

This remains the existing responsive web app, not a new native install. Data stays in the same browser's localStorage; there is no new account or cloud sync.

## Develop and test

Edit `mobile.js` and `mobile.css`, then rebuild both self-contained HTML entrypoints:

```sh
python build_mobile.py
python -m pip install -r requirements-test.txt
python -m playwright install chromium
python -m unittest discover -s tests -v
python verify_visual.py
```

`index.html` and `Fall-2026-Course-Dashboard.html` must remain identical. The build replaces only the marked mobile block. Existing course data and original script are preserved. Test data is written only in isolated Playwright browser contexts, never in the user's browser.
