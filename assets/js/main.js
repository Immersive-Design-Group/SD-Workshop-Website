(function(){
  const body = document.body;
  const btn  = document.querySelector('.hamburger');
  const drawer = document.getElementById('mobile-nav');
  const backdrop = document.querySelector('.nav-backdrop');

  if(!btn || !drawer || !backdrop) return;

  function openNav(){
    body.classList.add('nav-open');
    btn.setAttribute('aria-expanded','true');
    backdrop.hidden = false;
    const firstLink = drawer.querySelector('a');
    if(firstLink) firstLink.focus({preventScroll:true});
  }

  function closeNav(){
    body.classList.remove('nav-open');
    btn.setAttribute('aria-expanded','false');
    setTimeout(()=>{ backdrop.hidden = true; }, 250);
    btn.focus({preventScroll:true});
  }

  btn.addEventListener('click', () => {
    body.classList.contains('nav-open') ? closeNav() : openNav();
  });

  backdrop.addEventListener('click', closeNav);

  drawer.addEventListener('click', (e)=>{
    if(e.target.matches('a')) closeNav();
  });

  window.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape' && body.classList.contains('nav-open')) closeNav();
  });
})();

// Workshop Status Indicator
(function() {
  function isChineseHoliday(date) {
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

  function isWorkshopOpen() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    
    // Check if it's weekend (Saturday = 6, Sunday = 0)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }
    
    // Check if it's a Chinese holiday
    if (isChineseHoliday(now)) {
      return false;
    }
    
    // Check if it's within business hours (9:00 AM to 10:00 PM)
    const openTime = 9 * 60; // 9:00 AM in minutes
    const closeTime = 22 * 60; // 10:00 PM in minutes
    
    return currentTime >= openTime && currentTime < closeTime;
  }

  function updateWorkshopStatus() {
    const statusElement = document.getElementById('status-text');
    if (!statusElement) return;
    
    const isOpen = isWorkshopOpen();
    
    // Remove existing classes
    statusElement.classList.remove('open', 'closed', 'loading');
    
    if (isOpen) {
      statusElement.textContent = 'OPEN';
      statusElement.classList.add('open');
    } else {
      statusElement.textContent = 'CLOSED';
      statusElement.classList.add('closed');
    }
  }

  // Update status when page loads
  document.addEventListener('DOMContentLoaded', updateWorkshopStatus);
  
  // Update status every minute to keep it current
  setInterval(updateWorkshopStatus, 60000);
  
  // Also update when the page becomes visible (user returns to tab)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      updateWorkshopStatus();
    }
  });
})();
