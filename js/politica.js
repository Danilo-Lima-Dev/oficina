/* Página pública de política de privacidade: lê nome, logo e contatos da empresa (tabela "publico") */
(function(){
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const falta=t=>`<span class="falta">${t}</span>`;
  function base(){
    try{const u=new URL(String(SUPABASE_URL).trim());return u.origin}catch(e){return ''}
  }
  async function dadosEmpresa(){
    const url=base(),key=typeof SUPABASE_ANON_KEY==='string'?SUPABASE_ANON_KEY.trim():'';
    if(!url||!key)return {};
    const pedir=campos=>fetch(`${url}/rest/v1/publico?id=eq.1&select=${campos}`,{headers:{apikey:key,Authorization:'Bearer '+key}}).then(r=>r.ok?r.json():Promise.reject(r.status));
    try{return (await pedir('nome,logo,politica'))[0]||{}}
    catch(e){try{return (await pedir('nome,logo'))[0]||{}}catch(e2){return {}}}
  }
  function desenhar(d){
    const p=d.politica||{},nome=esc(d.nome||'a oficina');
    const logo=/^data:image\//.test(d.logo||'')?`<img src="${esc(d.logo)}" alt="">`:'';
    const ident=[p.cnpj&&'CNPJ '+esc(p.cnpj),p.endereco&&esc(p.endereco),p.telefone&&'Telefone '+esc(p.telefone),p.email&&'E-mail '+esc(p.email)].filter(Boolean).join(' · ');
    document.title='Política de privacidade – '+(d.nome||'Tapeçaria');
    document.getElementById('pol').innerHTML=`
    <header>${logo}<div><h1>Política de privacidade</h1><p class="meta">${nome}</p></div></header>
    <p>Esta página explica como a <b>${nome}</b> trata os dados pessoais de clientes, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018, LGPD).</p>

    <h2>Quem cuida dos seus dados</h2>
    <p>A controladora dos dados é a <b>${nome}</b>${ident?'. '+ident:''}.</p>
    <div class="caixa"><b>Encarregado de dados (DPO):</b> ${p.encarregado?esc(p.encarregado):falta('a empresa ainda vai informar o contato do encarregado')}</div>

    <h2>Quais dados coletamos</h2>
    <ul>
      <li><b>Cadastro:</b> nome, CPF ou CNPJ, telefone, e-mail e endereço. Só o nome é obrigatório; os demais servem para emitir documentos e falar com você.</li>
      <li><b>Veículo:</b> placa, marca, modelo, ano e cor.</li>
      <li><b>Serviço:</b> orçamentos, ordens de serviço, materiais usados, valores, pagamentos e garantia.</li>
      <li><b>Comunicação de promoções:</b> somente se você autorizar. A autorização fica registrada com data e pode ser retirada a qualquer momento.</li>
    </ul>

    <h2>Para que usamos</h2>
    <ul>
      <li>Fazer orçamentos, executar o serviço, entregar o veículo e cumprir a garantia (execução de contrato, LGPD art. 7º, V).</li>
      <li>Cumprir obrigações legais, fiscais e contábeis (art. 7º, II).</li>
      <li>Defender direitos em eventual reclamação ou processo (art. 7º, VI).</li>
      <li>Enviar promoções, apenas com o seu consentimento (art. 7º, I).</li>
    </ul>
    <p>Não vendemos nem alugamos seus dados.</p>

    <h2>Com quem compartilhamos</h2>
    <p>Os dados ficam em serviços de tecnologia contratados para funcionar o sistema: o banco de dados (Supabase) e a hospedagem do site (GitHub Pages). Eles só guardam e transmitem as informações. Também podemos informar dados a autoridades quando a lei exigir.</p>

    <h2>Como protegemos</h2>
    <ul>
      <li>Acesso só para funcionários com senha individual, e cada um vê apenas o que a sua função precisa.</li>
      <li>Conexão protegida (HTTPS) e banco de dados com regras de acesso por usuário.</li>
      <li>Registro de quem acessou ou alterou cada informação.</li>
      <li>Cópias de segurança trancadas com senha.</li>
    </ul>

    <h2>Por quanto tempo guardamos</h2>
    <p>${p.retencao?esc(p.retencao).replace(/\n/g,'<br>'):'Pelo tempo necessário para prestar o serviço, cumprir a garantia e as obrigações legais e fiscais. Depois disso, os dados são apagados ou anonimizados.'}</p>

    <h2>Seus direitos</h2>
    <p>Você pode pedir, a qualquer momento: confirmação de que tratamos seus dados, acesso a eles, correção, anonimização ou eliminação de dados desnecessários, cópia dos seus dados, informação sobre com quem compartilhamos, e retirada do consentimento para promoções (LGPD art. 18).</p>
    <p>Para isso, fale com o encarregado ${p.encarregado?'(<b>'+esc(p.encarregado)+'</b>)':''}${p.email?' ou escreva para <b>'+esc(p.email)+'</b>':''}. Se não ficar satisfeito, você pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD), em gov.br/anpd.</p>

    <p class="meta" style="margin-top:32px">Esta política pode ser atualizada. A versão em vigor é sempre a desta página.</p>`;
  }
  dadosEmpresa().then(desenhar);
})();
