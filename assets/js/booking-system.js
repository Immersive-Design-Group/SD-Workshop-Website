// Booking System JavaScript - Matching Your Design

let bookingData = {
  equipment: [],
  bookings: [],
  selectedDate: '',
  selectedSlot: null,
  selectedBooking: null,
  rules: {},
  subscription: null,
  currentOTPBooking: null
};

// Initialize the booking system
function initializeBookingSystem(equipmentConfig, bookingRules) {
  console.log('Initializing booking system...');
  console.log('Equipment config:', equipmentConfig);
  console.log('Booking rules:', bookingRules);
  
  bookingData.rules = bookingRules;
  
  // Set initial date to today
  const today = new Date();
  bookingData.selectedDate = today.toISOString().split('T')[0];
  
  // Update date display
  updateDateDisplay();
  
  // Set up event listeners
  setupEventListeners();
  
  // Load equipment from config (this should work even without Supabase)
  loadEquipmentFromConfig(equipmentConfig);
  
  // Try to load bookings (this might fail if Supabase isn't configured)
  loadBookings();
  
  // Set up real-time subscription (only if Supabase is available)
  if (typeof SupabaseClient !== 'undefined' && SupabaseClient) {
    setupRealtimeSubscription();
  }
  
  // Update current time indicator
  updateCurrentTimeIndicator();
  setInterval(updateCurrentTimeIndicator, 60000); // Update every minute
}

// Set up event listeners
function setupEventListeners() {
  // Date selection
  const dateButton = document.getElementById('selected-date-display');
  const datePicker = document.getElementById('date-picker');
  
  dateButton.addEventListener('click', function() {
    datePicker.style.display = 'block';
    datePicker.focus();
    datePicker.click();
  });
  
  datePicker.addEventListener('change', function() {
    bookingData.selectedDate = this.value;
    updateDateDisplay();
    loadBookings();
    this.style.display = 'none';
  });
  
  datePicker.addEventListener('blur', function() {
    this.style.display = 'none';
  });
  
  // Set date picker min value
  const today = new Date().toISOString().split('T')[0];
  datePicker.min = today;
  datePicker.value = today;
  
  // Close modals when clicking outside
  window.addEventListener('click', function(event) {
    const modals = ['booking-modal', 'deletion-modal', 'otp-modal'];
    modals.forEach(modalId => {
      const modal = document.getElementById(modalId);
      if (event.target === modal) {
        closeModal(modalId);
      }
    });
  });
}

// Update date display
function updateDateDisplay() {
  const date = new Date(bookingData.selectedDate);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  const dateDisplay = document.getElementById('selected-date-display');
  dateDisplay.textContent = `${month}月${day}日`;
}

// Load equipment from Jekyll configuration
function loadEquipmentFromConfig(equipmentConfig) {
  console.log('Loading equipment from config...');
  bookingData.equipment = [];
  
  // Check if equipmentConfig exists and has data
  if (!equipmentConfig || Object.keys(equipmentConfig).length === 0) {
    console.warn('No equipment configuration found. Creating sample data...');
    // Create sample equipment if no config is provided
    bookingData.equipment = [
      {
        id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
        name: '3D PRINTER 1',
        type: 'X1E',
        description: 'XYZ 3D Printer for prototyping',
        rules: ['Must complete safety training before use', 'Maximum print time 4 hours'],
        max_duration: 30
      },
      {
        id: 'b2c3d4e5-f6g7-8901-2345-678901bcdefg',
        name: '3D PRINTER 2',
        type: 'X1E',
        description: 'XYZ 3D Printer for prototyping',
        rules: ['Must complete safety training before use', 'Maximum print time 4 hours'],
        max_duration: 30
      },
      {
        id: 'c3d4e5f6-g7h8-9012-3456-789012cdefgh',
        name: '3D PRINTER 3',
        type: 'X1E',
        description: 'XYZ 3D Printer for prototyping',
        rules: ['Must complete safety training before use', 'Maximum print time 4 hours'],
        max_duration: 30
      },
      {
        id: 'd4e5f6g7-h8i9-0123-4567-890123defghi',
        name: '3D PRINTER 4',
        type: 'X1E',
        description: 'XYZ 3D Printer for prototyping',
        rules: ['Must complete safety training before use', 'Maximum print time 4 hours'],
        max_duration: 30
      },
      {
        id: 'e5f6g7h8-i9j0-1234-5678-901234efghij',
        name: '3D PRINTER 5',
        type: 'X1E',
        description: 'XYZ 3D Printer for prototyping',
        rules: ['Must complete safety training before use', 'Maximum print time 4 hours'],
        max_duration: 30
      },
      {
        id: 'f6g7h8i9-j0k1-2345-6789-012345fghijk',
        name: 'Laser Cutting Machine',
        type: 'Speed 300',
        description: 'High precision laser cutting machine',
        rules: ['Safety glasses required', 'Material thickness limit 10mm', 'Supervised use only'],
        max_duration: 60
      }
    ];
  } else {
    // Flatten the equipment data from Jekyll
    Object.keys(equipmentConfig).forEach(category => {
      if (Array.isArray(equipmentConfig[category])) {
        equipmentConfig[category].forEach((item, index) => {
          bookingData.equipment.push({
            id: generateId(item.name),
            name: item.name,
            type: item.type,
            description: item.description,
            rules: item.rules || [],
            max_duration: item.max_duration || 30,
            image: item.image || null
          });
        });
      }
    });
  }
  
  console.log('Loaded equipment:', bookingData.equipment);
  renderBookingGrid();
}

// Generate a UUID-like ID for equipment
function generateId(name) {
  // Create a more UUID-like format for equipment IDs
  const cleanName = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  // Generate a simple UUID-like string
  const randomPart = Math.random().toString(36).substr(2, 8);
  return `${cleanName}_${randomPart}`;
}

// Load bookings from database
async function loadBookings() {
  console.log('Loading bookings...');
  
  // Check if Supabase is available
  if (typeof SupabaseClient === 'undefined' || !SupabaseClient) {
    console.warn('Supabase client not available. Using sample bookings...');
    // Create sample bookings for demonstration
    bookingData.bookings = [
      {
        id: 'sample1',
        equipment_id: '3d_printer_1',
        user_name: 'Candy',
        user_email: 'candy@example.com',
        start_time: '10:00:00',
        end_time: '10:30:00',
        booking_date: bookingData.selectedDate,
        status: 'active'
      },
      {
        id: 'sample2',
        equipment_id: '3d_printer_3',
        user_name: 'Candy',
        user_email: 'candy@example.com',
        start_time: '11:00:00',
        end_time: '11:30:00',
        booking_date: bookingData.selectedDate,
        status: 'active'
      }
    ];
    renderBookingGrid();
    return;
  }
  
  showLoading(true);
  
  try {
    const result = await SupabaseClient.getBookings(bookingData.selectedDate);
    
    if (result.success) {
      bookingData.bookings = result.data;
      console.log('Loaded bookings from database:', bookingData.bookings);
    } else {
      console.error('Error loading bookings:', result.error);
      bookingData.bookings = []; // Empty bookings on error
    }
  } catch (error) {
    console.error('Error loading bookings:', error);
    bookingData.bookings = []; // Empty bookings on error
  }
  
  renderBookingGrid();
  showLoading(false);
}

// Generate time slots (9:00 AM to 1:00 PM + more)
function generateTimeSlots() {
  const slots = [];
  
  // Morning slots (9:00 - 13:00)
  for (let hour = 9; hour <= 12; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  slots.push('13:00');
  
  // Afternoon slots (13:30 - 22:00)
  for (let hour = 13; hour <= 21; hour++) {
    if (hour === 13) slots.push('13:30');
    else {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }
  slots.push('22:00');
  
  return slots;
}

// Render the booking grid
function renderBookingGrid() {
  const timeSlots = generateTimeSlots();
  
  // Render time slots header
  renderTimeSlotsHeader(timeSlots);
  
  // Render equipment rows
  renderEquipmentRows(timeSlots);
  
  // Update current time indicator
  updateCurrentTimeIndicator();
}

// Render time slots header
function renderTimeSlotsHeader(timeSlots) {
  const header = document.getElementById('time-slots-header');
  header.innerHTML = '';
  
  timeSlots.forEach(slot => {
    const div = document.createElement('div');
    div.className = 'time-slot-header';
    div.textContent = slot;
    header.appendChild(div);
  });
}

// Render equipment rows
function renderEquipmentRows(timeSlots) {
  const grid = document.getElementById('equipment-grid');
  grid.innerHTML = '';
  
  bookingData.equipment.forEach((equipment, index) => {
    const row = document.createElement('div');
    row.className = 'equipment-row';
    
    // Equipment info
    const equipmentInfo = document.createElement('div');
    equipmentInfo.className = 'equipment-info';
    
    const equipmentImage = document.createElement('div');
    equipmentImage.className = 'equipment-image';
    if (equipment.image) {
      equipmentImage.innerHTML = `<img src="${equipment.image}" alt="${equipment.name}">`;
    } else {
      equipmentImage.textContent = equipment.type;
    }
    
    const equipmentDetails = document.createElement('div');
    equipmentDetails.className = 'equipment-details';
    equipmentDetails.innerHTML = `
      <div class="equipment-name">${equipment.name}</div>
      <div class="equipment-model">${equipment.type}</div>
    `;
    
    equipmentInfo.appendChild(equipmentImage);
    equipmentInfo.appendChild(equipmentDetails);
    row.appendChild(equipmentInfo);
    
    // Time slots
    const timeSlotsRow = document.createElement('div');
    timeSlotsRow.className = 'time-slots-row';
    
    timeSlots.forEach(slot => {
      const slotDiv = document.createElement('div');
      slotDiv.className = 'time-slot';
      
      const booking = getBookingForSlot(equipment.id, slot);
      
      if (booking) {
        slotDiv.className += ' booked';
        slotDiv.innerHTML = `
          <div class="booking-info">
            <div class="booking-user">${booking.user_name}</div>
          </div>
        `;
        slotDiv.onclick = () => showDeletionModal(booking);
      } else {
        slotDiv.className += ' available';
        slotDiv.onclick = () => showBookingModal(equipment, slot);
      }
      
      timeSlotsRow.appendChild(slotDiv);
    });
    
    row.appendChild(timeSlotsRow);
    grid.appendChild(row);
  });
}

// Get booking for specific slot
function getBookingForSlot(equipmentId, timeSlot) {
  return bookingData.bookings.find(booking => 
    booking.equipment_id === equipmentId && 
    booking.start_time === timeSlot + ':00'
  );
}

// Show booking modal
function showBookingModal(equipment, timeSlot) {
  bookingData.selectedSlot = { equipment, timeSlot };
  
  const modal = document.getElementById('booking-modal');
  const title = document.getElementById('modal-equipment-title');
  const dateDisplay = document.getElementById('booking-date-display');
  const startTime = document.getElementById('start-time-display');
  const endTime = document.getElementById('end-time-display');
  
  const endTimeValue = calculateEndTime(timeSlot);
  
  // Update modal content
  title.innerHTML = `${equipment.name}<br><span class="equipment-model">${equipment.type}</span>`;
  
  // Format date as MMDD
  const date = new Date(bookingData.selectedDate);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  dateDisplay.textContent = `${month}${day}`;
  
  startTime.textContent = timeSlot;
  endTime.textContent = endTimeValue;
  
  // Clear form
  document.getElementById('user-name').value = '';
  document.getElementById('user-phone').value = '';
  document.getElementById('user-email').value = '';
  document.getElementById('booking-purpose').value = '';
  document.getElementById('training-accepted').checked = false;
  
  modal.style.display = 'flex';
}

// Show deletion modal
function showDeletionModal(booking) {
  bookingData.selectedBooking = booking;
  
  const modal = document.getElementById('deletion-modal');
  const info = document.getElementById('deletion-equipment-info');
  
  const equipment = bookingData.equipment.find(eq => eq.id === booking.equipment_id);
  
  // Format date and time
  const date = new Date(booking.booking_date);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const startTime = booking.start_time.slice(0, 5);
  const endTime = booking.end_time.slice(0, 5);
  
  info.innerHTML = `
    ${equipment ? equipment.name + ' ' + equipment.type : 'Unknown Equipment'}<br>
    ${month}.${day} ${startTime}-${endTime}
  `;
  
  modal.style.display = 'flex';
}

// Close modal
function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
  
  if (modalId === 'booking-modal') {
    bookingData.selectedSlot = null;
  } else if (modalId === 'deletion-modal') {
    bookingData.selectedBooking = null;
  } else if (modalId === 'otp-modal') {
    bookingData.currentOTPBooking = null;
  }
}

// Individual close functions for onclick events
function closeBookingModal() { closeModal('booking-modal'); }
function closeDeletionModal() { closeModal('deletion-modal'); }
function closeOTPModal() { closeModal('otp-modal'); }

// Submit booking
async function submitBooking() {
  const name = document.getElementById('user-name').value.trim();
  const phone = document.getElementById('user-phone').value.trim();
  const email = document.getElementById('user-email').value.trim();
  const purpose = document.getElementById('booking-purpose').value.trim();
  const trainingAccepted = document.getElementById('training-accepted').checked;
  
  // Validation
  if (!name || !phone || !email) {
    alert('Please fill in all required fields (Name, Phone, Email)');
    return;
  }
  
  if (!trainingAccepted) {
    alert('You must accept the training requirements');
    return;
  }
  
  if (!validateEmail(email)) {
    alert('Please enter a valid email address');
    return;
  }
  
  showLoading(true);
  
  try {
    const { equipment, timeSlot } = bookingData.selectedSlot;
    const endTime = calculateEndTime(timeSlot);
    
    const bookingPayload = {
      equipment_id: equipment.id,
      user_name: name,
      user_email: email,
      user_phone: phone,
      purpose: purpose || 'No purpose specified',
      booking_date: bookingData.selectedDate,
      start_time: timeSlot + ':00',
      end_time: endTime + ':00',
      training_accepted: trainingAccepted
    };
    
    const result = await SupabaseClient.createBooking(bookingPayload);
    
    if (result.success) {
      // Send confirmation email
      const emailData = {
        ...bookingPayload,
        equipment_name: equipment.name
      };
      
      await EmailService.sendConfirmationEmail(emailData);
      
      alert('Booking confirmed! Check your email for details.');
      closeBookingModal();
      loadBookings(); // Refresh the grid
    } else {
      alert('Error creating booking: ' + result.error);
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
  
  showLoading(false);
}

// Confirm deletion (first step)
async function confirmDeletion() {
  if (!bookingData.selectedBooking) return;
  
  showLoading(true);
  
  try {
    // Generate and send OTP
    const result = await SupabaseClient.generateOTP(
      bookingData.selectedBooking.id, 
      bookingData.selectedBooking.user_email
    );
    
    if (result.success) {
      // Send OTP email
      await EmailService.sendOTPEmail(
        bookingData.selectedBooking.user_email, 
        result.otpCode, 
        bookingData.selectedBooking.user_name
      );
      
      // Store booking for OTP verification
      bookingData.currentOTPBooking = bookingData.selectedBooking;
      
      // Show OTP modal
      closeDeletionModal();
      document.getElementById('otp-modal').style.display = 'flex';
      document.getElementById('otp-input').value = '';
      
      alert('OTP sent to your email. Please check and enter the code.');
    } else {
      alert('Error sending OTP: ' + result.error);
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
  
  showLoading(false);
}

// Verify OTP and delete booking
async function verifyOTP() {
  const otpCode = document.getElementById('otp-input').value.trim();
  
  if (!otpCode) {
    alert('Please enter the OTP code');
    return;
  }
  
  if (!bookingData.currentOTPBooking) {
    alert('No booking found for verification');
    return;
  }
  
  showLoading(true);
  
  try {
    // Verify OTP
    const verifyResult = await SupabaseClient.verifyOTP(
      bookingData.currentOTPBooking.id, 
      otpCode
    );
    
    if (verifyResult.success) {
      // Cancel booking
      const cancelResult = await SupabaseClient.cancelBooking(bookingData.currentOTPBooking.id);
      
      if (cancelResult.success) {
        alert('Booking cancelled successfully');
        closeOTPModal();
        loadBookings(); // Refresh the grid
      } else {
        alert('Error cancelling booking: ' + cancelResult.error);
      }
    } else {
      alert('Invalid or expired OTP. Please try again.');
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
  
  showLoading(false);
}

// Calculate end time (30 minutes later)
function calculateEndTime(startTime) {
  const [hour, minute] = startTime.split(':').map(Number);
  const endMinute = minute + 30;
  
  if (endMinute >= 60) {
    return `${(hour + 1).toString().padStart(2, '0')}:00`;
  } else {
    return `${hour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
  }
}

// Update current time indicator
function updateCurrentTimeIndicator() {
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  
  // Only show on current date
  if (currentDate !== bookingData.selectedDate) {
    document.getElementById('current-time-indicator').style.display = 'none';
    return;
  }
  
  // Get local time (not UTC)
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  
  console.log(`Current local time: ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);
  
  const startTimeInMinutes = 9 * 60; // 9:00 AM
  const endTimeInMinutes = 22 * 60; // 10:00 PM
  
  if (currentTimeInMinutes < startTimeInMinutes || currentTimeInMinutes > endTimeInMinutes) {
    document.getElementById('current-time-indicator').style.display = 'none';
    return;
  }
  
  const timeSlots = generateTimeSlots();
  const slotWidth = 80; // pixels (min-width of time slots)
  const equipmentWidth = 180; // pixels (width of equipment column)
  
  // Calculate position based on time slots
  let position = 0;
  for (let i = 0; i < timeSlots.length; i++) {
    const [slotHour, slotMinute] = timeSlots[i].split(':').map(Number);
    const slotTimeInMinutes = slotHour * 60 + slotMinute;
    
    if (currentTimeInMinutes <= slotTimeInMinutes) {
      // Interpolate between this slot and the previous one
      if (i > 0) {
        const [prevHour, prevMinute] = timeSlots[i-1].split(':').map(Number);
        const prevTimeInMinutes = prevHour * 60 + prevMinute;
        const progress = (currentTimeInMinutes - prevTimeInMinutes) / (slotTimeInMinutes - prevTimeInMinutes);
        position = (i - 1 + progress) * slotWidth;
      } else {
        position = 0;
      }
      break;
    }
  }
  
  const timeLine = document.getElementById('current-time-indicator');
  timeLine.style.display = 'block';
  timeLine.style.left = (equipmentWidth + position) + 'px';
}

// Set up real-time subscription
function setupRealtimeSubscription() {
  if (bookingData.subscription) {
    SupabaseClient.unsubscribe(bookingData.subscription);
  }
  
  bookingData.subscription = SupabaseClient.subscribeToBookings((payload) => {
    console.log('Real-time update:', payload);
    loadBookings(); // Refresh bookings when changes occur
  });
}

// Utility functions
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function showLoading(show) {
  const overlay = document.getElementById('loading-overlay');
  overlay.style.display = show ? 'flex' : 'none';
}

// Cleanup when page unloads
window.addEventListener('beforeunload', function() {
  if (bookingData.subscription) {
    SupabaseClient.unsubscribe(bookingData.subscription);
  }
});