(() => {
  document.addEventListener('DOMContentLoaded', init);
  
  // Also ensure real-time indicator is positioned when window loads
  window.addEventListener('load', () => {
    if (typeof positionNowLine === 'function') {
      positionNowLine();
    }
  });

  /* ===== Config ===== */
  const RSV_START_TIME = "09:00";
  const RSV_END_TIME   = "22:00";
  const RSV_STEP_MIN   = 30;

  /* layout constants (must match CSS) */
  const GAP    = cssNumber('--rsv-gap', 10);
  const LEFT_PAD = cssNumber('--rsv-leftpad', 10);
  const equipW = () => parseInt(getComputedStyle(document.documentElement)
                     .getPropertyValue('--rsv-equip-w')) || 180;
  const slotW = () => parseInt(getComputedStyle(document.documentElement)
                     .getPropertyValue('--rsv-slot-w')) || 120;
  const SEG_W = () => slotW() + GAP;

  /* helpers */
  const el = id => document.getElementById(id);
  const t2m = t => { const [h,m]=t.split(':').map(Number); return h*60+m; };
  const m2t = m => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
  const buildTimeline = (s,e,step) => { const out=[]; for(let m=t2m(s); m<=t2m(e); m+=step) out.push(m2t(m)); return out; };
  
  // Date formatting functions
  function fmtCN(d) { return `${d.getMonth()+1}月${d.getDate()}日`; }
  function fmtISO(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
  function sameDay(a,b) { return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
  
  // Check if a date is Chinese holiday
  function isChineseHolidayDate(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    
    // Chinese New Year (Lunar calendar - approximate dates for 2024-2025)
    if (year === 2024 && month === 2 && day >= 10 && day <= 17) return true;
    if (year === 2025 && month === 1 && day >= 29) return true;
    if (year === 2025 && month === 2 && day <= 4) return true;
    
    // Qingming Festival (Tomb Sweeping Day) - April 5
    if (month === 4 && day === 5) return true;
    
    // Labor Day - May 1
    if (month === 5 && day === 1) return true;
    
    // Dragon Boat Festival (Lunar calendar - approximate dates)
    if (year === 2024 && month === 6 && day === 10) return true;
    if (year === 2025 && month === 5 && day === 31) return true;
    
    // National Day - October 1-7
    if (month === 10 && day >= 1 && day <= 7) return true;
    
    // Mid-Autumn Festival (Lunar calendar - approximate dates)
    if (year === 2024 && month === 9 && day === 17) return true;
    if (year === 2025 && month === 10 && day === 6) return true;
    
    // New Year's Day - January 1
    if (month === 1 && day === 1) return true;
    
    return false;
  }

  // === Persistent bookings cache (past + future) ===
  let bookingsByDate = Object.create(null);
  const START_MIN = () => t2m(RSV_START_TIME);
  const slotIndexFromTime = (timeStr) => Math.floor((t2m(timeStr) - START_MIN()) / RSV_STEP_MIN);

  function normalizeImage(url) {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith("/")) return (window.RSV_BASEURL || "") + url;
    return (window.RSV_ASSETS || "") + url;
  }

  function getEquipment() {
    const arr = (window.RSV_EQUIPMENT || []);
    return Array.isArray(arr) ? arr : [];
  }

  // Convert server list into our cache map
  function indexBookingsIntoMap(list) {
    console.log('Indexing bookings into map:', list);
    
    // Clear existing cache for the dates we're updating
    const dateKeys = new Set(list.map(b => b.date));
    dateKeys.forEach(dateKey => {
      console.log('Clearing cache for date:', dateKey);
      if (bookingsByDate[dateKey]) {
        delete bookingsByDate[dateKey];
      }
    });
    
    list.forEach(b => {
      console.log('Processing booking object:', b);
      const dateKey = b.date;
      const dev = b.device || '';
      const startSlot = slotIndexFromTime(b.start);
      const endSlot   = slotIndexFromTime(b.end);
      
      console.log(`Processing booking: ${dev} on ${dateKey} from ${b.start} to ${b.end} (slots ${startSlot}-${endSlot})`);
      
      if (!bookingsByDate[dateKey]) bookingsByDate[dateKey] = Object.create(null);
      if (!bookingsByDate[dateKey][dev]) bookingsByDate[dateKey][dev] = [];
      
      // Always add booking (we cleared duplicates above)
      const bookingData = {
        startSlot, endSlot, name: b.name || '', purpose: b.purpose || '', email: b.email || '', id: b.id || '', device: b.device || ''
      };
      console.log('Adding booking data:', bookingData);
      bookingsByDate[dateKey][dev].push(bookingData);
    });
    console.log('Final bookings cache:', bookingsByDate);
  }

  // Load a date range from Apps Script and index it
  async function loadBookingsBetween(fromDate, toDate) {
    const fromISO = fmtISO(fromDate);
    const toISO   = fmtISO(toDate);
    const url = `${SCRIPT_URL}?action=list_bookings&from=${encodeURIComponent(fromISO)}&to=${encodeURIComponent(toISO)}`;
    
    try {
      console.log('Loading bookings from:', url);
      showLoadingState();
      
      const res = await fetch(url);
      const data = await res.json();
      
      hideLoadingState();
      
      if (!data.ok) {
        console.error('Failed to load bookings:', data.error);
        showError('Failed to load existing bookings: ' + data.error);
        return;
      }
      
      console.log('Loaded bookings response:', data);
      indexBookingsIntoMap(data.bookings || []);
      renderRows(); // re-render now that server data exists
    } catch (error) {
      hideLoadingState();
      console.error('Error loading bookings:', error);
      showError('Failed to load bookings. Please refresh the page.');
    }
  }

  // Ensure a single date is covered in the cache (lazy load a window around it)
  async function ensureDateLoaded(dateObj) {
    const key = fmtISO(dateObj);
    console.log('Ensuring date loaded:', key);
    
    // Load a wider range to catch nearby bookings
    const from = new Date(dateObj); from.setDate(from.getDate() - 3);
    const to   = new Date(dateObj); to.setDate(to.getDate() + 3);
    await loadBookingsBetween(from, to);
  }

  /* DOM refs */
  let headerViewport, timebar, nowLineGlobal, rowsRoot, timeline;
  
  /* Multi-slot selection */
  let selectedSlots = new Set();
  let isSelecting = false;
  let isDragging = false;
  let currentEquipment = null;
  let isInitialLoad = true; // Track if this is the initial page load
  let modalOpenTimeout = null;
  let userActionInProgress = false;
  let lastSlotInteractionTime = 0;

  function init() {
    headerViewport = el('rsv-header-viewport');
    timebar        = el('rsv-timebar');
    nowLineGlobal  = el('rsv-now-line-global');
    rowsRoot       = el('rsv-rows');

    timeline = buildTimeline(RSV_START_TIME, RSV_END_TIME, RSV_STEP_MIN);
    console.log('Timeline created:', timeline);

    renderHeader();
    
    // Initialize date selector with proper validation FIRST
    initializeDateSelector();
    
    // Then setup the rest
    setupSync();
    // Position the real-time indicator with a small delay to ensure DOM is ready
    setTimeout(() => positionNowLine(), 100);
    setupEmailValidation();

    // Load initial booking data for current date and nearby dates
    console.log('Loading initial bookings for date:', fmtISO(selectedDate));
    ensureDateLoaded(selectedDate).then(() => {
      console.log('Initial bookings loaded successfully');
      
      // Only render rows after data is loaded to avoid showing warnings prematurely
      renderRows();
      // Mark initial load as complete
      isInitialLoad = false;
      
      // Reposition the real-time indicator after rows are rendered
      positionNowLine();
    }).catch(console.error);

    setTimeout(() => {
      scrollToCurrentTime();
    }, 1000); // Increased delay to ensure data is loaded
    
    // Update real-time indicator every 30 seconds for smoother movement
    setInterval(positionNowLine, 30 * 1000);
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        clearSelection();
      }
      if (e.key === 'Enter' && selectedSlots.size > 0 && currentEquipment) {
        // Enforce selection limit before opening modal
        if (selectedSlots.size > 10) {
          enforceSelectionLimit();
          showError('Selection limit exceeded. Please review your selection.');
          return;
        }
        openModalWithSelectedSlots(currentEquipment);
      }
    });
    
    // Reposition real-time indicator when page becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        positionNowLine();
      }
    });
    
    // Reposition real-time indicator when window gains focus
    window.addEventListener('focus', () => {
      positionNowLine();
    });
     
    window.addEventListener('resize', () => {
      clearTimeout(window.resizeTimeout);
      window.resizeTimeout = setTimeout(() => {
        headerViewport.offsetHeight;
        // Reposition the real-time indicator after resize
        positionNowLine();
      }, 100);
    });
      
    updateSelectionCounter();
    window.addEventListener('mouseup', endSelectionGlobally, true);
    window.addEventListener('blur', endSelectionGlobally, true);
  }

  function setupEmailValidation() {
    const usernameInput = document.getElementById('email-username');
    const domainSelect = document.getElementById('email-domain');
    const combinedInput = document.getElementById('email-combined');
    
    if (!usernameInput || !domainSelect || !combinedInput) {
      console.warn('Split email inputs not found');
      return;
    }
    
    function updateCombinedEmail() {
      const username = usernameInput.value.trim();
      const domain = domainSelect.value;
      
      if (username && domain) {
        combinedInput.value = username + domain;
        
        // Show preview of full email
        const previewText = document.querySelector('.email-preview-text');
        if (previewText) {
          previewText.textContent = combinedInput.value;
          document.querySelector('.email-preview').style.display = 'block';
        }
      } else {
        combinedInput.value = '';
        const preview = document.querySelector('.email-preview');
        if (preview) {
          preview.style.display = 'none';
        }
      }
      
      // Validate the combined email
      validateEmail();
    }
    
    function validateEmail() {
      const email = combinedInput.value;
      const allowedDomains = ['@mail.sustech.edu.cn', '@sustech.edu.cn'];
      const isValid = allowedDomains.some(domain => email.endsWith(domain)) && email.includes('@');
      
      if (email && !isValid) {
        usernameInput.setCustomValidity('Please enter a valid university email');
        domainSelect.setCustomValidity('Please select a valid domain');
      } else {
        usernameInput.setCustomValidity('');
        domainSelect.setCustomValidity('');
      }
    }
    
    // Update combined email when either input changes
    usernameInput.addEventListener('input', function(e) {
      // Only allow valid username characters
      const validValue = e.target.value.replace(/[^a-zA-Z0-9._-]/g, '');
      if (e.target.value !== validValue) {
        e.target.value = validValue;
      }
      updateCombinedEmail();
    });
    
    domainSelect.addEventListener('change', updateCombinedEmail);
    
    // Auto-focus domain dropdown when username looks complete
    usernameInput.addEventListener('blur', function() {
      if (this.value.trim().length >= 3 && !domainSelect.value) {
        setTimeout(() => domainSelect.focus(), 100);
      }
    });
    
    // Initialize
    updateCombinedEmail();
  }

  function showLoadingState() {
    // Remove existing loading state
    hideLoadingState();
    
    const loadingEl = document.createElement('div');
    loadingEl.id = 'booking-loading';
    loadingEl.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f3f4f6;
        border: 2px solid #d1d5db;
        color: #374151;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 8px;
      ">
        <div style="width: 16px; height: 16px; border: 2px solid #9ca3af; border-top: 2px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        Loading bookings...
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    document.body.appendChild(loadingEl);
  }

  function hideLoadingState() {
    const loadingEl = document.getElementById('booking-loading');
    if (loadingEl) {
      loadingEl.remove();
    }
  }

  function showError(message) {
    // Remove existing error messages
    document.querySelectorAll('.booking-error').forEach(el => el.remove());
    
    const errorEl = document.createElement('div');
    errorEl.className = 'booking-error';
    errorEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 18px;">⚠️</span>
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: none; border: none; color: inherit; 
          font-size: 18px; cursor: pointer; margin-left: auto;
        ">×</button>
      </div>
    `;
    document.body.appendChild(errorEl);
    
    setTimeout(() => {
      if (errorEl.parentNode) {
        errorEl.remove();
      }
    }, 5000);
  }

  function showPersistentWarning(message) {
    // Don't show warnings during initial page load
    if (isInitialLoad) {
      console.log('Skipping warning during initial load:', message);
      return;
    }
    
    // Remove existing warnings
    document.querySelectorAll('.weekend-warning').forEach(el => el.remove());
    
    // Find next available date for the button
    let nextAvailable = new Date(selectedDate);
    let attempts = 0;
    while (isWeekendOrHoliday(nextAvailable) && attempts < 14) {
      nextAvailable.setDate(nextAvailable.getDate() + 1);
      attempts++;
    }
    
    const hasNextAvailable = attempts < 14;
    const nextDateText = hasNextAvailable ? fmtCN(nextAvailable) : 'a weekday';
    
    // Pre-load the next available date data to make switching faster
    if (hasNextAvailable) {
      ensureDateLoaded(nextAvailable).catch(console.error);
    }
    
    const warningEl = document.createElement('div');
    warningEl.className = 'weekend-warning';
    warningEl.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #fef2f2;
        border: 3px solid #fecaca;
        color: #dc2626;
        padding: 30px;
        border-radius: 16px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.3);
        z-index: 20000;
        text-align: center;
        max-width: 500px;
        width: 90%;
      ">
        <div style="font-size: 64px; margin-bottom: 16px;">🚫</div>
        <h3 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 800;">Booking Not Available</h3>
        <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.5;">
          ${message}
        </p>
        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          ${hasNextAvailable ? `
            <button onclick="selectNextAvailableDate()" style="
              background: #059669; color: white; border: none; 
              padding: 12px 24px; border-radius: 8px; font-size: 16px; 
              font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px;
            ">
              📅 Book for ${nextDateText}
            </button>
          ` : ''}
          <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
            background: #dc2626; color: white; border: none; 
            padding: 12px 24px; border-radius: 8px; font-size: 16px; 
            font-weight: 600; cursor: pointer;
          ">I Understand</button>
        </div>
      </div>
      <div style="
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.5); z-index: 19999;
      " onclick="this.parentElement.remove()"></div>
    `;
    document.body.appendChild(warningEl);
    
    // Store next available date for the button handler
    if (hasNextAvailable) {
      window.nextAvailableDate = nextAvailable;
    }
  }
  
  // Add global function for the "Book for next date" button
  window.selectNextAvailableDate = function() {
    if (window.nextAvailableDate) {
      // Show loading state immediately
      labelEl.textContent = 'Loading...';
      labelEl.style.opacity = '0.7';
      
      selectedDate = new Date(window.nextAvailableDate);
      
      // Update dropdown selection
      menu.querySelectorAll('.date-item.is-selected').forEach(x => x.classList.remove('is-selected'));
      const targetItem = menu.querySelector(`[data-date="${fmtISO(selectedDate)}"]`);
      if (targetItem) {
        targetItem.classList.add('is-selected');
      }
      
      // Remove warning and load new date immediately
      document.querySelectorAll('.weekend-warning').forEach(el => el.remove());
      clearSelection();
      
             // Load data immediately without delay
       ensureDateLoaded(selectedDate).then(() => {
         console.log('Switched to next available date:', fmtISO(selectedDate));
         // Update label with new date
         labelEl.textContent = fmtCN(selectedDate);
         labelEl.style.opacity = '1';
         
         // Render rows immediately after data is loaded
         renderRows();
       }).catch(console.error);
    }
  };

  function renderHeader() {
    timebar.innerHTML = '';
    
    // Always show all time labels regardless of date type
    for (let i = 0; i < timeline.length - 1; i++) {
      const startTime = timeline[i];
      const d = document.createElement('div');
      d.className = 'time-label';
      d.textContent = startTime;
      timebar.appendChild(d);
    }
  }

  // Check if a date is weekend or Chinese holiday
  function isWeekendOrHoliday(date) {
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isChineseHoliday = isChineseHolidayDate(date);
    return isWeekend || isChineseHoliday;
  }

  // Check if a slot is in the past
  function isSlotInPast(slotIndex, date) {
    const now = new Date();
    let slotDate;
    
    // Handle both Date objects and date strings
    if (date instanceof Date) {
      slotDate = new Date(date);
    } else {
      slotDate = new Date(date);
    }
    
    // Normalize dates to remove time component for accurate comparison
    const todayNormalized = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const slotDateNormalized = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate());
    
    console.log(`Checking if slot is past: slotDate=${slotDateNormalized.toDateString()}, today=${todayNormalized.toDateString()}`);
    
    // If the slot date is before today, all slots are in the past
    if (slotDateNormalized < todayNormalized) {
      console.log('Slot date is in the past');
      return true;
    }
    
    // If it's today, check if the slot time has passed
    if (slotDateNormalized.getTime() === todayNormalized.getTime()) {
      const slotStartTime = timeline[slotIndex];
      const slotMinutes = t2m(slotStartTime);
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const isPast = slotMinutes <= nowMinutes;
      console.log(`Today slot check: ${slotStartTime} (${slotMinutes}min) vs now (${nowMinutes}min) = ${isPast ? 'past' : 'future'}`);
      return isPast;
    }
    
    // Future dates are not in the past
    console.log('Slot date is in the future');
    return false;
  }

  function renderRows() {
    console.log('Rendering rows for date:', fmtISO(selectedDate), 'selectedDate object:', selectedDate);
    rowsRoot.innerHTML = '';
    const eqs = getEquipment();

    // Check if current selected date is weekend/holiday
    const isDateRestricted = isWeekendOrHoliday(selectedDate);
    
    console.log(`Date ${fmtISO(selectedDate)} is restricted: ${isDateRestricted}`);
    
    if (isDateRestricted) {
      // Show warning message for weekends and holidays instead of rendering slots
      const warningRow = document.createElement('div');
      warningRow.className = 'equip-row';
      warningRow.style.gridColumn = '1 / -1';
      warningRow.style.textAlign = 'center';
      warningRow.style.padding = '40px 20px';
      
      warningRow.innerHTML = `
        <div style="
          background: #fef2f2;
          border: 2px solid #fecaca;
          border-radius: 12px;
          padding: 30px;
          color: #dc2626;
          max-width: 600px;
          margin: 0 auto;
        ">
          <div style="font-size: 48px; margin-bottom: 16px;">🚫</div>
          <h3 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 800;">Booking Not Available</h3>
          <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.5;">
            Equipment booking is not available on weekends and Chinese holidays.
          </p>
          <p style="margin: 0; font-size: 14px; color: #9ca3af;">
            Please select a weekday to make your reservation.
          </p>
        </div>
      `;
      
      rowsRoot.appendChild(warningRow);
      return;
    }

    // Normal rendering for available dates
    console.log('Rendering normal available date slots...');
    
    eqs.forEach(eq => {
      const row = document.createElement('div');
      row.className = 'equip-row';

      const left = document.createElement('div');
      left.className = 'equip-left';

      const imgSrc = normalizeImage(eq.image);

      left.innerHTML = `
        <div class="equip-card">
          <div class="equip-thumb">
            ${imgSrc ? `<img src="${imgSrc}" alt="${eq.name}">` : ''}
          </div>
        </div>
        <div class="equip-meta-below">
          <div class="equip-name">${eq.name || ''}</div>
          <div class="equip-model">${eq.model || ''}</div>
        </div>
      `;

      if (imgSrc) {
        const imgEl = left.querySelector('img');
        imgEl.addEventListener('error', () => imgEl.remove());
      }

      row.appendChild(left);

      const viewport = document.createElement('div');
      viewport.className = 'row-viewport';

      const strip = document.createElement('div');
      strip.className = 'row-slots';

      // Get existing bookings for this equipment and date
      const existingBookings = getExistingBookings(eq);
      console.log(`Rendering bookings for ${eq.name} on ${fmtISO(selectedDate)}:`, existingBookings);
      
      // Create a set to track which slots are booked
      const bookedSlots = new Set();
      
      existingBookings.forEach(booking => {
        console.log(`Processing booking for display: slots ${booking.startSlot} to ${booking.endSlot}`);
        for (let i = booking.startSlot; i < booking.endSlot; i++) {
          bookedSlots.add(i);
        }
      });

      console.log(`Booked slots for ${eq.name}:`, Array.from(bookedSlots));

      // Render slots - each slot represents a 30-minute time period
      for (let i = 0; i < timeline.length - 1; i++) {
        const cell = document.createElement('div');
        cell.dataset.slotIndex = i;
        cell.dataset.equipmentId = eq.name;
        
        const slotStartTime = timeline[i];
        const slotEndTime = timeline[i + 1];
        const isPastSlot = isSlotInPast(i, selectedDate);
        
        console.log(`Slot ${i} (${slotStartTime}-${slotEndTime}): isPast=${isPastSlot}, isBooked=${bookedSlots.has(i)}`);
        
        if (bookedSlots.has(i)) {
          // Find the original booking for this slot
          let originalBooking = null;
          for (const booking of existingBookings) {
            if (i >= booking.startSlot && i < booking.endSlot) {
              originalBooking = booking;
              break;
            }
          }
          
          cell.className = 'slot booked';
          
          // Only show booking info on the first slot of each booking
          if (originalBooking) {
            const startTime = timeline[originalBooking.startSlot];
            const endTime = timeline[originalBooking.endSlot];
            cell.innerHTML = `
              <div class="booking-info">
                <div class="booking-header">
                  <div class="user-avatar">
                    <div class="user-avatar-initial">${getInitial(originalBooking.name)}</div>
                  </div>
                  <div class="time-name">
                    <div class="booking-time">${startTime}-${endTime}</div>
                    <div class="user-name-container">
                      <div class="user-name">${originalBooking.name}</div>
                    </div>
                  </div>
                </div>
                <div class="project-info">
                  <div class="project-name">${originalBooking.purpose}</div>
                </div>
              </div>
            `;
            
            // Add click handler to open booking management modal
            cell.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              openBookingManagementModal(originalBooking);
            });
            
            // Add cursor pointer to indicate it's clickable
            cell.style.cursor = 'pointer';
          }
        } else if (isPastSlot) {
          // Past slots - not selectable
          cell.className = 'slot past';
          cell.innerHTML = `
            <div style="
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100%;
              color: #9ca3af;
              font-size: 12px;
              text-align: center;
            ">
              Past
            </div>
          `;
        } else {
          // Available future slots
          cell.className = 'slot available';
          
          // Add tooltip showing the exact time slot
          cell.title = `${slotStartTime} - ${slotEndTime}`;
          
          // Add event listeners for available slots
          cell.addEventListener('mousedown', (e) => {
            e.preventDefault();
            startSelection(e, eq, i);
          });
          
          cell.addEventListener('mouseenter', (e) => {
            if (isSelecting && isDragging) {
              // Clear any pending modal opening during drag
              if (modalOpenTimeout) {
                clearTimeout(modalOpenTimeout);
                modalOpenTimeout = null;
              }
              
              updateSelection(e, eq, i);
              
              // Update interaction tracking
              lastSlotInteractionTime = Date.now();
              userActionInProgress = true;
            }
          });
          
          cell.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Clear any pending modal opening for this click
            if (modalOpenTimeout) {
              clearTimeout(modalOpenTimeout);
              modalOpenTimeout = null;
            }
            
            if (!isDragging) {
              if (selectedSlots.has(i)) {
                // User clicked on already selected slot - deselect it
                removeSlotFromSelection(eq, i);
              } else {
                // User clicked on unselected slot - select it
                addSlotToSelection(eq, i);
              }
            }
            
            // Update interaction tracking
            lastSlotInteractionTime = Date.now();
          });
          
          cell.addEventListener('dblclick', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Clear any pending modal opening
            if (modalOpenTimeout) {
              clearTimeout(modalOpenTimeout);
              modalOpenTimeout = null;
            }
            
            if (selectedSlots.has(i)) {
              removeSlotFromSelection(eq, i);
            }
            
            // Reset user action state
            userActionInProgress = false;
            lastSlotInteractionTime = Date.now();
          });
        }
        
        strip.appendChild(cell);
      }

      viewport.appendChild(strip);
      row.appendChild(viewport);
      rowsRoot.appendChild(row);
    });
  }

  function setupSync() {
    const vpRows = () => Array.from(document.querySelectorAll('#rsv-rows .row-viewport'));

    headerViewport.addEventListener('scroll', () => {
      const x = headerViewport.scrollLeft;
      vpRows().forEach(v => v.scrollLeft = x);
      positionNowLine();
    });

    ['wheel','touchmove'].forEach(evt => {
      headerViewport.addEventListener(evt, e => e.preventDefault(), { passive:false });
    });

    const getScrollStep = () => {
      const viewportWidth = window.innerWidth;
      if (viewportWidth <= 480) return slotW() * 1;
      if (viewportWidth <= 768) return slotW() * 2;
      if (viewportWidth <= 1024) return slotW() * 3;
      return slotW() * 6;
    };
    
    el('rsv-arrow-left').addEventListener('click', () => {
      const step = getScrollStep();
      headerViewport.scrollBy({ left: -step, behavior: 'smooth' });
    });
    
    el('rsv-arrow-right').addEventListener('click', () => {
      const step = getScrollStep();
      headerViewport.scrollBy({ left: step, behavior: 'smooth' });
    });
  }

  /* ===== Multi-Slot Selection Functions ===== */
  
  function startSelection(e, eq, slotIndex) {
    // Don't allow selection on restricted dates
    if (isWeekendOrHoliday(selectedDate)) {
      showPersistentWarning('Booking is not available on weekends and Public holidays.');
      return;
    }
    
    // Check if we're already at the limit and trying to select a new slot
    if (selectedSlots.size >= 10 && !selectedSlots.has(slotIndex)) {
      showLimitMessage();
      return;
    }
    
    // Prevent starting selection if already at limit (unless clicking on an already selected slot)
    if (selectedSlots.size >= 10) {
      showLimitMessage();
      return;
    }
    
    // Clear any pending modal opening
    if (modalOpenTimeout) {
      clearTimeout(modalOpenTimeout);
      modalOpenTimeout = null;
    }
    
    isSelecting = true;
    isDragging = true;
    currentEquipment = eq;
    userActionInProgress = true;
    lastSlotInteractionTime = Date.now();
    
    // Clear previous selection if switching equipment
    if (currentEquipment?.name !== eq.name) {
      clearSelection();
      currentEquipment = eq;
    }
    
    addSlotToSelection(eq, slotIndex);
    document.body.style.userSelect = 'none';
    
    // Don't open modal immediately - wait to see if user wants to drag or double-click
    // Modal will open in endSelectionGlobally() after a delay
  }

  function updateSelection(e, eq, slotIndex) {
    if (!isSelecting || !isDragging || currentEquipment?.name !== eq.name) return;
    
    // Strict limit enforcement: don't allow any new selections if already at 10 slots
    if (selectedSlots.size >= 10 && !selectedSlots.has(slotIndex)) {
      showLimitMessage();
      return;
    }
    
    // Prevent dragging to select more slots if already at limit
    if (selectedSlots.size >= 10) {
      showLimitMessage();
      return;
    }
    
    // Don't select past slots
    if (isSlotInPast(slotIndex, selectedDate)) return;
    
    // Final check before adding slot
    if (selectedSlots.size >= 10) {
      showLimitMessage();
      return;
    }
    
    // One more safety check before calling addSlotToSelection
    if (selectedSlots.size >= 10) {
      showLimitMessage();
      return;
    }
    
    // Final safety check before calling addSlotToSelection
    if (selectedSlots.size >= 10) {
      showLimitMessage();
      return;
    }
    
    addSlotToSelection(eq, slotIndex);
    
    // Don't open modal during drag - let the user complete their drag operation
    // Modal will open in endSelectionGlobally() after drag completes
  }

  function endSelectionGlobally() {
    if (isSelecting) {
      isSelecting = false;
      document.body.style.userSelect = '';
      userActionInProgress = false;
      
      // Enforce selection limit when selection ends
      if (selectedSlots.size > 10) {
        enforceSelectionLimit();
      }
      
      // Intelligent modal opening with proper delays for user experience
      if (selectedSlots.size > 0 && currentEquipment && 
          el('rsv-modal').getAttribute('aria-hidden') === 'true') {
        
        // Clear any existing timeout
        if (modalOpenTimeout) {
          clearTimeout(modalOpenTimeout);
        }
        
        // Smart delay based on user behavior
        let modalDelay;
        const timeSinceInteraction = Date.now() - lastSlotInteractionTime;
        
        if (selectedSlots.size === 1) {
          // Single slot: longer delay to allow for double-click
          modalDelay = Math.max(1000, 1000 - timeSinceInteraction);
        } else {
          // Multiple slots: shorter delay but still enough for user to finish
          modalDelay = Math.max(800, 800 - timeSinceInteraction);
        }
        
        // Set the modal opening timeout
        modalOpenTimeout = setTimeout(() => {
          // Only open modal if user hasn't started another action
          if (!userActionInProgress && !isSelecting && selectedSlots.size > 0) {
            openModalWithSelectedSlots(currentEquipment);
            modalOpenTimeout = null;
          }
        }, modalDelay);
      }
      
      // Small delay to distinguish between click and drag
      setTimeout(() => {
        isDragging = false;
      }, 100);
    }
  }

  function addSlotToSelection(eq, slotIndex) {
    // Don't allow selection on restricted dates
    if (isWeekendOrHoliday(selectedDate)) {
      showPersistentWarning('Booking is not available on weekends and Public holidays.');
      return;
    }
    
    // Don't allow selection of past slots
    if (isSlotInPast(slotIndex, selectedDate)) {
      showError('Cannot book past time slots.');
      return;
    }
    
    // Strict limit enforcement: don't allow any new selections if already at 10 slots
    if (selectedSlots.size >= 10 && !selectedSlots.has(slotIndex)) {
      if (!document.querySelector('.limit-message')) showLimitMessage();
      return;
    }
    
    // Additional safety check: if somehow we're already over the limit, don't add more
    if (selectedSlots.size >= 10) {
      console.warn('Selection limit exceeded, preventing further selections');
      showLimitMessage();
      return;
    }
    
    if (!selectedSlots.has(slotIndex)) {
      const wasEmpty = selectedSlots.size === 0;
      selectedSlots.add(slotIndex);

      const slotEl = document.querySelector(
        `[data-slot-index="${slotIndex}"][data-equipment-id="${eq.name}"]`
      );
      if (slotEl && slotEl.classList.contains('available')) {
        slotEl.classList.add('selected');
        slotEl.classList.remove('available');
        
        // Add selection order number
        slotEl.dataset.selectionOrder = selectedSlots.size;
      }

      updateSelectionCounter();
      
      // Don't open modal immediately - let the selection process complete first
      // Modal will be opened in endSelectionGlobally() after user finishes their action
    }
  }

  function removeSlotFromSelection(eq, slotIndex) {
    if (selectedSlots.has(slotIndex)) {
      selectedSlots.delete(slotIndex);
      
      const slotElement = document.querySelector(
        `[data-slot-index="${slotIndex}"][data-equipment-id="${eq.name}"]`
      );
      if (slotElement) {
        slotElement.classList.remove('selected');
        slotElement.classList.add('available');
        delete slotElement.dataset.selectionOrder;
      }
      
      // Renumber remaining selected slots
      const remainingSlots = Array.from(selectedSlots).sort((a, b) => a - b);
      remainingSlots.forEach((slot, index) => {
        const slotEl = document.querySelector(
          `[data-slot-index="${slot}"][data-equipment-id="${eq.name}"]`
        );
        if (slotEl) {
          slotEl.dataset.selectionOrder = index + 1;
        }
      });
      
      updateSelectionCounter();
      
      // Clear any pending modal opening
      if (modalOpenTimeout) {
        clearTimeout(modalOpenTimeout);
        modalOpenTimeout = null;
      }
      
      // Update modal or close if no slots selected
      if (selectedSlots.size === 0) {
        closeModal();
      } else {
        // Schedule modal opening with delay to allow for more deselections
        modalOpenTimeout = setTimeout(() => {
          if (!userActionInProgress && selectedSlots.size > 0) {
            updateModalFromSelection(eq);
          }
        }, 500);
      }
      
      // Update interaction tracking
      lastSlotInteractionTime = Date.now();
      userActionInProgress = false;
    }
  }
  
  function clearSelection() {
    selectedSlots.clear();
    
    // Clear any pending modal opening
    if (modalOpenTimeout) {
      clearTimeout(modalOpenTimeout);
      modalOpenTimeout = null;
    }
    
    document.querySelectorAll('.slot.selected').forEach(slot => {
      slot.classList.remove('selected');
      slot.classList.add('available');
      delete slot.dataset.selectionOrder;
    });
    
    updateSelectionCounter();
    
    // Reset interaction tracking
    userActionInProgress = false;
    lastSlotInteractionTime = Date.now();
  }
      
  function updateSelectionCounter() {
    const counter = document.querySelector('.selection-counter');
    if (counter) {
      // Enforce the 10-slot limit by removing excess selections
      if (selectedSlots.size > 10) {
        console.warn(`Selection limit exceeded (${selectedSlots.size} slots), cleaning up excess selections`);
        enforceSelectionLimit();
      }
      
      if (selectedSlots.size === 0) {
        counter.style.display = 'none';
      } else {
        counter.style.display = 'block';
        counter.textContent = `${selectedSlots.size} slot${selectedSlots.size === 1 ? '' : 's'} selected (${(selectedSlots.size * 0.5).toFixed(1)}h)`;
        

        
        if (selectedSlots.size >= 10) {
          counter.style.color = '#ef4444';
          counter.style.borderColor = '#ef4444';
          counter.style.borderWidth = '2px';
          counter.style.borderStyle = 'solid';
        } else if (selectedSlots.size >= 8) {
          counter.style.color = '#f59e0b';
          counter.style.borderColor = '#f59e0b';
          counter.style.borderWidth = '2px';
          counter.style.borderStyle = 'solid';
        } else {
          counter.style.color = '#10b981';
          counter.style.borderColor = 'transparent';
          counter.style.borderWidth = '0px';
        }
      }
    }
  }
   
  function enforceSelectionLimit() {
    // If we have more than 10 slots selected, keep only the first 10
    if (selectedSlots.size > 10) {
      const sortedSlots = Array.from(selectedSlots).sort((a, b) => a - b);
      const slotsToRemove = sortedSlots.slice(10); // Keep first 10, remove the rest
      
      // Remove excess slots from selection
      slotsToRemove.forEach(slotIndex => {
        selectedSlots.delete(slotIndex);
        
        // Update the DOM for removed slots
        const slotElement = document.querySelector(
          `[data-slot-index="${slotIndex}"][data-equipment-id="${currentEquipment?.name}"]`
        );
        if (slotElement) {
          slotElement.classList.remove('selected');
          slotElement.classList.add('available');
          delete slotElement.dataset.selectionOrder;
        }
      });
      
      // Renumber remaining selected slots
      const remainingSlots = Array.from(selectedSlots).sort((a, b) => a - b);
      remainingSlots.forEach((slot, index) => {
        const slotEl = document.querySelector(
          `[data-slot-index="${slot}"][data-equipment-id="${currentEquipment?.name}"]`
        );
        if (slotEl) {
          slotEl.dataset.selectionOrder = index + 1;
        }
      });
      
      console.log(`Enforced selection limit: removed ${slotsToRemove.length} excess slots, kept ${selectedSlots.size} slots`);
      
      // Show warning message
      showError(`Selection limit enforced: removed ${slotsToRemove.length} excess slot(s). Maximum 10 slots (5 hours) allowed.`);
    }
  }

  function showLimitMessage() {
    if (document.querySelector('.limit-message')) {
      return;
    }
    
    const message = document.createElement('div');
    message.className = 'limit-message';
    message.innerHTML = `
      <div class="limit-message-content">
        <button class="limit-close-btn" onclick="this.parentElement.parentElement.remove()">×</button>
        <span>⚠️ 5-hour limit reached</span>
        <p>You've selected the maximum 5 hours (10 slots)</p>
        <p><strong>To select different slots:</strong></p>
        <p>1. Double-click on any selected slot to remove it</p>
        <p>2. Then click on the new slot you want</p>
        <p><strong>Current selection:</strong> ${selectedSlots.size} slots (${(selectedSlots.size * 0.5).toFixed(1)} hours)</p>
      </div>
    `;
    
    document.body.appendChild(message);
    
    message.addEventListener('click', (e) => {
      if (e.target === message) {
        message.remove();
      }
    });
    
    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    }, 5000); // Increased timeout for better readability
  }
  
  function openModalWithSelectedSlots(eq) {
    if (selectedSlots.size === 0) return;
    
    // Enforce selection limit before opening modal
    if (selectedSlots.size > 10) {
      enforceSelectionLimit();
    }
    
    // Clear any pending modal opening
    if (modalOpenTimeout) {
      clearTimeout(modalOpenTimeout);
      modalOpenTimeout = null;
    }

    const sorted = Array.from(selectedSlots).sort((a,b)=>a-b);
    
    // Debug logging to help identify the issue
    console.log('Opening modal with slots:');
    console.log('- Selected slots:', Array.from(selectedSlots));
    console.log('- Sorted slots:', sorted);
    console.log('- Total slots:', sorted.length);
    
    // Validation: ensure we're not exceeding 10 slots
    if (sorted.length > 10) {
      showError(`Cannot process ${sorted.length} slots. Maximum 10 slots (5 hours) allowed.`);
      return;
    }
    
    const start  = timeline[sorted[0]];
    const end    = timeline[sorted[sorted.length-1] + 1];
    const hours  = sorted.length * 0.5;

    openModal(eq, start, end, hours, sorted);
  }

  // Helper functions
  function getInitial(name) {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  // Get existing bookings for an equipment on the selected date
  function getExistingBookings(eq) {
    const dateKey = fmtISO(selectedDate);
    const serverData = bookingsByDate[dateKey]?.[eq.name] || [];
    console.log(`Getting bookings for ${eq.name} on ${dateKey}:`, serverData);
    console.log(`Full bookingsByDate for ${dateKey}:`, bookingsByDate[dateKey]);
    return serverData;
  }

  // Booking management functions
  function openBookingManagementModal(booking) {
    currentBooking = booking;
    
    // Populate modal with booking details
    el('booking-name').textContent = booking.name;
    el('booking-email').textContent = booking.email;
    el('booking-purpose').textContent = booking.purpose;
    el('booking-equipment').textContent = booking.device;
    el('booking-date').textContent = fmtISO(selectedDate);
    
    // Calculate time from slot indices
    const startTime = timeline[booking.startSlot];
    const endTime = timeline[booking.endSlot];
    el('booking-time').textContent = `${startTime} - ${endTime}`;
    
    // Show details view, hide OTP view
    el('booking-details-view').style.display = 'block';
    el('otp-verification-view').style.display = 'none';
    
    // Show modal
    el('booking-management-modal').setAttribute('aria-hidden', 'false');
  }

  function closeBookingManagementModal() {
    el('booking-management-modal').setAttribute('aria-hidden', 'true');
    currentBooking = null;
    
    // Reset form fields
    el('otp-email').value = '';
    el('otp-input').value = '';
  }

  function showOTPVerification() {
    el('booking-details-view').style.display = 'none';
    el('otp-verification-view').style.display = 'block';
    el('otp-input-section').style.display = 'none';
  }

  async function sendOTP() {
    const email = el('otp-email').value.trim();
    
    if (!email) {
      showError('Please enter your email address.');
      return;
    }

    if (!currentBooking) {
      showError('No booking selected.');
      return;
    }

    try {
      const url = `${SCRIPT_URL}?action=send_otp&email=${encodeURIComponent(email)}&id=${encodeURIComponent(currentBooking.id)}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.ok) {
        // Show OTP input section
        el('otp-input-section').style.display = 'block';
        el('otp-email').disabled = true;
        el('send-otp-btn').disabled = true;
        showSuccess('OTP sent successfully! Check your email.');
      } else {
        showError(data.error || 'Failed to send OTP.');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      showError('Failed to send OTP. Please try again.');
    }
  }

  async function verifyOTPAndDelete() {
    const otp = el('otp-input').value.trim();
    
    if (!otp) {
      showError('Please enter the OTP.');
      return;
    }

    if (!currentBooking) {
      showError('No booking selected.');
      return;
    }

    const email = el('otp-email').value.trim();

    try {
      const body = new URLSearchParams({
        action: 'delete_booking',
        email: email,
        id: currentBooking.id,
        otp: otp
      });

      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      
      const data = await res.json();
      
      if (data.ok) {
        showSuccess('Booking deleted successfully!');
        closeBookingManagementModal();
        
        // Refresh the current view to show updated bookings
        await ensureDateLoaded(selectedDate);
        renderRows();
      } else {
        showError(data.error || 'Failed to delete booking.');
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      showError('Failed to delete booking. Please try again.');
    }
  }

  function showSuccess(message) {
    // Remove existing success messages
    document.querySelectorAll('.booking-success').forEach(el => el.remove());
    
    const successEl = document.createElement('div');
    successEl.className = 'booking-success';
    successEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 18px;">✅</span>
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: none; border: none; color: inherit; 
          font-size: 18px; cursor: pointer; margin-left: auto;
        ">×</button>
      </div>
    `;
    document.body.appendChild(successEl);
    
    setTimeout(() => {
      if (successEl.parentNode) {
        successEl.remove();
      }
    }, 5000);
  }

  function cssNumber(varName, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : fallback;
  }

  // ===== Date dropdown functionality =====
  const dd      = el('rsv-date');
  const btn     = el('rsv-date-btn');
  const labelEl = el('rsv-date-label');
  const menu    = el('rsv-date-menu');

  let selectedDate = new Date();
  let menuStart    = new Date(selectedDate); menuStart.setDate(menuStart.getDate() - 7);
  let menuEnd      = new Date(selectedDate); menuEnd.setDate(menuEnd.getDate() + 7);

  function initializeDateSelector() {
    // Always start with today's date, even if it's weekend/holiday
    // This way users see the restriction message
    selectedDate = new Date();
    labelEl.textContent = fmtCN(selectedDate);
    
    console.log('Initialized with today:', selectedDate.toDateString(), 'isWeekend/Holiday:', isWeekendOrHoliday(selectedDate));
    
    // Update menu range around today - start from today, not past dates
    menuStart = new Date(selectedDate); // Start from today
    menuEnd = new Date(selectedDate); menuEnd.setDate(menuEnd.getDate() + 28); // Show 4 weeks ahead
    
    initialMenu();
    
    // Don't call renderRows here to avoid showing the warning immediately
    // Only render when user actually interacts or when data is loaded
  }

  function makeItem(d) {
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isChineseHoliday = isChineseHolidayDate(d);
    const isRestricted = isWeekend || isChineseHoliday;
    
    const b = document.createElement('button');
    b.className = 'date-item';
    
    // Add special styling for restricted dates
    if (isRestricted) {
      b.classList.add('date-item-restricted');
    }
    
    if (sameDay(d, selectedDate)) b.classList.add('is-selected');
    if (sameDay(d, new Date()))  b.classList.add('is-today');
    
    b.dataset.date = fmtISO(d);
    
    // Show different text for restricted dates
    if (isRestricted) {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = dayNames[dayOfWeek];
      b.innerHTML = `
        <span class="date-main">${fmtCN(d)}</span>
        <span class="date-status">${isWeekend ? dayName : 'Holiday'}</span>
      `;
    } else {
      // Show day name for all dates, not just restricted ones
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = dayNames[dayOfWeek];
      b.innerHTML = `
        <span class="date-main">${fmtCN(d)}</span>
        <span class="date-status">${dayName}</span>
      `;
    }
    
    return b;
  }

  function renderRange(start, end, {prepend=false}={}) {
    const frag = document.createDocumentFragment();
    const cur = new Date(start);
    while(cur <= end) {
      const item = makeItem(new Date(cur));
      if (item) {
        frag.appendChild(item);
      }
      cur.setDate(cur.getDate()+1);
    }
    if (prepend) menu.prepend(frag); else menu.appendChild(frag);
  }

  function initialMenu() {
    menu.innerHTML = '';
    renderRange(menuStart, menuEnd);
    // Center on today's date instead of selected date
    const todayItem = menu.querySelector('.is-today');
    if (todayItem) {
      menu.scrollTop = todayItem.offsetTop - (menu.clientHeight/2 - todayItem.offsetHeight/2);
    }
  }

  btn.addEventListener('click', (e) => { e.stopPropagation(); dd.classList.toggle('open'); });
  document.addEventListener('click', (e) => { if(!dd.contains(e.target)) dd.classList.remove('open'); });

  menu.addEventListener('click', (e) => {
    const t = e.target.closest('.date-item'); 
    if(!t) return;
    const d = new Date(t.dataset.date); 
    if (isNaN(d)) return;

    selectedDate = d;
    labelEl.textContent = fmtCN(selectedDate);

    // Clear current selection when changing dates
    clearSelection();

    // Check if selected date is restricted
    if (isWeekendOrHoliday(selectedDate)) {
      console.log('Selected restricted date:', fmtISO(selectedDate));
      
      // Find next available date to suggest
      let nextAvailable = new Date(selectedDate);
      let attempts = 0;
      while (isWeekendOrHoliday(nextAvailable) && attempts < 14) {
        nextAvailable.setDate(nextAvailable.getDate() + 1);
        attempts++;
      }
      
      const nextDateText = attempts < 14 ? fmtCN(nextAvailable) : 'a weekday';
      
      // Show warning with suggestion
      showPersistentWarning(
        `Equipment booking is not available on weekends and Public holidays.<br><br>` +
        `<strong>Suggestion:</strong> Try booking for ${nextDateText} instead.<br><br>` +
        `You can scroll through the date dropdown to see available dates.`
      );
    }

         // Load bookings for the selected date (even if restricted, to show proper UI)
     console.log('Date changed to:', fmtISO(selectedDate));
     
     ensureDateLoaded(selectedDate).then(() => {
       console.log('Bookings loaded for selected date');
     }).catch(console.error);

     menu.querySelectorAll('.date-item.is-selected').forEach(x => x.classList.remove('is-selected'));
     t.classList.add('is-selected');
     dd.classList.remove('open');
     
     // Always scroll header back to beginning (09:00) when changing dates
     // This ensures users start viewing from the beginning of the timeline
     headerViewport.scrollTo({
       left: 0,
       behavior: 'smooth'
     });
     
     const today = new Date();
     if (sameDay(d, today)) {
       setTimeout(() => {
         scrollToCurrentTime();
       }, 100);
     }
     
     // Reposition the real-time indicator for the new date
     positionNowLine();
  });

  menu.addEventListener('scroll', () => {
    const TH = 60;
    if (menu.scrollTop < TH) {
      // Don't load past dates - only allow scrolling to future dates
      return;
    }

    if (menu.scrollHeight - menu.scrollTop - menu.clientHeight < TH) {
      const afterEnd = new Date(menuEnd); afterEnd.setDate(menuEnd.getDate() + 14);
      const start = new Date(menuEnd.getTime() + 86400000);
      renderRange(start, afterEnd, {prepend:false});
      menuEnd = afterEnd;
    }
  });

    /* ====== Apps Script endpoint ====== */
   const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw_Qaun32dCk4a75S_Xtp_rZnGiHSmL8gUJP6vW3GDNKjbTj9GtWaUjqlrGpxf_mRQzZg/exec';

  /* ====== Modal helpers & state ====== */
  let lastModal = { eq:null, sorted:[], start:'', end:'', hours:0, slots:[] };

  function mmddLabel(d) {
    return `${String(d.getMonth()+1).padStart(2, '0')}${String(d.getDate()).padStart(2,'0')}`;
  }

  function openModal(eq, start, end, hours, sorted) {
    // Double-check that we're not trying to book on restricted dates
    if (isWeekendOrHoliday(selectedDate)) {
      showPersistentWarning('Booking is not available on weekends and Public holidays.');
      return;
    }

    lastModal.eq = eq;
    lastModal.sorted = sorted.slice();
    lastModal.start = start;
    lastModal.end = end;
    lastModal.hours = hours;
    lastModal.slots = sorted.map(i => ({
      device: eq.name,
      date: fmtISO(selectedDate),
      start: timeline[i],
      end: timeline[i+1]
    }));

    el('rsv-modal-equip').textContent = eq.name || '';
    el('rsv-modal-model').textContent = eq.model || '';
    el('rsv-pill-date').textContent  = mmddLabel(selectedDate);
    el('rsv-pill-start').textContent = start;
    el('rsv-pill-end').textContent   = end;

    el('total-slots').textContent = `${sorted.length} slot${sorted.length > 1 ? 's' : ''}`;
    el('total-hours').textContent = `${hours.toFixed(1)} hours`;
    el('duration-info').style.display = 'block';

    el('rsv-success').hidden = true;
    el('rsv-form').style.display = '';
    el('rsv-modal').setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    el('rsv-modal').setAttribute('aria-hidden', 'true');
    el('rsv-form').reset();
    el('rsv-form').style.display = '';
    el('rsv-success').hidden = true;
    
    // Clear any pending modal opening
    if (modalOpenTimeout) {
      clearTimeout(modalOpenTimeout);
      modalOpenTimeout = null;
    }
  }

  function updateModalFromSelection(eq) {
    if (el('rsv-modal').getAttribute('aria-hidden') === 'true') return;
    if (selectedSlots.size === 0) return;
    
    // Enforce selection limit before updating modal
    if (selectedSlots.size > 10) {
      enforceSelectionLimit();
    }
    
    const sorted = Array.from(selectedSlots).sort((a,b)=>a-b);
    
    // Validation: ensure we're not exceeding 10 slots
    if (sorted.length > 10) {
      showError(`Cannot process ${sorted.length} slots. Maximum 10 slots (5 hours) allowed.`);
      return;
    }
    
    const start = timeline[sorted[0]];
    const end   = timeline[sorted[sorted.length-1] + 1];
    const hours = sorted.length * 0.5;

    lastModal.sorted = sorted;
    lastModal.start  = start;
    lastModal.end    = end;
    lastModal.hours  = hours;
    lastModal.slots  = sorted.map(i => ({
      device: eq.name,
      date: fmtISO(selectedDate),
      start: timeline[i],
      end: timeline[i+1]
    }));

    el('rsv-pill-start').textContent = start;
    el('rsv-pill-end').textContent   = end;
    el('total-slots').textContent    = `${sorted.length} slot${sorted.length > 1 ? 's' : ''}`;
    el('total-hours').textContent    = `${hours.toFixed(1)} hours`;
    
    // Clear any pending modal opening since we're updating an existing modal
    if (modalOpenTimeout) {
      clearTimeout(modalOpenTimeout);
      modalOpenTimeout = null;
    }
  }

  el('rsv-modal-close').addEventListener('click', closeModal);
  el('rsv-modal-backdrop').addEventListener('click', closeModal);

  /* Submit form */
     el('rsv-form').addEventListener('submit', async (e) => {
     e.preventDefault();

     // Final validation before submission
     if (isWeekendOrHoliday(selectedDate)) {
       showPersistentWarning('Cannot create booking on weekends and Chinese holidays.');
       return;
     }
     
     // Strict validation: ensure exactly 10 slots or fewer
     if (selectedSlots.size > 10) {
       enforceSelectionLimit();
       showError('Selection limit exceeded. Maximum 10 slots (5 hours) allowed. Please review your selection.');
       return;
     }
     
     // Additional validation: ensure no gaps are filled automatically
     if (lastModal.sorted.length !== selectedSlots.size) {
       showError('Selection mismatch detected. Please refresh and reselect your slots.');
       return;
     }
     
     // Debug logging to help identify the issue
     console.log('Form submission validation:');
     console.log('- Selected slots (selectedSlots):', Array.from(selectedSlots).sort((a, b) => a - b));
     console.log('- Modal slots (lastModal.sorted):', lastModal.sorted);
     console.log('- Total slots to book:', lastModal.sorted.length);
     console.log('- Expected maximum:', 10);
     
     // Final validation: ensure we're not exceeding 10 slots
     if (lastModal.sorted.length > 10) {
       showError(`Cannot book ${lastModal.sorted.length} slots. Maximum 10 slots (5 hours) allowed.`);
       return;
     }

     const name    = e.target.name.value.trim();
     const emailInput = document.getElementById('email-combined') || e.target.email;
     const email   = emailInput.value.trim();
     const purpose = e.target.purpose.value.trim();
     const training = el('rsv-agree').checked;

     if (!name || !email || !purpose || !training) {
       alert('Please complete all fields and accept training.');
       return;
     }

     // Validate email domain for split input
     const allowedDomains = ['@mail.sustech.edu.cn', '@sustech.edu.cn'];
     const isValidEmail = allowedDomains.some(domain => email.endsWith(domain));
     if (!isValidEmail) {
       alert('Email must end with @mail.sustech.edu.cn or @sustech.edu.cn');
       return;
     }

     if (!lastModal.slots.length) {
       alert('No slots selected.');
       return;
     }

     // Validate that no selected slots are in the past
     const hasPastSlots = lastModal.sorted.some(slotIndex => 
       isSlotInPast(slotIndex, selectedDate)
     );
     if (hasPastSlots) {
       showError('Cannot book past time slots. Please refresh and select future slots.');
       return;
     }

     // Disable submit button and show loading state
     const submitBtn = document.getElementById('submit-btn');
     const btnText = submitBtn.querySelector('.btn-text');
     const btnLoading = submitBtn.querySelector('.btn-loading');
     
     submitBtn.disabled = true;
     btnText.style.opacity = '0';
     btnLoading.style.display = 'inline-block';
     submitBtn.style.opacity = '0.7';

     const body = new URLSearchParams({
       action: 'create_booking',
       name, email, purpose,
       training: training ? 'true' : 'false',
       slots: JSON.stringify(lastModal.slots)
     });

     try {
       const res = await fetch(SCRIPT_URL, {
         method: 'POST',
         headers: { 'Content-Type':'application/x-www-form-urlencoded' },
         body
       });
       
       const data = await res.json();
       if (!data.ok) throw new Error(data.error || 'Unknown error');

       el('rsv-success-start').textContent = `${mmddLabel(selectedDate)} ${lastModal.start}`;
       el('rsv-success-equip').textContent = `${lastModal.eq.name} ${lastModal.eq.model}`;
       el('rsv-form').style.display = 'none';
       el('rsv-success').hidden = false;

       // Add booking to cache immediately for instant UI update
       const dateKey = fmtISO(selectedDate);
       bookingsByDate[dateKey] = bookingsByDate[dateKey] || Object.create(null);
       const dev = lastModal.eq.name;
       bookingsByDate[dateKey][dev] = bookingsByDate[dateKey][dev] || [];
       
       // Create individual bookings for each selected slot to prevent filling gaps
       lastModal.sorted.forEach(slotIndex => {
         bookingsByDate[dateKey][dev].push({
           startSlot: slotIndex,
           endSlot: slotIndex + 1, // Each slot covers exactly one 30-minute period
           name,
           purpose,
           email,
           id: data.booking_id // Use the booking ID from server response
         });
       });
       
       // Debug logging to show exactly what was booked
       console.log('Booking created successfully:');
       console.log('- Total slots booked:', lastModal.sorted.length);
       console.log('- Slots booked:', lastModal.sorted);
       console.log('- Individual bookings created:', lastModal.sorted.length);
       console.log('- No automatic gap filling - only selected slots are booked');
       
       renderRows();
       clearSelection();
       
       // Reset submit button state after successful booking
       submitBtn.disabled = false;
       btnText.style.opacity = '1';
       btnLoading.style.display = 'none';
       submitBtn.style.opacity = '1';
       
       // No need to refresh from server - booking already added to cache and UI updated

     } catch (err) {
       showError('Booking failed: ' + err.message);
       
       // Re-enable submit button on error
       submitBtn.disabled = false;
       btnText.style.opacity = '1';
       btnLoading.style.display = 'none';
       submitBtn.style.opacity = '1';
     }
   });
  
  el('rsv-success-back').addEventListener('click', () => {
    el('rsv-success').hidden = true;
    el('rsv-form').style.display = '';
    closeModal();
  });

  // Add booking management modal HTML
  const bookingManagementModal = document.createElement('div');
  bookingManagementModal.id = 'booking-management-modal';
  bookingManagementModal.setAttribute('aria-hidden', 'true');
  bookingManagementModal.innerHTML = `
    <div class="modal-backdrop" id="booking-management-backdrop"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h2 id="booking-management-title">Booking Details</h2>
        <button class="modal-close" id="booking-management-close">&times;</button>
      </div>
      <div class="modal-body">
        <div id="booking-details-view">
          <div class="booking-info-grid">
            <div class="info-row">
              <label>Name:</label>
              <span id="booking-name"></span>
            </div>
            <div class="info-row">
              <label>Email:</label>
              <span id="booking-email"></span>
            </div>
            <div class="info-row">
              <label>Purpose:</label>
              <span id="booking-purpose"></span>
            </div>
            <div class="info-row">
              <label>Equipment:</label>
              <span id="booking-equipment"></span>
            </div>
            <div class="info-row">
              <label>Date:</label>
              <span id="booking-date"></span>
            </div>
            <div class="info-row">
              <label>Time:</label>
              <span id="booking-time"></span>
            </div>
          </div>
          <div class="booking-actions">
            <button id="change-appointment-btn" class="btn-secondary">CHANGE APPOINTMENT</button>
          </div>
        </div>
        
        <div id="otp-verification-view" style="display: none;">
          <div class="otp-section">
            <h3>Enter your email to receive OTP</h3>
            <div class="form-group">
              <label for="otp-email">Email:</label>
              <input type="email" id="otp-email" placeholder="Enter your email" required>
            </div>
            <button id="send-otp-btn" class="btn-primary">Send OTP</button>
          </div>
          
          <div id="otp-input-section" style="display: none;">
            <h3>Enter OTP from your email</h3>
            <div class="form-group">
              <label for="otp-input">OTP:</label>
              <input type="text" id="otp-input" placeholder="Enter 6-digit OTP" maxlength="6" required>
            </div>
            <button id="verify-otp-btn" class="btn-primary">Verify & Delete</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(bookingManagementModal);

  // Add event listeners for booking management modal
  el('booking-management-close').addEventListener('click', closeBookingManagementModal);
  el('booking-management-backdrop').addEventListener('click', closeBookingManagementModal);
  el('change-appointment-btn').addEventListener('click', showOTPVerification);
  el('send-otp-btn').addEventListener('click', sendOTP);
  el('verify-otp-btn').addEventListener('click', verifyOTPAndDelete);
  
  

  // Store current booking being managed
  let currentBooking = null;

  function positionNowLine() {
    try {
      const schedule = document.querySelector('.reservation-schedule');
      if (!schedule || !headerViewport) {
        console.log('PositionNowLine: Missing required elements', { schedule: !!schedule, headerViewport: !!headerViewport });
        return;
      }
      if (!Array.isArray(timeline) || timeline.length < 2) {
        console.log('PositionNowLine: Invalid timeline', { timeline: timeline });
        return;
      }

      // Check if selected date is today
      const today = new Date();
      const isToday = sameDay(selectedDate, today);
      
      // Debug logging
      console.log('Positioning now line:', {
        isToday,
        selectedDate: fmtISO(selectedDate),
        today: fmtISO(today),
        currentTime: new Date().toLocaleTimeString()
      });

      if (typeof nowLineGlobal !== 'undefined' && nowLineGlobal) {
        if (!isToday) {
          // If not today, hide the time indicator
          nowLineGlobal.style.display = 'none';
          return;
        }

        // Only show time indicator for today
        const startMin = t2m(RSV_START_TIME);
        const endMin   = t2m(RSV_END_TIME);
        const now      = new Date();
        const nowMin   = now.getHours()*60 + now.getMinutes();
        const m        = Math.min(Math.max(nowMin, startMin), endMin);
        
        // Debug logging for time calculation
        console.log('Time calculation:', {
          startMin,
          endMin,
          nowMin,
          m,
          RSV_START_TIME,
          RSV_END_TIME,
          currentTime: now.toLocaleTimeString()
        });

        // Use consistent values that match the CSS
        const LEFT_PAD = 10; // Match the timebar padding-left: 10px
        const GAP      = cssNumber('--rsv-gap', 10);
        const SLOT_W   = cssNumber('--rsv-slot-w', 120);
        const SEG_W    = SLOT_W + GAP;

        // Calculate which slot the current time falls into
        let slotIndex = Math.floor((m - startMin) / RSV_STEP_MIN);
        let positionInSlot = 0;
        
        let xInside;
        if (m < startMin) {
          // If current time is before 09:00, position at the very left edge of the first time header
          slotIndex = 0;
          xInside = LEFT_PAD; // Start exactly at the left edge of the first time header
        } else {
          const slotStartMin = startMin + (slotIndex * RSV_STEP_MIN);
          // Calculate position within the slot (0 = start, 1 = end)
          positionInSlot = (m - slotStartMin) / RSV_STEP_MIN;
          
          // Ensure positionInSlot doesn't exceed 1.0 (end of slot)
          positionInSlot = Math.min(positionInSlot, 1.0);
          
          // Position the line at the precise real-time position within the slot
          // Add a small offset to account for the visual appearance of the line
          xInside = LEFT_PAD + (slotIndex * SEG_W) + (positionInSlot * SLOT_W) - 1;
        }
        
        const xInView = xInside - headerViewport.scrollLeft;
        const inView = xInView >= 0 && xInView <= headerViewport.clientWidth;

        if (inView) {
          const schedLeft  = schedule.getBoundingClientRect().left + window.scrollX;
          const headerLeft = headerViewport.getBoundingClientRect().left + window.scrollX;
          const xPage      = headerLeft + xInView;
          const xSched     = xPage - schedLeft;
          
          const scheduleTop = schedule.getBoundingClientRect().top + window.scrollY;
          const headerTop = headerViewport.getBoundingClientRect().top + window.scrollY;
          const indicatorStartTop = headerTop - scheduleTop;
          
          // Debug logging for positioning
          console.log('Now line positioning:', {
            xInside,
            xInView,
            xSched,
            indicatorStartTop,
            LEFT_PAD,
            GAP,
            SLOT_W,
            SEG_W,
            slotIndex,
            positionInSlot
          });
          
          nowLineGlobal.style.display = 'block';
          nowLineGlobal.style.left = `${xSched}px`;
          nowLineGlobal.style.top = `${indicatorStartTop}px`;
        } else {
          nowLineGlobal.style.display = 'none';
        }
      }
    } catch (error) {
      console.error('Error in positionNowLine:', error);
    }
  }

  function scrollToCurrentTime() {
    if (!headerViewport || !Array.isArray(timeline) || timeline.length < 2) return;
    
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const startMin = t2m(RSV_START_TIME);
    const endMin = t2m(RSV_END_TIME);
    
    const m = Math.min(Math.max(nowMin, startMin), endMin);
    let slotIndex = Math.floor((m - startMin) / RSV_STEP_MIN);
    
    // If current time is before the first slot, scroll to the beginning of the first slot
    if (m < startMin) {
      slotIndex = 0;
    }
    
    // Use consistent values that match the CSS
    const LEFT_PAD = 10; // Match the timebar padding-left: 10px
    const GAP = cssNumber('--rsv-gap', 10);
    const SLOT_W = cssNumber('--rsv-slot-w', 120);
    const SEG_W = SLOT_W + GAP;
    
    // Position the scroll to show the start of the current slot
    const slotPosition = LEFT_PAD + (slotIndex * SEG_W);
    const viewportWidth = headerViewport.clientWidth;
    const targetScrollLeft = slotPosition - (viewportWidth / 4);
    const finalScrollLeft = Math.max(0, targetScrollLeft);
    
    headerViewport.scrollTo({
      left: finalScrollLeft,
      behavior: 'smooth'
    });
  }

})();