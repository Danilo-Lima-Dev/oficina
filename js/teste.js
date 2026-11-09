/* =====================================================================
   DADOS DE TESTE – um ano inteiro de uma tapeçaria fictícia em Teresina.
   Todos os nomes, CPFs, CNPJs, telefones e placas são inventados.
   Os CPFs/CNPJs passam na validação, mas não pertencem a ninguém.

   Para usar o sistema de verdade: em Configurações, clique em
   "Apagar tudo e começar do zero" e, se quiser, apague este arquivo
   e a linha <script src="js/teste.js"> do index.html.
   ===================================================================== */

// Usuários extras para testar permissões (senha inicial entre parênteses)
const USUARIOS_TESTE=[
  {login:'estoque1',nome:'Carla – Estoque',senhaInicial:'estoq123',modelo:'estoque',
   senha:{salt:'7d789a1b933ddd27f77e3f9a3c4f700c',hash:'23e9c611e5f31e5d09d754e1e77685e32c168b555fdbe8352b84ff94db8641fe'}},
  {login:'financeiro1',nome:'Rita – Financeiro',senhaInicial:'finan123',modelo:'financeiro',
   senha:{salt:'05a46b0196d32657f3a516c0b13053cc',hash:'934dde6563d8425f4aa7e1b832b4b886892e29326fa7e1ca9e8b1ba1453582b0'}}
];

function gerarDadosTeste(){
  // Sorteio com semente fixa: os dados saem iguais toda vez que forem gerados
  let st=20261109;
  const r=()=>{st=st+0x6D2B79F5|0;let t=Math.imul(st^st>>>15,1|st);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
  const int=(a,b)=>a+Math.floor(r()*(b-a+1));
  const pick=a=>a[Math.floor(r()*a.length)];
  const chance=p=>r()<p;
  const arred=(v,m=10)=>Math.round(v/m)*m;
  const hoje=new Date();hoje.setHours(0,0,0,0);
  const dataDe=n=>{const d=new Date(hoje);d.setDate(d.getDate()+n);return d};
  const hora=()=>String(int(8,17)).padStart(2,'0')+':'+String(int(0,59)).padStart(2,'0');
  const ateHoje=d=>d<=hoje;
  const pad4=n=>String(n).padStart(4,'0');

  /* ---------- documentos válidos ---------- */
  const fmtCPF=d=>`${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
  const fmtCNPJ=d=>`${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
  function novoCPF(){let n='';for(let i=0;i<9;i++)n+=int(0,9);if(/^(\d)\1+$/.test(n))n='1'+n.slice(1);for(let t=9;t<11;t++){let s=0;for(let i=0;i<t;i++)s+=+n[i]*(t+1-i);n+=((s*10)%11)%10}return fmtCPF(n)}
  function novoCNPJ(){let n='';for(let i=0;i<8;i++)n+=int(0,9);n+='0001';for(const p of [[5,4,3,2,9,8,7,6,5,4,3,2],[6,5,4,3,2,9,8,7,6,5,4,3,2]]){const s=p.reduce((a,x,i)=>a+ +n[i]*x,0)%11;n+=s<2?0:11-s}return fmtCNPJ(n)}

  /* ---------- estoque ---------- */
  const categorias=['Revestimento','Espuma','Aviamento','Insumo','Carpete','Acessórios'];
  const P=[ // chave, nome, categoria, unidade, saldo, mínimo, custo, preço
    ['ecoPreto','Couro ecológico preto','Revestimento','m',42,15,38,75],
    ['ecoCinza','Couro ecológico cinza','Revestimento','m',18,10,38,75],
    ['ecoMarrom','Couro ecológico marrom','Revestimento','m',6,8,40,78],
    ['natPreto','Couro natural preto','Revestimento','m',14,8,140,255],
    ['natBege','Couro natural bege','Revestimento','m',6,8,145,260],
    ['natCaramelo','Couro natural caramelo','Revestimento','m',9,5,150,270],
    ['courvinPreto','Courvin preto','Revestimento','m',35,10,20,42],
    ['courvinGrafite','Courvin cinza grafite','Revestimento','m',25,10,22,45],
    ['jacquard','Tecido automotivo jacquard','Revestimento','m',12,6,35,68],
    ['suede','Suede automotivo preto','Revestimento','m',4,5,48,90],
    ['forroCinza','Tecido de forro de teto cinza','Revestimento','m',12,6,26,52],
    ['forroBege','Tecido de forro de teto bege','Revestimento','m',5,6,26,52],
    ['d23','Espuma D23 – 2 cm','Espuma','m²',10,4,18,38],
    ['d28','Espuma D28 – 3 cm','Espuma','m²',14,6,23,46],
    ['d33','Espuma D33 – 2 cm','Espuma','m²',18,6,28,55],
    ['manta','Manta acrílica 10 mm','Espuma','m',30,10,9,20],
    ['linha40','Linha nylon 40 preta','Aviamento','rolo',3,4,18,30],
    ['linha60','Linha nylon 60 bege','Aviamento','rolo',6,3,16,28],
    ['elastico','Elástico chato 30 mm','Aviamento','m',80,20,2.5,6],
    ['velcro','Velcro 25 mm','Aviamento','m',25,10,6,14],
    ['percinta','Percinta elástica','Aviamento','m',40,15,4,9],
    ['colaContato','Cola de contato 2,8 kg','Insumo','un',0,2,95,0],
    ['colaSpray','Cola spray para forro','Insumo','un',7,4,32,0],
    ['grampos','Grampos 80/8 (caixa)','Insumo','un',9,3,14,0],
    ['carpete','Carpete automotivo preto','Carpete','m²',16,8,32,65]
  ];
  const produtos=P.map((p,i)=>({id:'p'+(i+1),chave:p[0],nome:p[1],categoria:p[2],un:p[3],qtd:p[4],min:p[5],custo:p[6],preco:p[7]}));
  const prodK=k=>produtos.find(p=>p.chave===k);

  /* ---------- clientes ---------- */
  const ruas=['Rua Coelho Rodrigues','Av. Frei Serafim','Av. Nossa Senhora de Fátima','Rua Areolino de Abreu','Av. Dom Severino','Rua Barroso','Av. João XXIII','Rua Senador Teodoro Pacheco','Av. Kennedy','Rua Elizeu Martins','Rua Paissandu','Av. Miguel Rosa'];
  const bairros=['Centro','Fátima','Jóquei','São Cristóvão','Ininga','Dirceu Arcoverde','Mocambinho','Morada do Sol','Horto','Piçarra','Cabral','Ilhotas','Uruguai','Santa Isabel','Planalto'];
  const pessoas=['João Pereira da Silva','Maria Clara Sousa','Antônio Carlos Rodrigues','Francisca das Chagas Lima','José Ribamar Oliveira','Ana Beatriz Carvalho','Raimundo Nonato Alves','Luciana Barros Melo','Pedro Henrique Costa','Fernanda Araújo Santos','Carlos Eduardo Nunes','Juliana Moura Ribeiro','Marcos Vinícius Teixeira','Patrícia Gomes de Sá','Rafael Martins Leal','Camila Fontenele Brito','Thiago Rocha Portela','Aline Castelo Branco','Gustavo Mendes Vale','Larissa Freitas Ibiapina','Edvaldo Soares Neto'];
  const empresas=[['Auto Locadora Piauí Ltda','frota@locadorapi.com.br'],['Transportes Rio Poti Ltda','manutencao@riopoti.com.br'],['Autoescola Avenida Ltda','contato@autoescolaavenida.com.br'],['Cooperativa de Táxi de Teresina','frota@coopertaxi.com.br'],['Clínica Vida e Saúde Ltda','adm@clinicavidaesaude.com.br']];
  const emailDe=n=>{const p=n.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().split(' ').filter(x=>x.length>2);return p[0]+'.'+p[p.length-1]+int(1,99)+'@'+pick(['gmail.com','hotmail.com','outlook.com','yahoo.com.br'])};
  const fone=()=>`(86) 9${int(8100,9999)}-${int(1000,9999)}`;
  const clientes=[];
  pessoas.forEach((nome,i)=>{
    const criado=dataDe(-int(5,360));
    clientes.push({id:'c'+(i+1),nome,cpf:i===0?'123.456.789-09':i===1?'987.654.321-00':novoCPF(),telefone:fone(),email:chance(.7)?emailDe(nome):'',
      endereco:chance(.8)?`${pick(ruas)}, ${int(10,2500)} – ${pick(bairros)}`:'',promo:false,promoData:'',criado:iso(criado),anonimizado:false});
    const c=clientes[clientes.length-1];if(chance(.4)){c.promo=true;c.promoData=c.criado}
  });
  empresas.forEach(([nome,email],i)=>{
    clientes.push({id:'e'+(i+1),nome,cpf:i===0?'11.222.333/0001-81':novoCNPJ(),telefone:`(86) 3${int(200,299)}-${int(1000,9999)}`,email,
      endereco:`${pick(ruas)}, ${int(100,3000)} – ${pick(bairros)}`,promo:false,promoData:'',criado:iso(dataDe(-int(30,360))),anonimizado:false,empresa:true});
  });

  /* ---------- veículos ---------- */
  const carros=[['Volkswagen','Gol 1.0'],['Fiat','Strada Freedom'],['Chevrolet','Onix LT'],['Fiat','Argo Drive'],['Hyundai','HB20 Sense'],['Toyota','Corolla XEi'],['Toyota','Hilux SRV'],['Volkswagen','Polo Highline'],['Renault','Kwid Zen'],['Fiat','Mobi Like'],['Jeep','Renegade Sport'],['Honda','Civic EXL'],['Chevrolet','S10 LTZ'],['Ford','Ranger XLS'],['Volkswagen','T-Cross'],['Nissan','Kicks SV'],['Fiat','Toro Volcano'],['Chevrolet','Spin LTZ']];
  const motos=[['Honda','CG 160 Fan'],['Honda','Biz 125'],['Yamaha','Fazer 250'],['Honda','Pop 110i']];
  const vans=[['Mercedes-Benz','Sprinter 416'],['Renault','Master Furgão'],['Fiat','Ducato Minibus']];
  const cores=['Prata','Branco','Preto','Cinza','Vermelho','Azul','Branco','Prata'];
  const usadas=new Set();
  const placa=()=>{let p;do{p=pick(['P','Q','R','O','N'])+String.fromCharCode(65+int(0,25))+String.fromCharCode(65+int(0,25))+int(0,9)+String.fromCharCode(65+int(0,25))+int(0,9)+int(0,9)}while(usadas.has(p));usadas.add(p);return p};
  const veiculos=[];
  const addVei=(cli,tipo)=>{const [marca,modelo]=pick(tipo==='moto'?motos:tipo==='van'?vans:carros);const ano=String(int(2012,2025));
    const v={id:'v'+(veiculos.length+1),clienteId:cli.id,placa:placa(),marca,modelo,ano,cor:pick(cores),tipo};veiculos.push(v);return v};
  clientes.forEach(c=>{
    if(c.empresa){const n=int(2,4);for(let i=0;i<n;i++)addVei(c,c.nome.includes('Transportes')||c.nome.includes('Clínica')?(i===0?'van':'carro'):'carro')}
    else{addVei(c,chance(.15)?'moto':'carro');if(chance(.2))addVei(c,chance(.5)?'moto':'carro')}
  });
  veiculos[0].placa='PIA1B23';veiculos[0].marca='Volkswagen';veiculos[0].modelo='Gol G6';veiculos[0].tipo='carro';
  // um veículo vendido pelo cliente e excluído do cadastro (continua nos documentos antigos)
  const vExcl=veiculos[veiculos.length-3];

  /* ---------- serviços típicos de tapeçaria ---------- */
  const SERV=[ // descrição, mão de obra [mín,máx], materiais [chave,qtdMín,qtdMáx], tipos de veículo, peso
    ['Reforma completa dos bancos (dianteiros e traseiro)',[900,1300],[['ecoPreto',8,10],['manta',5,6],['d33',1.5,2.5],['linha40',1,1]],['carro'],5],
    ['Revestimento dos bancos em couro natural',[1400,1800],[['natPreto',9,11],['manta',5,6],['linha40',1,1]],['carro'],2],
    ['Revestimento dos bancos em couro bege',[1400,1800],[['natBege',9,10],['manta',5,6],['linha60',1,1]],['carro'],1],
    ['Troca do forro de teto',[320,420],[['forroCinza',3,4]],['carro'],5],
    ['Troca do forro de teto (bege)',[320,420],[['forroBege',3,4]],['carro'],2],
    ['Reparo de rasgo no banco do motorista',[180,260],[['courvinPreto',1,2],['d28',0.5,1]],['carro'],6],
    ['Revestimento do volante em couro',[150,220],[['natPreto',0.5,1],['linha40',0.2,0.3]],['carro'],4],
    ['Revestimento dos painéis de porta (4 portas)',[380,520],[['ecoPreto',2,3]],['carro'],3],
    ['Troca do carpete',[350,480],[['carpete',4,5]],['carro'],3],
    ['Capas de banco sob medida',[450,650],[['courvinGrafite',6,8],['elastico',4,6]],['carro'],4],
    ['Bancos em tecido jacquard',[700,950],[['jacquard',7,9],['manta',4,5]],['carro'],1],
    ['Reforma do banco da moto',[90,140],[['courvinPreto',0.5,1],['d33',0.3,0.5]],['moto'],6],
    ['Revestimento da manopla do câmbio e freio de mão',[120,170],[['natPreto',0.3,0.5]],['carro'],2],
    ['Reforma completa dos bancos da van',[1800,2600],[['ecoPreto',18,22],['d28',4,6],['manta',10,12]],['van'],3],
    ['Costura de reforço nos bancos',[120,180],[['linha40',0.5,1]],['carro','van'],2]
  ];
  const meio=v=>Math.round(v*2)/2;
  function itensServico(v){
    const ok=SERV.filter(s=>s[3].includes(v.tipo));const pesos=ok.flatMap(s=>Array(s[4]).fill(s));
    const escolhidos=[pick(pesos)];if(v.tipo==='carro'&&chance(.25)){const o=pick(pesos);if(o!==escolhidos[0])escolhidos.push(o)}
    const itens=[];
    escolhidos.forEach(s=>{
      s[2].forEach(([k,a,b])=>{const p=prodK(k);if(!p.preco)return;const q=Math.max(.5,meio(a+r()*(b-a)));const ja=itens.find(i=>i.produtoId===p.id);if(ja)ja.qtd+=q;else itens.push({produtoId:p.id,desc:p.nome,qtd:q,un:p.un,preco:p.preco})});
      itens.push({produtoId:'',desc:'Mão de obra – '+s[0].charAt(0).toLowerCase()+s[0].slice(1),qtd:1,un:'un',preco:arred(int(s[1][0],s[1][1]))});
    });
    return itens;
  }
  const total=d=>Math.max(0,d.itens.reduce((a,i)=>a+i.qtd*i.preco,0)-(d.desconto||0));
  const estados=['Sem avarias aparentes.','Banco do motorista com rasgo na lateral.','Risco leve na porta traseira direita (já existente).','Cliente deixou cadeirinha infantil no porta-malas.','Painel com trinca perto do rádio (já existente).','Km 85.420. Nenhum objeto no veículo.','Tapete do motorista não veio com o carro.','Forro do teto descolando na parte traseira.','Banco traseiro com mancha de tinta.'];
  const obsOrc=['Cliente prefere costura dupla aparente.','Cor da linha a combinar com o cliente.','Prazo de entrega combinado em até 5 dias úteis.','Valores válidos para pagamento à vista ou no PIX.','',''];

  /* ---------- ordens de serviço e orçamentos ao longo de 12 meses ---------- */
  const pesosCli=clientes.flatMap(c=>Array(c.empresa?4:c.id==='c1'?3:1).fill(c));
  const veiDe=c=>veiculos.filter(v=>v.clienteId===c.id);
  const osLista=[],orcLista=[],caixa=[],movs=[];
  const formasPF=['PIX','PIX','PIX','PIX','Cartão de crédito','Cartão de crédito','Cartão de débito','Dinheiro','Dinheiro'];
  for(let i=0;i<130;i++){
    const idade=i<6?int(0,2):i<14?int(3,7):i<24?int(8,20):int(21,360);
    const ent=dataDe(-idade);
    const c=pick(pesosCli);let vs=veiDe(c).filter(v=>v!==vExcl||idade>60);if(!vs.length)vs=veiDe(c);const v=pick(vs);
    const o={id:'s'+(i+1),num:0,clienteId:c.id,veiculoId:v.id,origem:'',entrada:iso(ent),previsao:'',status:'',pagamento:'',garantia:90,desconto:0,estado:pick(estados),obs:'',baixado:false,itens:itensServico(v)};
    const prazo=int(2,6);o.previsao=iso(dataDe(-idade+prazo));
    o.status=idade>20?(chance(.05)?'Cancelada':'Entregue'):idade>=8?(chance(.7)?'Entregue':'Pronto'):idade>=3?(chance(.4)?'Pronto':'Em andamento'):(chance(.5)?'Aguardando':'Em andamento');
    if(chance(.15))o.desconto=arred(int(30,150),10);
    // 60% veio de um orçamento aprovado
    if(chance(.6)){const od={id:'o'+(orcLista.length+1),num:0,clienteId:c.id,veiculoId:v.id,data:iso(dataDe(-idade-int(1,6))),validade:15,status:'Aprovado',desconto:o.desconto,obs:pick(obsOrc),itens:JSON.parse(JSON.stringify(o.itens))};orcLista.push(od);o._orc=od}
    osLista.push(o);
  }
  // orçamentos que não viraram serviço
  for(let i=0;i<22;i++){
    const tipo=i<9?'Recusado':i<16?'Aberto antigo':'Aberto';
    const idade=tipo==='Aberto'?int(0,10):int(20,330);
    const c=pick(pesosCli),v=pick(veiDe(c));
    orcLista.push({id:'o'+(orcLista.length+1),num:0,clienteId:c.id,veiculoId:v.id,data:iso(dataDe(-idade)),validade:15,status:tipo==='Recusado'?'Recusado':'Aberto',desconto:chance(.2)?arred(int(30,100)):0,obs:pick(obsOrc),itens:itensServico(v)});
  }
  // numeração em ordem de data
  osLista.sort((a,b)=>a.entrada.localeCompare(b.entrada)).forEach((o,i)=>o.num=i+1);
  orcLista.sort((a,b)=>a.data.localeCompare(b.data)).forEach((o,i)=>o.num=i+1);
  const numOSt=o=>`OS-${o.entrada.slice(0,4)}-${pad4(o.num)}`,numOrct=o=>`ORC-${o.data.slice(0,4)}-${pad4(o.num)}`;
  osLista.forEach(o=>{if(o._orc){o.origem=numOrct(o._orc);delete o._orc}});

  // pagamentos e baixa de estoque
  const L=(data,tipo,valor,descricao,categoria,forma,osId,user)=>{if(ateHoje(new Date(data.slice(0,10)+'T00:00')))caixa.push({id:uid(),data,tipo,valor:+valor.toFixed(2),descricao,categoria,forma,osId:osId||'',user:user||'Administrador'})};
  osLista.forEach(o=>{
    const T=total(o),c=clientes.find(x=>x.id===o.clienteId);
    const forma=c.empresa?pick(['Boleto','Transferência','PIX']):pick(formasPF);
    o.pagamento=forma==='Cartão de crédito'?`Cartão de crédito em ${int(2,6)}x`:forma==='Boleto'?'Boleto 30 dias':forma;
    const dEnt=o.entrada+'T'+hora(),dFim=(o.previsao<=iso(hoje)?o.previsao:iso(hoje))+'T'+hora();
    const quem=pick(['Administrador','Vendedor 1']);
    if(o.status==='Cancelada')return;
    if(['Pronto','Entregue'].includes(o.status)){o.baixado=true;o.itens.filter(i=>i.produtoId).forEach(i=>movs.push({id:uid(),data:dFim,produtoId:i.produtoId,tipo:'Saída',qtd:i.qtd,obs:'Usado na '+numOSt(o),user:'Administrador'}))}
    const sinal=arred(T*pick([.3,.4,.5]),10);
    if(o.status==='Entregue'){
      const idade=(hoje-new Date(o.entrada+'T00:00'))/864e5;
      if(idade<75&&chance(.12)){L(dEnt,'entrada',sinal,'Sinal '+numOSt(o),'Sinal de OS',forma==='Boleto'?'PIX':forma,o.id,quem)}            // entregue com saldo em aberto
      else if(chance(.35)){L(dEnt,'entrada',sinal,'Sinal '+numOSt(o),'Sinal de OS',forma==='Boleto'?'PIX':forma,o.id,quem);L(dFim,'entrada',T-sinal,'Pagamento '+numOSt(o),'Serviço (OS)',forma,o.id,quem)}
      else L(dFim,'entrada',T,'Pagamento '+numOSt(o),'Serviço (OS)',forma,o.id,quem);
    }else if(o.status==='Pronto'){if(chance(.7))L(dEnt,'entrada',sinal,'Sinal '+numOSt(o),'Sinal de OS',forma==='Boleto'?'PIX':forma,o.id,quem)}
    else if(o.status==='Em andamento'){if(chance(.6))L(dEnt,'entrada',sinal,'Sinal '+numOSt(o),'Sinal de OS',forma==='Boleto'?'PIX':forma,o.id,quem)}
    else if(chance(.3))L(dEnt,'entrada',sinal,'Sinal '+numOSt(o),'Sinal de OS','PIX',o.id,quem);
  });

  /* ---------- despesas mensais, compras de material e vendas de balcão ---------- */
  const fornecedores=['Couros Nordeste','Distribuidora Teresina Tapeçaria','Espumas Piauí','Aviamentos Central'];
  for(let m=11;m>=0;m--){
    const ini=new Date(hoje.getFullYear(),hoje.getMonth()-m,1);
    const em=dd=>{const d=new Date(ini.getFullYear(),ini.getMonth(),dd);return iso(d)+'T'+hora()};
    const mesNome=ini.toLocaleDateString('pt-BR',{month:'long'});
    L(em(5),'saida',1800,'Aluguel do galpão – '+mesNome,'Aluguel','PIX');
    L(em(5),'saida',1650,'Salário – auxiliar de tapeceiro','Salários','Transferência');
    L(em(5),'saida',2100,'Salário – costureira','Salários','Transferência');
    L(em(10),'saida',int(240,390)+r(),'Conta de energia','Energia e água','PIX');
    L(em(12),'saida',int(55,95)+r(),'Conta de água','Energia e água','PIX');
    L(em(15),'saida',119.9,'Internet e telefone','Internet e telefone','Cartão de débito');
    L(em(10),'saida',380,'Honorários do contador','Outras saídas','PIX');
    L(em(20),'saida',int(310,460)+r(),'Simples Nacional (DAS)','Impostos e taxas','Boleto');
    for(let k=int(2,4);k>0;k--)L(em(int(1,27)),'saida',int(40,160),pick(['Gasolina da moto de entregas','Frete de material','Combustível – busca de veículo']),'Combustível e frete','Dinheiro');
    if(chance(.6))L(em(int(1,27)),'saida',int(80,320),pick(['Manutenção da máquina de costura','Lâminas e tesouras','Grampeador pneumático – reparo','Compressor – manutenção']),'Manutenção e ferramentas','PIX');
    L(em(28),'saida',arred(int(2200,3200),50),'Retirada do dono','Retirada do dono','PIX');
    // compras de material (entram no estoque e saem do caixa)
    for(let k=int(2,3);k>0;k--){
      const dia=em(int(1,26));const lista=[];let soma=0;
      for(let j=int(1,3);j>0;j--){const p=pick(produtos);const q=p.un==='un'||p.un==='rolo'?int(2,6):int(5,20);if(lista.some(x=>x.p===p))continue;lista.push({p,q});soma+=q*p.custo}
      const nf=int(1000,9999),forn=pick(fornecedores);
      lista.forEach(({p,q})=>movs.push({id:uid(),data:dia,produtoId:p.id,tipo:'Entrada',qtd:q,obs:`NF ${nf} – ${forn}`,user:'Administrador'}));
      L(dia,'saida',soma,`Compra de material – NF ${nf} (${forn})`,'Compra de material',pick(['Boleto','PIX','Boleto']));
    }
    for(let k=int(0,2);k>0;k--)L(em(int(1,27)),'entrada',int(30,180),pick(['Venda de retalho de couro','Venda de espuma no balcão','Venda de elástico e velcro','Conserto rápido de alça de bolsa']),'Venda de material',pick(['Dinheiro','PIX']),'',pick(['Administrador','Vendedor 1']));
  }
  // saldo inicial do caixa, ajustado para o caixa terminar positivo
  const inicio=dataDe(-366);
  let saldo=caixa.reduce((a,l)=>a+(l.tipo==='entrada'?1:-1)*l.valor,0);
  const inicial=Math.max(8000,arred(9000-saldo,100));
  caixa.push({id:uid(),data:iso(inicio)+'T08:00',tipo:'entrada',valor:inicial,descricao:'Saldo inicial do caixa',categoria:'Outras entradas',forma:'Dinheiro',osId:'',user:'Administrador'});
  caixa.sort((a,b)=>b.data.localeCompare(a.data));
  movs.sort((a,b)=>b.data.localeCompare(a.data));
  vExcl.excluido=true;vExcl.excluidoEm=iso(dataDe(-40))+'T10:00';
  veiculos.forEach(v=>delete v.tipo);clientes.forEach(c=>delete c.empresa);produtos.forEach(p=>delete p.chave);

  return {
    exemplo:true,
    empresa:{nome:'Tapeçaria Modelo',cnpj:'11.444.777/0001-61',endereco:'Rua Areolino de Abreu, 1520 – Centro – Teresina/PI',telefone:'(86) 99999-0000',email:'contato@tapecariamodelo.com.br',encarregado:'Administrador – privacidade@tapecariamodelo.com.br',garantia:90,validade:15,retencao:'Ordens de serviço e orçamentos: 5 anos (obrigações fiscais e de defesa do consumidor). Cadastro de cliente sem movimentação: revisar após 2 anos.'},
    users:seedUsers(),
    seq:{orc:orcLista.length+1,os:osLista.length+1},
    clientes,veiculos,produtos,categorias,movs,
    orcamentos:orcLista,os:osLista,caixa,logs:[]
  };
}
