MEGA.mount('');
const state=document.getElementById('setupState');
const form=document.getElementById('loginForm');
const msg=document.getElementById('msg');
const submit=form.querySelector('button[type="submit"],button:not([type])');
const withTimeout=(p,ms=10000)=>Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(new Error('TIMEOUT')),ms))]);

function showMessage(text,bad=true){
  msg.className='notice'+(bad?' error':'');
  msg.textContent=text;
}
function describeSetupError(e){
  const d=e?.data||{};
  if(d.code==='D1_BINDING_MISSING') return 'Base D1 non connectée. Dans Cloudflare, ajoutez le binding D1 SITE_MEGA_D1 vers site-mega-d1.';
  if(d.code==='KV_BINDING_MISSING') return 'KV non connecté. Dans Cloudflare, ajoutez le binding KV SITE_MEGA_KV vers site-mega-kv.';
  return d.message||'Le serveur d’administration ne répond pas correctement. Vérifiez les bindings Cloudflare puis redéployez.';
}

(async()=>{
  try{
    await withTimeout(MEGA.api('/api/session'));
    location.replace('/admin.html');
    return;
  }catch{}
  try{
    const s=await withTimeout(MEGA.api('/api/setup-status'));
    if(s.adminExists){
      state.className='notice';
      state.textContent='Administration active. Saisissez votre e-mail et votre mot de passe.';
    }else if(s.bootstrapSecretConfigured){
      state.className='notice';
      state.textContent='Première connexion prête. Utilisez le compte administrateur configuré.';
    }else{
      state.className='notice error';
      state.textContent='Le compte administrateur n’est pas encore initialisé : le secret Cloudflare ADMIN_BOOTSTRAP_PASSWORD manque.';
    }
  }catch(e){
    state.className='notice error';
    state.textContent=describeSetupError(e);
  }
})();

form.addEventListener('submit',async e=>{
  e.preventDefault();
  e.stopPropagation();
  if(!form.reportValidity()) return;
  const fd=new FormData(form);
  const payload={email:String(fd.get('email')||'').trim(),password:String(fd.get('password')||'')};
  msg.textContent='';
  submit.disabled=true;
  submit.textContent='Connexion en cours…';
  try{
    const r=await withTimeout(MEGA.api('/api/login',{method:'POST',body:JSON.stringify(payload)}),12000);
    if(r?.ok) location.replace('/admin.html');
    else showMessage('Connexion refusée.');
  }catch(err){
    const d=err?.data||{};
    const map={
      INVALID_CREDENTIALS:'E-mail ou mot de passe incorrect.',
      ADMIN_SETUP_REQUIRED:'Le compte principal n’est pas encore initialisé. Configurez le secret ADMIN_BOOTSTRAP_PASSWORD dans Cloudflare.',
      TOO_MANY_ATTEMPTS:'Trop de tentatives. Réessayez dans 15 minutes.',
      D1_BINDING_MISSING:'La base D1 SITE_MEGA_D1 n’est pas connectée au projet Cloudflare.',
      KV_BINDING_MISSING:'Le KV SITE_MEGA_KV n’est pas connecté au projet Cloudflare.'
    };
    showMessage(d.message||map[d.error]||'Impossible de se connecter. Vérifiez la configuration Cloudflare.');
  }finally{
    submit.disabled=false;
    submit.textContent='Se connecter à l’administration';
    const pwd=form.querySelector('input[name="password"]'); if(pwd) pwd.value='';
  }
});

document.getElementById('forgot').addEventListener('click',()=>{
  showMessage('Pour le compte principal, réinitialisez le secret ADMIN_BOOTSTRAP_PASSWORD dans Cloudflare. Pour un autre compte, un administrateur peut réinitialiser son mot de passe depuis Utilisateurs.',false);
});
