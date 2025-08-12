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
