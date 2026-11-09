/* ===================== Utilidades ===================== */
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brl=n=>(Number(n)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const nfmt=n=>(Number(n)||0).toLocaleString('pt-BR',{maximumFractionDigits:2});
const dbr=d=>d?d.slice(0,10).split('-').reverse().join('/'):'—';
const pad=n=>String(n).padStart(4,'0');
const ano=()=>new Date().getFullYear();
const numOrc=o=>`ORC-${(o.data||'').slice(0,4)||ano()}-${pad(o.num)}`;
const numOS=o=>`OS-${(o.entrada||'').slice(0,4)||ano()}-${pad(o.num)}`;
/* ---------- Sessão e permissões ---------- */
let SESSAO=null; // id do usuário logado
const me=()=>(S&&S.users&&S.users.find(u=>u.id===SESSAO))||null;
// O administrador sempre pode tudo; os demais, só o que foi liberado na tela de Acessos
const pode=p=>{const u=me();return !!u&&(u.admin||!!(u.perms&&u.perms[p]))};
const perfilNome=u=>u.admin?'Administrador':'Usuário';
const cli=id=>S.clientes.find(c=>c.id===id);
const vei=id=>S.veiculos.find(v=>v.id===id);
// Veículos excluídos somem das listas, mas continuam nos documentos antigos
const veiculosAtivos=()=>S.veiculos.filter(v=>!v.excluido);
const prod=id=>S.produtos.find(p=>p.id===id);
function maskDoc(d){if(!d)return '—';const s=String(d);if(s.length>14)return s.replace(/^(\d{2})\.\d{3}/,'$1.***');return s.replace(/^\d{3}/,'***').replace(/-\d{2}$/,'-**')}
function nomeVisivel(c){if(!c)return '—';if(pode('cli.ver'))return c.nome;const p=c.nome.split(' ');return p[0]+(p.length>1?' '+p[p.length-1][0]+'.':'')}
function soma(doc){const sub=doc.itens.reduce((a,i)=>a+(Number(i.qtd)||0)*(Number(i.preco)||0),0);const mat=doc.itens.filter(i=>i.produtoId).reduce((a,i)=>a+(Number(i.qtd)||0)*(Number(i.preco)||0),0);return{sub,mat,mo:sub-mat,total:Math.max(0,sub-(Number(doc.desconto)||0))}}
function log(acao,alvo){const u=me();S.logs.unshift({id:uid(),data:new Date().toISOString(),user:u?u.nome+' ('+u.login+')':'Sistema',acao,alvo});S.logs=S.logs.slice(0,500);save()}
function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2600)}
function chipStatus(s){const m={'Aguardando':'c-mute','Em andamento':'c-info','Pronto':'c-ok','Entregue':'c-acc','Cancelada':'c-bad','Aberto':'c-info','Aprovado':'c-ok','Recusado':'c-bad','Vencido':'c-warn'};return `<span class="chip ${m[s]||'c-mute'}">${esc(s)}</span>`}
function estoqueChip(p){if(p.qtd<=0)return '<span class="chip c-bad">Zerado</span>';if(p.qtd<p.min)return '<span class="chip c-warn">Abaixo do mínimo</span>';return '<span class="chip c-ok">OK</span>'}
function orcStatus(o){if(o.status==='Aberto'){const v=pd(o.data);v.setDate(v.getDate()+Number(o.validade||0));if(iso(v)<iso(new Date()))return 'Vencido'}return o.status}

/* ---------- Caixa: quanto cada OS já recebeu ---------- */
function recebido(o){return S.caixa.filter(l=>l.tipo==='entrada'&&l.osId===o.id).reduce((a,l)=>a+Number(l.valor),0)}
function falta(o){return Math.max(0,+(soma(o).total-recebido(o)).toFixed(2))}
function chipPagamento(o){
  if(o.status==='Cancelada')return '<span class="chip c-mute">—</span>';
  const r=recebido(o),t=soma(o).total;
  if(t>0&&r>=t-0.005)return '<span class="chip c-ok">Pago</span>';
  if(r>0)return `<span class="chip c-warn">Falta ${brl(t-r)}</span>`;
  return '<span class="chip c-mute">A receber</span>';
}

/* ---------- Estoque baixo ---------- */
const baixos=()=>S.produtos.filter(p=>p.qtd<p.min);
// Sugestão de compra: repor até 2× o estoque mínimo
const sugestao=p=>Math.max(0,Math.ceil(p.min*2-p.qtd));
// Guarda o saldo antes de uma movimentação e avisa quem acabou de cair abaixo do mínimo
function fotoEstoque(){const m={};S.produtos.forEach(p=>m[p.id]=p.qtd);return m}
function avisarQueda(antes){
  const caiu=S.produtos.filter(p=>antes[p.id]!==undefined&&antes[p.id]>=p.min&&p.qtd<p.min);
  if(caiu.length)setTimeout(()=>toast('Estoque baixo: '+caiu.map(p=>`${p.nome} (${nfmt(p.qtd)} ${p.un}, mínimo ${nfmt(p.min)})`).join('; ')),400);
  return caiu;
}

/* ---------- Arquivos: planilha CSV que abre direto no Excel ---------- */
function csvCampo(v){if(typeof v==='number')v=String(v).replace('.',',');v=String(v??'');return /[";\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}
function baixarCSV(nome,linhas){
  const txt='﻿'+linhas.map(l=>l.map(csvCampo).join(';')).join('\r\n');
  const url=URL.createObjectURL(new Blob([txt],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download=nome;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function copiarTexto(txt,el){
  const fallback=()=>{if(el){const r=document.createRange();r.selectNodeContents(el);const s=getSelection();s.removeAllRanges();s.addRange(r)}toast('Texto selecionado: use Ctrl+C')};
  if(navigator.clipboard)navigator.clipboard.writeText(txt).then(()=>toast('Copiado')).catch(fallback);else fallback();
}
const hojeISO=()=>iso(new Date());

/* ---------- Senhas: PBKDF2-SHA256 com sal aleatório (a senha nunca é guardada) ---------- */
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
const unhex=h=>new Uint8Array(h.match(/../g).map(x=>parseInt(x,16)));
async function hashSenha(senha,saltHex,iter){
  if(!(window.crypto&&crypto.subtle))throw new Error('Este navegador não permite criptografia aqui. Abra pelo iniciar.bat (http://localhost:8000) no Chrome ou Edge.');
  const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(senha),'PBKDF2',false,['deriveBits']);
  return hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:unhex(saltHex),iterations:iter||SENHA_ITER},k,256));
}
async function novaSenhaHash(senha){const salt=hex(crypto.getRandomValues(new Uint8Array(16)));return {salt,hash:await hashSenha(senha,salt,SENHA_ITER),iter:SENHA_ITER}}
async function confere(u,senha){if(!u.senha)return false;const h=await hashSenha(senha,u.senha.salt,u.senha.iter);let d=0;for(let i=0;i<h.length;i++)d|=h.charCodeAt(i)^u.senha.hash.charCodeAt(i);return d===0&&h.length===u.senha.hash.length}
// Regras mínimas de senha
function problemaSenha(s,u){
  if(s.length<8)return 'A senha precisa ter pelo menos 8 caracteres.';
  if(!/[A-Za-z]/.test(s)||!/\d/.test(s))return 'Use letras e números na senha.';
  if(u&&u.login&&normal(u.login).length>=3&&normal(s).includes(normal(u.login)))return 'A senha não pode conter o nome de usuário.';
  if(['12345678','senha123','admin123','vend1234','password'].includes(s.toLowerCase()))return 'Essa senha é fácil demais de adivinhar.';
  return '';
}
function senhaTemporaria(){const a='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';const r=crypto.getRandomValues(new Uint8Array(10));let s='';r.forEach(x=>s+=a[x%a.length]);return /\d/.test(s)?s:s.slice(0,9)+'7'}

/* ---------- CPF e CNPJ: validação pelos dígitos verificadores (cálculo oficial da Receita) ---------- */
const soDigitos=v=>String(v||'').replace(/\D/g,'');
function cpfValido(v){
  const c=soDigitos(v);
  if(c.length!==11||/^(\d)\1{10}$/.test(c))return false; // 111.111.111-11 e parecidos passam no cálculo, mas não existem
  for(let t=9;t<11;t++){let s=0;for(let i=0;i<t;i++)s+=+c[i]*(t+1-i);if(((s*10)%11)%10!==+c[t])return false}
  return true;
}
function cnpjValido(v){
  const c=soDigitos(v);
  if(c.length!==14||/^(\d)\1{13}$/.test(c))return false;
  const dv=n=>{const pesos=n===12?[5,4,3,2,9,8,7,6,5,4,3,2]:[6,5,4,3,2,9,8,7,6,5,4,3,2];const r=pesos.reduce((a,p,i)=>a+ +c[i]*p,0)%11;return r<2?0:11-r};
  return dv(12)===+c[12]&&dv(13)===+c[13];
}
// Formata enquanto digita: até 11 números vira CPF, de 12 a 14 vira CNPJ
function formatarDoc(v){
  const d=soDigitos(v).slice(0,14);
  if(d.length<=11)return d.slice(0,3)+(d.length>3?'.'+d.slice(3,6):'')+(d.length>6?'.'+d.slice(6,9):'')+(d.length>9?'-'+d.slice(9,11):'');
  return d.slice(0,2)+'.'+d.slice(2,5)+'.'+d.slice(5,8)+'/'+d.slice(8,12)+(d.length>12?'-'+d.slice(12,14):'');
}
// Devolve {ok, tipo, msg}. "idIgnorar" serve para não acusar duplicado o próprio cliente em edição
function conferirDoc(v,idIgnorar){
  const d=soDigitos(v);
  if(!d)return {ok:false,vazio:true,msg:'Informe o CPF (pessoa física) ou o CNPJ (empresa).'};
  if(d.length<11)return {ok:false,incompleto:true,msg:`Faltam ${11-d.length} número(s) para o CPF.`};
  if(d.length>11&&d.length<14)return {ok:false,incompleto:true,msg:`Faltam ${14-d.length} número(s) para o CNPJ.`};
  const tipo=d.length===11?'CPF':'CNPJ';
  if(!(tipo==='CPF'?cpfValido(d):cnpjValido(d)))return {ok:false,tipo,msg:`${tipo} inválido: os dígitos não conferem. Confira o número no documento do cliente.`};
  const dono=S.clientes.find(c=>c.id!==idIgnorar&&!c.anonimizado&&soDigitos(c.cpf)===d);
  if(dono)return {ok:false,tipo,dup:dono,msg:`Este ${tipo} já está cadastrado para ${dono.nome}.`};
  return {ok:true,tipo,msg:`${tipo} válido`+(tipo==='CPF'?' · pessoa física':' · empresa')};
}

/* ---------- Busca: ignora acentos, maiúsculas e pontuação ---------- */
// "João" → "joao", "CONCEIÇÃO" → "conceicao"
function normal(t){return String(t??'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim()}
/* Confere se TODAS as palavras digitadas aparecem nos campos, em qualquer ordem.
   Cada palavra também é comparada sem pontuação, para achar CPF, telefone e placa
   digitados com ou sem pontos, traços e espaços ("12345678909", "pia-1b23"). */
function combina(q,...campos){
  const palavras=normal(q).split(/\s+/).filter(Boolean);
  if(!palavras.length)return true;
  const texto=normal(campos.flat().filter(x=>x!=null&&x!=='').join(' | '));
  const corrido=texto.replace(/[^a-z0-9]/g,'');
  return palavras.every(p=>{const pc=p.replace(/[^a-z0-9]/g,'');return texto.includes(p)||(pc.length>0&&corrido.includes(pc))});
}
// Dados do cliente que entram na busca (CPF, telefone e endereço só para quem pode ver dados pessoais)
function camposCliente(c){
  if(!c)return [];
  const carros=S.veiculos.filter(v=>v.clienteId===c.id&&!v.excluido).flatMap(v=>[v.placa,v.marca,v.modelo]);
  return pode('cli.ver')?[c.nome,c.cpf,soDigitos(c.cpf),c.telefone,c.email,c.endereco,...carros]:[nomeVisivel(c),...carros];
}

/* ---------- Logo da empresa ---------- */
const logoEmpresa=()=>(S&&S.empresa&&S.empresa.logo)||'';
// Na tela: o logo, ou o símbolo padrão quando ainda não há logo
const logoTela=()=>logoEmpresa()?`<img src="${logoEmpresa()}" alt="Logo de ${esc(S.empresa.nome)}">`:'<span class="brand-mark" aria-hidden="true"></span>';
// Nos impressos (o tamanho muda sozinho entre A4 e A5 pelo CSS .doc-logo)
const logoDoc=()=>logoEmpresa()?`<img class="doc-logo" src="${logoEmpresa()}" alt="">`:'';
function aplicarFavicon(){
  let l=document.querySelector('link[rel="icon"]');if(!l){l=document.createElement('link');l.rel='icon';document.head.appendChild(l)}
  if(logoEmpresa())l.href=logoEmpresa();else l.removeAttribute('href');
}
