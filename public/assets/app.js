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

// V45 — module public de rédaction rapide
(function(){
 const WA='2250777041790';
 const defs={
  cv:{label:'CV',fields:[['poste','Poste / objectif professionnel','text'],['formation','Formation / diplômes','textarea'],['experience','Expériences professionnelles','textarea'],['competences','Compétences','textarea'],['langues','Langues / informatique','textarea']]},
  courrier_administratif:{label:'Courrier administratif',fields:[['destinataire','Destinataire / fonction','text'],['objet','Objet du courrier','text'],['demande','Votre demande / situation à expliquer','textarea'],['precision','Informations importantes à mentionner','textarea']]},
  demande_aide:{label:"Courrier demande d'aide",fields:[['destinataire','Destinataire / organisme','text'],['type_aide',"Type d'aide souhaitée",'text'],['motif','Motif et situation','textarea'],['besoin','Montant, matériel ou besoin demandé','textarea']]},
  contrat_travail:{label:'Contrat de travail',fields:[['employeur','Employeur / entreprise','text'],['employe','Nom du travailleur','text'],['poste','Poste / fonction','text'],['type_contrat','Type de contrat (CDD, CDI...)','text'],['debut','Date de début','date'],['salaire','Salaire / rémunération','text'],['conditions','Horaires et conditions particulières','textarea']]},
  contrat_loyer:{label:'Contrat de loyer',fields:[['bailleur','Nom du bailleur','text'],['locataire','Nom du locataire','text'],['bien','Bien loué et adresse','textarea'],['loyer','Montant du loyer','text'],['caution','Caution / avance','text'],['debut','Date de prise d’effet','date'],['duree','Durée du bail','text'],['conditions','Conditions particulières','textarea']]},
  autres:{label:'Autres',fields:[['titre','Type / titre du document','text'],['besoin','Décrivez précisément le document souhaité','textarea'],['precision','Informations complémentaires','textarea']]}
 };
 function inject(){
  if(document.getElementById('megaQuickFab'))return;
  document.body.insertAdjacentHTML('beforeend',`<button id="megaQuickFab" class="mega-quick-fab" type="button" aria-label="Ouvrir Rédaction rapide"><span class="qicon">✎</span><span>Rédaction rapide</span></button><div id="megaQuickModal" class="mega-quick-modal" role="dialog" aria-modal="true" aria-label="Rédaction rapide"><div class="mega-quick-card"><div class="mega-quick-head"><div><h2>Rédaction rapide</h2><p>Choisissez le document puis renseignez les informations utiles.</p></div><button id="megaQuickClose" class="mega-quick-close" type="button">×</button></div><div id="megaQuickBody"></div></div></div>`);
  const modal=document.getElementById('megaQuickModal');document.getElementById('megaQuickFab').onclick=()=>{modal.classList.add('open');choose()};document.getElementById('megaQuickClose').onclick=()=>modal.classList.remove('open');modal.onclick=e=>{if(e.target===modal)modal.classList.remove('open')};
 }
 function choose(){const b=document.getElementById('megaQuickBody');b.innerHTML=`<div class="mega-doc-grid">${Object.entries(defs).map(([k,v])=>`<button class="mega-doc-btn" data-doc="${k}" type="button">${v.label}</button>`).join('')}</div><p style="text-align:center;color:#667">Votre demande sera enregistrée et recevra un numéro unique.</p>`;b.querySelectorAll('[data-doc]').forEach(x=>x.onclick=()=>form(x.dataset.doc));}
 function form(type){const d=defs[type],b=document.getElementById('megaQuickBody');b.innerHTML=`<button type="button" id="qBack" class="mega-doc-btn" style="padding:8px 12px">← Documents</button><h3>${d.label}</h3><form id="megaQuickForm"><input type="hidden" name="website"><div class="mega-q-fields"><label>Nom et prénoms *<input name="fullName" required maxlength="140"></label><label>Téléphone / WhatsApp *<input name="phone" required maxlength="60" inputmode="tel"></label><label>E-mail<input name="email" type="email" maxlength="180"></label><label>Localité<input name="locality" maxlength="120"></label>${d.fields.map(([n,l,t])=>`<label class="${t==='textarea'?'wide':''}">${l}${t==='textarea'?`<textarea name="${n}" maxlength="4000"></textarea>`:`<input name="${n}" type="${t}" maxlength="500">`}</label>`).join('')}</div><button class="btn btn-primary mega-q-submit" type="submit">Enregistrer ma demande</button></form>`;document.getElementById('qBack').onclick=choose;document.getElementById('megaQuickForm').onsubmit=e=>submit(e,type);}
 async function submit(e,type){e.preventDefault();const f=e.target,btn=f.querySelector('button[type=submit]');btn.disabled=true;btn.textContent='Enregistrement…';const fd=new FormData(f),base={documentType:type,fullName:fd.get('fullName'),phone:fd.get('phone'),email:fd.get('email'),locality:fd.get('locality'),website:fd.get('website')},data={};for(const [k,v] of fd.entries())if(!['fullName','phone','email','locality','website'].includes(k))data[k]=v;base.data=data;try{const r=await MEGA.api('/api/writing-requests',{method:'POST',body:JSON.stringify(base)});const msg=`Bonjour MEGA SERVICES, je viens d'enregistrer une demande de ${defs[type].label}. Mon numéro unique est ${r.reference}. Merci de prendre en charge ma demande.`;document.getElementById('megaQuickBody').innerHTML=`<div class="mega-q-success"><h3>Demande enregistrée</h3><p>Votre numéro unique :</p><div class="mega-q-ref">${r.reference}</div><p><b>Annoncez maintenant votre demande à MEGA SERVICES.</b><br>Le bouton ci-dessous ouvre WhatsApp avec votre numéro unique déjà renseigné.</p><a class="btn btn-primary mega-wa-btn" target="_blank" rel="noopener" href="https://wa.me/${WA}?text=${encodeURIComponent(msg)}">Annoncer sur WhatsApp</a><br><button type="button" id="qNew" class="mega-doc-btn" style="margin-top:12px">Nouvelle demande</button></div>`;document.getElementById('qNew').onclick=choose;}catch(err){alert(err.status===429?'Trop de demandes en peu de temps. Réessayez plus tard.':'Impossible d’enregistrer la demande. Vérifiez les champs et réessayez.');btn.disabled=false;btn.textContent='Enregistrer ma demande';}}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject);else inject();
})();
