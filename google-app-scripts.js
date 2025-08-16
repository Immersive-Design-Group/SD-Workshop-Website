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
  - /exec?action=get_booking_details&id=BOOKING_ID                  (get specific booking details)
  - /exec?action=send_otp&email=EMAIL&id=BOOKING_ID                (send OTP for deletion)
*/
function doGet(e) {
  const action = (e.parameter.action || '').toLowerCase();
  if (action === 'list_bookings') return listBookings(e);
  if (action === 'get_booking_details') return getBookingDetails(e);
  if (action === 'send_otp') return sendOTP(e);
  return out({ ok: true, msg: 'webapp alive' });
}

function listBookings(e) {
  try {
    const fromISO = (e.parameter.from || '').trim();
    const toISO   = (e.parameter.to   || '').trim();
    const dateISO = (e.parameter.date || '').trim();

    console.log(`listBookings called with: from=${fromISO}, to=${toISO}, date=${dateISO}`);

    // Handle single date query
    if (dateISO) {
      const date = new Date(dateISO);
      if (!isNaN(date)) {
        return listBookingsForDateRange(date, date);
      }
    }

    // Handle date range query
    if (fromISO && toISO) {
      const from = new Date(fromISO);
      const to = new Date(toISO);
      if (!isNaN(from) && !isNaN(to)) {
        return listBookingsForDateRange(from, to);
      }
    }

    // Default: return bookings for a reasonable range around today
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30);
    const to = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 180);
    
    console.log(`Using default range: ${from.toISOString()} to ${to.toISOString()}`);
    return listBookingsForDateRange(from, to);
    
  } catch (error) {
    console.error('Error in listBookings:', error);
    return out({ ok: false, error: 'Failed to retrieve bookings: ' + error.message });
  }
}

function listBookingsForDateRange(fromDate, toDate) {
  try {
    console.log(`listBookingsForDateRange: ${fromDate.toISOString()} to ${toDate.toISOString()}`);
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(SHEET_NAME);
    
    if (!sh || sh.getLastRow() < 2) {
      console.log('No sheet or no data rows found');
      return out({ ok: true, bookings: [] });
    }

    const data = sh.getDataRange().getValues();
    const header = data[0];
    const col = Object.fromEntries(header.map((h, i) => [h, i]));

    console.log('Sheet headers:', header);
    console.log('Column mapping:', col);

    // Validate required columns exist
    const requiredCols = ['Date', 'Equipment', 'Start Time', 'End Time', 'Name', 'Purpose', 'Status'];
    for (const reqCol of requiredCols) {
      if (!(reqCol in col)) {
        console.warn(`Missing column: ${reqCol}`);
      }
    }

    const result = [];
    
    for (let r = 1; r < data.length; r++) {
      const row = data[r];
      
      // Skip cancelled bookings
      const status = String(row[col['Status']] || '').trim().toLowerCase();
      if (status === 'cancelled') {
        console.log(`Skipping cancelled booking at row ${r + 1}`);
        continue;
      }

      // Get and validate date
      const dateValue = row[col['Date']];
      let bookingDate;
      
      if (dateValue instanceof Date) {
        bookingDate = dateValue;
      } else {
        const dateStr = String(dateValue || '').trim();
        if (!dateStr) {
          console.log(`Skipping row ${r + 1} - no date`);
          continue;
        }
        bookingDate = new Date(dateStr);
      }
      
      if (isNaN(bookingDate)) {
        console.log(`Skipping row ${r + 1} - invalid date: ${dateValue}`);
        continue;
      }
      
      // Normalize date to remove time component for comparison
      const normalizedBookingDate = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate());
      const normalizedFromDate = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
      const normalizedToDate = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
      
      // Check if booking date is within range
      if (normalizedBookingDate < normalizedFromDate || normalizedBookingDate > normalizedToDate) {
        continue;
      }

      // Format date as YYYY-MM-DD for consistency with frontend
      const formattedDate = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}-${String(bookingDate.getDate()).padStart(2, '0')}`;

      const booking = {
        device: String(row[col['Equipment']] || '').trim(),
        date: formattedDate,
        start: String(row[col['Start Time']] || '').trim(),
        end: String(row[col['End Time']] || '').trim(),
        name: String(row[col['Name']] || '').trim(),
        purpose: String(row[col['Purpose']] || '').trim(),
        id: String(row[col['Booking ID']] || '').trim(),
        email: String(row[col['Email']] || '').trim()
      };

      // Only include bookings with valid required data
      if (booking.device && booking.start && booking.end && booking.name) {
        result.push(booking);
        console.log(`Added booking: ${JSON.stringify(booking)}`);
      } else {
        console.log(`Skipping incomplete booking at row ${r + 1}:`, booking);
      }
    }

    console.log(`Returning ${result.length} bookings for date range ${fromDate.toISOString().split('T')[0]} to ${toDate.toISOString().split('T')[0]}`);
    console.log('Final result:', result);
    
    return out({ ok: true, bookings: result });
    
  } catch (error) {
    console.error('Error in listBookingsForDateRange:', error);
    return out({ ok: false, error: 'Database error: ' + error.message });
  }
}

/***** GET: get booking details *****/
function getBookingDetails(e) {
  try {
    const bookingId = (e.parameter.id || '').trim();
    if (!bookingId) {
      return out({ ok: false, error: 'Booking ID is required.' });
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(SHEET_NAME);
    
    if (!sh || sh.getLastRow() < 2) {
      return out({ ok: false, error: 'No data found.' });
    }

    const data = sh.getDataRange().getValues();
    const header = data[0];
    const col = Object.fromEntries(header.map((h, i) => [h, i]));

    // Find the booking by ID
    let booking = null;
    for (let r = 1; r < data.length; r++) {
      const row = data[r];
      const rowId = String(row[col['Booking ID']] || '').trim();
      if (rowId === bookingId) {
        const status = String(row[col['Status']] || '').trim().toLowerCase();
        if (status === 'cancelled') {
          return out({ ok: false, error: 'This booking has been cancelled.' });
        }
        
        booking = {
          id: rowId,
          name: String(row[col['Name']] || '').trim(),
          email: String(row[col['Email']] || '').trim(),
          purpose: String(row[col['Purpose']] || '').trim(),
          device: String(row[col['Equipment']] || '').trim(),
          model: String(row[col['Model']] || '').trim(),
          date: String(row[col['Date']] || '').trim(),
          start: String(row[col['Start Time']] || '').trim(),
          end: String(row[col['End Time']] || '').trim(),
          totalHours: parseFloat(row[col['Total Hours']] || 0),
          createdDate: row[col['Created Date']] instanceof Date ? 
            row[col['Created Date']].toISOString().split('T')[0] : 
            String(row[col['Created Date']] || '')
        };
        break;
      }
    }

    if (!booking) {
      return out({ ok: false, error: 'Booking not found.' });
    }

    return out({ ok: true, booking: booking });
    
  } catch (error) {
    console.error('Error in getBookingDetails:', error);
    return out({ ok: false, error: 'Failed to retrieve booking details: ' + error.message });
  }
}

/***** GET: send OTP for deletion *****/
function sendOTP(e) {
  try {
    const email = (e.parameter.email || '').trim();
    const bookingId = (e.parameter.id || '').trim();
    
    if (!email || !bookingId) {
      return out({ ok: false, error: 'Email and booking ID are required.' });
    }

    // Validate email domain
    const allowedDomains = ['@mail.sustech.edu.cn', '@sustech.edu.cn'];
    const isValidEmail = allowedDomains.some(domain => email.endsWith(domain));
    if (!isValidEmail) {
      return out({ ok: false, error: 'Invalid email domain.' });
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(SHEET_NAME);
    
    if (!sh || sh.getLastRow() < 2) {
      return out({ ok: false, error: 'No data found.' });
    }

    const data = sh.getDataRange().getValues();
    const header = data[0];
    const col = Object.fromEntries(header.map((h, i) => [h, i]));

    // Find the booking and verify email matches
    let bookingRow = -1;
    let booking = null;
    
    for (let r = 1; r < data.length; r++) {
      const row = data[r];
      const rowId = String(row[col['Booking ID']] || '').trim();
      const rowEmail = String(row[col['Email']] || '').trim();
      
      if (rowId === bookingId) {
        if (rowEmail !== email) {
          return out({ ok: false, error: 'Email does not match this booking.' });
        }
        
        const status = String(row[col['Status']] || '').trim().toLowerCase();
        if (status === 'cancelled') {
          return out({ ok: false, error: 'This booking has been cancelled.' });
        }
        
        bookingRow = r;
        booking = {
          id: rowId,
          name: String(row[col['Name']] || '').trim(),
          device: String(row[col['Equipment']] || '').trim(),
          date: String(row[col['Date']] || '').trim(),
          start: String(row[col['Start Time']] || '').trim(),
          end: String(row[col['End Time']] || '').trim()
        };
        break;
      }
    }

    if (!booking) {
      return out({ ok: false, error: 'Booking not found.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Update the spreadsheet with OTP and expiry
    sh.getRange(bookingRow + 1, col['OTP'] + 1).setValue(otp);
    sh.getRange(bookingRow + 1, col['OTP Expiry'] + 1).setValue(otpExpiry);

    // Send OTP email
    try {
      MailApp.sendEmail({
        to: email,
        subject: 'SD-Workshop: OTP for Booking Deletion',
        name: 'SD-Workshop Team',
        body:
`Hi ${booking.name},

You requested to delete your booking for ${booking.device} on ${booking.date} from ${booking.start} to ${booking.end}.

Your OTP is: ${otp}

This OTP will expire in 10 minutes.

If you didn't request this, please ignore this email.

Regards,
SD-Workshop Team`,
        htmlBody: `
          <p>Hi ${booking.name},</p>
          <p>You requested to delete your booking for <b>${booking.device}</b> on <b>${booking.date}</b> from <b>${booking.start}</b> to <b>${booking.end}</b>.</p>
          <p><strong>Your OTP is: <span style="font-size: 24px; color: #2563eb; font-family: monospace;">${otp}</span></strong></p>
          <p><em>This OTP will expire in 10 minutes.</em></p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Regards,<br>SD-Workshop Team</p>
        `
      });
      console.log('OTP email sent successfully');
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      return out({ ok: false, error: 'Failed to send OTP email. Please try again.' });
    }

    return out({ ok: true, msg: 'OTP sent successfully.' });
    
  } catch (error) {
    console.error('Error in sendOTP:', error);
    return out({ ok: false, error: 'Failed to send OTP: ' + error.message });
  }
}

/***** Handle URL-ENCODED POST from your site *****/
function doPost(e) {
  try {
    console.log('doPost called with parameters:', e.parameter);
    
    const p = e.parameter || {};
    const action = (p.action || '').toLowerCase();

    // Handle different actions
    if (action === 'create_booking') {
      return createBooking(p);
    } else if (action === 'delete_booking') {
      return deleteBooking(p);
    } else {
      return out({ ok: false, error: 'Invalid action. Supported actions: create_booking, delete_booking' });
    }

  } catch (err) {
    console.error('Error in doPost:', err);
    return out({ ok: false, error: 'Internal error: ' + err.message });
  }
}

function createBooking(p) {
  try {
    const name     = (p.name || '').trim();
    const email    = (p.email || '').trim();
    const purpose  = (p.purpose || '').trim();
    const training = (p.training === 'true' || p.training === 'on');

    if (!name || !email || !purpose || !training) {
      return out({ ok:false, error:'Missing required fields (name, email, purpose, training).' });
    }

    // Validate email domain
    const allowedDomains = ['@mail.sustech.edu.cn', '@sustech.edu.cn'];
    const isValidEmail = allowedDomains.some(domain => email.endsWith(domain));
    if (!isValidEmail) {
      return out({ ok:false, error:'Email must end with @mail.sustech.edu.cn or @sustech.edu.cn' });
    }

    // slots is a JSON string from the client: [{device,date,start,end}, ...]
    let slots = [];
    try { 
      slots = JSON.parse(p.slots || '[]'); 
    } catch (parseError) {
      console.error('JSON parse error for slots:', parseError);
      return out({ ok:false, error:'Invalid slots data format.' });
    }
    
    if (!Array.isArray(slots) || slots.length === 0) {
      return out({ ok:false, error:'No slots provided.' });
    }

    console.log('Parsed slots:', slots);

    // Validate slot data
    for (const slot of slots) {
      if (!slot.device || !slot.date || !slot.start || !slot.end) {
        console.error('Invalid slot:', slot);
        return out({ ok:false, error:'Invalid slot data: missing required fields.' });
      }
    }

    // Derive summary from selected slots
    const device = (slots[0].device || '').trim();
    const model  = ''; // not sent by your UI (leave blank or map later)
    const date   = (slots[0].date || '').trim(); // YYYY-MM-DD

    const start = slots.map(s => s.start).sort()[0];
    const end   = slots.map(s => s.end).sort().slice(-1)[0];
    const totalSlots = slots.length;
    const totalHours = (totalSlots * 30) / 60;

    console.log(`Booking summary: ${device} on ${date} from ${start} to ${end} (${totalHours}h)`);

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

    console.log('Checking for conflicts...');
    for (let r = 1; r < data.length; r++) {
      const row = data[r];
      const rowStatus = String(row[col['Status']] || '').trim().toLowerCase();
      if (rowStatus === 'cancelled') continue;
      
      const rowDevice = String(row[col['Equipment']] || '').trim();
      if (rowDevice !== device) continue;
      
      const rowDateValue = row[col['Date']];
      let rowDate;
      if (rowDateValue instanceof Date) {
        rowDate = `${rowDateValue.getFullYear()}-${String(rowDateValue.getMonth() + 1).padStart(2, '0')}-${String(rowDateValue.getDate()).padStart(2, '0')}`;
      } else {
        rowDate = String(rowDateValue || '').trim();
      }
      if (rowDate !== date) continue;
      
      const exS = t2m(String(row[col['Start Time']] || ''));
      const exE = t2m(String(row[col['End Time']] || ''));
      if (overlaps(exS, exE, newS, newE)) {
        console.log(`Conflict detected with existing booking: ${rowDevice} on ${rowDate} from ${row[col['Start Time']]} to ${row[col['End Time']]}`);
        return out({ ok:false, error:'Time slot conflict. Please choose another time.' });
      }
    }

    // Save booking
    const bookingId = nextBookingId();
    const newRow = [
      bookingId, new Date(), name, email, purpose,
      device, model, date, start, end,
      totalSlots, totalHours, 'CONFIRMED', '', '', '', '',
      JSON.stringify(slots)
    ];
    
    console.log('Saving new booking row:', newRow);
    sh.appendRow(newRow);

    // Email – user (single, clean)
    try {
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
      console.log('User email sent successfully');
    } catch (emailError) {
      console.warn('Failed to send user email:', emailError);
      // Continue even if email fails
    }

    // Optional: email admin
    if (ADMIN_EMAIL) {
      try {
        MailApp.sendEmail({
          to: ADMIN_EMAIL,
          subject: `New booking – ${device} ${date} ${start}-${end}`,
          htmlBody: `<p>${name} (${email}) booked <b>${device}</b> on ${date} ${start}-${end}.<br>ID: <code>${bookingId}</code></p>`
        });
        console.log('Admin email sent successfully');
      } catch (adminEmailError) {
        console.warn('Failed to send admin email:', adminEmailError);
        // Continue even if admin email fails
      }
    }

    console.log(`Booking created successfully: ${bookingId}`);
    return out({ ok:true, booking_id: bookingId });

  } catch (err) {
    console.error('Error in createBooking:', err);
    return out({ ok:false, error: 'Internal error: ' + err.message });
  }
}

function deleteBooking(p) {
  try {
    const email = (p.email || '').trim();
    const bookingId = (p.id || '').trim();
    const otp = (p.otp || '').trim();

    if (!email || !bookingId || !otp) {
      return out({ ok: false, error: 'Email, booking ID, and OTP are required for deletion.' });
    }

    // Validate email domain
    const allowedDomains = ['@mail.sustech.edu.cn', '@sustech.edu.cn'];
    const isValidEmail = allowedDomains.some(domain => email.endsWith(domain));
    if (!isValidEmail) {
      return out({ ok: false, error: 'Invalid email domain.' });
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(SHEET_NAME);
    
    if (!sh || sh.getLastRow() < 2) {
      return out({ ok: false, error: 'No data found.' });
    }

    const data = sh.getDataRange().getValues();
    const header = data[0];
    const col = Object.fromEntries(header.map((h, i) => [h, i]));

    // Find the booking and verify email matches
    let bookingRow = -1;
    let booking = null;
    
    for (let r = 1; r < data.length; r++) {
      const row = data[r];
      const rowId = String(row[col['Booking ID']] || '').trim();
      const rowEmail = String(row[col['Email']] || '').trim();
      const rowOTP = String(row[col['OTP']] || '').trim();
      const rowOTPExpiry = row[col['OTP Expiry']];

      if (rowId === bookingId) {
        if (rowEmail !== email) {
          return out({ ok: false, error: 'Email does not match this booking.' });
        }
        
        const status = String(row[col['Status']] || '').trim().toLowerCase();
        if (status === 'cancelled') {
          return out({ ok: false, error: 'This booking has already been cancelled.' });
        }

        if (rowOTP !== otp) {
          return out({ ok: false, error: 'Invalid OTP.' });
        }

        if (rowOTPExpiry < new Date()) {
          return out({ ok: false, error: 'OTP has expired.' });
        }
        
        bookingRow = r;
        booking = {
          id: rowId,
          name: String(row[col['Name']] || '').trim(),
          device: String(row[col['Equipment']] || '').trim(),
          date: String(row[col['Date']] || '').trim(),
          start: String(row[col['Start Time']] || '').trim(),
          end: String(row[col['End Time']] || '').trim()
        };
        break;
      }
    }

    if (!booking) {
      return out({ ok: false, error: 'Booking not found.' });
    }

    // Mark booking as cancelled
    sh.getRange(bookingRow + 1, col['Status'] + 1).setValue('CANCELLED');
    sh.getRange(bookingRow + 1, col['Cancelled Date'] + 1).setValue(new Date());
    sh.getRange(bookingRow + 1, col['Cancellation Reason'] + 1).setValue('User requested deletion');

    // Email – user (single, clean)
    try {
      MailApp.sendEmail({
        to: email,
        subject: 'SD-Workshop Booking Deleted',
        name: 'SD-Workshop Team',
        body:
`Hi ${booking.name},

Your booking for ${booking.device} on ${booking.date} from ${booking.start} to ${booking.end} has been cancelled.

Regards,
SD-Workshop Team`,
        htmlBody: `
          <p>Hi ${booking.name},</p>
          <p>Your booking for <b>${booking.device}</b> on <b>${booking.date}</b> from <b>${booking.start}</b> to <b>${booking.end}</b> has been cancelled.</p>
          <p>Regards,<br>SD-Workshop Team</p>
        `
      });
      console.log('User deletion email sent successfully');
    } catch (emailError) {
      console.warn('Failed to send user deletion email:', emailError);
      // Continue even if email fails
    }

    // Optional: email admin
    if (ADMIN_EMAIL) {
      try {
        MailApp.sendEmail({
          to: ADMIN_EMAIL,
          subject: `Booking Cancelled – ${booking.device} ${booking.date} ${booking.start}-${booking.end}`,
          htmlBody: `<p>${booking.name} (${email}) cancelled booking for <b>${booking.device}</b> on ${booking.date} ${booking.start}-${booking.end}.<br>ID: <code>${booking.id}</code></p>`
        });
        console.log('Admin deletion email sent successfully');
      } catch (adminEmailError) {
        console.warn('Failed to send admin deletion email:', adminEmailError);
        // Continue even if admin email fails
      }
    }

    console.log(`Booking deleted successfully: ${booking.id}`);
    return out({ ok: true, msg: 'Booking deleted successfully.' });

  } catch (err) {
    console.error('Error in deleteBooking:', err);
    return out({ ok: false, error: 'Internal error: ' + err.message });
  }
}