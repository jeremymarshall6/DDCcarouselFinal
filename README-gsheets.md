# Dealer.com Dynamic Carousel — Google Sheets Edition

## Architecture Overview

```
┌──────────────────┐         ┌───────────────────────────┐
│   Dealer.com     │  fetch  │  Google Apps Script        │
│   (Browser JS)   │ ──────► │  (reads Google Sheet,     │
│                  │ ◄────── │   returns JSON)            │
│  carousel HTML   │  JSON   │                           │
└──────────────────┘         └────────────┬──────────────┘
                                          │ reads
                                          ▼
                              ┌───────────────────────┐
                              │   Google Sheet         │
                              │  (your slide data)     │
                              └───────────────────────┘
```

**No CORS proxy needed.** Google Apps Script web apps automatically
serve responses with open CORS headers, so the Dealer.com page
can fetch the data directly.

---

## Files

| File | Purpose |
|------|---------|
| `carousel-gsheets.html` | The carousel widget — paste into Dealer.com RAW HTML Editor |
| `google-apps-script.js` | Apps Script code — paste into your Google Sheet's script editor |

---

## Step 1: Create Your Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet
2. Name it something like "Carousel Slides"
3. Set up the columns:

| A (image_url) | B (link_url) | C (alt_text) |
|----------------|--------------|---------------|
| https://cdn.example.com/slide1.jpg | https://yoursite.com/specials | Summer Sale Banner |
| https://cdn.example.com/slide2.jpg | https://yoursite.com/inventory | New Inventory |
| https://cdn.example.com/slide3.jpg | https://yoursite.com/service | Service Department |

- **Row 1** = header row (skipped automatically)
- **Column A** = full image URL (must be publicly accessible)
- **Column B** = click-through destination URL
- **Column C** = alt text for accessibility

---

## Step 2: Deploy the Apps Script

1. In your Google Sheet, go to **Extensions → Apps Script**
2. Delete any default code in the editor
3. Paste the entire contents of `google-apps-script.js`
4. Click **Deploy → New deployment**
5. Click the gear icon next to "Select type" and choose **Web app**
6. Set these options:
   - **Description:** "Carousel data endpoint"
   - **Execute as:** Me
   - **Who has access:** Anyone
7. Click **Deploy**
8. **Copy the Web App URL** — it will look like:
   ```
   https://script.google.com/macros/s/AKfycbx.../exec
   ```
9. You may need to authorize the script to access your spreadsheet

### Testing the endpoint

Paste the Web App URL directly into your browser. You should see JSON like:
```json
[
  {
    "image": "https://cdn.example.com/slide1.jpg",
    "link": "https://yoursite.com/specials",
    "alt": "Summer Sale Banner"
  },
  ...
]
```

If you see this, the endpoint is working.

---

## Step 3: Configure the Carousel

Open `carousel-gsheets.html` and update the CONFIG section:

```javascript
var CONFIG = {
  SHEET_JSON_URL: "https://script.google.com/macros/s/AKfycbx.../exec",  // ← your URL here
  AUTO_ROTATE_MS: 5000,   // 5 seconds between slides
  PAUSE_ON_HOVER: true
};
```

---

## Step 4: Paste into Dealer.com

1. Log in to **Dealer.com Control Center**
2. Navigate to the page where you want the carousel
3. Open the **RAW HTML Editor** for the target widget area
4. Paste the **entire contents** of `carousel-gsheets.html`
5. Save and preview

---

## Updating Slides

To add, remove, or reorder slides:

1. Open your Google Sheet
2. Edit the rows (add new rows, delete old ones, reorder)
3. That's it — changes appear on the Dealer.com site on the next page load

No code changes. No redeployment. Just edit the spreadsheet.

**Note:** Google Apps Script caches responses briefly (~1-5 minutes).
If you need changes to appear instantly during testing, add a cache-buster
parameter to the URL: `?t=` + `Date.now()` (already handled in the script).

---

## Optional: Helper Menu

After deploying the Apps Script, your Google Sheet will have a
**Carousel** menu with three utilities:

- **Validate All Entries** — Checks that image URLs look valid,
  highlights bad rows in red
- **Count Active Slides** — Shows how many slides are configured
- **Test JSON Output** — Opens a dialog showing the exact JSON
  the carousel will receive

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Carousel error: HTTP 401" | Apps Script not deployed as "Anyone" | Redeploy with "Who has access" = Anyone |
| "Carousel error: Failed to fetch" | URL incorrect or not deployed | Verify you copied the full /exec URL |
| "No slides found" | Sheet is empty or only has header | Add data rows starting on row 2 |
| Images not loading | Image URLs not publicly accessible | Ensure images are hosted on a public CDN |
| Stale data after sheet edit | Google's response cache | Wait 1-5 minutes, or hard-refresh the page |
| "Carousel error: [object]" | Apps Script threw an error | Open Apps Script → Executions to see the log |

---

## Redeploying After Script Changes

If you edit the Apps Script code itself (not the spreadsheet data):

1. Go to **Deploy → Manage deployments**
2. Click the pencil icon on your active deployment
3. Change **Version** to "New version"
4. Click **Deploy**

The URL stays the same — no changes needed on the Dealer.com side.
