/* =====================================================================
   Configuração do Supabase
   Supabase → Project Settings → API (ou "Data API" / "API Keys"):
   - SUPABASE_URL:      o "Project URL", algo como https://abcdefgh.supabase.co
   - SUPABASE_ANON_KEY: a chave "anon public" (ou "publishable")
   Essa chave pode ficar visível no site: quem protege os dados são as
   regras do banco (supabase/schema.sql). NUNCA coloque aqui a chave
   "service_role" / "secret".
   ===================================================================== */
const SUPABASE_URL = 'https://hlxblmuxusopqhdluidn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_zh64k0J5--4j6TKLzmov2g_kMm_ShH0';
