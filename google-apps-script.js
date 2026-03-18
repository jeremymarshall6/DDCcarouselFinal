/**
 * ============================================================
 * Google Apps Script: Carousel Slide Data API
 * ============================================================
 *
 * PURPOSE:
 * Serves your Google Sheet as a JSON API that the Dealer.com
 * carousel can fetch directly — no CORS proxy needed.
 *
 * GOOGLE SHEET FORMAT:
 * ┌─────────────────────────────────────────┬──────────────────────────────────┬─────────────────────┐
 * │ Column A                                │ Column B                         │ Column C            │
 * │ Image URL                               │ Link URL                         │ Alt Text            │
 * ├─────────────────────────────────────────┼──────────────────────────────────┼─────────────────────┤
 * │ https://cdn.example.com/slide1.jpg      │ https://yoursite.com/specials    │ Summer Sale Banner  │
 * │ https://cdn.example.com/slide2.jpg      │ https://yoursite.com/inventory   │ New Inventory       │
 * │ https://cdn.example.com/slide3.jpg      │ https://yoursite.com/service     │ Service Department  │
 * └─────────────────────────────────────────┴──────────────────────────────────┴─────────────────────┘
 *
 * Row 1 = Header row (skipped automatically)
 * Column A = Full image URL (must be publicly accessible)
 * Column B = Click-through destination URL
 * Column C = Alt text for accessibility
 *
 * SETUP STEPS:
 * 1. Create a new Google Sheet with the format above
 * 2. Open Extensions → Apps Script
 * 3. Paste this entire script, replacing any default code
 * 4. Click Deploy → New deployment
 * 5. Type = "Web app"
 * 6. Set "Execute as" = Me
 * 7. Set "Who has access" = Anyone
 * 8. Click Deploy and copy the Web App URL
 * 9. Paste that URL into SHEET_JSON_URL in the carousel HTML
 *
 * ============================================================
 */

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();
    var slides = [];

    // Skip header row (row 0), process all data rows
    for (var i = 1; i < data.length; i++) {
      var imageUrl = String(data[i][0] || '').trim();
      var linkUrl  = String(data[i][1] || '').trim();
      var altText  = String(data[i][2] || '').trim();

      // Only include rows that have at least an image URL
      if (imageUrl && imageUrl.length > 0) {
        slides.push({
          image: imageUrl,
          link:  linkUrl || '#',
          alt:   altText || 'Slide image'
        });
      }
    }

    var output = ContentService.createTextOutput(JSON.stringify(slides));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;

  } catch (error) {
    var errorOutput = ContentService.createTextOutput(
      JSON.stringify({ error: error.message })
    );
    errorOutput.setMimeType(ContentService.MimeType.JSON);
    return errorOutput;
  }
}

/**
 * Optional: Adds a helper menu to your Google Sheet.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Carousel')
    .addItem('Validate All Entries', 'validateEntries')
    .addItem('Count Active Slides', 'countSlides')
    .addItem('Test JSON Output', 'testJsonOutput')
    .addToUi();
}

/**
 * Validates that image URLs look correct.
 * Highlights invalid rows in red.
 */
function validateEntries() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var issues = 0;

  for (var i = 1; i < data.length; i++) {
    var imageUrl = String(data[i][0] || '').trim();
    var row = sheet.getRange(i + 1, 1, 1, 3);

    if (!imageUrl) {
      // Empty row — skip
      row.setBackground(null);
      continue;
    }

    if (!imageUrl.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i) &&
        !imageUrl.match(/^https?:\/\/.+/i)) {
      row.setBackground('#fce4e4');
      issues++;
    } else {
      row.setBackground(null);
    }
  }

  SpreadsheetApp.getUi().alert(
    issues === 0
      ? 'All entries look valid!'
      : issues + ' row(s) may have invalid image URLs (highlighted in red).'
  );
}

/**
 * Counts active (non-empty) slide entries.
 */
function countSlides() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var count = 0;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0] || '').trim().length > 0) count++;
  }

  SpreadsheetApp.getUi().alert('Active slides: ' + count);
}

/**
 * Opens the JSON output in a dialog for testing.
 */
function testJsonOutput() {
  var response = doGet();
  var json = response.getContent();
  var parsed = JSON.parse(json);
  var pretty = JSON.stringify(parsed, null, 2);

  var html = HtmlService.createHtmlOutput(
    '<pre style="font-size:12px;max-height:400px;overflow:auto">' + pretty + '</pre>'
  ).setWidth(500).setHeight(450);

  SpreadsheetApp.getUi().showModalDialog(html, 'Carousel JSON Output (' + parsed.length + ' slides)');
}
