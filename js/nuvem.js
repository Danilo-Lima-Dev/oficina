/* =====================================================================
   Ligação com o banco de dados (Supabase)
   - Depois do login, carrega do banco só o que o usuário pode ver.
   - As telas continuam alterando o objeto S, como antes. Ao chamar save(),
     este arquivo compara S com a última versão lida do banco e grava só o
     que mudou (inclui, altera ou apaga).
   - Mudanças feitas por outras pessoas chegam em tempo real e a tela é atualizada.
   ===================================================================== */
let sb=null; // cliente do Supabase

const configurado=()=>typeof SUPABASE_URL==='string'&&/^https:\/\/[a-z0-9-]+\.supabase\.(co|in)\/?$/i.test(SUPABASE_URL.trim())&&typeof SUPABASE_ANON_KEY==='string'&&SUPABASE_ANON_KEY.length>30&&!/COLE_AQUI/.test(SUPABASE_ANON_KEY);
function iniciarSupabase(){
  if(sb)return sb;
  sb=supabase.createClient(SUPABASE_URL.trim(),SUPABASE_ANON_KEY.trim(),{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'tapecaria_sessao'}});
  return sb;
}
// Cliente separado, sem guardar sessão: usado pelo administrador para criar usuários sem sair da própria conta
const clienteTemporario=()=>supabase.createClient(SUPABASE_URL.trim(),SUPABASE_ANON_KEY.trim(),{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false,storageKey:'tapecaria_tmp_'+Date.now()}});

// Coleções do objeto S ↔ tabelas do banco
const TABELAS={clientes:'clientes',veiculos:'veiculos',produtos:'produtos',movs:'movs',orcamentos:'orcamentos',os:'os',caixa:'caixa',logs:'logs',users:'perfis',categorias:'categorias',config:'config',publico:'publico'};
const COLECAO_DA_TABELA=Object.fromEntries(Object.entries(TABELAS).map(([c,t])=>[t,c]));
const FOTO={};               // última versão conhecida no banco: FOTO[coleção] = Map(id → JSON)
const SO_LEITURA=new Set();  // coleções carregadas em resumo (ex.: nome abreviado de clientes): nunca são gravadas

// Como cada coleção vira linhas da tabela (id + dados)
function linhas(col){
  if(col==='categorias')return S.categorias.map(n=>({id:n,dados:{nome:n}}));
  if(col==='config'){const {logo,...emp}=S.empresa;return [{id:'empresa',dados:emp},{id:'sistema',dados:{exemplo:!!S.exemplo}}]}
  if(col==='publico')return [{id:1,dados:{nome:S.empresa.nome||'Tapeçaria',logo:S.empresa.logo||''}}];
  return (S[col]||[]).map(o=>{if(!o.id)o.id=uid();const {id,...dados}=o;return {id,dados}});
}
const json=v=>JSON.stringify(v);
function guardarFoto(col,lista){FOTO[col]=new Map(lista.map(l=>[String(l.id),json(l.dados)]))}

/* ---------- Leitura ---------- */
async function lerTabela(tabela,opcoes={}){
  let todos=[],de=0;const passo=1000;
  for(;;){
    let q=sb.from(tabela).select('id,dados');
    q=opcoes.recentes?q.order('criado_em',{ascending:false}).range(0,opcoes.recentes-1):q.order('id').range(de,de+passo-1);
    const {data,error}=await q;if(error)throw error;
    todos=todos.concat(data||[]);
    if(opcoes.recentes||!data||data.length<passo)break;de+=passo;
  }
  return todos;
}
async function lerPublico(){
  try{const {data}=await sb.from('publico').select('nome,logo').eq('id',1).maybeSingle();if(data){S.empresa.nome=data.nome||S.empresa.nome;S.empresa.logo=data.logo||''}}catch(e){}
}
// Carrega tudo o que o usuário logado pode ver
async function carregarDados(){
  const perfis=await lerTabela('perfis');
  S.users=perfis.map(r=>({...r.dados,id:r.id}));guardarFoto('users',perfis);
  migrar(S);
  if(!me())throw new Error('Seu cadastro não foi encontrado.');
  const [cfg,pub,cli,vei,prod,cat,movs,orc,os,cx,logs]=await Promise.all([
    lerTabela('config'),
    sb.from('publico').select('nome,logo').eq('id',1).maybeSingle().then(r=>r.data),
    pode('cli.ver')?lerTabela('clientes'):sb.rpc('clientes_resumo').then(r=>{if(r.error)throw r.error;return (r.data||[]).map(x=>({id:x.id,dados:{nome:x.nome,cpf:'',telefone:'',email:'',endereco:''}}))}),
    lerTabela('veiculos'),lerTabela('produtos'),lerTabela('categorias'),lerTabela('movs'),lerTabela('orcamentos'),lerTabela('os'),lerTabela('caixa'),
    pode('auditoria')?lerTabela('logs',{recentes:500}):Promise.resolve([])
  ]);
  const emp=(cfg.find(r=>r.id==='empresa')||{}).dados||{};
  S.empresa={nome:'Tapeçaria',cnpj:'',endereco:'',telefone:'',email:'',encarregado:'',garantia:90,validade:15,retencao:'',...emp,nome:(pub&&pub.nome)||emp.nome||'Tapeçaria',logo:(pub&&pub.logo)||''};
  S.exemplo=!!((cfg.find(r=>r.id==='sistema')||{}).dados||{}).exemplo;
  const pega=(col,rows)=>{S[col]=rows.map(r=>({...r.dados,id:r.id}));guardarFoto(col,rows)};
  pega('clientes',cli);if(pode('cli.ver'))SO_LEITURA.delete('clientes');else SO_LEITURA.add('clientes');
  pega('veiculos',vei);pega('produtos',prod);pega('movs',movs);pega('orcamentos',orc);pega('os',os);pega('caixa',cx);pega('logs',logs);
  S.categorias=cat.map(r=>r.dados.nome||r.id).sort((a,b)=>a.localeCompare(b));guardarFoto('categorias',cat);
  // ordem de exibição igual à da versão anterior (mais recentes primeiro)
  S.caixa.sort((a,b)=>String(b.data).localeCompare(String(a.data)));S.movs.sort((a,b)=>String(b.data).localeCompare(String(a.data)));S.logs.sort((a,b)=>String(b.data).localeCompare(String(a.data)));
  guardarFoto('config',linhas('config'));guardarFoto('publico',linhas('publico'));
  if(!cfg.length&&pode('config'))FOTO.config=new Map(); // primeira vez: grava as configurações padrão
  ligarTempoReal();
}

/* ---------- Gravação: compara S com o banco e envia só as diferenças ---------- */
let gravando=null,gravarDeNovo=false,timerGravar=null;
function save(){clearTimeout(timerGravar);timerGravar=setTimeout(()=>{gravar()},200)}
async function salvarAgora(){clearTimeout(timerGravar);await gravar();while(gravando)await gravando}
async function gravar(){
  if(!sb||!me())return;
  if(gravando){gravarDeNovo=true;return gravando}
  gravando=(async()=>{
    const erros=[];
    for(const col of Object.keys(TABELAS)){
      if(SO_LEITURA.has(col))continue;
      try{await gravarColecao(col)}catch(e){erros.push({col,e})}
    }
    if(erros.length){
      console.error(erros);
      const e=erros[0].e,msg=String(e.message||e);
      toast(/row-level security|permission|42501/i.test(msg)?'Você não tem permissão para essa alteração. Ela foi desfeita.':'Não foi possível gravar no banco: '+msg);
      for(const {col} of erros)await recarregarColecao(col).catch(()=>{});
      if(typeof render==='function'&&me())render();
    }
  })();
  try{await gravando}finally{gravando=null;if(gravarDeNovo){gravarDeNovo=false;await gravar()}}
}
async function gravarColecao(col){
  const tabela=TABELAS[col],atual=linhas(col),antes=FOTO[col]||new Map();
  const ids=new Set(atual.map(l=>String(l.id)));
  const novos=[],mudados=[],removidos=[...antes.keys()].filter(id=>!ids.has(id));
  for(const l of atual){const k=String(l.id),j=json(l.dados);if(!antes.has(k))novos.push(l);else if(antes.get(k)!==j)mudados.push(l)}
  if(!novos.length&&!mudados.length&&!removidos.length)return;
  // apagar
  if(removidos.length){
    if(col==='users')removidos.forEach(id=>antes.delete(id)); // usuários são excluídos pela função própria (tela Acessos)
    else for(let i=0;i<removidos.length;i+=200){const parte=removidos.slice(i,i+200);const {error}=await sb.from(tabela).delete().in('id',parte);if(error)throw error;parte.forEach(id=>antes.delete(id))}
  }
  // incluir (usuários e o registro público já existem: são sempre atualizados)
  if(col==='users'||col==='publico')mudados.push(...novos.splice(0));
  if(col==='config'){for(const l of [...novos,...mudados]){const {error}=await sb.from(tabela).upsert(l);if(error)throw error;antes.set(String(l.id),json(l.dados))}FOTO[col]=antes;return}
  for(let i=0;i<novos.length;i+=500){const parte=novos.slice(i,i+500);const {error}=await sb.from(tabela).insert(parte);if(error)throw error;parte.forEach(l=>antes.set(String(l.id),json(l.dados)))}
  // alterar
  for(const l of mudados){
    const {error}=col==='publico'?await sb.from(tabela).update(l.dados).eq('id',1):await sb.from(tabela).update({dados:l.dados}).eq('id',l.id);
    if(error)throw error;antes.set(String(l.id),json(l.dados));
  }
  FOTO[col]=antes;
}
async function recarregarColecao(col){
  if(col==='config'||col==='publico'){await lerPublico();guardarFoto(col,linhas(col));return}
  const rows=col==='logs'?await lerTabela('logs',{recentes:500}):await lerTabela(TABELAS[col]);
  if(col==='categorias')S.categorias=rows.map(r=>r.dados.nome||r.id).sort((a,b)=>a.localeCompare(b));
  else S[col]=rows.map(r=>({...r.dados,id:r.id}));
  if(col==='caixa'||col==='movs'||col==='logs')S[col].sort((a,b)=>String(b.data).localeCompare(String(a.data)));
  guardarFoto(col,rows);
}

/* ---------- Numeração de OS e orçamentos (o banco garante que não repete) ---------- */
async function proximoNumero(tipo){
  const {data,error}=await sb.rpc('proximo_numero',{p_tipo:tipo});
  if(error)throw new Error(/permiss/i.test(error.message)?'Você não tem permissão para criar este documento.':'Não foi possível gerar o número: '+error.message);
  return Number(data);
}

/* ---------- Tempo real: o que outra pessoa muda aparece aqui ---------- */
let canal=null,renderPendente=false;
function ligarTempoReal(){
  if(canal)return;
  canal=sb.channel('tapecaria').on('postgres_changes',{event:'*',schema:'public'},p=>{try{aplicarMudanca(p)}catch(e){console.error(e)}}).subscribe();
}
function aplicarMudanca(p){
  const col=COLECAO_DA_TABELA[p.table];if(!col||SO_LEITURA.has(col))return;
  if(col==='publico'){if(p.new){S.empresa.nome=p.new.nome||S.empresa.nome;S.empresa.logo=p.new.logo||'';guardarFoto('publico',linhas('publico'));pedirRender()}return}
  if(col==='config'){if(p.new&&p.new.id==='empresa'){const logo=S.empresa.logo;S.empresa={...p.new.dados,logo};}if(p.new&&p.new.id==='sistema')S.exemplo=!!p.new.dados.exemplo;guardarFoto('config',linhas('config'));pedirRender();return}
  const foto=FOTO[col]||(FOTO[col]=new Map());
  if(p.eventType==='DELETE'){
    const id=String((p.old||{}).id);if(!foto.has(id))return;foto.delete(id);
    if(col==='categorias')S.categorias=S.categorias.filter(n=>n!==id);else S[col]=(S[col]||[]).filter(o=>String(o.id)!==id);
  }else{
    const r=p.new;if(!r||r.dados==null)return;const id=String(r.id),j=json(r.dados);
    if(foto.get(id)===j)return; // é a própria alteração que acabamos de gravar
    foto.set(id,j);
    if(col==='categorias'){if(!S.categorias.includes(r.dados.nome))S.categorias.push(r.dados.nome);S.categorias.sort((a,b)=>a.localeCompare(b))}
    else{const lista=S[col]||(S[col]=[]);const i=lista.findIndex(o=>String(o.id)===id);const obj={...r.dados,id:r.id};if(i>=0)lista[i]=obj;else lista.unshift(obj)}
    if(col==='users'&&id===String(SESSAO)){migrar(S);const u=me();if(!u.ativo){sair('Seu acesso foi bloqueado pelo administrador.');return}}
  }
  pedirRender();
}
// Não redesenha com uma janela aberta (para não perder o que está sendo digitado)
function pedirRender(){if(!me()||$('#app').hidden)return;if($('#modalRoot').innerHTML||$('#confirmRoot').innerHTML){renderPendente=true;return}render()}
setInterval(()=>{if(renderPendente&&me()&&!$('#modalRoot').innerHTML&&!$('#confirmRoot').innerHTML){renderPendente=false;render()}},1500);
async function desligarTempoReal(){if(canal){try{await sb.removeChannel(canal)}catch(e){}canal=null}}

/* ---------- Área de impressão: não deixa dados de cliente escondidos na página ---------- */
window.addEventListener('afterprint',()=>{const p=document.getElementById('print');if(p)p.innerHTML=''});

/* ---------- Barreira para curiosos: bloqueia F12 e atalhos das ferramentas do navegador ----------
   Não é a proteção de verdade: quem protege os dados é o banco, que só entrega a cada
   usuário o que ele pode ver (regras em supabase/schema.sql). */
document.addEventListener('keydown',e=>{
  const k=(e.key||'').toLowerCase(),ctrl=e.ctrlKey||e.metaKey;
  if(e.key==='F12'||(ctrl&&e.shiftKey&&['i','j','c','k'].includes(k))||(ctrl&&e.altKey&&['i','j','c'].includes(k))||(ctrl&&k==='u')){e.preventDefault();e.stopPropagation()}
},true);
