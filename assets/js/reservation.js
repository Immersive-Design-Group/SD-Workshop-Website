(() => {
  document.addEventListener('DOMContentLoaded', init);

  /* ===== Config ===== */
  const RSV_START_TIME = "09:00";
  const RSV_END_TIME   = "22:00";
  const RSV_STEP_MIN   = 30;

  /* layout constants (must match CSS) */
  const GAP    = cssNumber('--rsv-gap', 10);         // gap between boxes
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

  function normalizeImage(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;     // full URL
  if (url.startsWith("/")) return (window.RSV_BASEURL || "") + url;  // absolute site path
  // otherwise treat as filename in /assets/reservation/
  return (window.RSV_ASSETS || "") + url;
}


  function getEquipment() {
    const arr = (window.RSV_EQUIPMENT || []);
    return Array.isArray(arr) ? arr : [];
  }

  /* DOM refs */
  let headerViewport, timebar, nowLineGlobal, rowsRoot, timeline;
  
     /* Multi-slot selection */
   let selectedSlots = new Set();
   let isSelecting = false;
   let currentEquipment = null;

  function init() {
    headerViewport = el('rsv-header-viewport');
    timebar        = el('rsv-timebar');
    nowLineGlobal  = el('rsv-now-line-global'); // from the include
    rowsRoot       = el('rsv-rows');

    timeline = buildTimeline(RSV_START_TIME, RSV_END_TIME, RSV_STEP_MIN);

    renderHeader();
    renderRows();
    setupSync();
    positionNowLine();
    
    // Scroll to current time slot on page load
    setTimeout(() => {
      scrollToCurrentTime();
    }, 100); // Small delay to ensure DOM is fully rendered
    
    setInterval(positionNowLine, 60 * 1000);
    
                 // Add keyboard shortcuts
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          clearSelection();
        }
        if (e.key === 'Enter' && selectedSlots.size > 0 && currentEquipment) {
          openModalWithSelectedSlots(currentEquipment);
        }
      });
     
           // Handle window resize for responsive scroll step
      window.addEventListener('resize', () => {
        // Debounce resize events to avoid excessive recalculations
        clearTimeout(window.resizeTimeout);
        window.resizeTimeout = setTimeout(() => {
          // Force reflow to ensure accurate measurements
          headerViewport.offsetHeight;
        }, 100);
      });
  }

  function renderHeader() {
  timebar.innerHTML = '';
  // Loop through the timeline to create a label for each slot
  for (let i = 0; i < timeline.length - 1; i++) {
    const startTime = timeline[i];

    const d = document.createElement('div');
    d.className = 'time-label';
    // Create the label text with just the start time like "09:00"
    d.textContent = startTime;
    timebar.appendChild(d);
  }
}

  function renderRows() {
  rowsRoot.innerHTML = '';
  const eqs = getEquipment();

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

    // Check for existing bookings and render them first
    const existingBookings = getExistingBookings(eq);
    
    // render slots with existing bookings
    for (let i = 0; i < timeline.length - 1; i++) {
      const cell = document.createElement('div');
      const isBooked = existingBookings.some(booking => 
        i >= booking.startSlot && i < booking.endSlot
      );
      
      if (isBooked) {
        // Find the booking for this slot
        const booking = existingBookings.find(b => 
          i >= b.startSlot && i < b.endSlot
        );
        
        cell.className = 'slot booked';
        cell.dataset.slotIndex = i;
        cell.dataset.equipmentId = eq.name;
        
        // Only show booking info on the first slot of each booking
        if (i === booking.startSlot) {
          cell.innerHTML = `
            <div class="booking-info">
              <div class="booking-time">${timeline[booking.startSlot]}-${timeline[booking.endSlot]}</div>
              <div class="booking-user">
                <div class="user-initial">${getInitial(booking.name)}</div>
                <span>${booking.name}</span>
              </div>
              <div class="booking-purpose">${booking.purpose}</div>
            </div>
          `;
        }
      } else {
        cell.className = 'slot available';
        cell.dataset.slotIndex = i;
        cell.dataset.equipmentId = eq.name;
        
                                 // Multi-slot selection events
          cell.addEventListener('mousedown', (e) => {
            startSelection(e, eq, i);
          });
          
          cell.addEventListener('mouseenter', (e) => {
            if (isSelecting) {
              updateSelection(e, eq, i);
            }
          });
          
          cell.addEventListener('mouseup', (e) => {
            endSelection(e, eq, i);
          });
          
          // Single click handler for selecting slots only
          cell.addEventListener('click', (e) => {
            // Single click only selects (doesn't toggle)
            if (!selectedSlots.has(i)) {
              addSlotToSelection(eq, i);
            }
          });
          
          // Double-click handler for unselecting slots
          cell.addEventListener('dblclick', (e) => {
            e.preventDefault();
            // Double-click unselects the slot
            if (selectedSlots.has(i)) {
              selectedSlots.delete(i);
              const slotElement = document.querySelector(`[data-slot-index="${i}"][data-equipment-id="${eq.name}"]`);
              if (slotElement) {
                slotElement.classList.remove('selected');
                slotElement.classList.add('available');
              }
            }
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

    // keep row viewports in lockstep with header
    headerViewport.addEventListener('scroll', () => {
      const x = headerViewport.scrollLeft;
      vpRows().forEach(v => v.scrollLeft = x);
      positionNowLine();
    });

    // block wheel/touch scrolling – arrows only
    ['wheel','touchmove'].forEach(evt => {
      headerViewport.addEventListener(evt, e => e.preventDefault(), { passive:false });
    });

    // arrows
    // Responsive scroll step: fewer slots on smaller devices
    const getScrollStep = () => {
      const viewportWidth = window.innerWidth;
      if (viewportWidth <= 480) return slotW() * 1;      // 1 slot on mobile
      if (viewportWidth <= 768) return slotW() * 2;      // 2 slots on tablet
      if (viewportWidth <= 1024) return slotW() * 3;     // 3 slots on small desktop
      return slotW() * 6;                                 // 6 slots on large desktop
    };
    
    el('rsv-arrow-left') .addEventListener('click', () => {
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
      e.preventDefault();
      // Set selection mode immediately for drag operations
      isSelecting = true;
      currentEquipment = eq;
      
      // Start with the initial slot - this fixes the "first slot not selectable" issue
      addSlotToSelection(eq, slotIndex);
      
      // Add visual feedback
      document.body.style.userSelect = 'none';
    }
   
   function updateSelection(e, eq, slotIndex) {
     if (!isSelecting || currentEquipment?.name !== eq.name) return;
     
     // Add slot to selection (don't toggle during drag)
     addSlotToSelection(eq, slotIndex);
   }
   
               function endSelection(e, eq, slotIndex) {
       if (!isSelecting) return;
       
       isSelecting = false;
       document.body.style.userSelect = '';
       
       // Add final slot if not already selected
       if (!selectedSlots.has(slotIndex)) {
         addSlotToSelection(eq, slotIndex);
       }
       
       // Reset dragging state after a short delay to allow click events to process
       setTimeout(() => {
         isDragging = false;
       }, 100);
     }
   
       function addSlotToSelection(eq, slotIndex) {
      // Check 5-hour limit (10 slots) - but allow if we're under the limit
      if (selectedSlots.size >= 10) {
        // At limit - don't show message during drag, just return silently
        return;
      }
      
      // Only add if not already selected
      if (!selectedSlots.has(slotIndex)) {
        selectedSlots.add(slotIndex);
        
        // Update visual state
        const slotElement = document.querySelector(`[data-slot-index="${slotIndex}"][data-equipment-id="${eq.name}"]`);
        if (slotElement && slotElement.classList.contains('available')) {
          slotElement.classList.add('selected');
          slotElement.classList.remove('available');
        }
      }
    }
   
       function toggleSlotSelection(eq, slotIndex) {
      const slotElement = document.querySelector(`[data-slot-index="${slotIndex}"][data-equipment-id="${eq.name}"]`);
      
      if (!slotElement || slotElement.classList.contains('booked')) {
        return; // Cannot select booked slots
      }
      
      if (selectedSlots.has(slotIndex)) {
        // Remove from selection (always allowed, even at limit)
        selectedSlots.delete(slotIndex);
        slotElement.classList.remove('selected');
        slotElement.classList.add('available');
      } else {
        // Add to selection (check 5-hour limit)
        if (selectedSlots.size < 10) {
          selectedSlots.add(slotIndex);
          slotElement.classList.add('selected');
          slotElement.classList.remove('available');
        } else {
          // At limit - show helpful message only once
          if (!document.querySelector('.limit-message')) {
            showLimitMessage();
          }
          return;
        }
      }
    }
  
           function clearSelection() {
      selectedSlots.clear();
      
      // Remove visual selection from all slots
      document.querySelectorAll('.slot.selected').forEach(slot => {
        slot.classList.remove('selected');
        slot.classList.add('available');
      });
    }
   
   
   
                   // Show helpful message when trying to select at limit
    function showLimitMessage() {
      // Check if message already exists
      if (document.querySelector('.limit-message')) {
        return; // Don't create multiple messages
      }
      
      // Create a temporary message element
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
        </div>
      `;
      
      // Add to page
      document.body.appendChild(message);
      
      // Click outside to close
      message.addEventListener('click', (e) => {
        if (e.target === message) {
          message.remove();
        }
      });
      
      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        if (message.parentNode) {
          message.parentNode.removeChild(message);
        }
      }, 3000);
    }
  
  function openModalWithSelectedSlots(eq) {
  if (selectedSlots.size === 0) return;
  
  // Sort slots by index
  const sortedSlots = Array.from(selectedSlots).sort((a, b) => a - b);
  const startTime = timeline[sortedSlots[0]];
  const endTime = timeline[sortedSlots[sortedSlots.length - 1] + 1];
  const totalHours = selectedSlots.size * 0.5; // 30 min = 0.5 hours
  
  openModal(eq, startTime, endTime, totalHours, sortedSlots);
}

// Helper functions
function getInitial(name) {
  return name ? name.charAt(0).toUpperCase() : '?';
}

// Get existing bookings for an equipment
function getExistingBookings(eq) {
  // Demo data - in real implementation, fetch from database
  const staticBookings = {
    '3D Printer 1': [
      {
        startSlot: 0,
        endSlot: 4, // 2 hours (4 slots)
        name: 'Liu Ming',
        purpose: '课题组 Candy project'
      }
    ],
    'Laser Cutter': [
      {
        startSlot: 3,
        endSlot: 7, // 2 hours (4 slots)
        name: 'Zhang Wei',
        purpose: 'Prototype cutting'
      }
    ]
  };
  
  // Combine static demo data with dynamic user bookings
  const staticData = staticBookings[eq.name] || [];
  const dynamicData = window.demoBookings?.[eq.name] || [];
  
  return [...staticData, ...dynamicData];
}

// Admin helper functions
function checkIfSlotsBooked(eq, slotIndices) {
  const existingBookings = getExistingBookings(eq);
  return existingBookings.some(booking => 
    slotIndices.some(slotIndex => 
      slotIndex >= booking.startSlot && slotIndex < booking.endSlot
    )
  );
}

function showAdminInfo(eq, slotIndices) {
  // Demo data - in real implementation, fetch from database
  const demoBookingData = {
    '3D Printer 1': {
      name: 'Liu Ming',
      phone: '138-0013-8000',
      email: 'liuming@example.com',
      purpose: '课题组 Candy project'
    },
    'Laser Cutter': {
      name: 'Zhang Wei',
      phone: '139-0013-9000',
      email: 'zhangwei@example.com',
      purpose: 'Prototype cutting'
    }
  };
  
  const bookingData = demoBookingData[eq.name] || {};
  
  el('booked-by-name').textContent = bookingData.name || '--';
  el('booked-by-phone').textContent = bookingData.phone || '--';
  el('booked-by-email').textContent = bookingData.email || '--';
}

  // Helper: read a numeric CSS variable (falls back if missing)
  function cssNumber(varName, fallback){
    const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : fallback;
}

// ===== Date dropdown (LEFT side): today by default =====
/* ===== Scrollable Date Dropdown (LEFT) ===== */
const dd      = el('rsv-date');        // wrapper
const btn     = el('rsv-date-btn');    // button that opens menu
const labelEl = el('rsv-date-label');  // visible label text
const menu    = el('rsv-date-menu');   // scrollable list container

function fmtCN(d){ return `${d.getMonth()+1}月${d.getDate()}日`; }
function fmtISO(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function sameDay(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }

let selectedDate = new Date();
let menuStart    = new Date(selectedDate); menuStart.setDate(menuStart.getDate() - 7);  // initial window: -7 …
let menuEnd      = new Date(selectedDate); menuEnd.setDate(menuEnd.getDate() + 7);      // … to +7 days
labelEl.textContent = fmtCN(selectedDate);

function makeItem(d){
  // Check if it's a weekend (Saturday = 6, Sunday = 0)
  const dayOfWeek = d.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  // Check if it's a Chinese holiday
  const isChineseHoliday = isChineseHolidayDate(d);
  
  // If it's a weekend or Chinese holiday, return null to skip it
  if (isWeekend || isChineseHoliday) {
    return null;
  }
  
  const b = document.createElement('button');
  b.className = 'date-item';
  if (sameDay(d, selectedDate)) b.classList.add('is-selected');
  if (sameDay(d, new Date()))  b.classList.add('is-today');
  b.dataset.date = fmtISO(d);
  b.textContent  = fmtCN(d);
  return b;
}

// Function to check if a date is a Chinese holiday
function isChineseHolidayDate(date) {
  const month = date.getMonth() + 1; // getMonth() returns 0-11
  const day = date.getDate();
  const year = date.getFullYear();
  
  // Chinese New Year (Lunar calendar - approximate dates for 2024-2025)
  // 2024: Feb 10-17, 2025: Jan 29-Feb 4
  if (year === 2024 && month === 2 && day >= 10 && day <= 17) return true;
  if (year === 2025 && month === 1 && day >= 29) return true;
  if (year === 2025 && month === 2 && day <= 4) return true;
  
  // Qingming Festival (Tomb Sweeping Day) - April 5
  if (month === 4 && day === 5) return true;
  
  // Labor Day - May 1
  if (month === 5 && day === 1) return true;
  
  // Dragon Boat Festival (Lunar calendar - approximate dates)
  // 2024: June 10, 2025: May 31
  if (year === 2024 && month === 6 && day === 10) return true;
  if (year === 2025 && month === 5 && day === 31) return true;
  
  // National Day - October 1-7
  if (month === 10 && day >= 1 && day <= 7) return true;
  
  // Mid-Autumn Festival (Lunar calendar - approximate dates)
  // 2024: Sep 17, 2025: Oct 6
  if (year === 2024 && month === 9 && day === 17) return true;
  if (year === 2025 && month === 10 && day === 6) return true;
  
  // New Year's Day - January 1
  if (month === 1 && day === 1) return true;
  
  return false;
}

function renderRange(start, end, {prepend=false}={}){
  const frag = document.createDocumentFragment();
  const cur = new Date(start);
  while(cur <= end){
    const item = makeItem(new Date(cur));
    if (item) { // Only add non-weekend dates
      frag.appendChild(item);
    }
    cur.setDate(cur.getDate()+1);
  }
  if (prepend) menu.prepend(frag); else menu.appendChild(frag);
}

function initialMenu(){
  menu.innerHTML = '';
  renderRange(menuStart, menuEnd);
  // center the selected/today in view
  const sel = menu.querySelector('.is-selected') || menu.querySelector('.is-today');
  if (sel) menu.scrollTop = sel.offsetTop - (menu.clientHeight/2 - sel.offsetHeight/2);
}
initialMenu();

// Open/close
btn.addEventListener('click', (e)=>{ e.stopPropagation(); dd.classList.toggle('open'); });
document.addEventListener('click', (e)=>{ if(!dd.contains(e.target)) dd.classList.remove('open'); });

  // Choose a date
  menu.addEventListener('click', (e)=>{
    const t = e.target.closest('.date-item'); if(!t) return;
    const d = new Date(t.dataset.date); if (isNaN(d)) return;

    selectedDate = d;
    labelEl.textContent = fmtCN(selectedDate);

    // Update selection styles
    menu.querySelectorAll('.date-item.is-selected').forEach(x => x.classList.remove('is-selected'));
    t.classList.add('is-selected');

    dd.classList.remove('open');

    // TODO: re-fetch your bookings for 'selectedDate' + re-render rows
    
    // If it's today's date, scroll to current time
    const today = new Date();
    if (sameDay(d, today)) {
      setTimeout(() => {
        scrollToCurrentTime();
      }, 100);
    }
  });

// Infinite scroll (prepend older / append newer)
menu.addEventListener('scroll', ()=>{
  const TH = 60; // px threshold
  // When user nears the TOP -> load OLDER dates
  if (menu.scrollTop < TH){
    const beforeStart = new Date(menuStart); beforeStart.setDate(menuStart.getDate() - 14);
    const oldFirst = menu.firstElementChild ? menu.firstElementChild.offsetTop : 0;

    renderRange(beforeStart, new Date(menuStart.getTime() - 86400000), {prepend:true});
    menuStart = beforeStart;

    // keep visual position stable after prepending
    const newFirst = menu.firstElementChild ? menu.firstElementChild.offsetTop : 0;
    menu.scrollTop += (newFirst - oldFirst);
  }

  // When user nears the BOTTOM -> load NEWER dates
  if (menu.scrollHeight - menu.scrollTop - menu.clientHeight < TH){
    const afterEnd = new Date(menuEnd); afterEnd.setDate(menuEnd.getDate() + 14);
    const start = new Date(menuEnd.getTime() + 86400000);
    renderRange(start, afterEnd, {prepend:false});
    menuEnd = afterEnd;
  }
});

document.addEventListener('click', (e)=>{ if(!dd.contains(e.target)) dd.classList.remove('open'); });



  function positionNowLine(){
  // Bail out quietly if key DOM nodes aren't there yet
  const schedule = document.querySelector('.reservation-schedule');
  if (!schedule || !headerViewport) return;
  // timeline must exist and have at least 2 items
  if (!Array.isArray(timeline) || timeline.length < 2) return;

  // Time math
  const startMin = t2m(RSV_START_TIME);
  const endMin   = t2m(RSV_END_TIME);
  const now      = new Date();
  const nowMin   = now.getHours()*60 + now.getMinutes();
  const m        = Math.min(Math.max(nowMin, startMin), endMin); // clamp for math

  // Layout numbers from CSS so we don't depend on other JS globals
  const LEFT_PAD = cssNumber('--rsv-leftpad', 10);
  const GAP      = cssNumber('--rsv-gap', 10);
  const SLOT_W   = cssNumber('--rsv-slot-w', 80); // Use the correct slot width from CSS
  const SEG_W    = SLOT_W + GAP;

  const totalSeg = (timeline.length - 1);
  const frac     = (m - startMin) / (endMin - startMin);         // 0..1 across full range
  const xInside  = LEFT_PAD + frac * (SEG_W * totalSeg);         // inside header content

  // Position relative to the current header viewport
  const xInView  = xInside - headerViewport.scrollLeft;
  const inView   = xInView >= 0 && xInView <= headerViewport.clientWidth;

  // Tall global line (spans all rows), only when visible
  if (typeof nowLineGlobal !== 'undefined' && nowLineGlobal) {
    if (inView) {
      // Convert header-relative X to schedule-container coords using DOM rects
      const schedLeft  = schedule.getBoundingClientRect().left + window.scrollX;
      const headerLeft = headerViewport.getBoundingClientRect().left + window.scrollX;
      const xPage      = headerLeft + xInView;          // absolute page X of the header line
      const xSched     = xPage - schedLeft;             // schedule container coords
      
      // Calculate the correct starting position for the indicator line
      // Position it to start from the time header level, not from the very top
      const scheduleTop = schedule.getBoundingClientRect().top + window.scrollY;
      const headerTop = headerViewport.getBoundingClientRect().top + window.scrollY;
      const indicatorStartTop = headerTop - scheduleTop;
      
      nowLineGlobal.style.display = 'block';
      nowLineGlobal.style.left = `${xSched}px`;
      nowLineGlobal.style.top = `${indicatorStartTop}px`;
    } else {
      nowLineGlobal.style.display = 'none';
    }
  }
}

  // Function to scroll to current time slot
  function scrollToCurrentTime() {
    if (!headerViewport || !Array.isArray(timeline) || timeline.length < 2) return;
    
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const startMin = t2m(RSV_START_TIME);
    const endMin = t2m(RSV_END_TIME);
    
    // Clamp current time to valid range
    const m = Math.min(Math.max(nowMin, startMin), endMin);
    
    // Calculate which slot we should scroll to
    const slotIndex = Math.floor((m - startMin) / RSV_STEP_MIN);
    
    // Calculate the scroll position to center the current time slot
    const LEFT_PAD = cssNumber('--rsv-leftpad', 10);
    const GAP = cssNumber('--rsv-gap', 10);
    const SLOT_W = cssNumber('--rsv-slot-w', 80);
    const SEG_W = SLOT_W + GAP;
    
    // Calculate the position of the current time slot
    const slotPosition = LEFT_PAD + (slotIndex * SEG_W);
    
    // Calculate viewport width and center the slot
    const viewportWidth = headerViewport.clientWidth;
    const targetScrollLeft = slotPosition - (viewportWidth / 2) + (SLOT_W / 2);
    
    // Ensure we don't scroll past the beginning
    const finalScrollLeft = Math.max(0, targetScrollLeft);
    
    // Smooth scroll to the current time slot
    headerViewport.scrollTo({
      left: finalScrollLeft,
      behavior: 'smooth'
    });
  }

})();

/* ----- Modal ----- */
const modal = el('rsv-modal');
function openModal(eq, start, end, totalHours = 0.5, selectedSlotIndices = []) {
  el('rsv-modal-equip').textContent = eq.name;
  el('rsv-modal-model').textContent = eq.model;
  // Show the currently selected date
  el('rsv-pill-date').textContent = fmtCN(selectedDate);
  el('rsv-pill-start').textContent = start;
  el('rsv-pill-end').textContent = end;
  
  // Show duration info for multiple slots
  const durationInfo = el('duration-info');
  const totalSlotsEl = el('total-slots');
  const totalHoursEl = el('total-hours');
  
  if (totalHours > 0.5) {
    totalSlotsEl.textContent = `${selectedSlotIndices.length} slots`;
    totalHoursEl.textContent = `${totalHours} hours`;
    durationInfo.style.display = 'grid';
  } else {
    durationInfo.style.display = 'none';
  }
  
  // Check if this is admin view (check if slots are already booked)
  const isAdminView = checkIfSlotsBooked(eq, selectedSlotIndices);
  const adminInfo = el('admin-info');
  const form = el('rsv-form');
  
  if (isAdminView) {
    // Show admin info, hide form
    showAdminInfo(eq, selectedSlotIndices);
    adminInfo.style.display = 'grid';
    form.style.display = 'none';
  } else {
    // Show form, hide admin info
    adminInfo.style.display = 'none';
    form.style.display = 'grid';
  }
  
  modal.setAttribute('aria-hidden','false');
}

function closeModal(){ 
  modal.setAttribute('aria-hidden','true');
  clearSelection(); // Clear selection when modal closes
  
  // Reset form display
  const form = el('rsv-form');
  const adminInfo = el('admin-info');
  form.style.display = 'grid';
  adminInfo.style.display = 'none';
}

el('rsv-modal-close').addEventListener('click', closeModal);
el('rsv-modal-backdrop').addEventListener('click', closeModal);



el('rsv-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  if(!el('rsv-agree').checked) return;

  const form = new FormData(e.target);
  const sortedSlots = Array.from(selectedSlots).sort((a, b) => a - b);
  
  const payload = {
    name: form.get('name'),
    phone: form.get('phone'),
    email: form.get('email'),
    purpose: form.get('purpose') || '',
    equipment: el('rsv-modal-equip').textContent,
    model: el('rsv-modal-model').textContent,
    date: el('rsv-pill-date').textContent,
    start: el('rsv-pill-start').textContent,
    end: el('rsv-pill-end').textContent,
    totalSlots: selectedSlots.size,
    totalHours: selectedSlots.size * 0.5,
    selectedSlotIndices: sortedSlots
  };

  /* TODO: Replace with Supabase insert */
  console.log('Reservation payload →', payload);

  // Create new booking in demo data
  createNewBooking(payload);

  closeModal();
  alert(`Booked ${selectedSlots.size} slots (${selectedSlots.size * 0.5}h) successfully! Hook this to Supabase.`);
  
  // Re-render rows to show new booking
  renderRows();
});

// Create new booking (demo function)
function createNewBooking(payload) {
  // In real implementation, this would be a database insert
  // For demo, we'll add to our demo data
  const equipmentName = payload.equipment;
  const startSlot = payload.selectedSlotIndices[0];
  const endSlot = payload.selectedSlotIndices[payload.selectedSlotIndices.length - 1] + 1;
  
  // Add to demo bookings (this would be database insert in production)
  if (!window.demoBookings) window.demoBookings = {};
  if (!window.demoBookings[equipmentName]) window.demoBookings[equipmentName] = [];
  
  window.demoBookings[equipmentName].push({
    startSlot: startSlot,
    endSlot: endSlot,
    name: payload.name,
    purpose: payload.purpose
  });
}
