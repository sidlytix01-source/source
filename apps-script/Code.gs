/**
 * Sidlytix website enquiry form -> Google Sheets + email notification.
 *
 * SETUP
 * 1. Open your Leads spreadsheet > Extensions > Apps Script, and paste this file.
 *    (Bound to the sheet = leave SHEET_ID empty. If the script is standalone,
 *    paste the sheet's ID from its URL into SHEET_ID.)
 * 2. Deploy > Manage deployments > Edit (pencil) > Version: "New version" > Deploy.
 *    Execute as: Me. Who has access: Anyone.
 *    IMPORTANT: every time you change this code you must deploy a NEW VERSION,
 *    otherwise the old code keeps running.
 * 3. The web app URL must match `scriptURL` in index.html.
 * 4. Test: open the web app URL in a browser - it should say "Sidlytix enquiry endpoint is running."
 */

const SHEET_ID = "";               // empty = use the spreadsheet this script is bound to
const SHEET_NAME = "Leads";
const ERROR_SHEET_NAME = "Errors";
const NOTIFY_EMAIL = "hello@sidlytix.com";

const MIN_FILL_MS = 3000;          // forms filled faster than this are treated as bots
const RATE_LIMIT_SECONDS = 60;     // one enquiry per email address per minute

const HEADERS = ["Timestamp", "Name", "Email", "Phone", "Country", "Industry", "Interested in", "Message", "Page"];

/** Health check: open the web app URL in a browser to confirm it is deployed. */
function doGet() {
  return ContentService.createTextOutput("Sidlytix enquiry endpoint is running.");
}

function doPost(e) {
  let data = {};

  try {
    data = JSON.parse((e && e.postData && e.postData.contents) || "{}");
  } catch (err) {
    return reply_(false, "bad_request");
  }

  // --- Spam checks. Bots get a fake "ok" so they learn nothing. ---
  if (data.website) return reply_(true);                         // honeypot was filled
  if (!(Number(data.elapsed) >= MIN_FILL_MS)) return reply_(true); // submitted too fast

  // --- Validation ---
  const name = line_(data.name, 120);
  const email = line_(data.email, 200).toLowerCase();
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return reply_(false, "invalid");
  }

  // --- Rate limit: same email within RATE_LIMIT_SECONDS is ignored ---
  const cache = CacheService.getScriptCache();
  const rateKey = "rl_" + Utilities.base64EncodeWebSafe(email).slice(0, 200);
  if (cache.get(rateKey)) return reply_(true);

  const row = [
    new Date(),
    safe_(name),
    safe_(email),
    safe_(line_(data.phone, 40)),
    safe_(line_(data.country, 80)),
    safe_(line_(data.industry, 80)),
    safe_(line_(data.service, 120)),
    safe_(text_(data.message, 4000)),
    safe_(line_(data.page, 200)),
  ];

  // --- Save the lead (this is the part that must never fail silently) ---
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const sheet = getSheet_(SHEET_NAME, HEADERS);
    sheet.appendRow(row);
  } catch (err) {
    logError_("save", err, data);
    return reply_(false, "save_failed");
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }

  cache.put(rateKey, "1", RATE_LIMIT_SECONDS);

  // --- Notify by email. The lead is already saved, so a mail error is only logged. ---
  try {
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      replyTo: email,          // press Reply in Gmail to answer the visitor directly
      name: "Sidlytix website",
      subject: `New enquiry: ${name} (${line_(data.industry, 80) || "No industry"}, ${line_(data.country, 80) || "No country"})`,
      body: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${line_(data.phone, 40) || "-"}`,
        `Country: ${line_(data.country, 80) || "-"}`,
        `Industry: ${line_(data.industry, 80) || "-"}`,
        `Interested in: ${line_(data.service, 120) || "-"}`,
        `Page: ${line_(data.page, 200) || "-"}`,
        "",
        "Message:",
        text_(data.message, 4000) || "-",
      ].join("\n"),
    });
  } catch (err) {
    logError_("email", err, data);
  }

  return reply_(true);
}

/* ---------------- helpers ---------------- */

function reply_(ok, error) {
  const body = ok ? { ok: true } : { ok: false, error: error || "error" };
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}

function getSpreadsheet_() {
  return SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet_(name, headers) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  }
  return sheet;
}

/** Single-line value: no line breaks or control characters, trimmed, length-limited. */
function line_(v, max) {
  return String(v == null ? "" : v)
    .replace(/[\u0000-\u001F\u007F]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** Multi-line value: keeps line breaks, removes other control characters. */
function text_(v, max) {
  return String(v == null ? "" : v)
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

/** Stop values like "=IMPORTXML(...)" being run as formulas in the sheet. */
function safe_(v) {
  return /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
}

function logError_(stage, err, data) {
  console.error(stage, err && err.stack ? err.stack : err);
  try {
    const sheet = getSheet_(ERROR_SHEET_NAME, ["Timestamp", "Stage", "Error", "Submitted data"]);
    sheet.appendRow([new Date(), stage, String(err && err.message ? err.message : err), safe_(JSON.stringify(data || {}).slice(0, 2000))]);
  } catch (_) {
    // Nothing else we can do; the console log above is still in Executions.
  }
}
