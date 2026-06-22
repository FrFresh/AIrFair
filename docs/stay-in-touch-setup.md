# Stay in Touch → Google Sheet setup

The signup form POSTs `{ name, email }` to a Google Apps Script Web App, which
appends a row to your sheet. One-time setup (~3 min):

## 1. Create the sheet
1. Make a new Google Sheet (e.g. "Air Fair — Signups").
2. In row 1, add headers: `Timestamp`, `Name`, `Email`.

## 2. Add the Apps Script
1. In the sheet: **Extensions → Apps Script**.
2. Delete any boilerplate and paste:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    var data = JSON.parse(e.postData.contents);
    sheet.appendRow([new Date(), data.name || '', data.email || '']);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. **Save**.

## 3. Deploy as a Web App
1. **Deploy → New deployment** → type **Web app**.
2. **Execute as:** Me. **Who has access:** **Anyone**.
3. **Deploy**, authorize when prompted, and copy the **Web app URL**
   (ends in `/exec`).

## 4. Wire it into the app
Create `/Users/fresh/AIrFair/.env.local` (already gitignored) with:

```
VITE_SHEET_ENDPOINT=https://script.google.com/macros/s/XXXXX/exec
```

Restart `npm run dev`, submit the form, and confirm a new row appears in the
sheet. For production, add the same `VITE_SHEET_ENDPOINT` variable in the
Vercel project settings (Settings → Environment Variables) before deploying.

> Note: the browser sends the request with `mode: 'no-cors'` (Apps Script
> doesn't return CORS headers), so the form can't read the response — it
> optimistically shows "Thanks." Verify writes by checking the sheet.
