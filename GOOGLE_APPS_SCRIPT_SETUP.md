# Google Apps Script Setup Guide for SD Workshop Booking System

## Overview
This guide will help you set up Google Apps Script to handle equipment bookings, send confirmation emails, and manage data in Google Sheets.

## Step 1: Create Google Sheets Database

1. **Create a new Google Sheet** at [sheets.google.com](https://sheets.google.com)
2. **Name the first sheet** `Bookings`
3. **Copy the Spreadsheet ID** from the URL:
   - URL format: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit`
   - Copy the long string between `/d/` and `/edit`

## Step 2: Set Up Google Apps Script

1. **Go to [script.google.com](https://script.google.com)**
2. **Click "New Project"**
3. **Replace the default code** with the contents of `google-apps-script-code.js`
4. **Update the configuration variables** at the top of the script:
   ```javascript
   const SPREADSHEET_ID = 'YOUR_ACTUAL_SPREADSHEET_ID_HERE';
   const ADMIN_EMAIL = 'your-actual-admin-email@domain.com';
   ```

## Step 3: Deploy as Web App

1. **Click "Deploy" → "New deployment"**
2. **Choose type**: `Web app`
3. **Configure settings**:
   - **Execute as**: `Me` (your Google account)
   - **Who has access**: `Anyone` (for public access)
4. **Click "Deploy"**
5. **Copy the Web App URL** - you'll need this for the next step

## Step 4: Update Your Website

1. **Open `assets/js/reservation.js`**
2. **Find this line**:
   ```javascript
   const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyTry_vI_-_bIOl4vvWUpVZxexfZK-7KFG8uLjMnirTUNfUUCSZJ6bahaTIyCUmT3o_qQ/exec';
   ```
3. **Replace with your actual Web App URL** from Step 3

## Step 5: Test the System

1. **Refresh your website**
2. **Try booking a time slot**
3. **Check your email** for confirmation
4. **Check the Google Sheet** to see the booking data

## Features Included

### ✅ **Automatic Email Confirmation**
- Users receive detailed confirmation emails
- Admin receives notification emails
- Professional HTML email templates

### ✅ **Data Validation**
- Required field checking
- Email format validation
- Booking conflict detection

### ✅ **Google Sheets Integration**
- Automatic data storage
- Unique booking IDs
- Comprehensive booking records

### ✅ **Conflict Prevention**
- Checks for overlapping time slots
- Prevents double-booking
- Only allows one user per time slot

## Data Structure in Google Sheets

The system creates these columns automatically:

| Column | Description | Example |
|--------|-------------|---------|
| A | Booking ID | BK1703123456ABC12 |
| B | Created Date | 2024-01-15 10:30:00 |
| C | Name | John Doe |
| D | Email | john@example.com |
| E | Phone | 123-456-7890 |
| F | Purpose | Prototype testing |
| G | Equipment | 3D Printer 1 |
| H | Model | X1E |
| I | Date | 12月7日 |
| J | Start Time | 10:00 |
| K | End Time | 11:00 |
| L | Total Slots | 2 |
| M | Total Hours | 1 |
| N | Status | Active |
| O | Cancelled Date | (empty) |
| P | Cancellation Reason | (empty) |
| Q | OTP | (empty) |
| R | OTP Expiry | (empty) |
| S | Slot Indices | [0,1] |

## Troubleshooting

### Common Issues:

1. **"Script not found" error**
   - Make sure you copied the Web App URL correctly
   - Check that the script is deployed as a web app

2. **"Spreadsheet not found" error**
   - Verify the Spreadsheet ID is correct
   - Ensure the sheet is shared with your Google account

3. **Emails not sending**
   - Check that you're logged into the correct Google account
   - Verify the admin email address is correct

4. **CORS errors**
   - Make sure the web app is deployed with "Anyone" access
   - Check that the script is published as a web app

### Testing the Script:

1. **In Google Apps Script editor**, run the `testScript()` function
2. **Check the execution log** for any errors
3. **Verify permissions** are granted when prompted

## Security Considerations

- **Web app access**: Set to "Anyone" for public booking access
- **Execute as**: Set to "Me" to use your Google account permissions
- **Spreadsheet sharing**: Only share with necessary admin accounts
- **Email validation**: Built-in email format checking
- **Rate limiting**: Consider adding if you expect high traffic

## Next Steps (Future Features)

Once the basic booking system is working, we can add:

1. **Booking Cancellation** with OTP verification
2. **Admin Dashboard** for managing bookings
3. **Equipment Availability** checking
4. **User Authentication** system
5. **Booking History** for users
6. **Analytics and Reporting**

## Support

If you encounter issues:
1. Check the Google Apps Script execution logs
2. Verify all configuration values are correct
3. Test with the `testScript()` function
4. Check browser console for JavaScript errors

## Example Successful Response

When a booking is successful, the system returns:
```json
{
  "success": true,
  "message": "Booking created successfully",
  "bookingId": "BK1703123456ABC12"
}
```

## Example Error Response

When something goes wrong:
```json
{
  "success": false,
  "error": "Time slot conflict detected. Please choose different time slots."
}
```
