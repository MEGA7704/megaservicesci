const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
function nav(active=''){
  return `<div class="topbar v14-topbar"><div class="topbar-main"><span>☎ +225 0777041790</span><span>◉ WhatsApp</span><span>✉ megaservicediabo@gmail.com</span><span>RCCM : CI-BKE-2020-B-1150</span><span>Compte contribuable : 2039493 M</span><span>Siège Social : Diabo</span></div><div class="topbar-social"><span>f</span><span>◉</span><span>▶</span></div></div>
  <nav class="nav v14-nav">
    <a class="brand v14-brand" href="/"><span class="mark v14-mark">M</span><span><strong>MEGA SERVICES</strong><small>SARL U</small><em>Des solutions pour un monde plus simple</em></span></a>
    <div class="links v14-links">
      <a class="${active==='home'?'active':''}" href="/">Accueil</a>
      <a class="${active==='about'?'active':''}" href="/a-propos.html">À propos</a>
      <a class="${active==='services'?'active':''}" href="/services.html">Nos services</a>
      <a class="${active==='work'?'active':''}" href="/realisations.html">Nos réalisations</a>
      <a class="${active==='recruit'?'active':''}" href="/recrutement.html">Nous recrutons</a>
      <a href="https://globalmarketci.pages.dev/#boutique/mega-services-sarl-u" target="_blank" rel="noopener">Boutique</a>
      <a class="${active==='contact'?'active':''}" href="/contact.html">Contact</a>
      <a class="btn v14-admin" href="/connexion.html">Connexion</a>
      <a class="btn v14-quote" href="/contact.html?devis=Demande%20de%20devis">▣ Demander un devis</a>
    </div>
  </nav>`
}
function footer(){return `<footer class="footer v14-footer"><div class="v14-footer-grid"><div><div class="brand v14-footer-brand"><span class="mark v14-mark">M</span><span><strong>MEGA SERVICES</strong><small>SARL U</small><em>Des solutions pour un monde plus simple</em></span></div></div><div><h4>Liens rapides</h4><a href="/">Accueil</a><a href="/a-propos.html">À propos</a><a href="/services.html">Nos services</a><a href="/realisations.html">Nos réalisations</a><a href="/recrutement.html">Nous recrutons</a><a href="/contact.html">Contact</a></div><div><h4>Nos coordonnées</h4><p>☎ +225 0777041790</p><p>◉ WhatsApp : +225 0777041790</p><p>✉ megaservicediabo@gmail.com</p><p>⌖ Diabo</p></div><div><h4>Informations légales</h4><p>RCCM : CI-BKE-2020-B-1150</p><p>Compte contribuable : 2039493 M</p><p>Siège Social : Diabo</p></div><div><h4>Suivez-nous</h4><div class="v14-socials"><span>f</span><span>◉</span><span>▶</span></div><p>Restez connectés !</p></div></div><div class="v14-footer-bottom"><span>© 2026 MEGA SERVICES SARL U. Tous droits réservés.</span><span>Mentions légales &nbsp; | &nbsp; Politique de confidentialité &nbsp; | &nbsp; CGU</span><strong>Votre partenaire de confiance !</strong></div></footer>`}
function mount(active){const h=$('#site-header'),f=$('#site-footer');if(h)h.innerHTML=nav(active);if(f)f.innerHTML=footer()}
async function api(url,opt={}){const r=await fetch(url,{...opt,headers:{'content-type':'application/json',...(opt.headers||{})}});let d={};try{d=await r.json()}catch{}if(!r.ok)throw Object.assign(new Error(d.message||d.error||'Erreur'),{status:r.status,data:d});return d}
window.MEGA={mount,api};
