/***** CONFIG *****/
const SPREADSHEET_ID = '1SOOKXawQ93WMI-4z2TQ2fwRmeRy2UpiQqCoNh0SvmbI';
const SHEET_NAME     = 'SD-Workshop-Bookings';
const ADMIN_EMAIL    = 'khowaja.ashfaqali1996@gmail.com';

/***** UTILITIES *****/
const out = obj =>
  ContentService.createTextOutput(JSON.stringify(obj))
                .setMimeType(ContentService.MimeType.JSON);

const t2m = t => { const [h, m] = (t||'').split(':').map(Number); return h*60 + m; };
const overlaps = (s1,e1,s2,e2) => s1 < e2 && s2 < e1;

/**
 * Sequential booking ID generator:
 * SD-WS-2025-000000, 000001, ...
 * Uses Script Properties + a lock to avoid race conditions.
 */
function nextBookingId() {
  const PREFIX = 'SD-WS-2025-';      // change the year when you want a new series
  const KEY    = 'SEQ_2025';         // keep in sync with the year above

  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const props = PropertiesService.getScriptProperties();
    let n = parseInt(props.getProperty(KEY) || '0', 10);
    const id = PREFIX + String(n).padStart(6, '0');
    props.setProperty(KEY, String(n + 1));
    return id;
  } finally {
    lock.releaseLock();
  }
}

/***** GET: list bookings  *****/
/*
  Supports:
  - /exec?action=list_bookings&date=YYYY-MM-DD                      (single day)
  - /exec?action=list_bookings&from=YYYY-MM-DD&to=YYYY-MM-DD        (range, inclusive)
  - /exec?action=list_bookings                                      (ALL bookings)
*/
function doGet(e) {
  const action = (e.parameter.action || '').toLowerCase();
  if (action === 'list_bookings') return listBookings(e);
  return out({ ok: true, msg: 'webapp alive' });
}

function listBookings(e) {
  const fromISO = (e.parameter.from || '').trim();
  const toISO   = (e.parameter.to   || '').trim();

  // sensible defaults if not provided
  const today = new Date();
  const from = fromISO ? new Date(fromISO) : new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30);
  const to   = toISO   ? new Date(toISO)   : new Date(today.getFullYear(), today.getMonth(), today.getDate() + 180);

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(SHEET_NAME);
  if (!sh || sh.getLastRow() < 2) return out({ ok: true, bookings: [] });

  const data   = sh.getDataRange().getValues();
  const header = data[0];
  const col = Object.fromEntries(header.map((h, i) => [h, i]));

  const result = [];
  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    if ((row[col['Status']] || '') === 'Cancelled') continue;

    const dateStr = String(row[col['Date']] || '').trim(); // stored as YYYY-MM-DD in your UI
    if (!dateStr) continue;
    const d = new Date(dateStr);
    if (isNaN(d)) continue;
    if (d < from || d > to) continue;

    result.push({
      device:  String(row[col['Equipment']] || ''),
      date:    dateStr,
      start:   String(row[col['Start Time']] || ''),
      end:     String(row[col['End Time']] || ''),
      name:    String(row[col['Name']] || ''),
      purpose: String(row[col['Purpose']] || '')
    });
  }

  return out({ ok: true, bookings: result });
}



/***** Handle URL-ENCODED POST from your site *****/
function doPost(e) {
  try {
    const p = e.parameter || {};

    const name     = (p.name || '').trim();
    const email    = (p.email || '').trim();
    const purpose  = (p.purpose || '').trim();
    const training = (p.training === 'true' || p.training === 'on');

    if (!name || !email || !purpose || !training) {
      return out({ ok:false, error:'Missing required fields (name, email, purpose, training).' });
    }

    // slots is a JSON string from the client: [{device,date,start,end}, ...]
    let slots = [];
    try { slots = JSON.parse(p.slots || '[]'); } catch (_) {}
    if (!Array.isArray(slots) || slots.length === 0) {
      return out({ ok:false, error:'No slots provided.' });
    }

    // Derive summary from selected slots
    const device = (slots[0].device || '').trim();
    const model  = ''; // not sent by your UI (leave blank or map later)
    const date   = (slots[0].date || '').trim(); // YYYY-MM-DD

    const start = slots.map(s => s.start).sort()[0];
    const end   = slots.map(s => s.end).sort().slice(-1)[0];
    const totalSlots = slots.length;
    const totalHours = (totalSlots * 30) / 60;

    // Ensure sheet and header
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sh.getLastRow() === 0) {
      sh.appendRow([
        'Booking ID','Created Date','Name','Email','Purpose',
        'Equipment','Model','Date','Start Time','End Time',
        'Total Slots','Total Hours','Status','Cancelled Date',
        'Cancellation Reason','OTP','OTP Expiry','Slots JSON'
      ]);
    }

    // Conflict check against existing active bookings
    const data   = sh.getDataRange().getValues();
    const header = data[0];
    const col = Object.fromEntries(header.map((h,i)=>[h,i]));
    const newS = t2m(start), newE = t2m(end);

    for (let r = 1; r < data.length; r++) {
      const row = data[r];
      if ((row[col['Status']] || '') === 'Cancelled') continue;
      if ((row[col['Equipment']] || '') !== device)   continue;
      if ((row[col['Date']] || '') !== date)          continue;
      const exS = t2m(row[col['Start Time']]);
      const exE = t2m(row[col['End Time']]);
      if (overlaps(exS, exE, newS, newE)) {
        return out({ ok:false, error:'Time slot conflict. Please choose another time.' });
      }
    }

    // Save
    const bookingId = nextBookingId();
    sh.appendRow([
      bookingId, new Date(), name, email, purpose,
      device, model, date, start, end,
      totalSlots, totalHours, 'CONFIRMED', '', '', '', '',
      JSON.stringify(slots)
    ]);

    // Email — user (single, clean)
    MailApp.sendEmail({
      to: email,
      subject: 'SD-Workshop Booking Confirmed',
      name: 'SD-Workshop Team',
      body:
`Hi ${name},

Your booking is confirmed for ${device} on ${date} from ${start} to ${end} (${totalHours}h).
Purpose: ${purpose}
Booking ID: ${bookingId}

Regards,
SD-Workshop Team`,
      htmlBody: `
        <p>Hi ${name},</p>
        <p>Your booking is <b>confirmed</b> for <b>${device}</b> on <b>${date}</b> from <b>${start}</b> to <b>${end}</b> (${totalHours}h).</p>
        <p><b>Purpose:</b> ${purpose}</p>
        <p><b>Booking ID:</b> <code>${bookingId}</code></p>
        <p>Regards,<br>SD-Workshop Team</p>
      `
    });

    // Optional: email admin
    if (ADMIN_EMAIL) {
      MailApp.sendEmail({
        to: ADMIN_EMAIL,
        subject: `New booking — ${device} ${date} ${start}-${end}`,
        htmlBody: `<p>${name} (${email}) booked <b>${device}</b> on ${date} ${start}-${end}.<br>ID: <code>${bookingId}</code></p>`
      });
    }

    return out({ ok:true, booking_id: bookingId });

  } catch (err) {
    return out({ ok:false, error: 'Internal error: ' + err });
  }
}
