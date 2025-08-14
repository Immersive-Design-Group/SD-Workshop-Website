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
  let headerViewport, timebar, nowLineHeader, nowLineGlobal, rowsRoot, timeline;

  function init() {
    headerViewport = el('rsv-header-viewport');
    timebar        = el('rsv-timebar');
    nowLineHeader  = el('rsv-now-line');
    nowLineGlobal  = el('rsv-now-line-global'); // from the include
    rowsRoot       = el('rsv-rows');

    timeline = buildTimeline(RSV_START_TIME, RSV_END_TIME, RSV_STEP_MIN);

    renderHeader();
    renderRows();
    setupSync();
    positionNowLine();
    setInterval(positionNowLine, 60 * 1000);
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

      // render EMPTY 30-min cells
      for (let i = 0; i < timeline.length - 1; i++) {
        const cell = document.createElement('div');
        cell.className = 'slot available';
        // click handler can open modal later if you want:
        // cell.addEventListener('click', () => openModal(eq, timeline[i], timeline[i+1]));
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
    const step = slotW() * 6; // ~6 slots
    el('rsv-arrow-left') .addEventListener('click', () => headerViewport.scrollBy({ left: -step, behavior: 'smooth' }));
    el('rsv-arrow-right').addEventListener('click', () => headerViewport.scrollBy({ left:  step, behavior: 'smooth' }));
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
  if (!schedule || !headerViewport || !nowLineHeader) return;
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

  // Small header line (only when visible)
  if (inView) {
    nowLineHeader.style.display = 'block';
    nowLineHeader.style.left = `${xInView}px`;
  } else {
    nowLineHeader.style.display = 'none';
  }

  // Tall global line (spans all rows), only when visible
  if (typeof nowLineGlobal !== 'undefined' && nowLineGlobal) {
    if (inView) {
      // Convert header-relative X to schedule-container coords using DOM rects
      const schedLeft  = schedule.getBoundingClientRect().left + window.scrollX;
      const headerLeft = headerViewport.getBoundingClientRect().left + window.scrollX;
      const xPage      = headerLeft + xInView;          // absolute page X of the header line
      const xSched     = xPage - schedLeft;             // schedule container coords
      nowLineGlobal.style.display = 'block';
      nowLineGlobal.style.left = `${xSched}px`;
    } else {
      nowLineGlobal.style.display = 'none';
    }
  }
}

})();

/* ----- Modal ----- */
const modal = el('rsv-modal');
function openModal(eq, start, end){
  el('rsv-modal-equip').textContent = eq.name;
  el('rsv-modal-model').textContent = eq.model;
  el('rsv-pill-date').textContent = '0712'; // replace with selected date later
  el('rsv-pill-start').textContent = start;
  el('rsv-pill-end').textContent = end;
  modal.setAttribute('aria-hidden','false');
}
function closeModal(){ modal.setAttribute('aria-hidden','true'); }
el('rsv-modal-close').addEventListener('click', closeModal);
el('rsv-modal-backdrop').addEventListener('click', closeModal);

el('rsv-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  if(!el('rsv-agree').checked) return;

  const form = new FormData(e.target);
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
  };

  /* TODO: Replace with Supabase insert */
  console.log('Reservation payload →', payload);

  closeModal();
  alert('Booked (demo). Hook this to Supabase).');
});
