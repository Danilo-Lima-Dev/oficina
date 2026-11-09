/* Dados: perfis, dados de exemplo e gravação no navegador */
/* ===================== Dados ===================== */
const KEY='tapecaria_prototipo_v1';
/* ===================== Acessos e permissões ===================== */
// Cada função do sistema que pode ser liberada ou bloqueada por usuário.
const PERMISSOES=[
  {grupo:'Geral',itens:[
    ['painel','Ver o painel inicial','Resumo do dia, carros na oficina e alertas'],
    ['precos','Ver valores e totais','Preços, totais de orçamento e de OS'],
    ['imprimir','Imprimir documentos','Orçamentos e ordens de serviço em A4']]},
  {grupo:'Orçamentos',itens:[
    ['orc.ver','Ver orçamentos',''],
    ['orc.editar','Criar e editar orçamentos',''],
    ['orc.aprovar','Aprovar e transformar em OS',''],
    ['orc.excluir','Excluir orçamentos','']]},
  {grupo:'Ordens de serviço',itens:[
    ['os.ver','Ver ordens de serviço',''],
    ['os.editar','Criar e editar ordens de serviço','Inclui mudar a situação e registrar o estado do carro'],
    ['os.excluir','Excluir ordens de serviço','']]},
  {grupo:'Caixa',itens:[
    ['caixa.ver','Ver o caixa completo','Visão geral, entradas, saídas, saldo e resumo por período'],
    ['caixa.lancar','Lançar entradas e saídas',''],
    ['caixa.receber','Receber pagamento de OS','Registrar sinal ou pagamento na própria OS'],
    ['caixa.excluir','Excluir lançamentos do caixa','']]},
  {grupo:'Clientes e veículos',itens:[
    ['cli.ver','Ver clientes e dados pessoais','Nome, CPF, telefone e endereço'],
    ['cli.editar','Cadastrar e editar clientes',''],
    ['cli.lgpd','Exportar e anonimizar dados (LGPD)','Atender pedidos do titular dos dados'],
    ['vei.ver','Ver veículos',''],
    ['vei.editar','Cadastrar e editar veículos',''],
    ['vei.excluir','Excluir veículos','Os documentos antigos continuam mostrando o veículo']]},
  {grupo:'Estoque',itens:[
    ['est.ver','Ver estoque',''],
    ['est.movimentar','Registrar entradas e saídas de material',''],
    ['est.editar','Cadastrar e editar materiais e categorias',''],
    ['est.excluir','Excluir materiais e categorias','Para itens que não são mais vendidos ou usados'],
    ['est.custo','Ver custo dos materiais',''],
    ['est.exportar','Exportar planilha e lista de reposição','']]},
  {grupo:'Administração',itens:[
    ['auditoria','Ver auditoria (LGPD)','Registro de quem acessou e alterou o quê'],
    ['config','Alterar dados da empresa','Cabeçalho dos documentos, garantia, validade'],
    ['acessos','Gerenciar usuários e acessos','Criar, editar, excluir usuários e trocar senhas']]}
];
const TODAS_PERMS=PERMISSOES.flatMap(g=>g.itens.map(i=>i[0]));
const perms=(...l)=>Object.fromEntries(TODAS_PERMS.map(p=>[p,l.includes(p)]));
// Modelos prontos para aplicar na tela de acessos
const MODELOS={
  vendedor:{nome:'Vendedor',perms:perms('painel','precos','imprimir','orc.ver','orc.editar','orc.aprovar','os.ver','os.editar','cli.ver','cli.editar','vei.ver','vei.editar','est.ver')},
  estoque:{nome:'Estoque',perms:perms('painel','os.ver','est.ver','est.movimentar','est.editar','est.custo','est.exportar')},
  financeiro:{nome:'Financeiro',perms:perms('painel','precos','imprimir','orc.ver','os.ver','caixa.ver','caixa.lancar','caixa.receber','cli.ver','vei.ver','est.ver','est.custo')},
  tudo:{nome:'Tudo liberado',perms:perms(...TODAS_PERMS)},
  nada:{nome:'Nada liberado',perms:perms()}
};
// Aba do menu → permissão necessária
const TAB_PERM={painel:'painel',orcamentos:'orc.ver',os:'os.ver',caixa:'caixa.ver',clientes:'cli.ver',veiculos:'vei.ver',estoque:'est.ver',auditoria:'auditoria',acessos:'acessos',config:'config'};
const TABS={painel:'Painel',orcamentos:'Orçamentos',os:'Ordens de serviço',caixa:'Caixa',clientes:'Clientes',veiculos:'Veículos',estoque:'Estoque',auditoria:'Auditoria LGPD',acessos:'Acessos',config:'Configurações'};
const SENHA_ITER=120000;
// Usuários iniciais. Senhas: admin123 e vend123 (o sistema obriga a trocar no primeiro acesso)
function seedUsers(){return [
  {id:'u1',nome:'Administrador',login:'admin',email:'',admin:true,ativo:true,perms:perms(...TODAS_PERMS),
   senha:{salt:'a73b1496cc1c2feb1af05f5dc7e0733e',hash:'2d12252f1256045045ef15aa41042067a0b5366cf9baa9a658726f81d84bc487',iter:SENHA_ITER},trocarSenha:true,senhaPadrao:true,criado:iso(new Date()),ultimoAcesso:''},
  {id:'u2',nome:'Vendedor 1',login:'vendedor1',email:'',admin:false,ativo:true,perms:{...MODELOS.vendedor.perms},
   senha:{salt:'1f8c2fd22853f04ce5d1f607b714c75c',hash:'5269ee3829a2a93c1b60f69afda59668d97020c8b0bdb147b24e3602d9674320',iter:SENHA_ITER},trocarSenha:true,senhaPadrao:true,criado:iso(new Date()),ultimoAcesso:''},
  ...(typeof USUARIOS_TESTE!=='undefined'?USUARIOS_TESTE.map((t,i)=>({id:'t'+(i+1),nome:t.nome,login:t.login,email:'',admin:false,ativo:true,perms:{...MODELOS[t.modelo].perms},
   senha:{...t.senha,iter:SENHA_ITER},trocarSenha:true,senhaPadrao:true,criado:iso(new Date()),ultimoAcesso:''})):[])
]}
const OS_STATUS=['Aguardando','Em andamento','Pronto','Entregue','Cancelada'];
const ORC_STATUS=['Aberto','Aprovado','Recusado','Vencido'];
const UNIDADES=['m','m²','un','kg','L','rolo','par','h'];
// Caixa
const FORMAS=['Dinheiro','PIX','Cartão de débito','Cartão de crédito','Boleto','Transferência'];
const CAT_ENTRADA=['Serviço (OS)','Sinal de OS','Venda de material','Outras entradas'];
const CAT_SAIDA=['Compra de material','Aluguel','Energia e água','Internet e telefone','Salários','Combustível e frete','Impostos e taxas','Manutenção e ferramentas','Retirada do dono','Outras saídas'];

function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function pd(s){const [y,m,d]=String(s).slice(0,10).split('-').map(Number);return new Date(y,m-1,d)}
function agora(){const d=new Date();return iso(d)+'T'+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}
function addDays(n){const d=new Date();d.setDate(d.getDate()+n);return iso(d)}
function uid(){return Math.random().toString(36).slice(2,10)}

// Dados de exemplo para testes: gerados por js/teste.js
function seed(){return gerarDadosTeste()}
function seedCaixa(){
  const L=(dias,hora,tipo,valor,descricao,categoria,forma,osId,user)=>({id:uid(),data:addDays(dias)+'T'+hora,tipo,valor,descricao,categoria,forma,osId:osId||'',user:user||'Administrador'});
  return [
    L(-12,'08:00','entrada',3500,'Saldo inicial do caixa','Outras entradas','Dinheiro','','Administrador'),
    L(-10,'09:30','saida',1140,'Couro ecológico preto – 30 m (NF 4471)','Compra de material','Boleto','','Administrador'),
    L(-8,'10:00','saida',1200,'Aluguel do galpão','Aluguel','PIX','','Administrador'),
    L(-6,'16:20','entrada',200,'Sinal OS-'+ano0()+'-0002','Sinal de OS','PIX','s2','Vendedor 1'),
    L(-5,'11:15','entrada',60,'Venda de retalho de courvin','Venda de material','Dinheiro','','Vendedor 1'),
    L(-4,'08:40','saida',236.5,'Conta de energia','Energia e água','PIX','','Administrador'),
    L(-3,'15:40','saida',95,'Cola de contato 2,8 kg','Compra de material','Dinheiro','','Administrador'),
    L(-2,'09:05','entrada',150,'Sinal OS-'+ano0()+'-0001','Sinal de OS','Dinheiro','s1','Vendedor 1'),
    L(0,'08:15','saida',45,'Frete de material','Combustível e frete','Dinheiro','','Administrador')
  ];
}
function ano0(){return new Date().getFullYear()}
// Ajustes nos dados lidos do banco (permissões novas aparecem desligadas)
function migrar(S){
  if(!Array.isArray(S.categorias))S.categorias=[];
  (S.users||[]).forEach(u=>{u.perms=u.perms||{};TODAS_PERMS.forEach(p=>{if(!(p in u.perms))u.perms[p]=!!u.admin})});
}
/* Antes do login o sistema não tem nenhum dado: tudo vem do banco (js/nuvem.js) depois de entrar,
   e só o que o usuário tem permissão para ver. */
const VAZIO=()=>({empresa:{nome:'Tapeçaria',logo:''},users:[],clientes:[],veiculos:[],produtos:[],categorias:[],movs:[],orcamentos:[],os:[],caixa:[],logs:[],seq:{os:1,orc:1},exemplo:false});
let S=VAZIO();
