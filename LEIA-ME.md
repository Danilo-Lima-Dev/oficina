# Sistema da Tapeçaria – versão online

Telas publicadas pelo **GitHub Pages** e dados guardados no **Supabase** (banco PostgreSQL com login e recuperação de senha).
Todos os computadores e celulares trabalham nos mesmos dados, em tempo real.

```
index.html            a página do sistema
css/estilo.css        visual, impressão A4/A5
js/config.js          ← endereço e chave pública do seu Supabase (você preenche)
js/nuvem.js           ligação com o banco: carrega, grava e atualiza em tempo real
js/acesso.js          login, senhas, recuperação por e-mail e tela Acessos
js/app.js             telas: orçamentos, OS, caixa, clientes, veículos, estoque, relatórios
js/dados.js           lista de funções/permissões e modelos de acesso
js/util.js            funções de apoio (busca, CPF/CNPJ, moeda, datas)
js/teste.js           gerador de dados de teste (pode remover quando for usar de verdade)
supabase/schema.sql   banco de dados: tabelas e regras de quem pode ver e mudar cada coisa
```

---

## Passo a passo para colocar no ar (cerca de 30 minutos, tudo grátis)

### 1. Criar o projeto no Supabase
1. Entre em **https://supabase.com** e crie uma conta (pode entrar com a conta do GitHub).
2. Clique em **New project**.
   - **Name:** tapecaria
   - **Database password:** crie uma senha forte e guarde (você quase não vai usar).
   - **Region:** escolha **South America (São Paulo)**. Os dados dos clientes ficam no Brasil.
3. Espere uns 2 minutos até o projeto ficar pronto.

### 2. Criar o banco de dados
1. No menu da esquerda, abra **SQL Editor** → **New query**.
2. Abra o arquivo `supabase/schema.sql`, copie **todo** o conteúdo, cole no editor e clique em **Run**.
3. Deve aparecer "Success". Se rodar de novo depois, não perde nada.

### 3. Ajustar o login no Supabase
Em **Authentication** (menu da esquerda):
1. **Sign In / Providers → Email:** desligue **Confirm email** e salve. Assim, os usuários que você cadastrar entram direto, sem e-mail de confirmação.
   Deixe **Allow new users to sign up** ligado: o sistema precisa disso para o administrador cadastrar a equipe. Quem se cadastrar por fora entra **bloqueado e sem nenhum acesso**.
2. **URL Configuration:** só faça depois do passo 5, quando já tiver o endereço do site.

### 4. Criar o repositório no GitHub
1. Entre em **https://github.com** e crie uma conta, se ainda não tiver.
2. Clique em **New repository** (botão verde ou o **+** no canto de cima).
   - **Repository name:** tapecaria
   - Marque **Public**. O GitHub Pages grátis só publica repositórios públicos. O código fica visível, mas **os dados não**: eles ficam no Supabase, protegidos pelas regras do banco.
3. Clique em **Create repository**.
4. Na página do repositório, clique em **uploading an existing file** (ou **Add file → Upload files**).
5. Abra a pasta extraída do zip, selecione **tudo o que está dentro dela** (`index.html`, `css`, `js`, `supabase`, `LEIA-ME.md`) e arraste para a página.
6. Clique em **Commit changes**.

### 5. Ligar o site ao Supabase e publicar
1. No Supabase, abra **Project Settings → API** (ou **Data API / API Keys**) e copie:
   - **Project URL** (algo como `https://abcdefgh.supabase.co`);
   - a chave **anon public** (ou **publishable**).
   ⚠️ **Nunca** use a chave `service_role` / `secret` no site.
2. No GitHub, abra `js/config.js`, clique no lápis (**Edit**), cole os dois valores no lugar de `COLE_AQUI...` e clique em **Commit changes**.
3. No GitHub, vá em **Settings → Pages**:
   - **Source:** Deploy from a branch
   - **Branch:** `main` e pasta `/ (root)` → **Save**.
4. Em 1 ou 2 minutos aparece o endereço do site, algo como `https://seu-usuario.github.io/tapecaria/`.
5. Volte no Supabase em **Authentication → URL Configuration**:
   - **Site URL:** cole o endereço do site.
   - **Redirect URLs:** adicione o mesmo endereço.
   Sem isso, o link de recuperação de senha não volta para o seu site.

### 6. Primeiro acesso (faça logo em seguida!)
1. Abra o endereço do site. Aparece **Criar administrador**.
2. Preencha seu nome, e-mail e senha. **O primeiro usuário vira administrador**, então faça isso logo depois de publicar, antes de divulgar o endereço.
3. Para testar com dados prontos: **Configurações → Carregar dados de teste**. Ele cria um ano de uma tapeçaria fictícia: 26 clientes, 40 veículos, 130 OS, 105 orçamentos, estoque e caixa.
4. Cadastre a equipe em **Acessos → + Novo usuário** (cada pessoa precisa de um e-mail). O sistema mostra uma senha temporária para você passar à pessoa, que cria a própria senha no primeiro acesso.

---

## Recuperação de senha por e-mail
Na tela de login, **Esqueci minha senha** envia um link para o e-mail da pessoa. Ao abrir o link, ela cria uma senha nova. Funciona para todos os usuários.

**Importante:** o e-mail padrão do Supabase só envia para os e-mails da **sua equipe dentro do Supabase** e no máximo **2 por hora**. Serve para testar com o seu próprio e-mail. Para os funcionários receberem o link, ligue um e-mail próprio:

1. Em uma conta Gmail com **verificação em duas etapas**, crie uma **senha de app** em https://myaccount.google.com/apppasswords.
2. No Supabase: **Authentication → Emails → SMTP Settings → Enable custom SMTP**:
   - **Host:** `smtp.gmail.com` · **Port:** `587`
   - **Username:** seu e-mail do Gmail · **Password:** a senha de app
   - **Sender email:** o mesmo e-mail · **Sender name:** nome da tapeçaria
3. Salve. Os e-mails passam a sair da sua conta.

Se alguém não tiver acesso ao e-mail, o administrador gera uma **senha temporária** em **Acessos**.

---

## Como atualizar o sistema depois
- **Pelo GitHub:** abra o arquivo, clique no lápis, mude e faça **Commit changes**. Ou envie os arquivos novos por **Add file → Upload files**, que substitui os antigos. O site atualiza sozinho em 1 ou 2 minutos.
- **Mudanças no banco:** quando um `supabase/schema.sql` novo vier, rode-o de novo no **SQL Editor**. Ele não apaga dados.

## Segurança e LGPD
- Cada usuário só recebe do banco o que tem permissão para ver. Quem não pode ver dados pessoais recebe só o nome abreviado do cliente ("João S."). Isso vale mesmo para quem abrir o F12.
- As senhas são guardadas pelo Supabase com criptografia.
- O sistema sai sozinho depois de 30 minutos sem uso, a não ser que a pessoa marque **Manter conectado**.
- Toda ação importante fica na **Auditoria**.
- O site usa HTTPS (GitHub Pages). O banco fica em São Paulo, se você escolheu essa região.

## Limites do plano grátis
- **Supabase:** se o projeto ficar uma semana quase sem uso, ele é pausado. O Supabase avisa por e-mail antes, e você reativa no painel com **Resume project**, sem perder dados. Em uso diário isso não acontece.
- **E-mail padrão do Supabase:** só envia para a equipe do projeto, 2 por hora (veja acima como usar o Gmail).
- Para o uso definitivo, com muitos clientes reais, considere o plano pago do Supabase, que inclui backups com mais recursos e não pausa.

## Antes de usar de verdade
1. **Configurações → Apagar tudo e começar do zero** (apaga os dados de teste; usuários e auditoria ficam).
2. Preencha os dados da empresa e envie o logo em **Configurações**.
3. Se quiser, apague o arquivo `js/teste.js` e a linha dele no `index.html`.
