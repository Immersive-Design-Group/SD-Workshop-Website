# Past Booking Deletion Debug Guide

## 🔍 **Issue: Past Bookings Can Be Deleted**

The past booking restriction isn't working properly. Let me help you debug this.

## 🧪 **Debug Steps**

### **Step 1: Test Frontend Past Booking Detection**

Open browser console and test with a past booking:

```javascript
// Check if past booking detection works
console.log('Testing past booking detection...');
console.log('selectedDate:', selectedDate);
console.log('timeline:', timeline);
console.log('currentBooking:', currentBooking);

// Test the isBookingInPast function
if (currentBooking) {
  console.log('isBookingInPast result:', isBookingInPast(currentBooking));
}
```

### **Step 2: Test Backend Past Booking Check**

Test the backend API directly:

```bash
# Test with a past booking ID
curl -X POST https://your-function-url/api/delete-booking \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@email.com",
    "id": "past-booking-id",
    "otp": "123456"
  }'
```

**Expected Response for Past Booking:**
```json
{
  "error": "Past bookings cannot be deleted"
}
```

### **Step 3: Check Console Logs**

Look for these log messages:

**Frontend Logs:**
```
isBookingInPast called with: [booking object]
selectedDate: [date]
booking.startSlot: [slot number]
startTime from timeline: [time]
bookingDateTime: [date time]
now: [current date time]
isPast: true/false
```

**Backend Logs:**
```
Admin deletion: Searching for booking with ID: [id]
Admin deletion: Found bookings: 1
```

## 🔧 **Potential Issues**

### **Issue 1: Frontend Detection Not Working**
- `isBookingInPast` function might not be called
- `selectedDate` or `timeline` might be null
- Date comparison might be incorrect

### **Issue 2: Backend Check Bypassed**
- Admin deletion bypasses past booking check
- Regular user deletion should still check

### **Issue 3: Cache Issues**
- Past booking data might be cached
- Fresh data not loaded

## 🛠 **Quick Fixes**

### **Fix 1: Add More Debugging to Frontend**

Add this to the `isBookingInPast` function:

```javascript
function isBookingInPast(booking) {
  console.log('=== PAST BOOKING DEBUG ===');
  console.log('booking:', booking);
  console.log('selectedDate:', selectedDate);
  console.log('timeline:', timeline);
  console.log('booking.startSlot:', booking?.startSlot);
  
  if (!booking || !booking.startSlot || selectedDate === null) {
    console.log('Missing required data, returning false');
    return false;
  }
  
  const startTime = timeline[booking.startSlot];
  console.log('startTime from timeline:', startTime);
  
  if (!startTime) {
    console.log('No startTime found, returning false');
    return false;
  }
  
  const bookingDateTime = new Date(`${fmtISO(selectedDate)} ${startTime}`);
  const now = new Date();
  
  console.log('bookingDateTime:', bookingDateTime);
  console.log('now:', now);
  console.log('bookingDateTime < now:', bookingDateTime < now);
  console.log('=== END DEBUG ===');
  
  return bookingDateTime < now;
}
```

### **Fix 2: Test with Different Scenarios**

1. **Past booking (should be blocked)**
2. **Future booking (should work)**
3. **Current day booking (should work)**

## 📊 **Expected Behavior**

### **Past Booking (Should Be Blocked)**
- Frontend: Shows "Past bookings cannot be deleted" message
- Backend: Returns "Past bookings cannot be deleted" error
- User: Cannot delete past bookings

### **Future Booking (Should Work)**
- Frontend: Shows OTP verification
- Backend: Allows deletion
- User: Can delete future bookings

## 🎯 **Next Steps**

1. **Check console logs** for past booking detection
2. **Test with different booking dates**
3. **Verify backend responses**
4. **Report specific error messages**

Let me know what the console logs show and I can help fix the specific issue!
