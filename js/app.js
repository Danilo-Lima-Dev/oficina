/* Telas, formulários, impressão e regras da LGPD */
/* ===================== Modal ===================== */
function modal(title,body,foot,narrow,fixo){
  $('#modalRoot').innerHTML=`<div class="scrim" id="scrim" ${fixo?'data-fixo':''}><div class="modal ${narrow?'narrow':''}" role="dialog" aria-modal="true" aria-labelledby="mt"><div class="modal-h"><h3 id="mt">${title}</h3>${fixo?'':'<button class="x" aria-label="Fechar" data-close>×</button>'}</div><div class="modal-b">${body}</div>${foot?`<div class="modal-f">${foot}</div>`:''}</div></div>`;
  $('#scrim').addEventListener('click',e=>{if((e.target.id==='scrim'&&!fixo)||e.target.hasAttribute('data-close'))closeModal()});
  document.body.style.overflow='hidden';
  const f=$('#modalRoot').querySelector('input,select,textarea');if(f&&matchMedia('(min-width:641px)').matches)f.focus();
}
function closeModal(){$('#modalRoot').innerHTML='';$('#print').innerHTML='';document.body.style.overflow=''}
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if($('#confirmRoot').innerHTML){$('#confirmRoot').innerHTML='';return}if(!document.querySelector('[data-fixo]'))closeModal()});
/* Caixa de confirmação: aparece por cima de qualquer janela.
   Toda exclusão passa por aqui. Botões com "Excluir", "Apagar", "Remover" ou "Anonimizar" ficam vermelhos. */
function confirmar(msg,ok,label='Confirmar',titulo){
  const perigo=/excluir|apagar|remover|anonimizar/i.test(label);
  const voltarFoco=document.activeElement;
  $('#confirmRoot').innerHTML=`<div class="scrim conf-scrim" id="confScrim"><div class="modal narrow conf ${perigo?'perigo':''}" role="alertdialog" aria-modal="true" aria-labelledby="confT" aria-describedby="confM">
    <div class="conf-corpo"><span class="conf-ico" aria-hidden="true">${perigo?'!':'?'}</span><div><h3 id="confT">${titulo||(perigo?'Tem certeza?':'Confirmar')}</h3><div id="confM" class="conf-msg">${msg}</div>${perigo?'<p class="conf-aviso">Essa ação não pode ser desfeita.</p>':''}</div></div>
    <div class="modal-f"><button class="btn" id="confNao">Cancelar</button><button class="btn ${perigo?'perigo-pri':'pri'}" id="confSim">${label}</button></div></div></div>`;
  const fechar=()=>{$('#confirmRoot').innerHTML='';if(voltarFoco&&document.contains(voltarFoco))voltarFoco.focus()};
  $('#confNao').onclick=fechar;
  $('#confScrim').onclick=e=>{if(e.target.id==='confScrim')fechar()};
  $('#confSim').onclick=()=>{const v={};$('#confirmRoot').querySelectorAll('input,select,textarea').forEach(el=>{if(el.id)v[el.id]=el.value});$('#confirmRoot').innerHTML='';ok(v)};
  $('#confNao').focus(); // o foco começa em Cancelar, para ninguém excluir sem querer apertando Enter
}


/* ===================== Tema claro / escuro ===================== */
const TEMAS=['auto','claro','escuro'];
const ICONES={
  auto:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/></svg>',
  claro:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  escuro:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>'};
const NOMES_TEMA={auto:'Automático',claro:'Claro',escuro:'Escuro'};
function temaAtual(){try{return localStorage.getItem('tapecaria_tema')||'auto'}catch(e){return 'auto'}}
function aplicarTema(t){
  const root=document.documentElement;
  if(t==='claro')root.dataset.theme='light';else if(t==='escuro')root.dataset.theme='dark';else delete root.dataset.theme;
  try{localStorage.setItem('tapecaria_tema',t)}catch(e){}
  const b=$('#temaBtn');
  b.innerHTML=ICONES[t]+'<span class="tema-txt">'+NOMES_TEMA[t]+'</span>';
  b.title='Tema: '+NOMES_TEMA[t]+' (clique para mudar)';
  b.setAttribute('aria-label','Tema '+NOMES_TEMA[t]+'. Clique para mudar');
}
$('#temaBtn').addEventListener('click',()=>{const t=TEMAS[(TEMAS.indexOf(temaAtual())+1)%TEMAS.length];aplicarTema(t);toast('Tema: '+NOMES_TEMA[t]+(t==='auto'?' (segue o celular/computador)':''))});
aplicarTema(temaAtual());

/* ===================== Tabelas no celular ===================== */
// Copia o título de cada coluna para as células; no celular o CSS mostra cada linha como um cartão com rótulos.
function rotular(){
  document.querySelectorAll('.tbl-wrap table').forEach(t=>{
    const hs=[...t.querySelectorAll('thead th')].map(th=>th.textContent.trim());
    t.querySelectorAll('tbody tr').forEach(tr=>[...tr.children].forEach((td,i)=>{if(!td.hasAttribute('data-label'))td.setAttribute('data-label',td.colSpan>1?'':(hs[i]||''))}));
  });
}
let rotPend=false;
new MutationObserver(()=>{if(rotPend)return;rotPend=true;queueMicrotask(()=>{rotPend=false;rotular()})}).observe(document.body,{childList:true,subtree:true});

/* ===================== Navegação ===================== */
let tab='painel';let filtro='';
function render(){
  const u=me();if(!u)return;
  const tabs=Object.keys(TABS).filter(t=>pode(TAB_PERM[t]));
  if(!tabs.includes(tab))tab=tabs[0]||'';
  $('#brandName').textContent=S.empresa.nome||'Tapeçaria';
  $('#brandLogo').innerHTML=logoTela();$('#brandLogo').classList.toggle('tem-logo',!!logoEmpresa());aplicarFavicon();
  $('#userNome').textContent=u.nome;$('#userPerfil').textContent=perfilNome(u);$('#userIni').textContent=u.nome.trim().split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase();
  const nb=baixos().length;
  $('#tabs').innerHTML=tabs.map(t=>`<button data-tab="${t}" ${t===tab?'aria-current="page"':''}>${TABS[t]}${t==='estoque'&&nb?` <span class="badge" aria-label="${nb} com estoque baixo">${nb}</span>`:''}</button>`).join('');
  renderAlerta();
  $('#view').innerHTML=tab?V[tab]():'<div class="empty" style="padding:60px 16px"><h2>Sem acessos liberados</h2><p>Seu usuário ainda não tem nenhuma função liberada. Peça ao administrador para ajustar seus acessos.</p></div>';
  tab&&bind[tab]&&bind[tab]();
  const at=$('#tabs [aria-current]');if(at)at.scrollIntoView({block:'nearest',inline:'nearest'});
}
/* Faixa de alerta de estoque baixo (some ao dispensar; volta se outro material cair abaixo do mínimo) */
let alertaDispensado='';
function renderAlerta(){
  const el=$('#alerta'),l=baixos();const assin=l.map(p=>p.id).sort().join(',');
  if(!l.length||!pode('est.ver')||alertaDispensado===assin){el.innerHTML='';return}
  const zer=l.filter(p=>p.qtd<=0).length;
  el.innerHTML=`<div class="wrap alerta-in" role="alert"><span class="alerta-ico" aria-hidden="true">!</span>
    <div class="alerta-txt"><b>${l.length} ${l.length>1?'materiais':'material'} com estoque baixo${zer?` (${zer} zerado${zer>1?'s':''})`:''}:</b> ${l.slice(0,4).map(p=>esc(p.nome)).join(', ')}${l.length>4?' e outros':''}.</div>
    ${pode('est.exportar')?'<button class="btn sm" data-act="reposicao">Ver lista de reposição</button>':''}<button class="btn sm link" id="alertaFechar">Dispensar</button></div>`;
  $('#alertaFechar').onclick=()=>{alertaDispensado=assin;renderAlerta()};
}
$('#tabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b){tab=b.dataset.tab;filtro='';render();window.scrollTo(0,0)}});
document.addEventListener('click',e=>{const a=e.target.closest('[data-act]');if(!a)return;const fn=ACT[a.dataset.act];if(fn)fn(a.dataset.id,a)});

/* ===================== Telas ===================== */
const V={}, bind={}, ACT={};

V.painel=()=>{
  const ativas=S.os.filter(o=>['Aguardando','Em andamento','Pronto'].includes(o.status));
  const abertos=S.orcamentos.filter(o=>orcStatus(o)==='Aberto');
  const baixos=S.produtos.filter(p=>p.qtd<p.min);
  const mes=iso(new Date()).slice(0,7);
  const fat=S.os.filter(o=>['Pronto','Entregue'].includes(o.status)&&(o.entrada||'').slice(0,7)===mes).reduce((a,o)=>a+soma(o).total,0);
  const showMoney=pode('precos');
  return `
  <div class="head painel-topo">${logoEmpresa()?`<img class="painel-logo" src="${logoEmpresa()}" alt="Logo de ${esc(S.empresa.nome)}">`:''}<div><h2>${['Bom dia','Boa tarde','Boa noite'][new Date().getHours()<12?0:new Date().getHours()<18?1:2]}, ${esc(me().nome)}</h2><p>${new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}</p></div></div>
  ${S.exemplo?`<div class="note">Você está usando <b>dados de teste</b>: um ano de uma tapeçaria fictícia, com nomes, CPFs e placas inventados. Teste à vontade. Em <i>Configurações</i> você recarrega os dados de teste ou apaga tudo para começar de verdade.</div>`:''}
  <div class="kpis">
    <div class="kpi"><b>${ativas.length}</b><span>Carros na oficina</span></div>
    ${pode('orc.ver')?`<div class="kpi"><b>${abertos.length}</b><span>Orçamentos aguardando resposta</span></div>`:''}
    <div class="kpi ${baixos.length?'alert':''}"><b>${baixos.length}</b><span>Materiais abaixo do mínimo</span></div>
    ${showMoney?`<div class="kpi"><b>${brl(fat)}</b><span>Serviços concluídos no mês</span></div>`:''}
    ${pode('caixa.ver')?(()=>{const h=S.caixa.filter(l=>l.data.slice(0,10)===hojeISO());const v=h.reduce((a,l)=>a+(l.tipo==='entrada'?1:-1)*l.valor,0);return `<div class="kpi"><b class="${v<0?'neg':''}">${brl(v)}</b><span>Resultado do caixa hoje</span></div>`})():''}
  </div>
  <div class="grid2">
    <section class="panel"><div class="panel-h"><h3>Na oficina agora</h3></div>
      <div class="tbl-wrap"><table><thead><tr><th>OS</th><th>Veículo</th><th>Cliente</th><th>Previsão</th><th>Situação</th></tr></thead><tbody>
      ${ativas.length?ativas.map(o=>{const v=vei(o.veiculoId);const atras=o.previsao<iso(new Date())&&o.status!=='Pronto';return `<tr><td><button class="btn link" data-act="editOS" data-id="${o.id}">${numOS(o)}</button></td><td><span class="plate">${esc(v?.placa||'—')}</span> ${esc(v?v.modelo:'')}</td><td>${esc(nomeVisivel(cli(o.clienteId)))}</td><td>${dbr(o.previsao)} ${atras?'<span class="chip c-bad">Atrasada</span>':''}</td><td>${chipStatus(o.status)}</td></tr>`}).join(''):`<tr><td colspan="5" class="empty">Nenhum carro na oficina.</td></tr>`}
      </tbody></table></div></section>
    <section class="panel"><div class="panel-h"><h3>Repor estoque</h3></div>
      <div class="tbl-wrap"><table><thead><tr><th>Material</th><th class="num">Saldo</th><th class="num">Mínimo</th><th></th></tr></thead><tbody>
      ${baixos.length?baixos.map(p=>`<tr><td>${esc(p.nome)}</td><td class="num">${nfmt(p.qtd)} ${esc(p.un)}</td><td class="num">${nfmt(p.min)} ${esc(p.un)}</td><td>${estoqueChip(p)}</td></tr>`).join(''):`<tr><td colspan="4" class="empty">Todos os materiais acima do mínimo.</td></tr>`}
      </tbody></table></div></section>
  </div>`;
};

/* ---------- Orçamentos ---------- */
V.orcamentos=()=>{
  const list=S.orcamentos.slice().sort((a,b)=>b.num-a.num).filter(o=>{const v=vei(o.veiculoId);return combina(filtro,numOrc(o),camposCliente(cli(o.clienteId)),v?.placa,v?.marca,v?.modelo,orcStatus(o),o.itens.map(i=>i.desc))});
  return `<div class="head"><div><h2>Orçamentos</h2><p>Monte o orçamento, imprima para o cliente e, se aprovado, transforme em ordem de serviço.</p></div><span class="spacer"></span>
  <input class="search" id="busca" placeholder="Buscar por nº, cliente, CPF, telefone, placa ou serviço" value="${esc(filtro)}" aria-label="Buscar orçamentos">
  ${pode('orc.editar')?'<button class="btn pri" data-act="novoOrc">+ Novo orçamento</button>':''}</div>
  <section class="panel"><div class="tbl-wrap"><table><thead><tr><th>Nº</th><th>Data</th><th>Cliente</th><th>Veículo</th>${pode('precos')?'<th class="num">Total</th>':''}<th>Situação</th><th></th></tr></thead><tbody>
  ${list.length?list.map(o=>{const c=cli(o.clienteId),v=vei(o.veiculoId),st=orcStatus(o);return `<tr><td><b>${numOrc(o)}</b></td><td>${dbr(o.data)}</td><td>${marcar(nomeVisivel(c),filtro)}</td><td><span class="plate">${esc(v?.placa||'—')}</span> ${esc(v?.modelo||'')}</td>${pode('precos')?`<td class="num">${brl(soma(o).total)}</td>`:''}<td>${chipStatus(st)}</td><td><div class="acts"><button class="btn sm" data-act="editOrc" data-id="${o.id}">Abrir</button>${pode('imprimir')?`<button class="btn sm" data-act="printOrc" data-id="${o.id}">Imprimir</button>`:''}${st==='Aberto'&&pode('orc.aprovar')?`<button class="btn sm pri" data-act="aprovar" data-id="${o.id}">Aprovar → OS</button>`:''}</div></td></tr>`}).join(''):`<tr><td colspan="7" class="empty">Nenhum orçamento encontrado.</td></tr>`}
  </tbody></table></div></section>`;
};
bind.orcamentos=()=>bindBusca();
function bindBusca(){const b=$('#busca');if(!b)return;b.oninput=e=>{filtro=e.target.value;const pos=e.target.selectionStart;render();const n=$('#busca');n.focus();n.setSelectionRange(pos,pos)}}

/* ---------- OS ---------- */
V.os=()=>{
  const pess=pode('cli.ver'),val=pode('precos');
  const list=S.os.slice().sort((a,b)=>b.num-a.num).filter(o=>{const v=vei(o.veiculoId);return combina(filtro,numOS(o),o.origem,camposCliente(cli(o.clienteId)),v?.placa,v?.marca,v?.modelo,o.status,o.itens.map(i=>i.desc))});
  const podeCriar=pode('os.editar');
  return `<div class="head"><div><h2>Ordens de serviço</h2><p>${pess?'Entrada do carro, materiais usados, andamento e entrega.':'Você vê os materiais de cada serviço. Dados pessoais dos clientes ficam ocultos para o seu perfil.'}</p></div><span class="spacer"></span>
  <input class="search" id="busca" placeholder="Buscar por nº, cliente, placa, serviço ou situação" value="${esc(filtro)}" aria-label="Buscar ordens">
  ${podeCriar?'<button class="btn pri" data-act="novaOS">+ Nova OS</button>':''}</div>
  <section class="panel"><div class="tbl-wrap"><table><thead><tr><th>Nº</th><th>Entrada</th><th>Previsão</th><th>Cliente</th><th>Veículo</th>${val?'<th class="num">Total</th><th>Pagamento</th>':''}<th>Situação</th><th>Estoque</th><th></th></tr></thead><tbody>
  ${list.length?list.map(o=>{const c=cli(o.clienteId),v=vei(o.veiculoId);return `<tr><td><b>${numOS(o)}</b></td><td>${dbr(o.entrada)}</td><td>${dbr(o.previsao)}</td><td>${marcar(nomeVisivel(c),filtro)}</td><td><span class="plate">${esc(v?.placa||'—')}</span> ${esc(v?.modelo||'')}</td>${val?`<td class="num">${brl(soma(o).total)}</td><td>${chipPagamento(o)}</td>`:''}<td>${chipStatus(o.status)}</td><td>${o.baixado?'<span class="chip c-ok">Baixado</span>':'<span class="chip c-mute">Pendente</span>'}</td><td><div class="acts"><button class="btn sm" data-act="editOS" data-id="${o.id}">Abrir</button>${pode('imprimir')?`<button class="btn sm" data-act="printOS" data-id="${o.id}">Imprimir</button>`:''}${pode('caixa.receber')&&o.status!=='Cancelada'&&falta(o)>0?`<button class="btn sm pri" data-act="receber" data-id="${o.id}">Receber</button>`:''}</div></td></tr>`}).join(''):`<tr><td colspan="10" class="empty">Nenhuma ordem de serviço encontrada.</td></tr>`}
  </tbody></table></div></section>
  <p class="lock">Os materiais saem do estoque automaticamente quando a OS passa para <b>Pronto</b> ou <b>Entregue</b>.</p>`;
};
bind.os=()=>bindBusca();

/* ---------- Editor de orçamento / OS ---------- */
let D=null, DK=null;
function optsVeiculos(cid,sel){const l=S.veiculos.filter(v=>v.clienteId===cid&&(!v.excluido||v.id===sel));return `<option value="">${cid?(l.length?'Selecione…':'Cliente sem veículo cadastrado'):'Escolha o cliente primeiro'}</option>`+l.map(v=>`<option value="${v.id}" ${v.id===sel?'selected':''}>${esc(v.placa)} – ${esc(v.marca)} ${esc(v.modelo)} ${esc(v.ano)}</option>`).join('')+(cid&&pode('vei.editar')?'<option value="__novo">+ Cadastrar novo veículo</option>':'')}
// Aviso quando a quantidade pedida passa do saldo em estoque
function saldoHint(it){
  const p=prod(it.produtoId);if(!p||(DK==='os'&&D.baixado))return '';
  if(Number(it.qtd)>p.qtd)return `<small class="saldo-aviso bad">Saldo insuficiente: ${nfmt(p.qtd)} ${esc(p.un)} em estoque</small>`;
  if(p.qtd-Number(it.qtd)<p.min)return `<small class="saldo-aviso warn">Após o uso fica abaixo do mínimo (${nfmt(p.min)} ${esc(p.un)})</small>`;
  return '';
}
function itensHTML(ro){
  return `<div class="tbl-wrap"><table class="items"><thead><tr><th style="min-width:170px">Material do estoque</th><th style="min-width:200px">Descrição</th><th class="num">Qtd</th><th>Un.</th><th class="num">Valor un.</th><th class="num">Total</th><th></th></tr></thead><tbody>
  ${D.itens.map((it,i)=>`<tr>
    <td><select data-i="${i}" data-f="produtoId" aria-label="Material" ${ro?'disabled':''}><option value="">Serviço / mão de obra</option>${S.produtos.map(p=>`<option value="${p.id}" ${p.id===it.produtoId?'selected':''}>${esc(p.nome)} (${nfmt(p.qtd)} ${esc(p.un)})${p.qtd<p.min?' ⚠':''}</option>`).join('')}</select><span id="sd${i}">${saldoHint(it)}</span></td>
    <td><input data-i="${i}" data-f="desc" value="${esc(it.desc)}" aria-label="Descrição" ${ro?'disabled':''}></td>
    <td><input class="q" type="number" step="0.01" min="0" data-i="${i}" data-f="qtd" value="${it.qtd}" aria-label="Quantidade" ${ro?'disabled':''}></td>
    <td><select class="u" data-i="${i}" data-f="un" aria-label="Unidade" ${ro?'disabled':''}>${UNIDADES.map(u=>`<option ${u===it.un?'selected':''}>${u}</option>`).join('')}</select></td>
    <td><input class="p" type="number" step="0.01" min="0" data-i="${i}" data-f="preco" value="${it.preco}" aria-label="Valor unitário" ${ro?'disabled':''}></td>
    <td class="num" id="lt${i}">${brl(it.qtd*it.preco)}</td>
    <td>${ro?'':`<button class="btn sm danger" data-rm="${i}" aria-label="Remover item">×</button>`}</td></tr>`).join('')||`<tr><td colspan="7" class="empty">Adicione materiais e mão de obra.</td></tr>`}
  </tbody></table></div>
  ${ro?'':`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn sm" data-add="mat">+ Material</button><button class="btn sm" data-add="mo">+ Mão de obra</button></div>`}
  <div class="totals" id="tots"></div>`;
}
function totsHTML(){const t=soma(D);return `<div><span>Materiais</span><span>${brl(t.mat)}</span></div><div><span>Mão de obra</span><span>${brl(t.mo)}</span></div><div><span>Desconto</span><span>− ${brl(D.desconto)}</span></div><div class="grand"><span>Total</span><span>${brl(t.total)}</span></div>`}

function openEditor(kind,id,rascunho){
  DK=kind;const src=kind==='orc'?S.orcamentos.find(o=>o.id===id):S.os.find(o=>o.id===id);
  if(rascunho)D=rascunho;
  else if(src)D=JSON.parse(JSON.stringify(src));
  else if(kind==='orc')D={id:null,clienteId:'',veiculoId:'',data:iso(new Date()),validade:S.empresa.validade,status:'Aberto',desconto:0,obs:'',itens:[]};
  else D={id:null,clienteId:'',veiculoId:'',origem:'',entrada:iso(new Date()),previsao:addDays(3),status:'Aguardando',pagamento:'',garantia:S.empresa.garantia,desconto:0,estado:'',obs:'',baixado:false,itens:[]};
  const pess=pode('cli.ver'),val=pode('precos');
  const ro=!pode(kind==='orc'?'orc.editar':'os.editar'); // sem permissão de editar: só leitura
  if(src&&!rascunho)log('Abriu '+(kind==='orc'?'orçamento':'OS'),kind==='orc'?numOrc(src):numOS(src));
  const titulo=kind==='orc'?(src?'Orçamento '+numOrc(src):'Novo orçamento'):(src?'Ordem de serviço '+numOS(src):'Nova ordem de serviço');
  const c=cli(D.clienteId);
  const cab=pess&&!ro?`
    <div class="f dupla"><label for="eCliBusca">Cliente</label>
      <div class="combo-sel" id="eCliSel" hidden></div>
      <div class="combo"><input id="eCliBusca" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="eCliLista" autocomplete="off" placeholder="Digite o nome, CPF ou telefone">
      <ul class="combo-list" id="eCliLista" role="listbox" hidden></ul></div>
      <input type="hidden" id="eCli"></div>
    <div class="f dupla"><label for="eVei">Veículo</label><select id="eVei">${optsVeiculos(D.clienteId,D.veiculoId)}</select></div>`:
    `<div class="f"><label>Cliente</label><input disabled value="${esc(nomeVisivel(c))}"></div><div class="f"><label>Veículo</label><input disabled value="${esc((vei(D.veiculoId)||{}).placa||'')} ${esc((vei(D.veiculoId)||{}).modelo||'')}"></div>`;
  const esp=kind==='orc'?`
    <div class="f"><label for="eData">Data</label><input type="date" id="eData" value="${D.data}" ${ro?'disabled':''}></div>
    <div class="f"><label for="eVal">Validade (dias)</label><input type="number" id="eVal" min="1" value="${D.validade}"></div>
    <div class="f"><label for="eSt">Situação</label><select id="eSt">${ORC_STATUS.filter(s=>s!=='Vencido').map(s=>`<option ${s===D.status?'selected':''}>${s}</option>`).join('')}</select></div>`:`
    <div class="f"><label for="eEnt">Entrada do carro</label><input type="date" id="eEnt" value="${D.entrada}" ${ro?'disabled':''}></div>
    <div class="f"><label for="ePrev">Previsão de entrega</label><input type="date" id="ePrev" value="${D.previsao}" ${ro?'disabled':''}></div>
    <div class="f"><label for="eSt">Situação</label><select id="eSt">${OS_STATUS.map(s=>`<option ${s===D.status?'selected':''}>${s}</option>`).join('')}</select></div>
    ${val?`<div class="f"><label for="ePag">Forma de pagamento</label><input id="ePag" value="${esc(D.pagamento)}" placeholder="PIX, cartão 3x, dinheiro…"></div>
    <div class="f"><label for="eGar">Garantia (dias)</label><input type="number" id="eGar" min="0" value="${D.garantia}"></div>`:''}
    <div class="f wide"><label for="eEst">Estado do veículo na entrada</label><textarea id="eEst" placeholder="Avarias já existentes, objetos deixados no carro, quilometragem…" ${ro?'disabled':''}>${esc(D.estado)}</textarea><small>Protege a oficina e o cliente: registre tudo o que já estava no carro antes do serviço.</small></div>`;
  const body=`<div class="form">${cab}${esp}</div>
    <div><h3 style="margin-bottom:8px">Itens</h3>${itensHTML(ro)}</div>
    <div class="form">${val?`<div class="f"><label for="eDesc">Desconto (R$)</label><input type="number" id="eDesc" min="0" step="0.01" value="${D.desconto}"></div>`:''}
    <div class="f wide"><label for="eObs">Observações (saem impressas)</label><textarea id="eObs" ${ro?'disabled':''}>${esc(D.obs)}</textarea></div></div>
    ${kind==='os'&&D.baixado?'<div class="note">Os materiais desta OS já saíram do estoque. Se mudar os itens, o estoque é ajustado; se cancelar, o material volta.</div>':''}
    ${kind==='os'&&src&&val&&(pode('caixa.receber')||pode('caixa.ver'))?(()=>{const r=recebido(src),t=soma(src).total;return `<div class="pagto"><div><span class="lock">Pagamento</span><b>${brl(r)} recebido de ${brl(t)}</b></div>${chipPagamento(src)}${falta(src)>0&&D.status!=='Cancelada'&&pode('caixa.receber')?'<button class="btn sm pri" id="eReceber">Registrar pagamento</button>':''}</div>`})():''}`;
  const foot=ro
    ?`<button class="btn" data-close>Fechar</button>${src&&pode('imprimir')?`<button class="btn pri" id="eSoImprimir">Imprimir</button>`:''}`
    :`<button class="btn" data-close>Cancelar</button>${src&&pode(kind==='orc'?'orc.excluir':'os.excluir')?`<button class="btn" id="eDel">Excluir</button>`:''}${src&&pode('imprimir')?`<button class="btn" id="ePrint">Salvar e imprimir</button>`:''}<button class="btn pri" id="eSave">Salvar</button>`;
  modal(titulo,body,foot);
  if(!val){$('#tots').innerHTML='';} else $('#tots').innerHTML=totsHTML();
  if(ro){$('.modal-b').querySelectorAll('input,select,textarea').forEach(el=>el.disabled=true);const si=$('#eSoImprimir');if(si)si.onclick=()=>{closeModal();(kind==='orc'?imprimirOrc:imprimirOS)(src.id)}}
  wireEditor(ro);
}
function rerenderItens(ro){const box=$('.items').closest('div').parentElement;box.innerHTML='<h3 style="margin-bottom:8px">Itens</h3>'+itensHTML(ro);if(pode('precos'))$('#tots').innerHTML=totsHTML();wireItens(ro)}
function wireItens(ro){
  const host=$('.items').closest('div').parentElement;
  host.oninput=e=>{const el=e.target;if(el.dataset.i===undefined)return;const i=+el.dataset.i,f=el.dataset.f;if(f==='produtoId')return;D.itens[i][f]=(f==='qtd'||f==='preco')?parseFloat(el.value)||0:el.value;if(f==='qtd'){const sd=$('#sd'+i);if(sd)sd.innerHTML=saldoHint(D.itens[i])}const lt=$('#lt'+i);if(lt)lt.textContent=brl(D.itens[i].qtd*D.itens[i].preco);if(pode('precos'))$('#tots').innerHTML=totsHTML()};
  host.onchange=e=>{const el=e.target;if(el.dataset.f==='produtoId'){const i=+el.dataset.i,p=prod(el.value);D.itens[i].produtoId=el.value;if(p){D.itens[i].desc=p.nome;D.itens[i].un=p.un;D.itens[i].preco=p.preco}rerenderItens(ro)}else if(el.dataset.f==='un'){D.itens[+el.dataset.i].un=el.value}};
  host.onclick=e=>{const a=e.target.closest('[data-add]');const r=e.target.closest('[data-rm]');if(a){D.itens.push(a.dataset.add==='mat'?{produtoId:'',desc:'',qtd:1,un:'m',preco:0}:{produtoId:'',desc:'Mão de obra – ',qtd:1,un:'un',preco:0});rerenderItens(ro);const ins=$('.items').querySelectorAll('tbody tr');const last=ins[ins.length-1];(last.querySelector(a.dataset.add==='mat'?'select':'input[data-f="desc"]')).focus()}if(r){const i=+r.dataset.rm,it=D.itens[i];const fazer=()=>{D.itens.splice(i,1);rerenderItens(ro)};if(!String(it.desc||'').trim()&&!it.produtoId)fazer();else confirmar(`Remover o item <b>${esc(it.desc||'sem descrição')}</b> (${nfmt(it.qtd)} ${esc(it.un)}) deste documento?<br><span class="lock">A mudança só vale depois que você salvar.</span>`,fazer,'Remover item')}};
}
function wireEditor(ro){
  wireItens(ro);
  const reabrir=()=>openEditor(DK,D.id,D);
  if($('#eCliBusca'))comboCliente('eCli',D.clienteId,pode('cli.editar')?nome=>{
    // cadastra o cliente sem perder o que já foi preenchido no orçamento/OS
    lerCampos();formCli(null,{nome},novo=>{D.clienteId=novo.id;D.veiculoId='';reabrir()},reabrir);
  }:null,id=>{D.clienteId=id;const v=veiculosAtivos().filter(x=>x.clienteId===id);D.veiculoId=v.length===1?v[0].id:'';$('#eVei').innerHTML=optsVeiculos(D.clienteId,D.veiculoId);if(id&&!v.length)$('#eVei').focus()});
  const ev=$('#eVei');if(ev)ev.onchange=()=>{
    if(ev.value==='__novo'){lerCampos();formVei(null,{clienteId:D.clienteId},nv=>{D.veiculoId=nv.id;reabrir()},reabrir);return}
    D.veiculoId=ev.value};
  const er=$('#eReceber');if(er)er.onclick=()=>ro?(closeModal(),ACT.receber(D.id)):salvarDoc(false,id=>ACT.receber(id));
  const ed=$('#eDesc');if(ed)ed.oninput=()=>{D.desconto=parseFloat(ed.value)||0;$('#tots').innerHTML=totsHTML()};
  if(!$('#eSave'))return;
  $('#eSave').onclick=()=>salvarDoc(false);
  const ep=$('#ePrint');if(ep)ep.onclick=()=>salvarDoc(true);
  const del=$('#eDel');if(del)del.onclick=()=>{
    const nome=DK==='orc'?numOrc(D):numOS(D);
    if(DK==='os'&&S.caixa.some(l=>l.osId===D.id)){toast(nome+' tem pagamento lançado no caixa. Para desfazer, mude o status para Cancelada.');return}
    const orig=DK==='os'?S.os.find(o=>o.id===D.id):null;
    const nota=orig&&orig.baixado?'<p class="conf-nota">Os materiais que saíram do estoque por esta OS voltam para o estoque.</p>':'';
    confirmar(`Excluir <b>${nome}</b>?${nota}`,()=>{closeModal();
      if(DK==='orc')S.orcamentos=S.orcamentos.filter(o=>o.id!==D.id);
      else{if(orig)acertarEstoque(null,orig,'Devolvido: '+nome+' excluída');S.os=S.os.filter(o=>o.id!==D.id)}
      log('Excluiu documento',nome);save();render();toast(nome+' excluído')},'Excluir '+(DK==='orc'?'orçamento':'OS'))};
}
function lerCampos(){
  const g=id=>{const e=$('#'+id);return e?e.value:undefined};
  if(DK==='orc'){if(g('eData')!==undefined)D.data=g('eData');D.validade=+g('eVal')||0;D.status=g('eSt')}
  else{if(g('eEnt')!==undefined)D.entrada=g('eEnt');if(g('ePrev')!==undefined)D.previsao=g('ePrev');D.status=g('eSt');if(g('ePag')!==undefined)D.pagamento=g('ePag');if(g('eGar')!==undefined)D.garantia=+g('eGar')||0;if(g('eEst')!==undefined)D.estado=g('eEst')}
  if(g('eObs')!==undefined)D.obs=g('eObs');
}
async function salvarDoc(imprimir,depois){
  lerCampos();
  if(pode('cli.ver')){
    if(!D.clienteId){toast('Escolha o cliente');$('#eCliBusca')?.focus();return}
    if(!D.veiculoId){toast('Escolha o veículo');$('#eVei').focus();return}
    if(!D.itens.length){toast('Adicione pelo menos um item');return}
    if(D.itens.some(i=>!String(i.desc).trim())){toast('Preencha a descrição de todos os itens');return}
  }
  if(D.itens.some(i=>!(Number(i.qtd)>0))){toast('A quantidade de cada item precisa ser maior que zero');return}
  if(D.itens.some(i=>!(Number(i.preco)>=0))){toast('O preço dos itens não pode ser negativo');return}
  if(!(Number(D.desconto)>=0)){toast('O desconto não pode ser negativo');$('#eDesc')?.focus();return}
  if(Number(D.desconto)>soma({itens:D.itens,desconto:0}).sub){toast('O desconto não pode ser maior que o valor dos itens');$('#eDesc')?.focus();return}
  if(DK==='os'&&D.entrada&&D.previsao&&D.previsao<D.entrada){toast('A previsão de entrega não pode ser antes da entrada');$('#ePrev')?.focus();return}
  if(DK==='orc'&&!(D.validade>=0)){toast('A validade não pode ser negativa');return}
  const lista=DK==='orc'?S.orcamentos:S.os;
  let novo=false;
  if(!D.id){
    // o número vem do banco, para duas pessoas nunca receberem o mesmo número
    const bt=$('#eSave');if(bt){bt.disabled=true;bt.textContent='Salvando…'}
    try{D.num=await proximoNumero(DK)}catch(e){toast(e.message);if(bt){bt.disabled=false;bt.textContent='Salvar'}return}
    D.id=uid();lista.push(D);novo=true;
  }
  const antigo=novo?null:lista.find(o=>o.id===D.id);
  if(!novo){const i=lista.findIndex(o=>o.id===D.id);if(i<0){toast('Este documento foi excluído por outra pessoa');closeModal();render();return}lista[i]=D}
  if(DK==='os')acertarEstoque(D,antigo);
  const nome=DK==='orc'?numOrc(D):numOS(D);
  log(novo?'Criou documento':'Alterou documento',nome);save();closeModal();render();toast(nome+' salvo');
  if(imprimir)(DK==='orc'?imprimirOrc:imprimirOS)(D.id);
  if(depois)depois(D.id);
}
// soma, por material, o que a OS usa do estoque
function usoMaterial(itens){const m={};(itens||[]).forEach(i=>{if(i.produtoId)m[i.produtoId]=+((m[i.produtoId]||0)+(Number(i.qtd)||0)).toFixed(3)});return m}
// deixa o estoque coerente com a OS: baixa ao ficar pronta, ajusta se os itens mudarem, devolve se for cancelada ou excluída
function acertarEstoque(o,antigo,motivo){
  const prev=antigo&&antigo.baixado?usoMaterial(antigo.baixados||antigo.itens):{};
  let alvo={};
  if(o&&o.status!=='Cancelada'&&(o.baixado||['Pronto','Entregue'].includes(o.status))){alvo=usoMaterial(o.itens);o.baixado=true}
  else if(o)o.baixado=false;
  if(o)o.baixados=Object.entries(alvo).map(([produtoId,qtd])=>({produtoId,qtd}));
  const nome=numOS(o||antigo),antes=fotoEstoque();let saiu=false;
  new Set([...Object.keys(prev),...Object.keys(alvo)]).forEach(id=>{
    const d=+((alvo[id]||0)-(prev[id]||0)).toFixed(3);if(!d)return;
    const p=prod(id);if(!p)return;
    p.qtd=+(p.qtd-d).toFixed(3);if(d>0)saiu=true;
    const obs=d>0?(prev[id]?'Ajuste da '+nome+' (itens alterados)':'Usado na '+nome):(motivo||(o&&o.status==='Cancelada'?'Devolvido: '+nome+' cancelada':'Ajuste da '+nome+' (itens alterados)'));
    S.movs.unshift({id:uid(),data:agora(),produtoId:p.id,tipo:d>0?'Saída':'Entrada',qtd:Math.abs(d),obs,user:me().nome});
  });
  if(!saiu)return;
  const neg=Object.keys(alvo).filter(id=>prod(id)?.qtd<0);
  if(neg.length)setTimeout(()=>toast('Atenção: estoque ficou negativo em '+neg.length+' material(is)'),800);
  else avisarQueda(antes);
}
ACT.novoOrc=()=>openEditor('orc');
ACT.editOrc=id=>openEditor('orc',id);
ACT.novaOS=()=>openEditor('os');
ACT.editOS=id=>openEditor('os',id);
ACT.printOrc=id=>imprimirOrc(id);
ACT.printOS=id=>imprimirOS(id);
ACT.aprovar=id=>{
  const o=S.orcamentos.find(x=>x.id===id);
  confirmar(`Aprovar <b>${numOrc(o)}</b> e abrir uma ordem de serviço com os mesmos itens?`,async()=>{
    let num;try{num=await proximoNumero('os')}catch(e){toast(e.message);return}
    o.status='Aprovado';
    const n={id:uid(),num,clienteId:o.clienteId,veiculoId:o.veiculoId,origem:numOrc(o),entrada:iso(new Date()),previsao:addDays(3),status:'Aguardando',pagamento:'',garantia:S.empresa.garantia,desconto:o.desconto,estado:'',obs:o.obs,baixado:false,itens:JSON.parse(JSON.stringify(o.itens))};
    S.os.push(n);log('Aprovou orçamento e abriu OS',numOrc(o)+' → '+numOS(n));save();tab='os';render();openEditor('os',n.id);toast(numOS(n)+' criada. Registre o estado do carro na entrada.');
  },'Aprovar e abrir OS');
};

/* ---------- Impressão ---------- */
function docHTML(kind,o){
  const e=S.empresa,c=cli(o.clienteId)||{},v=vei(o.veiculoId)||{},t=soma(o);
  const mats=o.itens.filter(i=>i.produtoId),mos=o.itens.filter(i=>!i.produtoId);
  const linhas=l=>l.map((i,k)=>`<tr><td>${k+1}</td><td>${esc(i.desc)}</td><td class="num">${nfmt(i.qtd)} ${esc(i.un)}</td><td class="num">${brl(i.preco)}</td><td class="num">${brl(i.qtd*i.preco)}</td></tr>`).join('');
  const tabela=(tit,l)=>l.length?`<div class="sec">${tit}</div><table><thead><tr><th style="width:24px">#</th><th>Descrição</th><th class="num">Qtd</th><th class="num">Valor un.</th><th class="num">Total</th></tr></thead><tbody>${linhas(l)}</tbody></table>`:'';
  let venc='';if(kind==='orc'){const d=pd(o.data);d.setDate(d.getDate()+Number(o.validade));venc=iso(d)}
  const cond=kind==='orc'
    ?`Orçamento válido por ${o.validade} dias (até ${dbr(venc)}). Valores sujeitos a confirmação após desmontagem, caso sejam encontrados danos ocultos.${o.obs?'\n'+o.obs:''}`
    :`Entrada: ${dbr(o.entrada)}   ·   Previsão de entrega: ${dbr(o.previsao)}   ·   Pagamento: ${o.pagamento||'a combinar'}   ·   Garantia do serviço: ${o.garantia} dias${o.origem?'   ·   Ref.: '+o.origem:''}\n\nEstado do veículo na entrada: ${o.estado||'não informado'}${o.obs?'\n\nObservações: '+o.obs:''}`;
  return `<div class="doc">
  <div class="doc-h"><div class="doc-emp">${logoDoc()}<div><div class="co">${esc(e.nome)}</div><div class="small">CNPJ ${esc(e.cnpj)}<br>${esc(e.endereco)}<br>${esc(e.telefone)} · ${esc(e.email)}</div></div></div>
  <div class="doc-t"><div class="k">${kind==='orc'?'ORÇAMENTO':'ORDEM DE SERVIÇO'}</div><div class="n">${kind==='orc'?numOrc(o):numOS(o)}</div><div class="small">Emitido em ${dbr(kind==='orc'?o.data:o.entrada)}</div></div></div>
  <div class="doc-boxes">
    <div class="doc-box"><div class="lbl">Cliente</div><b>${esc(c.nome||'—')}</b><br>CPF/CNPJ: ${esc(maskDoc(c.cpf))}<br>Telefone: ${esc(c.telefone||'—')}</div>
    <div class="doc-box"><div class="lbl">Veículo</div><b>${esc(v.marca||'')} ${esc(v.modelo||'')}</b> ${esc(v.ano||'')}<br>Placa: <b>${esc(v.placa||'—')}</b> · Cor: ${esc(v.cor||'—')}</div>
  </div>
  ${tabela('Materiais',mats)}${tabela('Mão de obra',mos)}
  <div class="tot"><div><span>Materiais</span><span>${brl(t.mat)}</span></div><div><span>Mão de obra</span><span>${brl(t.mo)}</span></div>${o.desconto?`<div><span>Desconto</span><span>− ${brl(o.desconto)}</span></div>`:''}<div class="g"><span>Total</span><span>${brl(t.total)}</span></div></div>
  <div class="cond">${esc(cond)}</div>
  <div class="sign"><div>${esc(e.nome)}</div><div>${kind==='orc'?'De acordo – cliente':'Recebi o veículo nas condições acima – cliente'}</div></div>
  <div class="lgpd">Documento sem valor fiscal. Seus dados pessoais são usados somente para executar este serviço e cumprir obrigações legais, conforme a Lei 13.709/2018 (LGPD). Para acessar, corrigir ou pedir a exclusão dos seus dados: ${esc(e.encarregado)}.</div>
  </div>`;
}
/* ---------- Tamanho da folha ----------
   Para mudar margens ou acrescentar outro tamanho (ex.: Carta), edite PAPEIS.
   O visual de cada tamanho fica em css/estilo.css, seção "Impressão". */
const PAPEIS={
  A4:{nome:'A4',medida:'210 × 297 mm',margem:'12mm',dica:'Folha comum'},
  A5:{nome:'A5',medida:'148 × 210 mm',margem:'8mm',dica:'Meia folha A4'}
};
function papelSalvo(){try{const p=localStorage.getItem('tapecaria_papel');return PAPEIS[p]?p:'A4'}catch(e){return 'A4'}}
// Diz ao navegador o tamanho da página antes de imprimir
function aplicarPapel(p){
  let st=$('#estiloPagina');if(!st){st=document.createElement('style');st.id='estiloPagina';document.head.appendChild(st)}
  st.textContent=`@page{size:${p} portrait;margin:${PAPEIS[p].margem}}`;
  $('#print').querySelectorAll('.doc').forEach(d=>d.classList.toggle('a5',p==='A5'));
}
// Pré-visualização com escolha do papel; serve para todos os documentos
function previa(titulo,html,acao,alvo){
  let papel=papelSalvo();
  $('#print').innerHTML=html;
  modal('Imprimir – '+titulo,`<div class="papel-escolha" role="radiogroup" aria-label="Tamanho da folha">
      ${Object.entries(PAPEIS).map(([k,p])=>`<button type="button" class="papel-op" role="radio" data-papel="${k}" aria-checked="${k===papel}"><span class="papel-ico ${k.toLowerCase()}" aria-hidden="true"></span><span><b>${p.nome}</b><small>${p.medida} · ${p.dica}</small></span></button>`).join('')}
    </div>
    <div class="folha-palco"><div class="folha" id="folha">${html}</div></div>
    <p class="lock" style="margin:0">Na janela de impressão, confira se o papel da impressora também está em <b id="papelNome">${papel}</b>. Para gerar PDF, escolha “Salvar como PDF” como impressora.</p>`,
    `<button class="btn" data-close>Fechar</button><button class="btn pri" id="doPrint">Imprimir em ${papel}</button>`);
  const mostrar=()=>{
    $('#folha').className='folha '+papel.toLowerCase();
    $('#folha').querySelectorAll('.doc').forEach(d=>d.classList.toggle('a5',papel==='A5'));
    document.querySelectorAll('[data-papel]').forEach(b=>b.setAttribute('aria-checked',b.dataset.papel===papel));
    $('#papelNome').textContent=papel;$('#doPrint').textContent='Imprimir em '+papel;
  };
  document.querySelectorAll('[data-papel]').forEach(b=>b.onclick=()=>{papel=b.dataset.papel;try{localStorage.setItem('tapecaria_papel',papel)}catch(e){}mostrar()});
  mostrar();
  // monta o documento de novo a cada clique: depois de imprimir a área é limpa (para não sobrar dado de cliente na página)
  $('#doPrint').onclick=()=>{$('#print').innerHTML=html;aplicarPapel(papel);log(acao,alvo+' ('+papel+')');window.print()};
}
function imprimir(kind,id){
  const o=(kind==='orc'?S.orcamentos:S.os).find(x=>x.id===id);
  const nome=kind==='orc'?numOrc(o):numOS(o);
  previa(nome,docHTML(kind,o),'Imprimiu documento',nome);
}
const imprimirOrc=id=>imprimir('orc',id), imprimirOS=id=>imprimir('os',id);

/* ---------- Clientes ---------- */
V.clientes=()=>{
  // quem tem o texto no nome aparece antes de quem só bateu no endereço, e-mail ou placa
  const peloNome=c=>combina(filtro,c.nome)?0:1;
  const list=S.clientes.filter(c=>combina(filtro,camposCliente(c))).sort((a,b)=>(filtro?peloNome(a)-peloNome(b):0)||a.nome.localeCompare(b.nome));
  return `<div class="head"><div><h2>Clientes</h2><p>CPF e contato aparecem mascarados na lista; os dados completos ficam no cadastro, e cada abertura é registrada.</p></div><span class="spacer"></span>
  <input class="search" id="busca" placeholder="Buscar por nome, CPF, telefone, e-mail ou placa" value="${esc(filtro)}" aria-label="Buscar clientes">
  ${pode('cli.editar')?'<button class="btn pri" data-act="novoCli">+ Novo cliente</button>':''}</div>
  <section class="panel"><div class="tbl-wrap"><table><thead><tr><th>Nome</th><th>CPF/CNPJ</th><th>Telefone</th><th class="num">Veículos</th><th>Promoções</th><th></th></tr></thead><tbody>
  ${list.length?list.map(c=>`<tr><td><b>${marcar(c.nome,filtro)}</b>${c.anonimizado?' <span class="chip c-mute">Anonimizado</span>':''}</td><td>${esc(maskDoc(c.cpf))}${!c.anonimizado&&c.cpf&&!(cpfValido(c.cpf)||cnpjValido(c.cpf))?' <span class="chip c-bad" title="Abra o cadastro e corrija o número">Inválido</span>':''}${!c.anonimizado&&!c.cpf?' <span class="chip c-warn">Sem CPF</span>':''}</td><td>${esc(c.telefone?c.telefone.replace(/\d{4}(?=-)/,'****'):'—')}</td><td class="num">${veiculosAtivos().filter(v=>v.clienteId===c.id).length}</td><td>${c.promo?`<span class="chip c-ok">Autorizou em ${dbr(c.promoData)}</span>`:'<span class="chip c-mute">Não autorizou</span>'}</td>
  <td><div class="acts">${c.anonimizado||!pode('cli.editar')?'':`<button class="btn sm" data-act="editCli" data-id="${c.id}">Abrir</button>`}${pode('cli.lgpd')&&!c.anonimizado?`<button class="btn sm" data-act="exportCli" data-id="${c.id}">Exportar dados</button><button class="btn sm danger" data-act="anonCli" data-id="${c.id}">Anonimizar</button>`:''}</div></td></tr>`).join(''):`<tr><td colspan="6" class="empty">Nenhum cliente encontrado.</td></tr>`}
  </tbody></table></div></section>
  ${pode('cli.lgpd')?'':'<p class="lock">Exportar ou anonimizar dados de clientes depende de liberação do administrador.</p>'}`;
};
bind.clientes=()=>bindBusca();
function formCli(c,inicial,aoSalvar,aoCancelar){
  const ini=c||inicial||{};
  modal(c?'Cliente':'Novo cliente',`<div class="form">
    <div class="f wide"><label for="cNome">Nome completo ou razão social</label><input id="cNome" value="${esc(ini.nome)}" autocomplete="off"></div>
    <div class="f"><label for="cCpf">CPF ou CNPJ</label><input id="cCpf" value="${esc(formatarDoc(c?.cpf))}" inputmode="numeric" autocomplete="off" maxlength="18" placeholder="000.000.000-00" aria-describedby="cCpfMsg"><small class="doc-msg" id="cCpfMsg" aria-live="polite">Necessário para emissão de documentos e garantia.</small></div>
    <div class="f"><label for="cTel">Telefone / WhatsApp</label><input id="cTel" value="${esc(c?.telefone)}" inputmode="tel"></div>
    <div class="f"><label for="cEmail">E-mail <span style="text-transform:none">(opcional)</span></label><input id="cEmail" type="email" value="${esc(c?.email)}"></div>
    <div class="f wide"><label for="cEnd">Endereço <span style="text-transform:none">(opcional)</span></label><input id="cEnd" value="${esc(c?.endereco)}"></div>
    <div class="f wide"><label class="check" for="cPromo" style="text-transform:none;letter-spacing:0;font-size:.9rem;color:var(--fg);font-weight:400"><input type="checkbox" id="cPromo" ${c?.promo?'checked':''}><span>O cliente <b>autoriza</b> receber promoções e lembretes por WhatsApp ou e-mail. <span style="color:var(--muted)">Pode ser retirado a qualquer momento. Sem essa autorização, o contato é usado só para avisos sobre o serviço.</span></span></label></div>
  </div>
  <div class="note">Base legal do cadastro: execução do contrato de serviço (art. 7º, V da LGPD). Colete apenas o necessário: os campos opcionais podem ficar em branco.</div>`,
  `<button class="btn" ${aoCancelar?'id="cVoltar"':'data-close'}>${aoCancelar?'Voltar':'Cancelar'}</button><button class="btn pri" id="cSave">Salvar</button>`,true);
  if(aoCancelar)$('#cVoltar').onclick=aoCancelar;
  // CPF/CNPJ: formata enquanto digita e avisa na hora se está errado ou repetido
  const campo=$('#cCpf'),aviso=$('#cCpfMsg');
  const conferir=(final)=>{
    const r=conferirDoc(campo.value,c?.id);
    const mostra=final||r.ok||!(r.incompleto||r.vazio);
    campo.classList.toggle('campo-erro',mostra&&!r.ok);campo.classList.toggle('campo-ok',r.ok);
    campo.setAttribute('aria-invalid',mostra&&!r.ok);
    aviso.className='doc-msg '+(r.ok?'ok':mostra?'erro':'');
    aviso.innerHTML=mostra?esc(r.msg)+(r.dup&&pode('cli.editar')?` <button type="button" class="btn link sm" id="cAbrirDup">Abrir cadastro</button>`:''):'Necessário para emissão de documentos e garantia.';
    const ab=$('#cAbrirDup');if(ab)ab.onclick=()=>{log('Visualizou dados pessoais',r.dup.nome);formCli(r.dup)};
    return r;
  };
  campo.addEventListener('input',()=>{const fim=campo.selectionStart===campo.value.length;campo.value=formatarDoc(campo.value);if(fim)campo.setSelectionRange(campo.value.length,campo.value.length);conferir(false)});
  campo.addEventListener('blur',()=>{if(soDigitos(campo.value))conferir(true)});
  campo.addEventListener('paste',()=>setTimeout(()=>{campo.value=formatarDoc(campo.value);conferir(true)},0));
  if(c&&c.cpf)conferir(true);
  $('#cSave').onclick=()=>{
    const nome=$('#cNome').value.trim();if(!nome){toast('Informe o nome');$('#cNome').focus();return}
    const rd=conferir(true);if(!rd.ok){toast(rd.msg);campo.focus();return}
    const promo=$('#cPromo').checked;
    const d={nome,cpf:formatarDoc(campo.value),telefone:$('#cTel').value.trim(),email:$('#cEmail').value.trim(),endereco:$('#cEnd').value.trim()};
    if(c){Object.assign(c,d);if(promo!==c.promo){c.promo=promo;c.promoData=promo?iso(new Date()):'';log(promo?'Registrou consentimento de promoções':'Registrou retirada de consentimento',nome)}log('Alterou cadastro de cliente',nome)}
    let novo=c;
    if(!c){novo={id:uid(),...d,promo,promoData:promo?iso(new Date()):'',criado:iso(new Date()),anonimizado:false};S.clientes.push(novo);log('Cadastrou cliente',nome)}
    save();closeModal();render();toast('Cliente salvo');
    if(aoSalvar)aoSalvar(novo);
  };
}
ACT.novoCli=()=>formCli();
ACT.editCli=id=>{const c=cli(id);log('Visualizou dados pessoais',c.nome);save();formCli(c)};
ACT.exportCli=id=>{
  const c=cli(id);
  const dados={titular:{nome:c.nome,cpf_cnpj:c.cpf,telefone:c.telefone,email:c.email,endereco:c.endereco,cadastrado_em:c.criado,autorizou_promocoes:c.promo,data_autorizacao:c.promoData||null},
    veiculos:S.veiculos.filter(v=>v.clienteId===id).map(({placa,marca,modelo,ano,cor})=>({placa,marca,modelo,ano,cor})),
    orcamentos:S.orcamentos.filter(o=>o.clienteId===id).map(o=>({numero:numOrc(o),data:o.data,total:soma(o).total,situacao:orcStatus(o)})),
    ordens_de_servico:S.os.filter(o=>o.clienteId===id).map(o=>({numero:numOS(o),entrada:o.entrada,total:soma(o).total,situacao:o.status})),
    gerado_em:new Date().toISOString(),controlador:S.empresa.nome+' – CNPJ '+S.empresa.cnpj};
  const txt=JSON.stringify(dados,null,2);
  log('Exportou dados do titular',c.nome);
  modal('Dados de '+esc(c.nome),`<p style="margin:0">Atende ao pedido de acesso e portabilidade (art. 18 da LGPD). Copie e envie ao cliente pelo canal que ele preferir.</p><pre class="json" id="jsonOut">${esc(txt)}</pre>`,`<button class="btn" data-close>Fechar</button><button class="btn pri" id="cp">Copiar</button>`);
  $('#cp').onclick=()=>{navigator.clipboard.writeText(txt).then(()=>toast('Copiado')).catch(()=>{const r=document.createRange();r.selectNodeContents($('#jsonOut'));const s=getSelection();s.removeAllRanges();s.addRange(r);toast('Texto selecionado: use Ctrl+C')})};
};
ACT.anonCli=id=>{
  const c=cli(id);
  confirmar(`Anonimizar <b>${esc(c.nome)}</b>?<br><br>Nome, CPF, telefone, e-mail e endereço serão apagados de forma permanente. Orçamentos e ordens de serviço continuam guardados, sem identificar a pessoa, para fins fiscais.`,()=>{
    const antigo=c.nome;Object.assign(c,{nome:'Cliente anonimizado #'+c.id.slice(0,4).toUpperCase(),cpf:'',telefone:'',email:'',endereco:'',promo:false,promoData:'',anonimizado:true});
    S.veiculos.filter(v=>v.clienteId===id).forEach(v=>{v.placa='*******'});
    log('Anonimizou cliente (pedido do titular)',antigo.split(' ')[0]+' → '+c.nome);save();render();toast('Dados anonimizados');
  },'Anonimizar cliente');
};

/* ---------- Veículos ---------- */
V.veiculos=()=>{
  const list=veiculosAtivos().filter(v=>{const c=cli(v.clienteId);return combina(filtro,v.placa,v.marca,v.modelo,v.ano,v.cor,c?(pode('cli.ver')?[c.nome,c.cpf,c.telefone]:nomeVisivel(c)):'')});
  return `<div class="head"><div><h2>Veículos</h2><p>Cada veículo pertence a um cliente. Um cliente pode ter vários (frotas, por exemplo).</p></div><span class="spacer"></span>
  <input class="search" id="busca" placeholder="Buscar por placa, marca, modelo, cor ou cliente" value="${esc(filtro)}" aria-label="Buscar veículos">
  ${pode('vei.editar')?'<button class="btn pri" data-act="novoVei">+ Novo veículo</button>':''}</div>
  <section class="panel"><div class="tbl-wrap"><table><thead><tr><th>Placa</th><th>Marca / modelo</th><th>Ano</th><th>Cor</th><th>Cliente</th><th class="num">Serviços</th><th></th></tr></thead><tbody>
  ${list.length?list.map(v=>`<tr><td><span class="plate">${esc(v.placa)}</span></td><td>${marcar(v.marca+' '+v.modelo,filtro)}</td><td>${esc(v.ano)}</td><td>${esc(v.cor)}</td><td>${marcar(cli(v.clienteId)?.nome||'—',filtro)}</td><td class="num">${S.os.filter(o=>o.veiculoId===v.id).length}</td><td><div class="acts">${pode('vei.editar')?`<button class="btn sm" data-act="editVei" data-id="${v.id}">Editar</button>`:''}${pode('vei.excluir')?`<button class="btn sm danger" data-act="exVei" data-id="${v.id}">Excluir</button>`:''}</div></td></tr>`).join(''):`<tr><td colspan="7" class="empty">Nenhum veículo encontrado.</td></tr>`}
  </tbody></table></div></section>`;
};
bind.veiculos=()=>bindBusca();
/* ---------- Busca de cliente pelo nome (usada no cadastro de veículo) ---------- */
function filtrarClientes(q){
  const base=S.clientes.filter(c=>!c.anonimizado);
  const n=normal(q);
  if(!n)return base.slice().sort((a,b)=>a.nome.localeCompare(b.nome)).slice(0,8);
  const p0=n.split(/\s+/)[0];
  // quem tem a palavra no começo do nome aparece primeiro
  const pos=c=>{const i=normal(c.nome).indexOf(p0);return i<0?999:i};
  return base.filter(c=>combina(q,camposCliente(c))).sort((a,b)=>pos(a)-pos(b)||a.nome.localeCompare(b.nome)).slice(0,8);
}
function marcar(texto,q){const t=esc(texto);const p=normal(q).split(/\s+/).filter(Boolean);if(!p.length)return t;
  // destaca as partes digitadas, ignorando acentos
  const base=normal(texto);let marcas=new Array(texto.length).fill(false);p.forEach(w=>{let i=base.indexOf(w);while(i>-1){for(let k=i;k<i+w.length;k++)marcas[k]=true;i=base.indexOf(w,i+w.length)}});
  let out='',dentro=false;[...texto].forEach((ch,i)=>{if(marcas[i]&&!dentro){out+='<mark>';dentro=true}if(!marcas[i]&&dentro){out+='</mark>';dentro=false}out+=esc(ch)});return out+(dentro?'</mark>':'')}
function comboCliente(prefixo,clienteId,aoNovo,aoEscolher){
  const sel=$('#'+prefixo+'Sel'),inp=$('#'+prefixo+'Busca'),lista=$('#'+prefixo+'Lista'),hid=$('#'+prefixo);
  let ativo=0,itens=[];
  function mostrarSel(){
    const c=cli(hid.value);
    sel.hidden=!c;inp.parentElement.hidden=!!c;
    if(c)sel.innerHTML=`<div class="combo-who"><b>${esc(c.nome)}</b><span>${esc(maskDoc(c.cpf))} · ${esc(c.telefone||'sem telefone')}</span></div><button type="button" class="btn sm" id="${prefixo}Trocar">Trocar</button>`;
    const tr=$('#'+prefixo+'Trocar');if(tr)tr.onclick=()=>{hid.value='';mostrarSel();inp.value='';if(aoEscolher)aoEscolher('');inp.focus();abrir()};
  }
  function abrir(){
    const q=inp.value;itens=filtrarClientes(q);ativo=0;
    lista.innerHTML=itens.map((c,i)=>`<li role="option" id="${prefixo}Op${i}" data-i="${i}" aria-selected="${i===0}"><b>${marcar(c.nome,q)}</b><span>${esc(maskDoc(c.cpf))} · ${esc(c.telefone||'—')} · ${veiculosAtivos().filter(v=>v.clienteId===c.id).length} veículo(s)</span></li>`).join('')
      +(itens.length?'':`<li class="combo-vazio">Nenhum cliente encontrado${q?' para “'+esc(q)+'”':''}.</li>`)
      +(aoNovo?`<li role="option" class="combo-novo" data-i="${itens.length}" id="${prefixo}Op${itens.length}" aria-selected="${!itens.length}">+ Cadastrar novo cliente${q.trim()?' “'+esc(q.trim())+'”':''}</li>`:'');
    if(!itens.length)ativo=aoNovo?itens.length:-1;
    lista.hidden=false;inp.setAttribute('aria-expanded','true');destacar();
  }
  function fechar(){lista.hidden=true;inp.setAttribute('aria-expanded','false')}
  function destacar(){lista.querySelectorAll('[role=option]').forEach(li=>{const on=+li.dataset.i===ativo;li.setAttribute('aria-selected',on);if(on){inp.setAttribute('aria-activedescendant',li.id);li.scrollIntoView({block:'nearest'})}})}
  function escolher(i){if(i>=itens.length){if(aoNovo){fechar();aoNovo(inp.value.trim())}return}hid.value=itens[i].id;fechar();mostrarSel();if(aoEscolher)aoEscolher(hid.value);const prox=$('#vPlaca');if(prox&&!prox.value)prox.focus()}
  inp.oninput=abrir;inp.onfocus=abrir;
  inp.onblur=()=>setTimeout(fechar,150);
  inp.onkeydown=e=>{
    if(lista.hidden&&e.key==='ArrowDown'){abrir();e.preventDefault();return}
    if(e.key==='ArrowDown'){ativo=Math.min(ativo+1,aoNovo?itens.length:itens.length-1);destacar();e.preventDefault()}
    else if(e.key==='ArrowUp'){ativo=Math.max(ativo-1,0);destacar();e.preventDefault()}
    else if(e.key==='Enter'){if(!lista.hidden){if(ativo>=0)escolher(ativo);e.preventDefault()}}
    else if(e.key==='Escape'&&!lista.hidden){fechar();e.stopPropagation()}
  };
  lista.onmousedown=e=>e.preventDefault();
  lista.onclick=e=>{const li=e.target.closest('[role=option]');if(li)escolher(+li.dataset.i)};
  hid.value=clienteId||'';mostrarSel();
}

const PLACA_RE=/^[A-Z]{3}\d[A-Z0-9]\d{2}$/;
const limparPlaca=p=>String(p||'').toUpperCase().replace(/[^A-Z0-9]/g,'');

function formVei(v,rascunho,aoSalvar,aoCancelar){
  const d=rascunho||v||{};
  modal(v?'Veículo '+esc(v.placa):'Novo veículo',`<div class="form">
    <div class="f wide"><label for="vCliBusca">Cliente</label>
      <div class="combo-sel" id="vCliSel" hidden></div>
      <div class="combo"><input id="vCliBusca" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="vCliLista" autocomplete="off" placeholder="Digite o nome, CPF ou telefone do cliente">
      <ul class="combo-list" id="vCliLista" role="listbox" hidden></ul></div>
      <input type="hidden" id="vCli"></div>
    <div class="f"><label for="vPlaca">Placa</label><input id="vPlaca" value="${esc(d.placa)}" maxlength="8" autocomplete="off" style="text-transform:uppercase;font-family:var(--f-mono)" placeholder="ABC1D23"></div>
    <div class="f"><label for="vMarca">Marca</label><input id="vMarca" value="${esc(d.marca)}"></div>
    <div class="f"><label for="vModelo">Modelo</label><input id="vModelo" value="${esc(d.modelo)}"></div>
    <div class="f"><label for="vAno">Ano</label><input id="vAno" value="${esc(d.ano)}" inputmode="numeric" maxlength="4"></div>
    <div class="f"><label for="vCor">Cor</label><input id="vCor" value="${esc(d.cor)}"></div>
  </div>`,`<button class="btn" ${aoCancelar?'id="vVoltar"':'data-close'}>${aoCancelar?'Voltar':'Cancelar'}</button><button class="btn pri" id="vSave">Salvar</button>`,true);
  if(aoCancelar)$('#vVoltar').onclick=aoCancelar;

  const ler=()=>({clienteId:$('#vCli').value,placa:limparPlaca($('#vPlaca').value),marca:$('#vMarca').value.trim(),modelo:$('#vModelo').value.trim(),ano:$('#vAno').value.trim(),cor:$('#vCor').value.trim()});
  comboCliente('vCli',d.clienteId,!pode('cli.editar')?null:nome=>{
    // guarda o que já foi digitado no veículo, cadastra o cliente e volta para cá com ele escolhido
    const r=ler();formCli(null,{nome},novo=>{r.clienteId=novo.id;formVei(v,r,aoSalvar,aoCancelar)},()=>formVei(v,r,aoSalvar,aoCancelar));
  });
  if(!d.clienteId&&!v)setTimeout(()=>{if(matchMedia('(min-width:641px)').matches)$('#vCliBusca').focus()},0);

  $('#vSave').onclick=()=>{
    const n=ler();
    if(!n.clienteId){toast('Escolha o cliente');$('#vCliBusca')?.focus();return}
    if(!PLACA_RE.test(n.placa)){toast('Placa inválida. Use o formato ABC1234 ou ABC1D23');$('#vPlaca').focus();return}
    if(veiculosAtivos().some(x=>x.placa===n.placa&&x.id!==v?.id)){toast('Essa placa já está cadastrada');return}
    let obj=v;if(v)Object.assign(v,n);else{obj={id:uid(),...n};S.veiculos.push(obj)}
    log(v?'Alterou veículo':'Cadastrou veículo',n.placa);save();closeModal();render();toast('Veículo salvo');
    if(aoSalvar)aoSalvar(obj);
  };
}
ACT.exVei=id=>{
  const v=vei(id),c=cli(v.clienteId);
  const orcs=S.orcamentos.filter(o=>o.veiculoId===id),oss=S.os.filter(o=>o.veiculoId===id);
  const naOficina=oss.filter(o=>!['Entregue','Cancelada'].includes(o.status));
  confirmar(`Excluir o veículo <b><span class="plate">${esc(v.placa)}</span> ${esc(v.marca)} ${esc(v.modelo)}</b>${c?` de ${esc(c.nome)}`:''}?
    ${naOficina.length?`<p class="conf-nota"><b>Atenção:</b> este carro tem ${naOficina.length} OS em andamento (${naOficina.map(numOS).join(', ')}).</p>`:''}
    ${orcs.length||oss.length?`<p class="lock" style="margin:8px 0 0">Ele aparece em ${orcs.length} orçamento(s) e ${oss.length} OS. Esses documentos continuam mostrando a placa e o modelo, mas o veículo some das listas e não pode mais ser escolhido.</p>`:''}`,()=>{
    v.excluido=true;v.excluidoEm=agora();
    log('Excluiu veículo',v.placa+' – '+v.marca+' '+v.modelo);save();render();toast('Veículo excluído');
  },'Excluir veículo');
};
ACT.novoVei=()=>formVei();
ACT.editVei=id=>formVei(vei(id));

/* ---------- Estoque ---------- */
let catF='';
V.estoque=()=>{
  const ed=pode('est.movimentar'),edMat=pode('est.editar'),custo=pode('est.custo'),exp=pode('est.exportar');
  const cats=S.categorias.slice().sort((a,b)=>a.localeCompare(b)),exc=pode('est.excluir');
  const list=S.produtos.filter(p=>combina(filtro,p.nome,p.categoria,p.un)&&(!catF||p.categoria===catF)).sort((a,b)=>a.nome.localeCompare(b.nome));
  const valor=S.produtos.reduce((a,p)=>a+Math.max(0,p.qtd)*p.custo,0);
  return `<div class="head"><div><h2>Estoque</h2><p>${ed?'Registre entradas de compra e saídas avulsas. Saídas por serviço são automáticas.':'Consulta de saldos e preços. Alterações são feitas pelo estoque ou pelo dono.'}</p></div><span class="spacer"></span>
  <input class="search" id="busca" placeholder="Buscar material ou categoria" value="${esc(filtro)}" aria-label="Buscar material">
  <select class="search" id="catSel" style="width:auto" aria-label="Categoria"><option value="">Todas as categorias</option>${cats.map(c=>`<option ${c===catF?'selected':''}>${esc(c)}</option>`).join('')}</select>
  ${exp?`<button class="btn" data-act="exportEstoque">Exportar planilha</button>
  <button class="btn" data-act="reposicao">Lista de reposição${baixos().length?` <span class="badge">${baixos().length}</span>`:''}</button>`:''}
  ${edMat||exc?'<button class="btn" data-act="categorias">Categorias</button>':''}
  ${edMat?'<button class="btn pri" data-act="novoProd">+ Novo material</button>':''}</div>
  ${custo?`<div class="kpis"><div class="kpi"><b>${S.produtos.length}</b><span>Materiais cadastrados</span></div><div class="kpi"><b>${brl(valor)}</b><span>Valor em estoque (custo)</span></div><div class="kpi ${baixos().length?'alert':''}"><b>${baixos().length}</b><span>Abaixo do mínimo</span></div><div class="kpi ${S.produtos.some(p=>p.qtd<=0)?'alert':''}"><b>${S.produtos.filter(p=>p.qtd<=0).length}</b><span>Zerados</span></div></div>`:''}
  <section class="panel"><div class="tbl-wrap"><table><thead><tr><th>Material</th><th>Categoria</th><th class="num">Saldo</th><th class="num">Mínimo</th>${custo?'<th class="num">Custo</th>':''}<th class="num">Preço de venda</th><th>Situação</th><th></th></tr></thead><tbody>
  ${list.length?list.map(p=>`<tr class="${p.qtd<=0?'linha-bad':p.qtd<p.min?'linha-warn':''}"><td><b>${marcar(p.nome,filtro)}</b></td><td>${esc(p.categoria)}</td><td class="num">${nfmt(p.qtd)} ${esc(p.un)}</td><td class="num">${nfmt(p.min)} ${esc(p.un)}</td>${custo?`<td class="num">${brl(p.custo)}</td>`:''}<td class="num">${p.preco?brl(p.preco)+' / '+esc(p.un):'<span class="lock">uso interno</span>'}</td><td>${estoqueChip(p)}</td><td><div class="acts">${ed?`<button class="btn sm" data-act="mov" data-id="${p.id}">Entrada / saída</button>`:''}${edMat?`<button class="btn sm" data-act="editProd" data-id="${p.id}">Editar</button>`:''}${exc?`<button class="btn sm danger" data-act="exProd" data-id="${p.id}">Excluir</button>`:''}</div></td></tr>`).join(''):`<tr><td colspan="8" class="empty">Nenhum material encontrado.</td></tr>`}
  </tbody></table></div></section>
  <section class="panel"><div class="panel-h"><h3>Últimas movimentações</h3></div><div class="tbl-wrap"><table><thead><tr><th>Data</th><th>Material</th><th>Tipo</th><th class="num">Qtd</th><th>Motivo</th><th>Por</th></tr></thead><tbody>
  ${S.movs.filter(m=>!filtro||combina(filtro,prod(m.produtoId)?.nome||m.nome,m.obs,m.user)).slice(0,25).map(m=>{const p=prod(m.produtoId);return `<tr><td>${dbr(m.data)} ${m.data.slice(11,16)}</td><td>${p?esc(p.nome):`${esc(m.nome||'—')} <span class="chip c-mute">Excluído</span>`}</td><td>${m.tipo==='Entrada'?'<span class="chip c-ok">Entrada</span>':'<span class="chip c-warn">Saída</span>'}</td><td class="num">${nfmt(m.qtd)} ${esc(p?.un||m.un||'')}</td><td>${esc(m.obs)}</td><td>${esc(m.user)}</td></tr>`}).join('')||'<tr><td colspan="6" class="empty">Nenhuma movimentação ainda.</td></tr>'}
  </tbody></table></div></section>`;
};
bind.estoque=()=>{bindBusca();$('#catSel').onchange=e=>{catF=e.target.value;render()}};
function formProd(p){
  modal(p?'Editar material':'Novo material',`<div class="form">
    <div class="f wide"><label for="pNome">Nome</label><input id="pNome" value="${esc(p?.nome)}" placeholder="Ex.: Couro ecológico caramelo"></div>
    <div class="f"><label for="pCat">Categoria</label><input id="pCat" list="catList" value="${esc(p?.categoria)}" placeholder="Revestimento, Espuma…"><datalist id="catList">${S.categorias.map(c=>`<option value="${esc(c)}">`).join('')}</datalist></div>
    <div class="f"><label for="pUn">Unidade</label><select id="pUn">${UNIDADES.map(u=>`<option ${u===(p?.un||'m')?'selected':''}>${u}</option>`).join('')}</select></div>
    ${p?'':'<div class="f"><label for="pQtd">Saldo inicial</label><input id="pQtd" type="number" step="0.01" min="0" value="0"></div>'}
    <div class="f"><label for="pMin">Estoque mínimo</label><input id="pMin" type="number" step="0.01" min="0" value="${p?.min??0}"></div>
    <div class="f"><label for="pCusto">Custo (R$)</label><input id="pCusto" type="number" step="0.01" min="0" value="${p?.custo??0}"></div>
    <div class="f"><label for="pPreco">Preço de venda (R$)</label><input id="pPreco" type="number" step="0.01" min="0" value="${p?.preco??0}"><small>Deixe 0 para insumo de uso interno.</small></div>
  </div>`,`<button class="btn" data-close>Cancelar</button><button class="btn pri" id="pSave">Salvar</button>`,true);
  $('#pSave').onclick=()=>{
    const d={nome:$('#pNome').value.trim(),categoria:$('#pCat').value.trim()||'Outros',un:$('#pUn').value,min:+$('#pMin').value||0,custo:+$('#pCusto').value||0,preco:+$('#pPreco').value||0};
    if(!d.nome){toast('Informe o nome');return}
    const ja=S.categorias.find(c=>normal(c)===normal(d.categoria));if(ja)d.categoria=ja;else{S.categorias.push(d.categoria);log('Criou categoria',d.categoria)}
    if(p)Object.assign(p,d);else{const n={id:uid(),...d,qtd:+$('#pQtd').value||0};S.produtos.push(n);if(n.qtd)S.movs.unshift({id:uid(),data:agora(),produtoId:n.id,tipo:'Entrada',qtd:n.qtd,obs:'Saldo inicial',user:me().nome})}
    log(p?'Alterou material':'Cadastrou material',d.nome);save();closeModal();render();toast('Material salvo');
  };
}
ACT.exProd=id=>{
  const p=prod(id);
  const abertos=[...S.orcamentos.filter(o=>orcStatus(o)==='Aberto'&&o.itens.some(i=>i.produtoId===id)).map(numOrc),...S.os.filter(o=>!['Entregue','Cancelada'].includes(o.status)&&!o.baixado&&o.itens.some(i=>i.produtoId===id)).map(numOS)];
  confirmar(`Excluir o material <b>${esc(p.nome)}</b> do estoque?
    ${p.qtd>0?`<p class="conf-nota">Ainda há <b>${nfmt(p.qtd)} ${esc(p.un)}</b> em estoque${pode('est.custo')?` (${brl(p.qtd*p.custo)} pelo custo)`:''}. Esse saldo sai do inventário.</p>`:''}
    ${abertos.length?`<p class="conf-nota">Ele está em ${abertos.length} documento(s) em aberto: ${abertos.map(esc).join(', ')}. Esses documentos mantêm a descrição e o valor, mas não vão mais dar baixa desse material.</p>`:''}
    <p class="lock" style="margin:8px 0 0">O histórico de movimentações continua mostrando o nome do material.</p>`,()=>{
    S.movs.forEach(m=>{if(m.produtoId===id){m.nome=p.nome;m.un=p.un}});
    S.produtos=S.produtos.filter(x=>x.id!==id);
    log('Excluiu material do estoque',p.nome+(p.qtd>0?' (saldo '+nfmt(p.qtd)+' '+p.un+')':''));save();render();toast('Material excluído');
  },'Excluir material');
};
/* ---------- Categorias do estoque ---------- */
let catEditando='';
function telaCategorias(){
  const ed=pode('est.editar'),exc=pode('est.excluir');
  const lista=S.categorias.slice().sort((a,b)=>a.localeCompare(b));
  const qtd=c=>S.produtos.filter(p=>p.categoria===c).length;
  modal('Categorias do estoque',`
    ${ed?`<form class="cat-nova" id="catForm"><input id="catNome" placeholder="Nome da nova categoria" aria-label="Nova categoria" maxlength="40"><button class="btn pri" type="submit">+ Adicionar</button></form>`:''}
    <div class="tbl-wrap"><table><thead><tr><th>Categoria</th><th class="num">Materiais</th><th></th></tr></thead><tbody>
    ${lista.map(c=>catEditando===c?`<tr><td colspan="3"><form class="cat-nova" data-catren="${esc(c)}"><input id="catRen" value="${esc(c)}" aria-label="Novo nome" maxlength="40"><button class="btn pri sm" type="submit">Salvar</button><button class="btn sm" type="button" data-catcancel>Cancelar</button></form></td></tr>`
      :`<tr><td><b>${esc(c)}</b></td><td class="num">${qtd(c)}</td><td><div class="acts">${ed?`<button class="btn sm" type="button" data-catedit="${esc(c)}">Renomear</button>`:''}${exc?`<button class="btn sm danger" type="button" data-catdel="${esc(c)}">Excluir</button>`:''}</div></td></tr>`).join('')||'<tr><td colspan="3" class="empty">Nenhuma categoria cadastrada.</td></tr>'}
    </tbody></table></div>`,`<button class="btn pri" data-close>Pronto</button>`,true);
  const box=$('.modal-b');
  const f=$('#catForm');if(f)f.onsubmit=e=>{e.preventDefault();const n=$('#catNome').value.trim();if(!n){$('#catNome').focus();return}
    if(S.categorias.some(c=>normal(c)===normal(n))){toast('Essa categoria já existe');return}
    S.categorias.push(n);log('Criou categoria',n);save();render();telaCategorias();toast('Categoria criada')};
  box.querySelectorAll('[data-catedit]').forEach(b=>b.onclick=()=>{catEditando=b.dataset.catedit;telaCategorias();$('#catRen').select()});
  box.querySelectorAll('[data-catcancel]').forEach(b=>b.onclick=()=>{catEditando='';telaCategorias()});
  box.querySelectorAll('[data-catren]').forEach(fr=>fr.onsubmit=e=>{e.preventDefault();const velho=fr.dataset.catren,n=$('#catRen').value.trim();
    if(!n)return;if(n!==velho&&S.categorias.some(c=>c!==velho&&normal(c)===normal(n))){toast('Já existe uma categoria com esse nome');return}
    S.categorias=S.categorias.map(c=>c===velho?n:c);S.produtos.forEach(p=>{if(p.categoria===velho)p.categoria=n});if(catF===velho)catF=n;
    catEditando='';log('Renomeou categoria',velho+' → '+n);save();render();telaCategorias();toast('Categoria renomeada')});
  box.querySelectorAll('[data-catdel]').forEach(b=>b.onclick=()=>{
    const c=b.dataset.catdel,n=qtd(c),outras=S.categorias.filter(x=>x!==c).sort((a,b)=>a.localeCompare(b));
    confirmar(`Excluir a categoria <b>${esc(c)}</b>?${n?`
      <p class="conf-nota">Ela tem <b>${n} material(is)</b>. Eles não serão apagados: escolha para qual categoria vão.</p>
      <div class="f" style="margin-top:8px"><label for="catDestino">Mover os materiais para</label><select id="catDestino">${outras.map(x=>`<option>${esc(x)}</option>`).join('')}<option value="__sem">Sem categoria</option></select></div>`:''}`,v=>{
      let destino=v.catDestino;if(destino==='__sem'){destino='Sem categoria';if(!S.categorias.includes(destino))S.categorias.push(destino)}
      if(n)S.produtos.forEach(p=>{if(p.categoria===c)p.categoria=destino});
      S.categorias=S.categorias.filter(x=>x!==c);if(catF===c)catF='';
      log('Excluiu categoria',c+(n?' ('+n+' material(is) movidos para '+destino+')':''));save();render();telaCategorias();toast('Categoria excluída');
    },'Excluir categoria');
  });
}
ACT.categorias=()=>{catEditando='';telaCategorias()};
ACT.novoProd=()=>formProd();
ACT.editProd=id=>formProd(prod(id));
ACT.mov=id=>{
  const p=prod(id);
  modal('Movimentar: '+esc(p.nome),`<p style="margin:0">Saldo atual: <b>${nfmt(p.qtd)} ${esc(p.un)}</b></p><div class="form">
    <div class="f"><label for="mTipo">Tipo</label><select id="mTipo"><option>Entrada</option><option>Saída</option></select></div>
    <div class="f"><label for="mQtd">Quantidade (${esc(p.un)})</label><input id="mQtd" type="number" step="0.01" min="0.01"></div>
    <div class="f wide"><label for="mObs">Motivo</label><input id="mObs" placeholder="Ex.: NF 1234 – fornecedor; perda; ajuste de inventário"></div></div>
    ${pode('caixa.lancar')?`<div id="mCaixaBox"><label class="check" for="mCaixa"><input type="checkbox" id="mCaixa"><span>Lançar o pagamento desta compra no <b>caixa</b> como saída</span></label>
      <div class="form" id="mCaixaCampos" hidden style="margin-top:10px"><div class="f"><label for="mValor">Valor pago (R$)</label><input id="mValor" type="number" step="0.01" min="0"></div>
      <div class="f"><label for="mForma">Forma de pagamento</label><select id="mForma">${FORMAS.map(x=>`<option>${x}</option>`).join('')}</select></div></div></div>`:''}`,
  `<button class="btn" data-close>Cancelar</button><button class="btn pri" id="mSave">Registrar</button>`,true);
  const cx=$('#mCaixa');
  if(cx){
    const sync=()=>{const ent=$('#mTipo').value==='Entrada';$('#mCaixaBox').hidden=!ent;if(!ent)cx.checked=false;$('#mCaixaCampos').hidden=!cx.checked};
    cx.onchange=sync;$('#mTipo').onchange=sync;
    $('#mQtd').oninput=()=>{const q=parseFloat($('#mQtd').value)||0;$('#mValor').value=(q*p.custo).toFixed(2)};
  }
  $('#mSave').onclick=()=>{
    const tipo=$('#mTipo').value,q=parseFloat($('#mQtd').value);
    if(!(q>0)){toast('Informe uma quantidade maior que zero');return}
    if(tipo==='Saída'&&q>p.qtd+1e-9){toast(`Saldo insuficiente: há só ${nfmt(p.qtd)} ${p.un}. Para corrigir o inventário, registre a diferença com o motivo.`);$('#mQtd').focus();return}
    const obs=$('#mObs').value.trim();if(!obs){toast('Informe o motivo');$('#mObs').focus();return}
    const lancar=cx&&cx.checked,valor=lancar?parseFloat($('#mValor').value):0;
    if(lancar&&!(valor>0)){toast('Informe o valor pago');$('#mValor').focus();return}
    const antes=fotoEstoque();
    p.qtd=+(p.qtd+(tipo==='Entrada'?q:-q)).toFixed(3);
    S.movs.unshift({id:uid(),data:agora(),produtoId:p.id,tipo,qtd:q,obs,user:me().nome});
    if(lancar){S.caixa.unshift({id:uid(),data:agora(),tipo:'saida',valor,descricao:`${p.nome} – ${nfmt(q)} ${p.un} (${obs})`,categoria:'Compra de material',forma:$('#mForma').value,osId:'',user:me().nome});log('Lançou saída no caixa',p.nome+' – '+brl(valor))}
    log('Registrou '+tipo.toLowerCase()+' de estoque',p.nome+' ('+nfmt(q)+' '+p.un+')');save();closeModal();render();toast(tipo+' registrada'+(lancar?' e lançada no caixa':''));
    if(tipo==='Saída')avisarQueda(antes);
  };
};

/* ---------- Estoque: exportar e lista de reposição ---------- */
ACT.exportEstoque=()=>{
  const custo=pode('est.custo');
  const cab=['Material','Categoria','Unidade','Saldo','Mínimo','Situação','Sugestão de compra'].concat(custo?['Custo unitário','Valor em estoque']:[]).concat(['Preço de venda']);
  const linhas=S.produtos.slice().sort((a,b)=>a.categoria.localeCompare(b.categoria)||a.nome.localeCompare(b.nome)).map(p=>{
    const sit=p.qtd<=0?'Zerado':p.qtd<p.min?'Abaixo do mínimo':'OK';
    return [p.nome,p.categoria,p.un,p.qtd,p.min,sit,p.qtd<p.min?sugestao(p):0].concat(custo?[p.custo,+(Math.max(0,p.qtd)*p.custo).toFixed(2)]:[]).concat([p.preco])});
  baixarCSV('estoque_'+hojeISO()+'.csv',[cab,...linhas]);
  log('Exportou estoque','Planilha completa');toast('Planilha do estoque baixada');
};
let repo=null;
ACT.reposicao=()=>{
  const custo=pode('est.custo');
  repo=baixos().map(p=>({id:p.id,ok:true,qtd:sugestao(p)}));
  if(!repo.length){modal('Lista de reposição','<div class="empty" style="padding:8px">Nenhum material abaixo do mínimo. Está tudo em dia.</div>','<button class="btn pri" data-close>Fechar</button>',true);return}
  const linha=r=>{const p=prod(r.id);return `<tr><td><input type="checkbox" data-rk="${r.id}" ${r.ok?'checked':''} aria-label="Incluir ${esc(p.nome)}"></td><td><b>${esc(p.nome)}</b><br><span class="lock">${esc(p.categoria)}</span></td><td class="num">${nfmt(p.qtd)} ${esc(p.un)}</td><td class="num">${nfmt(p.min)} ${esc(p.un)}</td><td class="num"><input type="number" class="q" min="0" step="1" data-rq="${r.id}" value="${r.qtd}" aria-label="Comprar ${esc(p.nome)}"> ${esc(p.un)}</td>${custo?`<td class="num" id="rs${r.id}">${brl(r.qtd*p.custo)}</td>`:''}</tr>`};
  modal('Lista de reposição',`<p style="margin:0">Materiais abaixo do estoque mínimo. A quantidade sugerida repõe até <b>2× o mínimo</b>; ajuste à vontade e desmarque o que não for comprar agora.</p>
    <div class="tbl-wrap"><table class="items"><thead><tr><th></th><th>Material</th><th class="num">Saldo</th><th class="num">Mínimo</th><th class="num">Comprar</th>${custo?'<th class="num">Custo estimado</th>':''}</tr></thead><tbody>${repo.map(linha).join('')}</tbody></table></div>
    ${custo?'<div class="totals"><div class="grand"><span>Total estimado</span><span id="rTot"></span></div></div>':''}
    <div class="f"><label for="rFor">Fornecedor ou observação (opcional)</label><input id="rFor" placeholder="Ex.: Couros Nordeste – falar com Rita"></div>`,
  `<button class="btn" data-close>Fechar</button><button class="btn" id="rCsv">Baixar planilha</button><button class="btn" id="rPrint">Imprimir</button><button class="btn pri" id="rCopy">Copiar para WhatsApp</button>`);
  const tot=()=>{if(!custo)return;$('#rTot').textContent=brl(repo.filter(r=>r.ok).reduce((a,r)=>a+r.qtd*prod(r.id).custo,0))};tot();
  const box=$('.modal-b');
  box.oninput=e=>{const q=e.target.dataset.rq;if(q){const r=repo.find(x=>x.id===q);r.qtd=Math.max(0,parseFloat(e.target.value)||0);const c=$('#rs'+q);if(c)c.textContent=brl(r.qtd*prod(q).custo);tot()}};
  box.onchange=e=>{const k=e.target.dataset.rk;if(k){repo.find(x=>x.id===k).ok=e.target.checked;tot()}};
  const sel=()=>repo.filter(r=>r.ok&&r.qtd>0).map(r=>({...r,p:prod(r.id)}));
  $('#rCopy').onclick=()=>{
    const l=sel();if(!l.length){toast('Nenhum item marcado');return}
    const txt=`*Pedido de material – ${S.empresa.nome}*\n${dbr(hojeISO())}\n\n`+l.map(r=>`• ${nfmt(r.qtd)} ${r.p.un} – ${r.p.nome}`).join('\n')+($('#rFor').value.trim()?`\n\nObs.: ${$('#rFor').value.trim()}`:'')+'\n\nPor favor, confirmar disponibilidade, valor e prazo de entrega.';
    copiarTexto(txt);log('Gerou lista de reposição','Copiada ('+l.length+' itens)');
  };
  $('#rCsv').onclick=()=>{
    const l=sel();if(!l.length){toast('Nenhum item marcado');return}
    baixarCSV('reposicao_'+hojeISO()+'.csv',[['Material','Categoria','Unidade','Saldo atual','Mínimo','Comprar'].concat(custo?['Custo unitário','Custo estimado']:[]),...l.map(r=>[r.p.nome,r.p.categoria,r.p.un,r.p.qtd,r.p.min,r.qtd].concat(custo?[r.p.custo,+(r.qtd*r.p.custo).toFixed(2)]:[]))]);
    log('Gerou lista de reposição','Planilha ('+l.length+' itens)');toast('Planilha baixada');
  };
  $('#rPrint').onclick=()=>{
    const l=sel();if(!l.length){toast('Nenhum item marcado');return}
    const e=S.empresa,t=l.reduce((a,r)=>a+r.qtd*r.p.custo,0);
    const html=`<div class="doc"><div class="doc-h"><div class="doc-emp">${logoDoc()}<div><div class="co">${esc(e.nome)}</div><div class="small">${esc(e.telefone)} · ${esc(e.email)}</div></div></div><div class="doc-t"><div class="k">PEDIDO DE MATERIAL</div><div class="small">Emitido em ${dbr(hojeISO())} por ${esc(me().nome)}</div></div></div>
      ${$('#rFor').value.trim()?`<div class="cond">Fornecedor / obs.: ${esc($('#rFor').value.trim())}</div>`:''}
      <table><thead><tr><th>#</th><th>Material</th><th>Categoria</th><th class="num">Saldo</th><th class="num">Mínimo</th><th class="num">Comprar</th>${custo?'<th class="num">Custo est.</th>':''}<th class="num">Recebido</th></tr></thead><tbody>
      ${l.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.p.nome)}</td><td>${esc(r.p.categoria)}</td><td class="num">${nfmt(r.p.qtd)} ${esc(r.p.un)}</td><td class="num">${nfmt(r.p.min)} ${esc(r.p.un)}</td><td class="num"><b>${nfmt(r.qtd)} ${esc(r.p.un)}</b></td>${custo?`<td class="num">${brl(r.qtd*r.p.custo)}</td>`:''}<td class="num">______</td></tr>`).join('')}</tbody></table>
      ${custo?`<div class="tot"><div class="g"><span>Total estimado</span><span>${brl(t)}</span></div></div>`:''}
      <div class="sign"><div>Solicitado por</div><div>Conferido no recebimento</div></div></div>`;
    previa('Pedido de material',html,'Imprimiu lista de reposição',l.length+' itens');
  };
};

/* ---------- Caixa ---------- */
let cxPer='mes',cxIni='',cxFim='',cxTipo='',cxBusca='';
function cxPeriodo(){
  const h=new Date(),hj=iso(h);
  if(cxPer==='hoje')return [hj,hj,'Hoje'];
  if(cxPer==='7d')return [addDays(-6),hj,'Últimos 7 dias'];
  if(cxPer==='mesant'){const a=new Date(h.getFullYear(),h.getMonth()-1,1),b=new Date(h.getFullYear(),h.getMonth(),0);return [iso(a),iso(b),a.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})]}
  if(cxPer==='per')return [cxIni||hj,cxFim||hj,dbr(cxIni||hj)+' a '+dbr(cxFim||hj)];
  return [hj.slice(0,8)+'01',hj,h.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})];
}
function cxDados(){
  const [ini,fim,nome]=cxPeriodo();
  const per=S.caixa.filter(l=>{const d=l.data.slice(0,10);return d>=ini&&d<=fim}).sort((a,b)=>b.data.localeCompare(a.data));
  const ent=per.filter(l=>l.tipo==='entrada').reduce((a,l)=>a+l.valor,0),sai=per.filter(l=>l.tipo==='saida').reduce((a,l)=>a+l.valor,0);
  const agrupa=(campo)=>{const m={};per.forEach(l=>{const k=l[campo]||'—';m[k]=m[k]||{e:0,s:0};m[k][l.tipo==='entrada'?'e':'s']+=l.valor});return Object.entries(m).sort((a,b)=>(b[1].e+b[1].s)-(a[1].e+a[1].s))};
  const dias={};per.forEach(l=>{const d=l.data.slice(0,10);dias[d]=dias[d]||{e:0,s:0};dias[d][l.tipo==='entrada'?'e':'s']+=l.valor});
  const anterior=S.caixa.filter(l=>l.data.slice(0,10)<ini).reduce((a,l)=>a+(l.tipo==='entrada'?1:-1)*l.valor,0);
  return {ini,fim,nome,per,ent,sai,res:ent-sai,anterior,forma:agrupa('forma'),cat:agrupa('categoria'),dias:Object.entries(dias).sort((a,b)=>a[0].localeCompare(b[0]))};
}
const aReceber=()=>S.os.filter(o=>o.status!=='Cancelada'&&falta(o)>0).sort((a,b)=>({Pronto:0,Entregue:1,'Em andamento':2,Aguardando:3}[a.status]??9)-({Pronto:0,Entregue:1,'Em andamento':2,Aguardando:3}[b.status]??9));
const sinal=v=>`<span class="${v<0?'neg':v>0?'pos':''}">${v<0?'− ':''}${brl(Math.abs(v))}</span>`;
function barras(lista,maxv){return lista.map(([k,v])=>`<tr><td>${esc(k)}</td><td class="num">${v.e?`<span class="pos">${brl(v.e)}</span>`:'—'}</td><td class="num">${v.s?`<span class="neg">${brl(v.s)}</span>`:'—'}</td><td class="barra-cel"><div class="barra"><i class="be" style="width:${maxv?v.e/maxv*100:0}%"></i></div><div class="barra"><i class="bs" style="width:${maxv?v.s/maxv*100:0}%"></i></div></td></tr>`).join('')}
function cxGeral(){
  const d=cxDados(),rec=aReceber(),totRec=rec.reduce((a,o)=>a+falta(o),0),dono=pode('caixa.excluir'),lanca=pode('caixa.lancar');
  const lista=d.per.filter(l=>{if(cxTipo&&l.tipo!==cxTipo)return false;const o=l.osId&&S.os.find(x=>x.id===l.osId);return combina(cxBusca,l.descricao,l.categoria,l.forma,l.user,brl(l.valor),o?camposCliente(cli(o.clienteId)):'')});
  const maxF=Math.max(0,...d.forma.map(([,v])=>Math.max(v.e,v.s))),maxC=Math.max(0,...d.cat.map(([,v])=>Math.max(v.e,v.s)));
  let acum=d.anterior;
  const per=[['hoje','Hoje'],['7d','7 dias'],['mes','Este mês'],['mesant','Mês passado'],['per','Período']];
  return `<div class="head"><div><h2>Caixa</h2><p>Entradas e saídas de dinheiro da oficina. Pagamentos de OS ficam ligados à ordem de serviço.</p></div><span class="spacer"></span>
    <button class="btn" data-act="cxExport">Exportar planilha</button><button class="btn" data-act="cxPrint">Imprimir resumo</button>
    ${lanca?'<button class="btn saida" data-act="cxNovo" data-id="saida">− Saída</button><button class="btn pri" data-act="cxNovo" data-id="entrada">+ Entrada</button>':''}</div>
  ${cxSubabas()}
  <div class="periodo" role="group" aria-label="Período">
    ${per.map(([k,n])=>`<button class="seg ${cxPer===k?'on':''}" data-per="${k}" aria-pressed="${cxPer===k}">${n}</button>`).join('')}
    ${cxPer==='per'?`<span class="per-datas"><input type="date" id="cxIni" value="${d.ini}" aria-label="De"> até <input type="date" id="cxFim" value="${d.fim}" aria-label="Até"></span>`:`<span class="lock per-nome">${esc(d.nome)}</span>`}
  </div>
  <div class="kpis">
    <div class="kpi"><b class="pos">${brl(d.ent)}</b><span>Entradas</span></div>
    <div class="kpi"><b class="neg">${brl(d.sai)}</b><span>Saídas</span></div>
    <div class="kpi"><b>${sinal(d.res)}</b><span>Resultado do período</span></div>
    <div class="kpi"><b>${sinal(d.anterior+d.res)}</b><span>Saldo do caixa em ${dbr(d.fim)}</span></div>
    <div class="kpi ${totRec?'warnk':''}"><b>${brl(totRec)}</b><span>A receber de ${rec.length} OS</span></div>
  </div>
  ${rec.length?`<section class="panel"><div class="panel-h"><h3>A receber</h3><span class="lock">Ordens de serviço com saldo em aberto</span></div><div class="tbl-wrap"><table><thead><tr><th>OS</th><th>Cliente</th><th>Situação</th><th class="num">Total</th><th class="num">Recebido</th><th class="num">Falta</th><th></th></tr></thead><tbody>
    ${rec.map(o=>`<tr><td><button class="btn link" data-act="editOS" data-id="${o.id}">${numOS(o)}</button></td><td>${esc(cli(o.clienteId)?.nome||'—')}</td><td>${chipStatus(o.status)}</td><td class="num">${brl(soma(o).total)}</td><td class="num">${brl(recebido(o))}</td><td class="num"><b>${brl(falta(o))}</b></td><td><div class="acts">${pode('caixa.receber')?`<button class="btn sm pri" data-act="receber" data-id="${o.id}">Receber</button>`:''}</div></td></tr>`).join('')}
  </tbody></table></div></section>`:''}
  <div class="grid2">
    <section class="panel"><div class="panel-h"><h3>Por forma de pagamento</h3></div><div class="tbl-wrap"><table><thead><tr><th>Forma</th><th class="num">Entradas</th><th class="num">Saídas</th><th></th></tr></thead><tbody>${barras(d.forma,maxF)||'<tr><td colspan="4" class="empty">Sem lançamentos no período.</td></tr>'}</tbody></table></div></section>
    <section class="panel"><div class="panel-h"><h3>Por categoria</h3></div><div class="tbl-wrap"><table><thead><tr><th>Categoria</th><th class="num">Entradas</th><th class="num">Saídas</th><th></th></tr></thead><tbody>${barras(d.cat,maxC)||'<tr><td colspan="4" class="empty">Sem lançamentos no período.</td></tr>'}</tbody></table></div></section>
  </div>
  <section class="panel"><div class="panel-h"><h3>Resumo por dia</h3><span class="lock">Saldo anterior ao período: ${sinal(d.anterior)}</span></div><div class="tbl-wrap"><table><thead><tr><th>Dia</th><th class="num">Entradas</th><th class="num">Saídas</th><th class="num">Resultado</th><th class="num">Saldo acumulado</th></tr></thead><tbody>
    ${d.dias.map(([dia,v])=>{acum+=v.e-v.s;return `<tr><td>${dbr(dia)} <span class="lock">${pd(dia).toLocaleDateString('pt-BR',{weekday:'short'})}</span></td><td class="num pos">${brl(v.e)}</td><td class="num neg">${brl(v.s)}</td><td class="num">${sinal(v.e-v.s)}</td><td class="num"><b>${sinal(acum)}</b></td></tr>`}).join('')||'<tr><td colspan="5" class="empty">Sem lançamentos no período.</td></tr>'}
  </tbody></table></div></section>
  <section class="panel"><div class="panel-h"><h3>Lançamentos</h3><span class="spacer" style="flex:1"></span>
    <select class="search" id="cxTipo" style="width:auto" aria-label="Tipo"><option value="">Entradas e saídas</option><option value="entrada" ${cxTipo==='entrada'?'selected':''}>Só entradas</option><option value="saida" ${cxTipo==='saida'?'selected':''}>Só saídas</option></select>
    <input class="search" id="cxBusca" placeholder="Buscar lançamento" value="${esc(cxBusca)}" aria-label="Buscar lançamento"></div>
    <div class="tbl-wrap"><table><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Forma</th><th class="num">Valor</th><th>Por</th><th></th></tr></thead><tbody>
    ${lista.map(l=>`<tr><td style="white-space:nowrap">${dbr(l.data)} <span class="lock">${l.data.slice(11,16)}</span></td><td>${esc(l.descricao)}${l.osId&&S.os.find(o=>o.id===l.osId)?` <button class="btn link" data-act="editOS" data-id="${l.osId}">ver OS</button>`:''}</td><td>${esc(l.categoria)}</td><td>${esc(l.forma)}</td><td class="num"><b>${sinal(l.tipo==='entrada'?l.valor:-l.valor)}</b></td><td>${esc(l.user)}</td><td>${dono?`<div class="acts"><button class="btn sm danger" data-act="cxDel" data-id="${l.id}" aria-label="Excluir lançamento">Excluir</button></div>`:''}</td></tr>`).join('')||'<tr><td colspan="7" class="empty">Nenhum lançamento encontrado.</td></tr>'}
    </tbody></table></div></section>`;
};
function bindCxGeral(){
  document.querySelectorAll('[data-per]').forEach(b=>b.onclick=()=>{cxPer=b.dataset.per;if(cxPer==='per'&&!cxIni){cxIni=hojeISO().slice(0,8)+'01';cxFim=hojeISO()}render()});
  const i=$('#cxIni'),f=$('#cxFim');if(i){i.onchange=()=>{cxIni=i.value;render()};f.onchange=()=>{cxFim=f.value;render()}}
  $('#cxTipo').onchange=e=>{cxTipo=e.target.value;render()};
  $('#cxBusca').oninput=e=>{cxBusca=e.target.value;const pos=e.target.selectionStart;render();const n=$('#cxBusca');n.focus();n.setSelectionRange(pos,pos)};
};

/* ---------- Caixa: relatório por período ---------- */
let cxAba='geral';
const rel={ini:'',fim:'',agr:'dia',tipo:'',cat:'',forma:''};
function cxSubabas(){return `<div class="subabas" role="tablist" aria-label="Caixa">
  <button role="tab" type="button" data-cxaba="geral" aria-selected="${cxAba==='geral'}">Visão geral</button>
  <button role="tab" type="button" data-cxaba="rel" aria-selected="${cxAba==='rel'}">Relatório por período</button></div>`}
V.caixa=()=>cxAba==='rel'?cxRelatorio():cxGeral();
bind.caixa=()=>{
  document.querySelectorAll('[data-cxaba]').forEach(b=>b.onclick=()=>{cxAba=b.dataset.cxaba;render()});
  if(cxAba==='rel')bindCxRel();else bindCxGeral();
};
// Atalhos de período
function relAtalho(k){
  const h=new Date(),hj=iso(h);
  if(k==='mes'){rel.ini=hj.slice(0,8)+'01';rel.fim=hj;rel.agr='dia'}
  if(k==='mesant'){rel.ini=iso(new Date(h.getFullYear(),h.getMonth()-1,1));rel.fim=iso(new Date(h.getFullYear(),h.getMonth(),0));rel.agr='dia'}
  if(k==='3m'){rel.ini=iso(new Date(h.getFullYear(),h.getMonth()-2,1));rel.fim=hj;rel.agr='semana'}
  if(k==='ano'){rel.ini=h.getFullYear()+'-01-01';rel.fim=hj;rel.agr='mes'}
  if(k==='12m'){rel.ini=iso(new Date(h.getFullYear(),h.getMonth()-11,1));rel.fim=hj;rel.agr='mes'}
}
// Chave do grupo de cada data (dia, semana começando na segunda, ou mês)
function relChave(d){
  if(rel.agr==='mes')return d.slice(0,7);
  if(rel.agr==='semana'){const x=pd(d);const dw=(x.getDay()+6)%7;x.setDate(x.getDate()-dw);return iso(x)}
  return d;
}
function relRotulo(k,curto){
  if(rel.agr==='mes'){const [y,m]=k.split('-');const t=new Date(+y,+m-1,1).toLocaleDateString('pt-BR',{month:curto?'short':'long',year:curto?'2-digit':'numeric'});return t.replace('.','').replace(' de ',curto?'/':' de ')}
  if(rel.agr==='semana'){const a=pd(k),b=pd(k);b.setDate(b.getDate()+6);return curto?dbr(k).slice(0,5):`${dbr(k).slice(0,5)} a ${dbr(iso(b)).slice(0,5)}`}
  return curto?dbr(k).slice(0,5):dbr(k)+' '+pd(k).toLocaleDateString('pt-BR',{weekday:'short'});
}
function relDados(){
  if(!rel.ini)relAtalho('mes');
  let {ini,fim}=rel;if(fim<ini)[ini,fim]=[fim,ini];
  const todos=S.caixa.filter(l=>{const d=l.data.slice(0,10);return d>=ini&&d<=fim&&(!rel.tipo||l.tipo===rel.tipo)&&(!rel.cat||l.categoria===rel.cat)&&(!rel.forma||l.forma===rel.forma)});
  // todos os grupos do período, mesmo os sem movimento, para o gráfico não pular datas
  const grupos=new Map();const x=pd(ini),f=pd(fim);let guard=0;
  while(x<=f&&guard++<800){const k=relChave(iso(x));if(!grupos.has(k))grupos.set(k,{e:0,s:0,n:0});x.setDate(x.getDate()+1)}
  todos.forEach(l=>{const g=grupos.get(relChave(l.data.slice(0,10)));if(g){g[l.tipo==='entrada'?'e':'s']+=l.valor;g.n++}});
  const ent=todos.filter(l=>l.tipo==='entrada').reduce((a,l)=>a+l.valor,0),sai=todos.filter(l=>l.tipo==='saida').reduce((a,l)=>a+l.valor,0);
  const anterior=(!rel.tipo&&!rel.cat&&!rel.forma)?S.caixa.filter(l=>l.data.slice(0,10)<ini).reduce((a,l)=>a+(l.tipo==='entrada'?1:-1)*l.valor,0):null;
  const por=campo=>{const m={};todos.forEach(l=>{const k=l[campo]||'—';m[k]=m[k]||{e:0,s:0,n:0};m[k][l.tipo==='entrada'?'e':'s']+=l.valor;m[k].n++});return Object.entries(m).sort((a,b)=>(b[1].e+b[1].s)-(a[1].e+a[1].s))};
  const dias=Math.round((pd(fim)-pd(ini))/864e5)+1;
  return {ini,fim,todos,grupos:[...grupos.entries()],ent,sai,res:ent-sai,anterior,cat:por('categoria'),forma:por('forma'),dias};
}
// Gráfico de barras desenhado em SVG (entradas em verde, saídas em vermelho)
function relGrafico(g){
  const W=860,H=250,L=70,R=14,T=14,B=34;
  const max=Math.max(1,...g.map(([,v])=>Math.max(v.e,v.s)));
  const p=10**Math.floor(Math.log10(max)),passo=[1,2,2.5,5,10].map(m=>m*p).find(m=>max/m<=4)||10*p;const topo=Math.ceil(max/passo)*passo;
  const y=v=>T+(H-T-B)*(1-v/topo),n=g.length,cw=(W-L-R)/n,bw=Math.max(1.5,Math.min(22,cw*0.36));
  const cada=Math.ceil(n/(W>700?16:8));
  let svg=`<svg viewBox="0 0 ${W} ${H}" class="grafico" role="img" aria-label="Entradas e saídas por ${rel.agr}">`;
  for(let v=0;v<=topo+1e-9;v+=passo)svg+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" class="g-grade"/><text x="${L-8}" y="${y(v)+4}" class="g-txt" text-anchor="end">${v>=1000?(v/1000).toLocaleString('pt-BR',{maximumFractionDigits:1})+' mil':v.toLocaleString('pt-BR')}</text>`;
  g.forEach(([k,v],i)=>{const cx=L+cw*i+cw/2;
    if(v.e)svg+=`<rect x="${cx-bw-1}" y="${y(v.e)}" width="${bw}" height="${y(0)-y(v.e)}" rx="2" class="g-e"><title>${relRotulo(k)} – entradas ${brl(v.e)}</title></rect>`;
    if(v.s)svg+=`<rect x="${cx+1}" y="${y(v.s)}" width="${bw}" height="${y(0)-y(v.s)}" rx="2" class="g-s"><title>${relRotulo(k)} – saídas ${brl(v.s)}</title></rect>`;
    if(i%cada===0)svg+=`<text x="${cx}" y="${H-12}" class="g-txt" text-anchor="middle">${esc(relRotulo(k,true))}</text>`});
  svg+=`<line x1="${L}" x2="${W-R}" y1="${y(0)}" y2="${y(0)}" class="g-eixo"/></svg>`;
  return svg;
}
function cxRelatorio(){
  const d=relDados(),cats=[...new Set([...CAT_ENTRADA,...CAT_SAIDA,...S.caixa.map(l=>l.categoria)])];
  const nomeAgr={dia:'Dia',semana:'Semana',mes:'Mês'}[rel.agr];
  let acum=d.anterior??0;
  const filtrado=rel.tipo||rel.cat||rel.forma;
  const tab=(tit,lista,col)=>`<section class="panel"><div class="panel-h"><h3>${tit}</h3></div><div class="tbl-wrap"><table><thead><tr><th>${col}</th><th class="num">Entradas</th><th class="num">% das entradas</th><th class="num">Saídas</th><th class="num">% das saídas</th><th class="num">Lançamentos</th></tr></thead><tbody>
    ${lista.map(([k,v])=>`<tr><td>${esc(k)}</td><td class="num pos">${v.e?brl(v.e):'—'}</td><td class="num">${d.ent&&v.e?(v.e/d.ent*100).toFixed(1).replace('.',',')+'%':'—'}</td><td class="num neg">${v.s?brl(v.s):'—'}</td><td class="num">${d.sai&&v.s?(v.s/d.sai*100).toFixed(1).replace('.',',')+'%':'—'}</td><td class="num">${v.n}</td></tr>`).join('')||'<tr><td colspan="6" class="empty">Sem lançamentos.</td></tr>'}</tbody></table></div></section>`;
  return `<div class="head"><div><h2>Caixa</h2><p>Relatório de entradas e saídas no período que você escolher.</p></div><span class="spacer"></span>
    <button class="btn" data-act="relExport">Exportar planilha</button><button class="btn pri" data-act="relPrint">Imprimir relatório</button></div>
  ${cxSubabas()}
  <section class="panel"><div class="panel-b rel-filtros">
    <div class="rel-atalhos">${[['mes','Este mês'],['mesant','Mês passado'],['3m','Últimos 3 meses'],['12m','Últimos 12 meses'],['ano','Este ano']].map(([k,n])=>`<button type="button" class="seg" data-relat="${k}">${n}</button>`).join('')}</div>
    <div class="form">
      <div class="f"><label for="rIni">De</label><input type="date" id="rIni" value="${d.ini}"></div>
      <div class="f"><label for="rFim">Até</label><input type="date" id="rFim" value="${d.fim}"></div>
      <div class="f"><label for="rAgr">Agrupar por</label><select id="rAgr">${[['dia','Dia'],['semana','Semana'],['mes','Mês']].map(([k,n])=>`<option value="${k}" ${rel.agr===k?'selected':''}>${n}</option>`).join('')}</select></div>
      <div class="f"><label for="rTipo">Tipo</label><select id="rTipo"><option value="">Entradas e saídas</option><option value="entrada" ${rel.tipo==='entrada'?'selected':''}>Só entradas</option><option value="saida" ${rel.tipo==='saida'?'selected':''}>Só saídas</option></select></div>
      <div class="f"><label for="rCat">Categoria</label><select id="rCat"><option value="">Todas</option>${cats.map(c=>`<option ${rel.cat===c?'selected':''}>${esc(c)}</option>`).join('')}</select></div>
      <div class="f"><label for="rForma">Forma de pagamento</label><select id="rForma"><option value="">Todas</option>${FORMAS.map(c=>`<option ${rel.forma===c?'selected':''}>${esc(c)}</option>`).join('')}</select></div>
    </div>
    ${filtrado?'<p class="lock" style="margin:0">Filtros ativos: o saldo acumulado não aparece porque nem todos os lançamentos estão sendo considerados. <button class="btn link sm" type="button" id="rLimpar">Limpar filtros</button></p>':''}
  </div></section>
  <div class="kpis">
    <div class="kpi"><b class="pos">${brl(d.ent)}</b><span>Entradas</span></div>
    <div class="kpi"><b class="neg">${brl(d.sai)}</b><span>Saídas</span></div>
    <div class="kpi"><b>${sinal(d.res)}</b><span>Resultado de ${dbr(d.ini)} a ${dbr(d.fim)}</span></div>
    <div class="kpi"><b>${brl(d.ent/d.dias)}</b><span>Média de entradas por dia (${d.dias} dias)</span></div>
    <div class="kpi"><b>${d.todos.length}</b><span>Lançamentos</span></div>
  </div>
  <section class="panel"><div class="panel-h"><h3>Entradas e saídas por ${nomeAgr.toLowerCase()}</h3><span class="spacer" style="flex:1"></span><span class="legenda"><i class="le"></i>Entradas <i class="ls"></i>Saídas</span></div>
    <div class="panel-b grafico-box">${d.todos.length?relGrafico(d.grupos):'<div class="empty">Nenhum lançamento neste período.</div>'}</div></section>
  <section class="panel"><div class="panel-h"><h3>Resumo por ${nomeAgr.toLowerCase()}</h3>${d.anterior!==null?`<span class="lock">Saldo antes do período: ${sinal(d.anterior)}</span>`:''}</div><div class="tbl-wrap"><table><thead><tr><th>${nomeAgr}</th><th class="num">Entradas</th><th class="num">Saídas</th><th class="num">Resultado</th>${d.anterior!==null?'<th class="num">Saldo acumulado</th>':''}</tr></thead><tbody>
    ${d.grupos.filter(([,v])=>v.n).map(([k,v])=>{acum+=v.e-v.s;return `<tr><td>${esc(relRotulo(k))}</td><td class="num pos">${brl(v.e)}</td><td class="num neg">${brl(v.s)}</td><td class="num">${sinal(v.e-v.s)}</td>${d.anterior!==null?`<td class="num"><b>${sinal(acum)}</b></td>`:''}</tr>`}).join('')||'<tr><td colspan="5" class="empty">Nenhum lançamento neste período.</td></tr>'}
    ${d.todos.length?`<tr class="total"><td>Total</td><td class="num pos">${brl(d.ent)}</td><td class="num neg">${brl(d.sai)}</td><td class="num">${sinal(d.res)}</td>${d.anterior!==null?`<td class="num">${sinal(d.anterior+d.res)}</td>`:''}</tr>`:''}
  </tbody></table></div></section>
  ${tab('Por categoria',d.cat,'Categoria')}${tab('Por forma de pagamento',d.forma,'Forma')}`;
}
function bindCxRel(){
  const set=(id,k)=>{const el=$('#'+id);el.onchange=()=>{rel[k]=el.value;render()}};
  set('rIni','ini');set('rFim','fim');set('rAgr','agr');set('rTipo','tipo');set('rCat','cat');set('rForma','forma');
  document.querySelectorAll('[data-relat]').forEach(b=>b.onclick=()=>{relAtalho(b.dataset.relat);render()});
  const l=$('#rLimpar');if(l)l.onclick=()=>{rel.tipo=rel.cat=rel.forma='';render()};
}
function relFiltrosTexto(){return [rel.tipo?(rel.tipo==='entrada'?'só entradas':'só saídas'):'',rel.cat?'categoria '+rel.cat:'',rel.forma?'forma '+rel.forma:''].filter(Boolean).join(' · ')}
ACT.relExport=()=>{
  const d=relDados(),nomeAgr={dia:'Dia',semana:'Semana',mes:'Mês'}[rel.agr];
  const linhas=[[`Relatório de caixa – ${S.empresa.nome}`],[`Período: ${dbr(d.ini)} a ${dbr(d.fim)}`+(relFiltrosTexto()?' · '+relFiltrosTexto():'')],[],
    ['Resumo'],['Entradas',+d.ent.toFixed(2)],['Saídas',+d.sai.toFixed(2)],['Resultado',+d.res.toFixed(2)],[],
    [`Por ${nomeAgr.toLowerCase()}`],[nomeAgr,'Entradas','Saídas','Resultado'],
    ...d.grupos.filter(([,v])=>v.n).map(([k,v])=>[relRotulo(k),+v.e.toFixed(2),+v.s.toFixed(2),+(v.e-v.s).toFixed(2)]),[],
    ['Por categoria'],['Categoria','Entradas','Saídas','Lançamentos'],...d.cat.map(([k,v])=>[k,+v.e.toFixed(2),+v.s.toFixed(2),v.n]),[],
    ['Por forma de pagamento'],['Forma','Entradas','Saídas','Lançamentos'],...d.forma.map(([k,v])=>[k,+v.e.toFixed(2),+v.s.toFixed(2),v.n]),[],
    ['Lançamentos'],['Data','Hora','Tipo','Descrição','Categoria','Forma','Valor','Lançado por'],
    ...d.todos.slice().sort((a,b)=>a.data.localeCompare(b.data)).map(l=>[dbr(l.data),l.data.slice(11,16),l.tipo==='entrada'?'Entrada':'Saída',l.descricao,l.categoria,l.forma,l.tipo==='entrada'?l.valor:-l.valor,l.user])];
  baixarCSV(`relatorio_caixa_${d.ini}_a_${d.fim}.csv`,linhas);
  log('Exportou relatório de caixa',dbr(d.ini)+' a '+dbr(d.fim));toast('Planilha do relatório baixada');
};
ACT.relPrint=()=>{
  const d=relDados(),e=S.empresa,nomeAgr={dia:'Dia',semana:'Semana',mes:'Mês'}[rel.agr];let acum=d.anterior??0;
  const tb=(tit,l)=>`<div class="sec">${tit}</div><table><thead><tr><th></th><th class="num">Entradas</th><th class="num">Saídas</th></tr></thead><tbody>${l.map(([k,v])=>`<tr><td>${esc(k)}</td><td class="num">${brl(v.e)}</td><td class="num">${brl(v.s)}</td></tr>`).join('')}</tbody></table>`;
  const html=`<div class="doc"><div class="doc-h"><div class="doc-emp">${logoDoc()}<div><div class="co">${esc(e.nome)}</div><div class="small">CNPJ ${esc(e.cnpj)}</div></div></div><div class="doc-t"><div class="k">RELATÓRIO DE CAIXA</div><div class="small">${dbr(d.ini)} a ${dbr(d.fim)}${relFiltrosTexto()?'<br>'+esc(relFiltrosTexto()):''}<br>Emitido em ${new Date().toLocaleString('pt-BR')} por ${esc(me().nome)}</div></div></div>
    <div class="doc-boxes quatro">
      ${d.anterior!==null?`<div class="doc-box"><div class="lbl">Saldo anterior</div><b>${brl(d.anterior)}</b></div>`:''}
      <div class="doc-box"><div class="lbl">Entradas</div><b>${brl(d.ent)}</b></div>
      <div class="doc-box"><div class="lbl">Saídas</div><b>${brl(d.sai)}</b></div>
      <div class="doc-box"><div class="lbl">Resultado</div><b>${brl(d.res)}</b></div></div>
    ${d.todos.length?`<div class="doc-grafico">${relGrafico(d.grupos)}</div>`:''}
    <div class="sec">Por ${nomeAgr.toLowerCase()}</div><table><thead><tr><th>${nomeAgr}</th><th class="num">Entradas</th><th class="num">Saídas</th><th class="num">Resultado</th>${d.anterior!==null?'<th class="num">Saldo</th>':''}</tr></thead><tbody>
    ${d.grupos.filter(([,v])=>v.n).map(([k,v])=>{acum+=v.e-v.s;return `<tr><td>${esc(relRotulo(k))}</td><td class="num">${brl(v.e)}</td><td class="num">${brl(v.s)}</td><td class="num">${brl(v.e-v.s)}</td>${d.anterior!==null?`<td class="num">${brl(acum)}</td>`:''}</tr>`}).join('')}</tbody></table>
    <div class="doc-duas"><div>${tb('Por categoria',d.cat)}</div><div>${tb('Por forma de pagamento',d.forma)}</div></div>
    <div class="sign"><div>Responsável pelo caixa</div><div>Conferido por</div></div></div>`;
  previa('Relatório de caixa',html,'Imprimiu relatório de caixa',dbr(d.ini)+' a '+dbr(d.fim));
};
function formCaixa(tipo,osId){
  const ent=tipo==='entrada';const o=osId?S.os.find(x=>x.id===osId):null;
  const abertas=aReceber();
  modal(o?'Receber '+numOS(o):ent?'Nova entrada':'Nova saída',`
    ${o?`<div class="pagto"><div><span class="lock">${esc(cli(o.clienteId)?.nome||'')} · ${esc((vei(o.veiculoId)||{}).placa||'')}</span><b>Total ${brl(soma(o).total)} · recebido ${brl(recebido(o))}</b></div><span class="chip c-warn">Falta ${brl(falta(o))}</span></div>`:''}
    <div class="form">
    ${ent&&!o?`<div class="f wide"><label for="xOS">Pagamento de ordem de serviço? (opcional)</label><select id="xOS"><option value="">Não, outra entrada</option>${abertas.map(a=>`<option value="${a.id}">${numOS(a)} – ${esc(cli(a.clienteId)?.nome||'')} – falta ${brl(falta(a))}</option>`).join('')}</select></div>`:''}
    <div class="f"><label for="xValor">Valor (R$)</label><input id="xValor" type="number" step="0.01" min="0.01" inputmode="decimal" value="${o?falta(o).toFixed(2):''}"></div>
    <div class="f"><label for="xForma">Forma de pagamento</label><select id="xForma">${FORMAS.map(x=>`<option ${o&&o.pagamento&&normal(o.pagamento).includes(normal(x).split(' ')[0])?'selected':''}>${x}</option>`).join('')}</select></div>
    <div class="f"><label for="xCat">Categoria</label><select id="xCat">${(ent?CAT_ENTRADA:CAT_SAIDA).map(x=>`<option ${o&&x==='Serviço (OS)'?'selected':''}>${x}</option>`).join('')}</select></div>
    <div class="f"><label for="xData">Data e hora</label><input id="xData" type="datetime-local" value="${agora()}"></div>
    <div class="f wide"><label for="xDesc">Descrição</label><input id="xDesc" value="${o?'Pagamento '+numOS(o):''}" placeholder="${ent?'Ex.: Venda de retalho de couro':'Ex.: Conta de energia de outubro'}"></div>
    </div>${o?'<p class="lock" style="margin:0">Se o valor for menor que o que falta, fica registrado como sinal/parcial e o restante continua em “A receber”.</p>':''}`,
  `<button class="btn" data-close>Cancelar</button><button class="btn ${ent?'pri':'saida-pri'}" id="xSave">${o?'Confirmar recebimento':'Lançar '+(ent?'entrada':'saída')}</button>`,true);
  let osSel=o;
  const ajusta=()=>{if(!osSel)return;const v=parseFloat($('#xValor').value)||0;$('#xCat').value=v<falta(osSel)-0.005?'Sinal de OS':'Serviço (OS)'};
  if(o){$('#xValor').oninput=ajusta;ajusta()}
  const xo=$('#xOS');if(xo)xo.onchange=()=>{osSel=S.os.find(x=>x.id===xo.value)||null;if(osSel){$('#xValor').value=falta(osSel).toFixed(2);$('#xDesc').value='Pagamento '+numOS(osSel);ajusta();$('#xValor').oninput=ajusta}else{$('#xCat').value=CAT_ENTRADA[2];$('#xValor').oninput=null}};
  $('#xSave').onclick=()=>{
    const valor=+(parseFloat($('#xValor').value)||0).toFixed(2);
    if(!(valor>0)){toast('Informe um valor maior que zero');$('#xValor').focus();return}
    if(osSel&&valor>falta(osSel)+0.005){toast('O valor passa do que falta receber ('+brl(falta(osSel))+')');$('#xValor').focus();return}
    const desc=$('#xDesc').value.trim();if(!desc){toast('Descreva o lançamento');$('#xDesc').focus();return}
    const data=($('#xData').value||agora()).slice(0,16);
    const l={id:uid(),data,tipo,valor,descricao:desc,categoria:$('#xCat').value,forma:$('#xForma').value,osId:osSel?osSel.id:'',user:me().nome};
    S.caixa.unshift(l);
    log(ent?'Lançou entrada no caixa':'Lançou saída no caixa',desc+' – '+brl(valor));
    save();closeModal();render();
    toast(osSel?(falta(osSel)>0?`Recebido ${brl(valor)}. Falta ${brl(falta(osSel))}`:numOS(osSel)+' quitada'):(ent?'Entrada':'Saída')+' lançada');
  };
}
ACT.cxNovo=t=>formCaixa(t);
ACT.receber=id=>formCaixa('entrada',id);
ACT.cxDel=id=>{
  const l=S.caixa.find(x=>x.id===id);
  confirmar(`Excluir o lançamento <b>${esc(l.descricao)}</b> de ${brl(l.valor)}?<br><span class="lock">A exclusão fica registrada na auditoria.</span>`,()=>{S.caixa=S.caixa.filter(x=>x.id!==id);log('Excluiu lançamento do caixa',l.descricao+' – '+brl(l.valor));save();render();toast('Lançamento excluído')},'Excluir lançamento');
};
ACT.cxExport=()=>{
  const d=cxDados();
  baixarCSV(`caixa_${d.ini}_a_${d.fim}.csv`,[['Data','Hora','Tipo','Descrição','Categoria','Forma de pagamento','Valor','OS','Lançado por'],
    ...d.per.slice().reverse().map(l=>{const o=S.os.find(x=>x.id===l.osId);return [dbr(l.data),l.data.slice(11,16),l.tipo==='entrada'?'Entrada':'Saída',l.descricao,l.categoria,l.forma,l.tipo==='entrada'?l.valor:-l.valor,o?numOS(o):'',l.user]}),
    [],['','','','Total de entradas','','',d.ent],['','','','Total de saídas','','',-d.sai],['','','','Resultado do período','','',+d.res.toFixed(2)]]);
  log('Exportou caixa',d.nome);toast('Planilha do caixa baixada');
};
ACT.cxPrint=()=>{
  const d=cxDados(),e=S.empresa;let acum=d.anterior;
  const tb=(tit,l)=>`<div class="sec">${tit}</div><table><thead><tr><th></th><th class="num">Entradas</th><th class="num">Saídas</th></tr></thead><tbody>${l.map(([k,v])=>`<tr><td>${esc(k)}</td><td class="num">${brl(v.e)}</td><td class="num">${brl(v.s)}</td></tr>`).join('')}</tbody></table>`;
  const html=`<div class="doc"><div class="doc-h"><div class="doc-emp">${logoDoc()}<div><div class="co">${esc(e.nome)}</div><div class="small">CNPJ ${esc(e.cnpj)}</div></div></div><div class="doc-t"><div class="k">RESUMO DE CAIXA</div><div class="small">${dbr(d.ini)} a ${dbr(d.fim)}<br>Emitido em ${new Date().toLocaleString('pt-BR')} por ${esc(me().nome)}</div></div></div>
    <div class="doc-boxes quatro">
      <div class="doc-box"><div class="lbl">Saldo anterior</div><b>${brl(d.anterior)}</b></div>
      <div class="doc-box"><div class="lbl">Entradas</div><b>${brl(d.ent)}</b></div>
      <div class="doc-box"><div class="lbl">Saídas</div><b>${brl(d.sai)}</b></div>
      <div class="doc-box"><div class="lbl">Saldo final</div><b>${brl(d.anterior+d.res)}</b></div></div>
    <div class="doc-duas">${'<div>'+tb('Por forma de pagamento',d.forma)+'</div><div>'+tb('Por categoria',d.cat)+'</div>'}</div>
    <div class="sec">Resumo por dia</div><table><thead><tr><th>Dia</th><th class="num">Entradas</th><th class="num">Saídas</th><th class="num">Saldo</th></tr></thead><tbody>${d.dias.map(([dia,v])=>{acum+=v.e-v.s;return `<tr><td>${dbr(dia)}</td><td class="num">${brl(v.e)}</td><td class="num">${brl(v.s)}</td><td class="num">${brl(acum)}</td></tr>`}).join('')}</tbody></table>
    <div class="sec">Lançamentos</div><table><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Forma</th><th class="num">Valor</th></tr></thead><tbody>${d.per.slice().reverse().map(l=>`<tr><td>${dbr(l.data)} ${l.data.slice(11,16)}</td><td>${esc(l.descricao)}</td><td>${esc(l.categoria)}</td><td>${esc(l.forma)}</td><td class="num">${l.tipo==='entrada'?'':'− '}${brl(l.valor)}</td></tr>`).join('')}</tbody></table>
    <div class="sign"><div>Responsável pelo caixa</div><div>Conferido por</div></div></div>`;
  previa('Resumo de caixa',html,'Imprimiu resumo de caixa',d.nome);
};

/* ---------- Logo: lê a imagem (inclusive AVIF), reduz e guarda como PNG ou WebP ---------- */
function prepararLogo(arquivo){
  return new Promise((ok,falha)=>{
    const url=URL.createObjectURL(arquivo),img=new Image();
    img.onload=()=>{
      try{
        const MAX=600,w0=img.naturalWidth||600,h0=img.naturalHeight||600,esc_=Math.min(1,MAX/Math.max(w0,h0));
        const w=Math.max(1,Math.round(w0*esc_)),h=Math.max(1,Math.round(h0*esc_));
        const cv=document.createElement('canvas');cv.width=w;cv.height=h;
        const cx=cv.getContext('2d');cx.imageSmoothingQuality='high';cx.drawImage(img,0,0,w,h);
        let dados=cv.toDataURL('image/png');
        const webp=cv.toDataURL('image/webp',0.92);
        if(webp.startsWith('data:image/webp')&&webp.length<dados.length)dados=webp; // usa o formato mais leve, mantendo a transparência
        if(dados.length>900000)throw new Error('O logo ficou grande demais para guardar. Tente uma imagem mais simples ou menor.');
        ok(dados);
      }catch(e){falha(e)}finally{URL.revokeObjectURL(url)}
    };
    img.onerror=()=>{URL.revokeObjectURL(url);falha(new Error('Não foi possível abrir esta imagem. Se for AVIF, use o Chrome ou o Edge atualizados, ou converta para PNG.'))};
    img.src=url;
  });
}

/* ---------- Auditoria ---------- */
V.auditoria=()=>`<div class="head"><div><h2>Auditoria LGPD</h2><p>Quem acessou ou alterou o quê, e quando. Serve de prova de boas práticas em caso de fiscalização ou incidente.</p></div></div>
  <div class="grid2">
  <section class="panel"><div class="panel-h"><h3>Usuários</h3>${pode('acessos')?'<span class="spacer" style="flex:1"></span><button class="btn sm" data-tab-ir="acessos">Gerenciar acessos</button>':''}</div><div class="tbl-wrap"><table><thead><tr><th>Usuário</th><th>Perfil</th><th>Situação</th><th class="num">Funções</th><th>Último acesso</th></tr></thead><tbody>
    ${S.users.map(u=>`<tr><td><b>${esc(u.nome)}</b> <span class="lock">${esc(u.login)}</span></td><td>${u.admin?'<span class="chip c-acc">Administrador</span>':'<span class="chip c-mute">Usuário</span>'}</td><td>${u.ativo?'<span class="chip c-ok">Ativo</span>':'<span class="chip c-bad">Bloqueado</span>'}</td><td class="num">${u.admin?'Todas':TODAS_PERMS.filter(p=>u.perms[p]).length+' de '+TODAS_PERMS.length}</td><td>${u.ultimoAcesso?dbr(u.ultimoAcesso)+' '+u.ultimoAcesso.slice(11,16):'Nunca entrou'}</td></tr>`).join('')}
  </tbody></table></div></section>
  <section class="panel"><div class="panel-h"><h3>Checklist LGPD da oficina</h3></div><div class="panel-b" style="display:grid;gap:8px">
    ${[['Cadastro só com dados necessários (campos opcionais livres)',true],['Promoções apenas com autorização registrada e datada',true],['Cada usuário só vê o que o administrador liberou',true],['Registro de acessos e alterações',true],['Exportação e anonimização a pedido do titular',true],['Aviso de privacidade impresso nos documentos',true],['Login com senha individual e acesso por função',true],['Banco de dados só entrega a cada usuário o que ele pode ver',true],['Senhas guardadas pelo Supabase com criptografia',true],['Saída automática por inatividade',true],['Site com HTTPS (GitHub Pages)',true],['Banco na região São Paulo e backup diário (Supabase)',false],['Política de privacidade publicada e encarregado nomeado',false]].map(([t,ok])=>`<div style="display:flex;gap:10px;align-items:center">${ok?'<span class="chip c-ok">Pronto</span>':'<span class="chip c-warn">Conferir</span>'}<span>${t}</span></div>`).join('')}
  </div></section></div>
  <section class="panel"><div class="panel-h"><h3>Registro de atividades</h3><span class="spacer" style="flex:1"></span><span class="lock">${S.logs.length} registro(s)</span></div><div class="tbl-wrap"><table><thead><tr><th>Data e hora</th><th>Usuário</th><th>Ação</th><th>Registro</th></tr></thead><tbody>
  ${S.logs.length?S.logs.slice(0,200).map(l=>`<tr><td style="white-space:nowrap">${new Date(l.data).toLocaleString('pt-BR')}</td><td>${esc(l.user)}</td><td>${esc(l.acao)}</td><td>${esc(l.alvo)}</td></tr>`).join(''):'<tr><td colspan="4" class="empty">Ainda não há atividades. Abra um cliente, imprima um orçamento ou troque de perfil para ver os registros aparecerem.</td></tr>'}
  </tbody></table></div></section>`;

/* ---------- Configurações ---------- */
V.config=()=>{const e=S.empresa;return `<div class="head"><div><h2>Configurações</h2><p>Dados que aparecem no cabeçalho e no rodapé dos documentos impressos.</p></div></div>
  <section class="panel"><div class="panel-h"><h3>Empresa</h3></div><div class="panel-b"><div class="form">
    <div class="f"><label for="kNome">Nome fantasia</label><input id="kNome" value="${esc(e.nome)}"></div>
    <div class="f"><label for="kCnpj">CNPJ</label><input id="kCnpj" value="${esc(e.cnpj)}"></div>
    <div class="f wide"><label for="kEnd">Endereço</label><input id="kEnd" value="${esc(e.endereco)}"></div>
    <div class="f"><label for="kTel">Telefone</label><input id="kTel" value="${esc(e.telefone)}"></div>
    <div class="f"><label for="kEmail">E-mail</label><input id="kEmail" value="${esc(e.email)}"></div>
    <div class="f"><label for="kGar">Garantia padrão (dias)</label><input id="kGar" type="number" value="${e.garantia}"></div>
    <div class="f"><label for="kVal">Validade padrão do orçamento (dias)</label><input id="kVal" type="number" value="${e.validade}"></div>
  </div></div></section>
  <section class="panel"><div class="panel-h"><h3>Logo da empresa</h3></div><div class="panel-b logo-cfg">
    <div class="logo-previa" id="logoPrevia">${logoEmpresa()?`<img src="${logoEmpresa()}" alt="Logo atual">`:'<span class="lock">Nenhum logo enviado</span>'}</div>
    <div class="logo-acoes">
      <p style="margin:0">Aparece na tela de login, no topo do sistema, no Painel e no cabeçalho de orçamentos, OS e relatórios impressos (A4 e A5).</p>
      <p class="lock" style="margin:0">Aceita AVIF, PNG, JPG, WebP ou SVG. Logo com fundo transparente fica melhor. A imagem é reduzida para no máximo 600 pixels.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><label class="btn pri" for="logoArq" tabindex="0">${logoEmpresa()?'Trocar logo':'Enviar logo'}</label><input type="file" id="logoArq" accept="image/avif,image/png,image/jpeg,image/webp,image/svg+xml,.avif" hidden>
      ${logoEmpresa()?'<button class="btn danger" type="button" id="logoRemover">Remover logo</button>':''}</div>
      <div class="aviso erro" id="logoErro" hidden role="alert"></div>
    </div></div></section>
  <section class="panel"><div class="panel-h"><h3>Privacidade (LGPD)</h3></div><div class="panel-b"><div class="form">
    <div class="f wide"><label for="kEnc">Encarregado de dados e contato</label><input id="kEnc" value="${esc(e.encarregado)}"><small>Sai no rodapé de todo orçamento e OS. Em empresas pequenas, pode ser o próprio dono.</small></div>
    <div class="f wide"><label for="kRet">Prazo de guarda dos dados</label><textarea id="kRet">${esc(e.retencao)}</textarea></div>
  </div></div></section>
  <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" id="kSave">Salvar configurações</button><span class="spacer" style="flex:1"></span><button class="btn" id="kSeed">Carregar dados de teste</button><button class="btn danger" id="kClear">Apagar tudo e começar do zero</button></div>`};
bind.config=()=>{
  const arq=$('#logoArq'),err=$('#logoErro');
  $('label[for="logoArq"]').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();arq.click()}};
  arq.onchange=async()=>{
    const f=arq.files[0];arq.value='';if(!f)return;err.hidden=true;
    try{
      if(f.size>15*1024*1024)throw new Error('A imagem passa de 15 MB. Use uma versão menor.');
      const url=await prepararLogo(f);
      S.empresa.logo=url;log('Alterou o logo da empresa',f.name);save();render();toast('Logo atualizado');
    }catch(e){err.textContent=e.message;err.hidden=false}
  };
  const rm=$('#logoRemover');if(rm)rm.onclick=()=>confirmar('Remover o logo da empresa? Os impressos voltam a sair só com o nome da empresa.',()=>{S.empresa.logo='';log('Removeu o logo da empresa','—');save();render();toast('Logo removido')},'Remover logo');
  $('#kSave').onclick=()=>{Object.assign(S.empresa,{nome:$('#kNome').value,cnpj:$('#kCnpj').value,endereco:$('#kEnd').value,telefone:$('#kTel').value,email:$('#kEmail').value,garantia:+$('#kGar').value||0,validade:+$('#kVal').value||0,encarregado:$('#kEnc').value,retencao:$('#kRet').value});log('Alterou configurações','Empresa');save();render();toast('Configurações salvas')};
  $('#kSeed').onclick=()=>confirmar('Substituir clientes, veículos, estoque, caixa e documentos do banco por <b>um ano de dados de teste</b>? Os usuários e as senhas continuam iguais.',async()=>{
    const bt=$('#kSeed');bt.disabled=true;bt.textContent='Carregando dados de teste…';toast('Enviando os dados de teste para o banco…');
    const u=S.users,l=S.logs,emp=S.empresa;
    S=seed();S.users=u;S.logs=l;
    // mantém os dados da empresa se já foram preenchidos; o logo nunca é trocado
    if(emp.cnpj)S.empresa=emp;else S.empresa.logo=emp.logo||'';
    log('Carregou dados de teste','—');
    try{await salvarAgora();await sb.rpc('ajustar_numeracao');toast('Dados de teste carregados')}catch(e){toast('Erro ao carregar: '+e.message)}
    render();
  },'Carregar dados de teste');
  $('#kClear').onclick=()=>confirmar('Apagar do banco <b>todos</b> os clientes, veículos, estoque, caixa e documentos? Os dados da empresa, os usuários e a auditoria são mantidos.',async()=>{
    const e=S.empresa,u=S.users,l=S.logs;S=VAZIO();S.empresa=e;S.users=u;S.logs=l;S.exemplo=false;
    log('Apagou todos os dados de clientes, estoque, caixa e documentos','—');
    try{await salvarAgora();await sb.rpc('ajustar_numeracao');toast('Tudo apagado')}catch(err){toast('Erro ao apagar: '+err.message)}
    render();
  },'Apagar tudo');
};
// O sistema começa pela tela de login (js/acesso.js)
