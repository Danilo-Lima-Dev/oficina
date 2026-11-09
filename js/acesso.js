/* Login, sessão, troca e recuperação de senha, e a tela de Acessos (usuários e permissões).
   Quem confere as senhas e envia os e-mails de recuperação é o Supabase (Authentication). */

/* ===================== Sessão ===================== */
const CH_BLOQ='tapecaria_bloqueio';
const CH_MANTER='tapecaria_manter';
const INATIVIDADE_MIN=30;              // sai sozinho após 30 minutos sem uso
const MAX_TENTATIVAS=5, BLOQUEIO_MIN=5; // 5 senhas erradas seguidas bloqueiam novas tentativas por 5 minutos neste aparelho
let ultimaAtividade=Date.now(), manterConectado=false;

const lerJSON=(st,k)=>{try{return JSON.parse(st.getItem(k)||'null')}catch(e){return null}};
const gravarJSON=(st,k,v)=>{try{v===null?st.removeItem(k):st.setItem(k,JSON.stringify(v))}catch(e){}};
['click','keydown','pointerdown','scroll'].forEach(ev=>document.addEventListener(ev,()=>{ultimaAtividade=Date.now()},{passive:true}));
setInterval(()=>{if(SESSAO&&!manterConectado&&Date.now()-ultimaAtividade>INATIVIDADE_MIN*60000)sair('Você saiu automaticamente após '+INATIVIDADE_MIN+' minutos sem uso.')},30000);
const traduzErro=e=>{const m=String(e&&e.message||e);
  if(/invalid login credentials/i.test(m))return 'Usuário ou senha incorretos.';
  if(/email not confirmed/i.test(m))return 'Este e-mail ainda não foi confirmado. Abra o link de confirmação enviado pelo Supabase.';
  if(/rate limit|too many|429/i.test(m))return 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.';
  if(/already registered|already been registered|already exists/i.test(m))return 'Já existe um usuário com este e-mail.';
  if(/should be different|same password/i.test(m))return 'A nova senha precisa ser diferente da atual.';
  if(/password.*(short|weak|at least)/i.test(m))return 'Senha fraca: use pelo menos 8 caracteres, com letras e números.';
  if(/failed to fetch|network/i.test(m))return 'Sem conexão com a internet ou com o banco de dados.';
  return m};

/* ===================== Telas de entrada ===================== */
function prepararTelaEntrada(){
  $('#app').hidden=true;$('#login').hidden=false;
  $('#loginEmpresa').textContent=S.empresa.nome||'Tapeçaria';
  $('#loginLogo').innerHTML=logoTela();$('#loginLogo').classList.toggle('tem-logo',!!logoEmpresa());aplicarFavicon();
}
// Falta preencher js/config.js
function telaConfigurar(){
  prepararTelaEntrada();
  $('#loginCorpo').innerHTML=`<div class="login-form"><h1>Falta ligar o banco de dados</h1>
    <div class="aviso erro">${problemaConfig()}</div>
    <p style="margin:0">O arquivo <code>js/config.js</code> do repositório deve ficar assim, com os valores do seu projeto (Supabase → <b>Project Settings → API</b>):</p>
    <pre class="cfg-exemplo">const SUPABASE_URL = 'https://abcdefghij.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOi...';</pre>
    <p class="lock" style="margin:0">Depois de salvar no GitHub, espere 1 ou 2 minutos e recarregue a página com <b>Ctrl+F5</b>. O passo a passo completo está no <b>LEIA-ME.md</b>.</p></div>`;
}
function mostrarLogin(aviso,tipo){
  prepararTelaEntrada();
  $('#loginCorpo').innerHTML=`<form id="fLogin" class="login-form" novalidate>
    <h1>Entrar</h1>
    ${aviso?`<div class="aviso ${tipo||''}" role="status">${aviso}</div>`:''}
    <div class="f"><label for="lUser">E-mail ou usuário</label><input id="lUser" autocomplete="username" autocapitalize="none" spellcheck="false" required></div>
    <div class="f"><label for="lSenha">Senha</label><div class="senha-campo"><input id="lSenha" type="password" autocomplete="current-password" required><button type="button" class="ver-senha" data-ver="lSenha" aria-label="Mostrar senha">Mostrar</button></div></div>
    <label class="lembrar" for="lManter"><input type="checkbox" id="lManter"> Manter conectado neste aparelho</label>
    <div class="aviso erro" id="lErro" role="alert" hidden></div>
    <button class="btn pri grande" type="submit" id="lEntrar">Entrar</button>
    <button class="btn link" type="button" id="lEsqueci">Esqueci minha senha</button>
  </form>`;
  ligarVerSenha();
  $('#lUser').focus();
  $('#fLogin').onsubmit=async e=>{
    e.preventDefault();
    const quem=$('#lUser').value.trim().toLowerCase(),senha=$('#lSenha').value,err=$('#lErro');
    const erro=m=>{err.innerHTML=m;err.hidden=false;$('#lSenha').value='';$('#lSenha').focus()};
    if(!quem||!senha){erro('Preencha usuário e senha.');return}
    const bloq=lerJSON(localStorage,CH_BLOQ)||{};const b=bloq[quem]||{n:0,ate:0};
    if(b.ate>Date.now()){erro(`Muitas tentativas erradas. Tente de novo em ${Math.ceil((b.ate-Date.now())/60000)} minuto(s).`);return}
    const btn=$('#lEntrar');btn.disabled=true;btn.textContent='Conferindo…';
    try{
      let email=quem;
      if(!quem.includes('@')){const r=await sb.rpc('email_do_login',{p_login:quem});if(r.error)throw r.error;email=r.data||''}
      const {error}=email?await sb.auth.signInWithPassword({email,password:senha}):{error:{message:'Invalid login credentials'}};
      if(error){
        if(/invalid login/i.test(error.message)){b.n=(b.ate&&b.ate<Date.now())?1:b.n+1;b.ate=b.n>=MAX_TENTATIVAS?Date.now()+BLOQUEIO_MIN*60000:0;bloq[quem]=b;gravarJSON(localStorage,CH_BLOQ,bloq)}
        erro(b.ate?`Senha errada ${MAX_TENTATIVAS} vezes. Tente de novo em ${BLOQUEIO_MIN} minutos.`:traduzErro(error)+(b.n>=3&&!b.ate?` Restam ${MAX_TENTATIVAS-b.n} tentativa(s).`:''));
        return;
      }
      delete bloq[quem];gravarJSON(localStorage,CH_BLOQ,bloq);
      manterConectado=$('#lManter').checked;gravarJSON(localStorage,CH_MANTER,manterConectado||null);
      btn.textContent='Abrindo os dados…';
      await entrarComSessao(true);
    }catch(ex){erro(esc(traduzErro(ex)))}
    finally{const bt=$('#lEntrar');if(bt){bt.disabled=false;bt.textContent='Entrar'}}
  };
  $('#lEsqueci').onclick=telaEsqueci;
}
// Sistema novo, sem nenhum usuário: cria o primeiro administrador
function telaPrimeiroAdmin(aviso){
  prepararTelaEntrada();
  $('#loginCorpo').innerHTML=`<form id="fAdm" class="login-form" novalidate>
    <h1>Criar administrador</h1>
    <p style="margin:0">O sistema ainda não tem usuários. Crie a conta do administrador: ela terá acesso a tudo, inclusive à tela <b>Acessos</b>, onde você cadastra a equipe.</p>
    ${aviso?`<div class="aviso">${aviso}</div>`:''}
    <div class="f"><label for="paNome">Seu nome</label><input id="paNome" autocomplete="name"></div>
    <div class="f"><label for="paEmail">E-mail</label><input id="paEmail" type="email" autocomplete="email" autocapitalize="none"><small>É para ele que vai o link de recuperação de senha.</small></div>
    <div class="form">${camposSenha('pa',false)}</div>
    <div class="aviso erro" id="paErro" hidden role="alert"></div>
    <button class="btn pri grande" type="submit" id="paCriar">Criar administrador e entrar</button></form>`;
  ligarVerSenha();medirForca('pa');$('#paNome').focus();
  $('#fAdm').onsubmit=async e=>{
    e.preventDefault();const err=$('#paErro');const falha=(t,c)=>{err.textContent=t;err.hidden=false;if(c)$('#'+c).focus()};
    const nome=$('#paNome').value.trim(),email=$('#paEmail').value.trim().toLowerCase();
    if(!nome)return falha('Informe seu nome.','paNome');
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))return falha('Informe um e-mail válido.','paEmail');
    const r=lerNovaSenha('pa',{login:email.split('@')[0]});if(r.erro)return falha(r.erro,r.campo);
    const bt=$('#paCriar');bt.disabled=true;bt.textContent='Criando…';
    try{
      const {data,error}=await sb.auth.signUp({email,password:r.senha,options:{data:{nome,login:'admin'},emailRedirectTo:location.origin+location.pathname}});
      if(error)throw error;
      if(!data.session)return mostrarLogin(`Conta criada. O Supabase enviou um e-mail de confirmação para <b>${esc(email)}</b>: abra o link e depois entre aqui. Para não precisar disso com a equipe, desligue <b>Confirm email</b> no Supabase (veja o LEIA-ME).`,'ok');
      await entrarComSessao(true);
    }catch(ex){falha(traduzErro(ex))}
    finally{bt.disabled=false;bt.textContent='Criar administrador e entrar'}
  };
}
function ligarVerSenha(){
  document.querySelectorAll('[data-ver]').forEach(b=>b.onclick=()=>{const i=$('#'+b.dataset.ver);const v=i.type==='password';i.type=v?'text':'password';b.textContent=v?'Ocultar':'Mostrar';b.setAttribute('aria-label',v?'Ocultar senha':'Mostrar senha')});
}
// Depois do login (ou ao abrir o site já logado): carrega os dados e abre o sistema
async function entrarComSessao(novoLogin){
  const {data}=await sb.auth.getSession();const sessao=data&&data.session;
  if(!sessao){mostrarLogin();return}
  SESSAO=sessao.user.id;
  try{await carregarDados()}
  catch(ex){
    const msg=String(ex.message||ex);SESSAO=null;await sb.auth.signOut().catch(()=>{});
    return mostrarLogin(/não foi encontrado/.test(msg)?'Seu cadastro ainda não foi liberado. Peça ao administrador para ativar seu usuário na tela Acessos.':'Não foi possível abrir os dados: '+esc(traduzErro(ex)),'erro');
  }
  const u=me();
  if(!u||!u.ativo){SESSAO=null;await sb.auth.signOut().catch(()=>{});return mostrarLogin('Seu acesso ainda não foi liberado (ou foi bloqueado) pelo administrador.','erro')}
  try{sessionStorage.setItem('tapecaria_aba','1')}catch(e){}
  ultimaAtividade=Date.now();
  if(novoLogin){u.ultimoAcesso=agora();log('Entrou no sistema','Login');save()}
  if(u.trocarSenha)trocaObrigatoria(u);else entrar();
}
function entrar(){
  closeModal();$('#login').hidden=true;$('#app').hidden=false;
  const u=me();tab=Object.keys(TABS).find(t=>pode(TAB_PERM[t]))||'';filtro='';
  render();toast('Bem-vindo, '+u.nome.split(' ')[0]);
}
async function sair(motivo){
  if(SESSAO){log(motivo?'Saiu por inatividade':'Saiu do sistema','Login');try{await salvarAgora()}catch(e){}}
  SESSAO=null;manterConectado=false;gravarJSON(localStorage,CH_MANTER,null);
  closeModal();$('#userMenu').hidden=true;$('#app').hidden=true;$('#view').innerHTML='';
  await desligarTempoReal();try{await sb.auth.signOut()}catch(e){}
  try{sessionStorage.setItem('tapecaria_msg',JSON.stringify({msg:motivo||'Você saiu do sistema.',tipo:motivo?'':'ok'}));sessionStorage.removeItem('tapecaria_aba')}catch(e){}
  S=null;location.replace(location.pathname); // recarrega do zero: nenhum dado fica na memória
}

/* ===================== Senhas ===================== */
const camposSenha=(pre,atual)=>`${atual?`<div class="f wide"><label for="${pre}Atual">Senha atual</label><div class="senha-campo"><input id="${pre}Atual" type="password" autocomplete="current-password"><button type="button" class="ver-senha" data-ver="${pre}Atual">Mostrar</button></div></div>`:''}
  <div class="f"><label for="${pre}Nova">Nova senha</label><div class="senha-campo"><input id="${pre}Nova" type="password" autocomplete="new-password"><button type="button" class="ver-senha" data-ver="${pre}Nova">Mostrar</button></div></div>
  <div class="f"><label for="${pre}Conf">Repita a nova senha</label><input id="${pre}Conf" type="password" autocomplete="new-password"></div>
  <div class="f wide"><div class="forca" id="${pre}Forca"><i></i></div><small>Mínimo de 8 caracteres, com letras e números.</small></div>`;
function medirForca(pre){
  const i=$('#'+pre+'Nova');i.addEventListener('input',()=>{const v=i.value;let p=0;if(v.length>=8)p++;if(v.length>=12)p++;if(/[A-Z]/.test(v)&&/[a-z]/.test(v))p++;if(/\d/.test(v))p++;if(/[^A-Za-z0-9]/.test(v))p++;const el=$('#'+pre+'Forca');el.dataset.n=Math.min(4,p);el.title=['Muito fraca','Fraca','Razoável','Boa','Forte'][Math.min(4,p)]});
}
function lerNovaSenha(pre,u){
  const n=$('#'+pre+'Nova').value,c=$('#'+pre+'Conf').value;
  const p=problemaSenha(n,u);if(p)return {erro:p,campo:pre+'Nova'};
  if(n!==c)return {erro:'As duas senhas não são iguais.',campo:pre+'Conf'};
  return {senha:n};
}
// Troca a senha de quem está logado
async function trocarMinhaSenha(senha){const {error}=await sb.auth.updateUser({password:senha});if(error)throw new Error(traduzErro(error))}
// Administrador define a senha de outra pessoa (função no banco, só para quem gerencia acessos)
async function definirSenhaDe(u,senha){
  if(u.id===me().id)return trocarMinhaSenha(senha);
  const {error}=await sb.rpc('admin_definir_senha',{p_id:u.id,p_senha:senha});if(error)throw new Error(traduzErro(error));
}
// Senha temporária ou primeiro acesso: troca obrigatória
function trocaObrigatoria(u){
  $('#login').hidden=true;$('#app').hidden=true;
  modal('Crie sua senha',`<p style="margin:0">Olá, <b>${esc(u.nome)}</b>. Você entrou com uma senha temporária: crie uma senha pessoal antes de continuar.</p>
    <div class="form">${camposSenha('t',false)}</div>
    <div class="aviso erro" id="tErro" hidden role="alert"></div>`,
    `<button class="btn" id="tSair">Sair</button><button class="btn pri" id="tSalvar">Salvar e entrar</button>`,true,true);
  ligarVerSenha();medirForca('t');
  $('#tSair').onclick=()=>sair();
  $('#tSalvar').onclick=async()=>{
    const r=lerNovaSenha('t',u),err=$('#tErro');
    if(r.erro){err.textContent=r.erro;err.hidden=false;$('#'+r.campo).focus();return}
    try{await trocarMinhaSenha(r.senha)}catch(ex){err.textContent=ex.message;err.hidden=false;return}
    u.trocarSenha=false;log('Criou nova senha','Senha temporária');save();entrar();
  };
}
function alterarMinhaSenha(){
  const u=me();
  modal('Alterar minha senha',`<div class="form">${camposSenha('a',true)}</div><div class="aviso erro" id="aErro" hidden role="alert"></div>`,
    `<button class="btn" data-close>Cancelar</button><button class="btn pri" id="aSalvar">Alterar senha</button>`,true);
  ligarVerSenha();medirForca('a');
  $('#aSalvar').onclick=async()=>{
    const err=$('#aErro');const falha=(m,c)=>{err.textContent=m;err.hidden=false;if(c)$('#'+c).focus()};
    const atual=$('#aAtual').value;
    // confere a senha atual entrando de novo com ela
    const conf=await sb.auth.signInWithPassword({email:u.email,password:atual});
    if(conf.error)return falha('A senha atual está errada.','aAtual');
    const r=lerNovaSenha('a',u);if(r.erro)return falha(r.erro,r.campo);
    if(r.senha===atual)return falha('A nova senha precisa ser diferente da atual.','aNova');
    try{await trocarMinhaSenha(r.senha)}catch(ex){return falha(ex.message)}
    log('Alterou a própria senha','—');save();closeModal();toast('Senha alterada');
  };
}

/* ===================== Menu do usuário ===================== */
$('#userBtn').onclick=e=>{e.stopPropagation();const m=$('#userMenu');m.hidden=!m.hidden;$('#userBtn').setAttribute('aria-expanded',!m.hidden);if(!m.hidden)m.querySelector('button').focus()};
document.addEventListener('click',e=>{if(!e.target.closest('.usuario')){$('#userMenu').hidden=true;$('#userBtn').setAttribute('aria-expanded','false')}});
$('#mSenha').onclick=()=>{$('#userMenu').hidden=true;alterarMinhaSenha()};
$('#mSair').onclick=()=>sair();
document.addEventListener('click',e=>{const b=e.target.closest('[data-tab-ir]');if(b){tab=b.dataset.tabIr;render();window.scrollTo(0,0)}});

/* ===================== Recuperação de senha por e-mail (todos os usuários) ===================== */
const mascaraEmail=e=>{const [a,d]=String(e).split('@');return a.slice(0,2)+'•••@'+d};
function telaEsqueci(){
  prepararTelaEntrada();
  $('#loginCorpo').innerHTML=`<form id="fEsq" class="login-form" novalidate>
    <h1>Recuperar senha</h1>
    <p class="lock" style="margin:0">Enviamos um link para o e-mail cadastrado. Ao abrir o link, você cria uma senha nova.</p>
    <div class="f"><label for="eqUser">Seu e-mail ou usuário</label><input id="eqUser" autocapitalize="none" spellcheck="false" autocomplete="username"></div>
    <div class="aviso" id="eqMsg" role="status" hidden></div>
    <button class="btn pri grande" type="submit" id="eqEnviar">Enviar link</button>
    <button class="btn link" type="button" id="eqVoltar">Voltar para o login</button></form>`;
  $('#eqUser').focus();
  $('#eqVoltar').onclick=()=>mostrarLogin();
  $('#fEsq').onsubmit=async e=>{
    e.preventDefault();
    const quem=$('#eqUser').value.trim().toLowerCase(),msg=$('#eqMsg');const mostra=(t,c)=>{msg.className='aviso '+(c||'');msg.innerHTML=t;msg.hidden=false};
    if(!quem)return mostra('Informe seu e-mail ou usuário.','erro');
    const b=$('#eqEnviar');b.disabled=true;b.textContent='Enviando…';
    try{
      let email=quem;
      if(!quem.includes('@')){const r=await sb.rpc('email_do_login',{p_login:quem});email=(r.data||'')}
      if(email){const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});if(error)throw error}
      // a mesma resposta para quem existe e quem não existe, para não revelar quem é usuário
      mostra(`Se ${quem.includes('@')?'este e-mail':'este usuário'} estiver cadastrado, enviamos um link${email?' para <b>'+esc(mascaraEmail(email))+'</b>':''}. Abra o e-mail neste aparelho e clique no link. Confira também a caixa de spam.`,'ok');
    }catch(ex){mostra(esc(traduzErro(ex)),'erro')}
    finally{b.disabled=false;b.textContent='Enviar de novo'}
  };
}
// Aberta pelo link do e-mail: o Supabase já identificou a pessoa pelo link
function telaNovaSenhaPeloLink(){
  prepararTelaEntrada();
  $('#loginCorpo').innerHTML=`<form id="fRed" class="login-form" novalidate><h1>Criar nova senha</h1>
    <div class="form">${camposSenha('r',false)}</div><div class="aviso erro" id="rErro" hidden role="alert"></div>
    <button class="btn pri grande" type="submit">Salvar nova senha</button>
    <button class="btn link" type="button" id="rCancelar">Cancelar</button></form>`;
  ligarVerSenha();medirForca('r');$('#rNova').focus();
  $('#rCancelar').onclick=async()=>{await sb.auth.signOut().catch(()=>{});try{history.replaceState(null,'',location.pathname)}catch(e){}mostrarLogin()};
  $('#fRed').onsubmit=async e=>{
    e.preventDefault();const err=$('#rErro');
    const r=lerNovaSenha('r',{login:''});if(r.erro){err.textContent=r.erro;err.hidden=false;$('#'+r.campo).focus();return}
    try{await trocarMinhaSenha(r.senha)}catch(ex){err.textContent=ex.message;err.hidden=false;return}
    try{const {data}=await sb.auth.getUser();const id=data.user.id;await sb.from('logs').insert({id:uid(),dados:{id:uid(),data:new Date().toISOString(),user:data.user.email,acao:'Redefiniu a senha pelo link do e-mail',alvo:mascaraEmail(data.user.email)}})}catch(e){}
    await sb.auth.signOut().catch(()=>{});
    gravarJSON(localStorage,CH_BLOQ,null);
    try{history.replaceState(null,'',location.pathname)}catch(e){}
    mostrarLogin('Senha alterada. Entre com a nova senha.','ok');
  };
}

/* ===================== Tela de Acessos (só administrador ou quem tiver a função liberada) ===================== */
let acSel='';
const qtdAdmins=()=>S.users.filter(u=>u.admin&&u.ativo).length;
const sw=(on,attrs,dis)=>`<button type="button" class="sw" role="switch" aria-checked="${on}" ${attrs} ${dis?'disabled':''}><span class="sw-trilho"><span class="sw-bola"></span></span><span class="sw-txt">${on?'Liberado':'Bloqueado'}</span></button>`;
V.acessos=()=>{
  if(!S.users.find(u=>u.id===acSel))acSel=S.users[0].id;
  const u=S.users.find(x=>x.id===acSel),eu=me().id===u.id;
  const liberadas=x=>x.admin?TODAS_PERMS.length:TODAS_PERMS.filter(p=>x.perms[p]).length;
  return `<div class="head"><div><h2>Acessos</h2><p>Cadastre quem usa o sistema e escolha, função por função, o que cada pessoa pode ver e fazer.</p></div><span class="spacer"></span><button class="btn pri" data-act="acNovo">+ Novo usuário</button></div>
  <div class="ac-grid">
    <section class="panel ac-lista" aria-label="Usuários">
      ${S.users.map(x=>`<button type="button" class="ac-user ${x.id===acSel?'on':''}" data-acsel="${x.id}" aria-pressed="${x.id===acSel}">
        <span class="avatar ${x.admin?'adm':''}">${esc(x.nome.trim().split(/\s+/).map(p=>p[0]).slice(0,2).join('').toUpperCase())}</span>
        <span class="ac-user-txt"><b>${esc(x.nome)}</b><span>${esc(x.login)} · ${x.admin?'Administrador':liberadas(x)+' de '+TODAS_PERMS.length+' funções'}</span></span>
        ${x.ativo?'':'<span class="chip c-bad">Bloqueado</span>'}${x.trocarSenha&&x.ativo?'<span class="chip c-warn" title="Precisa criar senha no próximo acesso">Senha</span>':''}
      </button>`).join('')}
    </section>
    <div class="ac-detalhe">
      <section class="panel"><div class="panel-h"><h3>${esc(u.nome)}</h3>${eu?'<span class="chip c-info">Você</span>':''}<span class="spacer" style="flex:1"></span>
        ${!eu?`<button class="btn sm danger" data-act="acExcluir" data-id="${u.id}">Excluir usuário</button>`:''}</div>
        <div class="panel-b" style="display:grid;gap:16px">
          <div class="form">
            <div class="f"><label for="acNome">Nome</label><input id="acNome" value="${esc(u.nome)}"></div>
            <div class="f"><label for="acLogin">Usuário (para entrar)</label><input id="acLogin" value="${esc(u.login)}" autocapitalize="none" spellcheck="false"></div>
            <div class="f"><label for="acEmail">E-mail (entrar e recuperar senha)</label><input id="acEmail" type="email" value="${esc(u.email)}"></div>
            <div class="f" style="align-content:end"><button class="btn" id="acSalvarDados">Salvar dados</button></div>
          </div>
          <div class="ac-chaves">
            <div class="ac-chave"><div><b>Usuário ativo</b><span>Bloqueado não consegue entrar no sistema.</span></div>${sw(u.ativo,'data-acflag="ativo"',eu)}</div>
            <div class="ac-chave"><div><b>Administrador</b><span>Acesso total, inclusive a esta tela. ${qtdAdmins()===1&&u.admin?'É o único administrador ativo.':''}</span></div>${sw(u.admin,'data-acflag="admin"',eu)}</div>
          </div>
          <div class="ac-senha"><div><b>Senha</b><span>${u.trocarSenha?'Vai criar uma senha nova no próximo acesso.':u.ultimoAcesso?'Último acesso em '+dbr(u.ultimoAcesso)+' às '+u.ultimoAcesso.slice(11,16)+'.':'Ainda não entrou no sistema.'}</span></div>
            <button class="btn sm" data-act="acTemp" data-id="${u.id}">Gerar senha temporária</button><button class="btn sm" data-act="acDefinir" data-id="${u.id}">Definir nova senha</button></div>
        </div></section>
      <section class="panel"><div class="panel-h"><h3>Funções liberadas</h3><span class="lock">${u.admin?'Administradores têm tudo liberado.':liberadas(u)+' de '+TODAS_PERMS.length+' ligadas'}</span>
        ${u.admin?'':`<span class="spacer" style="flex:1"></span><label class="lock" for="acModelo">Aplicar modelo</label><select class="search" id="acModelo" style="width:auto"><option value="">Escolha…</option>${Object.entries(MODELOS).map(([k,m])=>`<option value="${k}">${m.nome}</option>`).join('')}</select>`}</div>
        <div class="panel-b ac-grupos ${u.admin?'travado':''}">
          ${PERMISSOES.map(g=>{const on=g.itens.filter(([k])=>u.admin||u.perms[k]).length;return `<fieldset class="ac-grupo"><legend>${g.grupo}<span class="lock">${on}/${g.itens.length}</span>${u.admin?'':`<button type="button" class="btn link sm" data-acgrupo="${g.grupo}" data-on="${on<g.itens.length}">${on<g.itens.length?'Liberar todas':'Bloquear todas'}</button>`}</legend>
            ${g.itens.map(([k,nome,desc])=>`<div class="ac-perm"><div><b>${nome}</b>${desc?`<span>${desc}</span>`:''}</div>${sw(u.admin||!!u.perms[k],`data-acperm="${k}" aria-label="${esc(nome)}"`,u.admin||(eu&&k==='acessos'))}</div>`).join('')}
          </fieldset>`}).join('')}
        </div></section>
    </div>
  </div>`;
};
// Atualiza só o botão clicado, para a animação aparecer
function virarChave(b,on){b.setAttribute('aria-checked',on);b.querySelector('.sw-txt').textContent=on?'Liberado':'Bloqueado'}
bind.acessos=()=>{
  const u=S.users.find(x=>x.id===acSel);
  document.querySelectorAll('[data-acsel]').forEach(b=>b.onclick=()=>{acSel=b.dataset.acsel;render()});
  document.querySelectorAll('[data-acperm]').forEach(b=>b.onclick=()=>{
    const k=b.dataset.acperm,on=!u.perms[k];u.perms[k]=on;virarChave(b,on);
    const nome=PERMISSOES.flatMap(g=>g.itens).find(i=>i[0]===k)[1];
    log(on?'Liberou acesso':'Bloqueou acesso',u.login+': '+nome);save();
    setTimeout(()=>{const y=scrollY;render();scrollTo(0,y)},260); // atualiza contadores depois da animação
  });
  document.querySelectorAll('[data-acgrupo]').forEach(b=>b.onclick=()=>{
    const g=PERMISSOES.find(x=>x.grupo===b.dataset.acgrupo),on=b.dataset.on==='true';
    g.itens.forEach(([k])=>u.perms[k]=on);
    document.querySelectorAll(`.ac-grupo [data-acperm]`).forEach(x=>{if(g.itens.some(([k])=>k===x.dataset.acperm))virarChave(x,on)});
    log(on?'Liberou grupo de acessos':'Bloqueou grupo de acessos',u.login+': '+g.grupo);save();
    setTimeout(()=>{const y=scrollY;render();scrollTo(0,y)},260);
  });
  document.querySelectorAll('[data-acflag]').forEach(b=>b.onclick=()=>{
    const f=b.dataset.acflag,on=!u[f];
    if(!on&&u.admin&&qtdAdmins()===1&&(f==='admin'||f==='ativo')){toast('Precisa existir pelo menos um administrador ativo');return}
    u[f]=on;virarChave(b,on);
    log(f==='admin'?(on?'Tornou administrador':'Removeu de administrador'):(on?'Desbloqueou usuário':'Bloqueou usuário'),u.login);save();
    setTimeout(()=>{const y=scrollY;render();scrollTo(0,y)},260);
  });
  const m=$('#acModelo');if(m)m.onchange=()=>{const k=m.value;if(!k)return;
    confirmar(`Aplicar o modelo <b>${MODELOS[k].nome}</b> para ${esc(u.nome)}? As funções atuais serão substituídas.`,()=>{u.perms={...MODELOS[k].perms};log('Aplicou modelo de acesso',u.login+': '+MODELOS[k].nome);save();render();toast('Modelo aplicado')},'Aplicar');m.value=''};
  $('#acSalvarDados').onclick=async()=>{
    const nome=$('#acNome').value.trim(),login=$('#acLogin').value.trim().toLowerCase(),email=$('#acEmail').value.trim().toLowerCase();
    const p=problemaLogin(login,u.id);if(!nome){toast('Informe o nome');return}if(p){toast(p);$('#acLogin').focus();return}
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){toast('Informe um e-mail válido');$('#acEmail').focus();return}
    if(email!==String(u.email).toLowerCase()){
      // o e-mail é o acesso ao Supabase: troca primeiro lá
      if(u.id===me().id){const {error}=await sb.auth.updateUser({email});if(error){toast(traduzErro(error));return}toast('Confirme a troca pelo link enviado ao novo e-mail')}
      else{const {error}=await sb.rpc('admin_alterar_email',{p_id:u.id,p_email:email});if(error){toast(traduzErro(error));return}}
    }
    Object.assign(u,{nome,login,email});log('Alterou dados de usuário',login);save();render();toast('Dados salvos');
  };
};
function problemaLogin(login,id){
  if(!/^[a-z0-9._-]{3,30}$/.test(login))return 'Usuário: use de 3 a 30 letras minúsculas, números, ponto, hífen ou sublinhado, sem espaço.';
  if(S.users.some(x=>x.login===login&&x.id!==id))return 'Já existe um usuário com esse nome de acesso.';
  return '';
}
function mostrarSenhaTemp(u,senha){
  modal('Senha temporária',`<p style="margin:0">Passe esta senha para <b>${esc(u.nome)}</b>. No primeiro acesso, o sistema vai pedir para criar uma senha pessoal.</p>
    <div class="senha-temp"><code id="stTxt">${esc(senha)}</code><button class="btn sm" id="stCopiar">Copiar</button></div>
    <p class="lock" style="margin:0">Para entrar: <b>${esc(u.email)}</b> (ou o usuário <b>${esc(u.login)}</b>). Esta senha não aparece de novo depois que você fechar esta janela.</p>`,
    `<button class="btn pri" data-close>Pronto</button>`,true);
  $('#stCopiar').onclick=()=>copiarTexto(`Endereço: ${location.origin+location.pathname}\nE-mail: ${u.email}\nSenha temporária: ${senha}`,$('#stTxt'));
}
ACT.acNovo=()=>{
  modal('Novo usuário',`<div class="form">
    <div class="f wide"><label for="nuNome">Nome</label><input id="nuNome" placeholder="Ex.: Maria – Vendas"></div>
    <div class="f"><label for="nuLogin">Usuário (para entrar)</label><input id="nuLogin" autocapitalize="none" spellcheck="false" placeholder="maria"></div>
    <div class="f"><label for="nuEmail">E-mail</label><input id="nuEmail" type="email" autocapitalize="none"><small>Usado para entrar e para recuperar a senha.</small></div>
    <div class="f wide"><label for="nuModelo">Começar com os acessos de</label><select id="nuModelo">${Object.entries(MODELOS).map(([k,m])=>`<option value="${k}">${m.nome}</option>`).join('')}<option value="admin">Administrador (acesso total)</option></select><small>Depois você liga e desliga cada função na tela de Acessos.</small></div>
  </div><div class="aviso erro" id="nuErro" hidden role="alert"></div>`,
  `<button class="btn" data-close>Cancelar</button><button class="btn pri" id="nuSalvar">Criar usuário</button>`,true);
  $('#nuNome').oninput=()=>{const l=$('#nuLogin');if(!l.dataset.mexeu)l.value=normal($('#nuNome').value).split(/\s+/)[0].replace(/[^a-z0-9._-]/g,'')};
  $('#nuLogin').oninput=e=>e.target.dataset.mexeu='1';
  $('#nuSalvar').onclick=async()=>{
    const err=$('#nuErro');const falha=(t,c)=>{err.textContent=t;err.hidden=false;if(c)$('#'+c).focus()};
    const nome=$('#nuNome').value.trim(),login=$('#nuLogin').value.trim().toLowerCase(),email=$('#nuEmail').value.trim().toLowerCase(),mod=$('#nuModelo').value;
    if(!nome)return falha('Informe o nome.','nuNome');
    const p=problemaLogin(login);if(p)return falha(p,'nuLogin');
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))return falha('Informe um e-mail válido: ele é usado para entrar e recuperar a senha.','nuEmail');
    if(S.users.some(x=>String(x.email).toLowerCase()===email))return falha('Já existe um usuário com este e-mail.','nuEmail');
    const senha=senhaTemporaria();
    const bt=$('#nuSalvar');bt.disabled=true;bt.textContent='Criando…';
    try{
      // cria a conta no Supabase sem tirar o administrador da própria sessão
      const {data,error}=await clienteTemporario().auth.signUp({email,password:senha,options:{data:{nome,login}}});
      if(error)throw error;
      if(!data.user||(data.user.identities&&!data.user.identities.length))throw new Error('Já existe um usuário com este e-mail.');
      const u={id:data.user.id,nome,login,email,admin:mod==='admin',ativo:true,perms:mod==='admin'?{...MODELOS.tudo.perms}:{...MODELOS[mod].perms},trocarSenha:true,criado:iso(new Date()),ultimoAcesso:''};
      S.users.push(u);acSel=u.id;log('Criou usuário',login+' ('+(u.admin?'Administrador':MODELOS[mod].nome)+')');
      await salvarAgora();render();mostrarSenhaTemp(u,senha);
      if(!data.session)toast('O Supabase pediu confirmação de e-mail: a pessoa precisa abrir o link antes de entrar (veja o LEIA-ME).');
    }catch(ex){falha(traduzErro(ex))}
    finally{const b=$('#nuSalvar');if(b){b.disabled=false;b.textContent='Criar usuário'}}
  };
};
ACT.acTemp=id=>{
  const u=S.users.find(x=>x.id===id);
  confirmar(`Gerar uma senha temporária para <b>${esc(u.nome)}</b>? A senha atual deixa de funcionar na hora.`,async()=>{
    const senha=senhaTemporaria();try{await definirSenhaDe(u,senha)}catch(ex){toast(ex.message);return}u.trocarSenha=u.id!==me().id;
    const bloq=lerJSON(localStorage,CH_BLOQ)||{};delete bloq[u.login];gravarJSON(localStorage,CH_BLOQ,bloq);
    log('Redefiniu senha (temporária)',u.login);save();render();mostrarSenhaTemp(u,senha);
  },'Gerar senha');
};
ACT.acDefinir=id=>{
  const u=S.users.find(x=>x.id===id);
  modal('Definir nova senha – '+esc(u.nome),`<div class="form">${camposSenha('d',false)}</div>
    <label class="check" for="dTrocar"><input type="checkbox" id="dTrocar" ${u.id===me().id?'':'checked'}><span>Pedir para ${u.id===me().id?'eu':'a pessoa'} criar outra senha no próximo acesso</span></label>
    <div class="aviso erro" id="dErro" hidden role="alert"></div>`,
    `<button class="btn" data-close>Cancelar</button><button class="btn pri" id="dSalvar">Salvar senha</button>`,true);
  ligarVerSenha();medirForca('d');
  $('#dSalvar').onclick=async()=>{
    const r=lerNovaSenha('d',u),err=$('#dErro');if(r.erro){err.textContent=r.erro;err.hidden=false;$('#'+r.campo).focus();return}
    try{await definirSenhaDe(u,r.senha)}catch(ex){err.textContent=ex.message;err.hidden=false;return}u.trocarSenha=$('#dTrocar').checked&&u.id!==me().id;
    const bloq=lerJSON(localStorage,CH_BLOQ)||{};delete bloq[u.login];gravarJSON(localStorage,CH_BLOQ,bloq);
    log('Definiu nova senha',u.login);save();closeModal();render();toast('Senha salva');
  };
};
ACT.acExcluir=id=>{
  const u=S.users.find(x=>x.id===id);
  if(u.admin&&qtdAdmins()===1){toast('Não é possível excluir o único administrador');return}
  confirmar(`Excluir o usuário <b>${esc(u.nome)}</b> (${esc(u.login)})? Ele não poderá mais entrar. <br><br>O histórico da auditoria continua guardado. Se for só temporário, prefira <b>bloquear</b> o usuário.`,async()=>{
    const {error}=await sb.rpc('admin_excluir_usuario',{p_id:id});if(error){toast(traduzErro(error));return}
    S.users=S.users.filter(x=>x.id!==id);acSel='';log('Excluiu usuário',u.login);save();render();toast('Usuário excluído');
  },'Excluir usuário');
};

/* ===================== Início ===================== */
(async function iniciar(){
  if(!configurado()){telaConfigurar();return}
  iniciarSupabase();
  await lerPublico();
  let aviso=null;try{aviso=JSON.parse(sessionStorage.getItem('tapecaria_msg')||'null');sessionStorage.removeItem('tapecaria_msg')}catch(e){}
  // erro vindo do link do e-mail (ex.: link vencido)
  const hash=new URLSearchParams(location.hash.replace(/^#/,''));
  if(hash.get('error')){try{history.replaceState(null,'',location.pathname)}catch(e){}
    aviso={msg:/expired/i.test(hash.get('error_code')+hash.get('error_description'))?'O link do e-mail venceu ou já foi usado. Peça um novo em "Esqueci minha senha".':'Não foi possível usar o link do e-mail: '+esc(hash.get('error_description')||''),tipo:'erro'}}
  let recuperando=/type=recovery/.test(location.hash);
  sb.auth.onAuthStateChange(ev=>{if(ev==='PASSWORD_RECOVERY'){recuperando=true;telaNovaSenhaPeloLink()}});
  const {data}=await sb.auth.getSession();
  if(recuperando&&data.session){telaNovaSenhaPeloLink();return}
  if(data.session){
    // sem "manter conectado", fechar o navegador encerra a sessão
    manterConectado=!!lerJSON(localStorage,CH_MANTER);
    let mesmaAba=false;try{mesmaAba=!!sessionStorage.getItem('tapecaria_aba')}catch(e){}
    if(!manterConectado&&!mesmaAba){await sb.auth.signOut().catch(()=>{})}
    else return entrarComSessao(false);
  }
  const vazio=await sb.rpc('sistema_vazio');
  if(vazio.error)return mostrarLogin('Não foi possível falar com o banco de dados. Confira o js/config.js e se o arquivo supabase/schema.sql foi executado no Supabase. ('+esc(vazio.error.message)+')','erro');
  if(vazio.data)return telaPrimeiroAdmin();
  mostrarLogin(aviso&&aviso.msg,aviso&&aviso.tipo);
})();
