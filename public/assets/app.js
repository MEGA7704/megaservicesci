const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];

function nav(active=''){
  return `
  <nav class="nav v15-nav">
    <a class="brand v15-brand" href="/">
      <span class="v15-logo-mark">M</span>
      <span class="v15-brand-copy">
        <strong>MEGA SERVICES SARL U</strong>
        <small>Votre partenaire de confiance</small>
      </span>
    </a>
    <button class="v15-menu-toggle" type="button" aria-label="Ouvrir le menu">☰</button>
    <div class="links v15-links">
      <a class="${active==='home'?'active':''}" href="/">Accueil</a>
      <a class="${active==='about'?'active':''}" href="/a-propos.html">À propos</a>
      <a class="${active==='services'?'active':''}" href="/services.html">Nos services</a>
      <a class="${active==='work'?'active':''}" href="/realisations.html">Nos réalisations</a>
      <a class="${active==='recruit'?'active':''}" href="/recrutement.html">Nous recrutons</a>
      <a href="https://globalmarketci.pages.dev/#boutique/mega-services-sarl-u" target="_blank" rel="noopener">Boutique</a>
      <a class="${active==='contact'?'active':''}" href="/contact.html">Contact</a>
      <span class="v15-search" aria-hidden="true">⌕</span>
      <a class="v15-login-btn" href="/connexion.html">♙ Connexion</a>
    </div>
  </nav>`;
}

function footer(){
  return `
  <footer class="footer v15-footer">
    <div class="v15-footer-row">
      <div class="v15-footer-message">▥ <span>Des services pour aujourd'hui, des opportunités pour demain.</span></div>
      <div class="v15-footer-values"><span>🤝</span> Proximité <b>•</b> Fiabilité <b>•</b> Innovation</div>
      <div class="v15-footer-signature">Ensemble, plus loin !</div>
    </div>
    <div class="v15-footer-bottom">
      <span>© 2026 MEGA SERVICES SARL U</span>
      <span>+225 0777041790 · megaservicediabo@gmail.com · Diabo</span>
      <span>RCCM : CI-BKE-2020-B-1150 · Compte contribuable : 2039493 M</span>
    </div>
  </footer>`;
}

function mount(active){
  const h=$('#site-header'),f=$('#site-footer');
  if(h) h.innerHTML=nav(active);
  if(f) f.innerHTML=footer();
  const t=$('.v15-menu-toggle'), links=$('.v15-links');
  if(t&&links) t.addEventListener('click',()=>links.classList.toggle('open'));
}

async function api(url,opt={}){
  const r=await fetch(url,{...opt,headers:{'content-type':'application/json',...(opt.headers||{})}});
  let d={}; try{d=await r.json()}catch{}
  if(!r.ok) throw Object.assign(new Error(d.message||d.error||'Erreur'),{status:r.status,data:d});
  return d
}
window.MEGA={mount,api};
