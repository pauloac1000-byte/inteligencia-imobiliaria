-- ==============================================================================
-- Migration: Expansão da Busca do Comprador/Investidor (KORBIX)
-- 1. Novas colunas em public.leads_investidor:
--    - finalidade: 'morar' | 'renda_aluguel' | 'revenda'
--    - preco_minimo, preco_maximo, preco_teto_absoluto
--    - min_area_m2, min_quartos, min_vagas, min_area_terreno_m2
--    - forma_pagamento: 'a_vista' | 'financiamento_aprovado' | 'financiamento_a_aprovar'
--    - usa_fgts: BOOLEAN
--    - aceita_reforma: BOOLEAN
--    - prazo_mudanca: 'ate_30_dias' | 'ate_60_dias' | 'ate_90_dias' (quando finalidade = morar)
--    - yield_minimo_mensal: NUMERIC(5,2) (quando finalidade = renda)
--    - cidades_codigos_ibge: TEXT[]
--    - atalhos_regiao: TEXT[]
--    - bairros_preferidos: TEXT
--    - raio_km: INTEGER
--    - ponto_referencia: TEXT
-- 2. Tabela public.municipios_sp (códigos IBGE oficiais e nomes)
-- 3. Tabela public.regioes_atalho (atalhos de regiões editáveis pelo gestor)
-- 4. Função RPC única fn_submit_lead_investidor atualizada com novos parâmetros
-- 5. Atualização da função de compatibilidade para suportar códigos IBGE e finalidades
-- ==============================================================================

-- 1. Colunas adicionais na tabela public.leads_investidor
ALTER TABLE public.leads_investidor
  ADD COLUMN IF NOT EXISTS finalidade TEXT DEFAULT 'renda_aluguel',
  ADD COLUMN IF NOT EXISTS preco_minimo NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS preco_maximo NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS preco_teto_absoluto NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS min_area_m2 NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS min_quartos INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS min_vagas INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS min_area_terreno_m2 NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS forma_pagamento TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS usa_fgts BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS aceita_reforma BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS prazo_mudanca TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS yield_minimo_mensal NUMERIC(5,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cidades_codigos_ibge TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS atalhos_regiao TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS bairros_preferidos TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS raio_km INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ponto_referencia TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_investidor_finalidade ON public.leads_investidor(finalidade);

-- 2. Tabela public.municipios_sp
CREATE TABLE IF NOT EXISTS public.municipios_sp (
  codigo_ibge TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  nome_normalizado TEXT NOT NULL,
  microrregiao TEXT,
  mesorregiao TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_municipios_sp_nome ON public.municipios_sp(nome);
CREATE INDEX IF NOT EXISTS idx_municipios_sp_nome_norm ON public.municipios_sp(nome_normalizado);

ALTER TABLE public.municipios_sp ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "municipios_sp_leitura_publica" ON public.municipios_sp;
CREATE POLICY "municipios_sp_leitura_publica"
  ON public.municipios_sp
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 3. Tabela public.regioes_atalho
CREATE TABLE IF NOT EXISTS public.regioes_atalho (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativa BOOLEAN NOT NULL DEFAULT TRUE,
  cidades JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array de objetos [{ "codigo": "3509502", "nome": "Campinas" }]
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_regioes_atalho_ordem ON public.regioes_atalho(ordem);
CREATE INDEX IF NOT EXISTS idx_regioes_atalho_ativa ON public.regioes_atalho(ativa);

ALTER TABLE public.regioes_atalho ENABLE ROW LEVEL SECURITY;

-- Leitura de atalhos liberada para anon e authenticated (usada no formulário de busca)
DROP POLICY IF EXISTS "regioes_atalho_leitura_publica" ON public.regioes_atalho;
CREATE POLICY "regioes_atalho_leitura_publica"
  ON public.regioes_atalho
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Escrita restrita a administradores e gestores
DROP POLICY IF EXISTS "regioes_atalho_gestor_all" ON public.regioes_atalho;
CREATE POLICY "regioes_atalho_gestor_all"
  ON public.regioes_atalho
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.tipo = 'gestor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.tipo = 'gestor'
    )
  );

-- 4. Seed de cidades polo / municípios do estado de São Paulo
INSERT INTO public.municipios_sp (codigo_ibge, nome, nome_normalizado, microrregiao, mesorregiao)
VALUES
  -- Circuito das Águas Paulista (12 cidades)
  ('3500501', 'Águas de Lindóia', 'aguas de lindoia', 'Amparo', 'Campinas'),
  ('3527009', 'Lindóia', 'lindoia', 'Amparo', 'Campinas'),
  ('3143403', 'Monte Sião', 'monte siao', 'Sul de Minas', 'Sul/Sudoeste'),
  ('3551603', 'Serra Negra', 'serra negra', 'Amparo', 'Campinas'),
  ('3500600', 'Águas de São Pedro', 'aguas de sao pedro', 'Piracicaba', 'Piracicaba'),
  ('3538709', 'Piracicaba', 'piracicaba', 'Piracicaba', 'Piracicaba'),
  ('3501905', 'Amparo', 'amparo', 'Amparo', 'Campinas'),
  ('3537107', 'Pedreira', 'pedreira', 'Campinas', 'Campinas'),
  ('3524709', 'Jaguariúna', 'jaguariuna', 'Campinas', 'Campinas'),
  ('3519055', 'Holambra', 'holambra', 'Campinas', 'Campinas'),
  ('3552106', 'Socorro', 'socorro', 'Amparo', 'Campinas'),
  ('3522604', 'Itapira', 'itapira', 'Mogi Mirim', 'Campinas'),

  -- Campinas e Região Metropolitana
  ('3509502', 'Campinas', 'campinas', 'Campinas', 'Campinas'),
  ('3501608', 'Americana', 'americana', 'Campinas', 'Campinas'),
  ('3503802', 'Artur Nogueira', 'artur nogueira', 'Mogi Mirim', 'Campinas'),
  ('3512803', 'Cosmópolis', 'cosmopolis', 'Campinas', 'Campinas'),
  ('3515152', 'Engenheiro Coelho', 'engenheiro coelho', 'Mogi Mirim', 'Campinas'),
  ('3519071', 'Hortolândia', 'hortolandia', 'Campinas', 'Campinas'),
  ('3520509', 'Indaiatuba', 'indaiatuba', 'Campinas', 'Campinas'),
  ('3531803', 'Monte Mor', 'monte mor', 'Campinas', 'Campinas'),
  ('3533403', 'Nova Odessa', 'nova odessa', 'Campinas', 'Campinas'),
  ('3536505', 'Paulínia', 'paulinia', 'Campinas', 'Campinas'),
  ('3552403', 'Sumaré', 'sumare', 'Campinas', 'Campinas'),
  ('3556206', 'Valinhos', 'valinhos', 'Campinas', 'Campinas'),
  ('3556701', 'Vinhedo', 'vinhedo', 'Campinas', 'Campinas'),
  ('3551504', 'Santo Antônio de Posse', 'santo antonio de posse', 'Mogi Mirim', 'Campinas'),
  ('3532009', 'Morungaba', 'morungaba', 'Campinas', 'Campinas'),
  ('3530706', 'Mogi Guaçu', 'mogi guacu', 'Mogi Mirim', 'Campinas'),
  ('3530805', 'Mogi Mirim', 'mogi mirim', 'Mogi Mirim', 'Campinas'),

  -- Jundiaí e Região
  ('3525904', 'Jundiaí', 'jundiai', 'Jundiaí', 'Macro Metropolitana'),
  ('3509601', 'Campo Limpo Paulista', 'campo limpo paulista', 'Jundiaí', 'Macro Metropolitana'),
  ('3556503', 'Várzea Paulista', 'varzea paulista', 'Jundiaí', 'Macro Metropolitana'),
  ('3523404', 'Itupeva', 'itupeva', 'Jundiaí', 'Macro Metropolitana'),
  ('3527306', 'Louveira', 'louveira', 'Jundiaí', 'Macro Metropolitana'),
  ('3510500', 'Cabreúva', 'cabreuva', 'Jundiaí', 'Macro Metropolitana'),
  ('3522208', 'Itatiba', 'itatiba', 'Bragança Paulista', 'Macro Metropolitana'),
  ('3524006', 'Jarinu', 'jarinu', 'Jundiaí', 'Macro Metropolitana'),

  -- Grande São Paulo e ABC
  ('3550308', 'São Paulo', 'sao paulo', 'São Paulo', 'Metropolitana de São Paulo'),
  ('3548708', 'São Bernardo do Campo', 'sao bernardo do campo', 'São Paulo', 'Metropolitana de São Paulo'),
  ('3547809', 'Santo André', 'santo andre', 'São Paulo', 'Metropolitana de São Paulo'),
  ('3548807', 'São Caetano do Sul', 'sao caetano do sul', 'São Paulo', 'Metropolitana de São Paulo'),
  ('3513801', 'Diadema', 'diadema', 'São Paulo', 'Metropolitana de São Paulo'),
  ('3529401', 'Mauá', 'maua', 'São Paulo', 'Metropolitana de São Paulo'),
  ('3543303', 'Ribeirão Pires', 'ribeirao pires', 'São Paulo', 'Metropolitana de São Paulo'),
  ('3544103', 'Rio Grande da Serra', 'rio grande da serra', 'São Paulo', 'Metropolitana de São Paulo'),
  ('3518800', 'Guarulhos', 'guarulhos', 'Guarulhos', 'Metropolitana de São Paulo'),
  ('3534401', 'Osasco', 'osasco', 'Osasco', 'Metropolitana de São Paulo'),
  ('3505708', 'Barueri', 'barueri', 'Osasco', 'Metropolitana de São Paulo'),
  ('3547304', 'Santana de Parnaíba', 'santana de parnaiba', 'Osasco', 'Metropolitana de São Paulo'),
  ('3513009', 'Cotia', 'cotia', 'Itapecerica da Serra', 'Metropolitana de São Paulo'),
  ('3552809', 'Taboão da Serra', 'taboao da serra', 'Itapecerica da Serra', 'Metropolitana de São Paulo'),
  ('3515004', 'Embu das Artes', 'embu das artes', 'Itapecerica da Serra', 'Metropolitana de São Paulo'),
  ('3515103', 'Embu-Guaçu', 'embu guacu', 'Itapecerica da Serra', 'Metropolitana de São Paulo'),
  ('3522505', 'Itapecerica da Serra', 'itapecerica da serra', 'Itapecerica da Serra', 'Metropolitana de São Paulo'),
  ('3503901', 'Arujá', 'aruja', 'Guarulhos', 'Metropolitana de São Paulo'),
  ('3530607', 'Mogi das Cruzes', 'mogi das cruzes', 'Mogi das Cruzes', 'Metropolitana de São Paulo'),
  ('3552502', 'Suzano', 'suzano', 'Mogi das Cruzes', 'Metropolitana de São Paulo'),
  ('3522109', 'Itaquaquecetuba', 'itaquaquecetuba', 'Mogi das Cruzes', 'Metropolitana de São Paulo'),
  ('3539806', 'Poá', 'poa', 'Mogi das Cruzes', 'Metropolitana de São Paulo'),
  ('3516309', 'Ferraz de Vasconcelos', 'ferraz de vasconcelos', 'Mogi das Cruzes', 'Metropolitana de São Paulo'),
  ('3509205', 'Cajamar', 'cajamar', 'Osasco', 'Metropolitana de São Paulo'),
  ('3509007', 'Caieiras', 'caieiras', 'Franco da Rocha', 'Metropolitana de São Paulo'),
  ('3516408', 'Franco da Rocha', 'franco da rocha', 'Franco da Rocha', 'Metropolitana de São Paulo'),
  ('3516200', 'Francisco Morato', 'francisco morato', 'Franco da Rocha', 'Metropolitana de São Paulo'),
  ('3528502', 'Mairiporã', 'mairipora', 'Franco da Rocha', 'Metropolitana de São Paulo'),

  -- Vale do Paraíba e Litoral Norte
  ('3549904', 'São José dos Campos', 'sao jose dos campos', 'São José dos Campos', 'Vale do Paraíba'),
  ('3554102', 'Taubaté', 'taubate', 'São José dos Campos', 'Vale do Paraíba'),
  ('3524402', 'Jacareí', 'jacarei', 'São José dos Campos', 'Vale do Paraíba'),
  ('3538006', 'Pindamonhangaba', 'pindamonhangaba', 'São José dos Campos', 'Vale do Paraíba'),
  ('3518404', 'Guaratinguetá', 'guaratingueta', 'Guaratinguetá', 'Vale do Paraíba'),
  ('3502507', 'Aparecida', 'aparecida', 'Guaratinguetá', 'Vale do Paraíba'),
  ('3509700', 'Campos do Jordão', 'campos do jordao', 'Campos do Jordão', 'Vale do Paraíba'),
  ('3508504', 'Caçapava', 'cacapava', 'São José dos Campos', 'Vale do Paraíba'),
  ('3510559', 'Caraguatatuba', 'caraguatatuba', 'Litoral Norte', 'Vale do Paraíba'),
  ('3555406', 'Ubatuba', 'ubatuba', 'Litoral Norte', 'Vale do Paraíba'),
  ('3550704', 'São Sebastião', 'sao sebastiao', 'Litoral Norte', 'Vale do Paraíba'),
  ('3520400', 'Ilhabela', 'ilhabela', 'Litoral Norte', 'Vale do Paraíba'),

  -- Sorocaba e Região
  ('3552205', 'Sorocaba', 'sorocaba', 'Sorocaba', 'Macro Metropolitana'),
  ('3557006', 'Votorantim', 'votorantim', 'Sorocaba', 'Macro Metropolitana'),
  ('3523909', 'Itu', 'itu', 'Sorocaba', 'Macro Metropolitana'),
  ('3545209', 'Salto', 'salto', 'Sorocaba', 'Macro Metropolitana'),
  ('3550605', 'São Roque', 'sao roque', 'Sorocaba', 'Macro Metropolitana'),
  ('3507001', 'Boituva', 'boituva', 'Tatuí', 'Itapetininga'),
  ('3553708', 'Tatuí', 'tatui', 'Tatuí', 'Itapetininga'),
  ('3537800', 'Piedade', 'piedade', 'Sorocaba', 'Macro Metropolitana'),
  ('3522406', 'Itapevi', 'itapevi', 'Osasco', 'Metropolitana de São Paulo'),
  ('3522307', 'Itapetininga', 'itapetininga', 'Itapetininga', 'Itapetininga'),
  ('3502903', 'Araçoiaba da Serra', 'aracoiaba da serra', 'Sorocaba', 'Macro Metropolitana'),
  ('3540606', 'Porto Feliz', 'porto feliz', 'Sorocaba', 'Macro Metropolitana'),

  -- Ribeirão Preto e Região
  ('3543402', 'Ribeirão Preto', 'ribeirao preto', 'Ribeirão Preto', 'Ribeirão Preto'),
  ('3551702', 'Sertãozinho', 'sertaozinho', 'Ribeirão Preto', 'Ribeirão Preto'),
  ('3513108', 'Cravinhos', 'cravinhos', 'Ribeirão Preto', 'Ribeirão Preto'),
  ('3525102', 'Jardinópolis', 'jardinopolis', 'Ribeirão Preto', 'Ribeirão Preto'),
  ('3505906', 'Batatais', 'batatais', 'Batatais', 'Ribeirão Preto'),
  ('3507506', 'Brodowski', 'brodowski', 'Ribeirão Preto', 'Ribeirão Preto'),
  ('3524303', 'Jaboticabal', 'jaboticabal', 'Jaboticabal', 'Ribeirão Preto'),
  ('3531308', 'Monte Alto', 'monte alto', 'Jaboticabal', 'Ribeirão Preto'),
  ('3506003', 'Bebedouro', 'bebedouro', 'Jaboticabal', 'Ribeirão Preto'),
  ('3516903', 'Franca', 'franca', 'Franca', 'Ribeirão Preto'),
  ('3530508', 'Mococa', 'mococa', 'São João da Boa Vista', 'Campinas'),
  ('3549805', 'São José do Rio Pardo', 'sao jose do rio pardo', 'São João da Boa Vista', 'Campinas'),

  -- Baixada Santista e Litoral
  ('3548500', 'Santos', 'santos', 'Santos', 'Metropolitana de Santos'),
  ('3551009', 'São Vicente', 'sao vicente', 'Santos', 'Metropolitana de Santos'),
  ('3541000', 'Praia Grande', 'praia grande', 'Santos', 'Metropolitana de Santos'),
  ('3518701', 'Guarujá', 'guaruja', 'Santos', 'Metropolitana de Santos'),
  ('3513504', 'Cubatão', 'cubatao', 'Santos', 'Metropolitana de Santos'),
  ('3506359', 'Bertioga', 'bertioga', 'Santos', 'Metropolitana de Santos'),
  ('3522158', 'Itanhaém', 'itanhaem', 'Itanhaém', 'Litoral Sul'),
  ('3531100', 'Mongaguá', 'mongagua', 'Itanhaém', 'Litoral Sul'),
  ('3537602', 'Peruíbe', 'peruibe', 'Itanhaém', 'Litoral Sul')
ON CONFLICT (codigo_ibge) DO UPDATE SET
  nome = EXCLUDED.nome,
  nome_normalizado = EXCLUDED.nome_normalizado,
  microrregiao = EXCLUDED.microrregiao,
  mesorregiao = EXCLUDED.mesorregiao;

-- 5. Seed dos 8 atalhos iniciais em public.regioes_atalho
INSERT INTO public.regioes_atalho (nome, descricao, ordem, ativa, cidades)
VALUES
  (
    'Circuito das Águas Paulista',
    'Estâncias hidrominerais e turísticas do interior paulista',
    1,
    TRUE,
    '[
      {"codigo": "3500501", "nome": "Águas de Lindóia"},
      {"codigo": "3527009", "nome": "Lindóia"},
      {"codigo": "3143403", "nome": "Monte Sião"},
      {"codigo": "3551603", "nome": "Serra Negra"},
      {"codigo": "3500600", "nome": "Águas de São Pedro"},
      {"codigo": "3538709", "nome": "Piracicaba"},
      {"codigo": "3501905", "nome": "Amparo"},
      {"codigo": "3537107", "nome": "Pedreira"},
      {"codigo": "3524709", "nome": "Jaguariúna"},
      {"codigo": "3519055", "nome": "Holambra"},
      {"codigo": "3552106", "nome": "Socorro"},
      {"codigo": "3522604", "nome": "Itapira"}
    ]'::jsonb
  ),
  (
    'Campinas e região',
    'Região Metropolitana de Campinas e cidades do polo tecnológico',
    2,
    TRUE,
    '[
      {"codigo": "3509502", "nome": "Campinas"},
      {"codigo": "3501608", "nome": "Americana"},
      {"codigo": "3503802", "nome": "Artur Nogueira"},
      {"codigo": "3512803", "nome": "Cosmópolis"},
      {"codigo": "3515152", "nome": "Engenheiro Coelho"},
      {"codigo": "3519071", "nome": "Hortolândia"},
      {"codigo": "3520509", "nome": "Indaiatuba"},
      {"codigo": "3531803", "nome": "Monte Mor"},
      {"codigo": "3533403", "nome": "Nova Odessa"},
      {"codigo": "3536505", "nome": "Paulínia"},
      {"codigo": "3552403", "nome": "Sumaré"},
      {"codigo": "3556206", "nome": "Valinhos"},
      {"codigo": "3556701", "nome": "Vinhedo"}
    ]'::jsonb
  ),
  (
    'Jundiaí e região',
    'Aglomeração urbana de Jundiaí e eixo Anhanguera-Bandeirantes',
    3,
    TRUE,
    '[
      {"codigo": "3525904", "nome": "Jundiaí"},
      {"codigo": "3509601", "nome": "Campo Limpo Paulista"},
      {"codigo": "3556503", "nome": "Várzea Paulista"},
      {"codigo": "3523404", "nome": "Itupeva"},
      {"codigo": "3527306", "nome": "Louveira"},
      {"codigo": "3510500", "nome": "Cabreúva"},
      {"codigo": "3522208", "nome": "Itatiba"}
    ]'::jsonb
  ),
  (
    'Grande São Paulo e ABC',
    'Capital paulista, ABC paulista, região oeste e alto tietê',
    4,
    TRUE,
    '[
      {"codigo": "3550308", "nome": "São Paulo"},
      {"codigo": "3548708", "nome": "São Bernardo do Campo"},
      {"codigo": "3547809", "nome": "Santo André"},
      {"codigo": "3548807", "nome": "São Caetano do Sul"},
      {"codigo": "3513801", "nome": "Diadema"},
      {"codigo": "3529401", "nome": "Mauá"},
      {"codigo": "3518800", "nome": "Guarulhos"},
      {"codigo": "3534401", "nome": "Osasco"},
      {"codigo": "3505708", "nome": "Barueri"},
      {"codigo": "3547304", "nome": "Santana de Parnaíba"},
      {"codigo": "3513009", "nome": "Cotia"},
      {"codigo": "3552809", "nome": "Taboão da Serra"}
    ]'::jsonb
  ),
  (
    'Vale do Paraíba',
    'Eixo Dutra, Serra da Mantiqueira e Litoral Norte',
    5,
    TRUE,
    '[
      {"codigo": "3549904", "nome": "São José dos Campos"},
      {"codigo": "3554102", "nome": "Taubaté"},
      {"codigo": "3524402", "nome": "Jacareí"},
      {"codigo": "3538006", "nome": "Pindamonhangaba"},
      {"codigo": "3518404", "nome": "Guaratinguetá"},
      {"codigo": "3502507", "nome": "Aparecida"},
      {"codigo": "3509700", "nome": "Campos do Jordão"},
      {"codigo": "3508504", "nome": "Caçapava"},
      {"codigo": "3510559", "nome": "Caraguatatuba"},
      {"codigo": "3555406", "nome": "Ubatuba"},
      {"codigo": "3550704", "nome": "São Sebastião"}
    ]'::jsonb
  ),
  (
    'Sorocaba e região',
    'Polo industrial de Sorocaba, Castelo Branco e região de Itu/Salto',
    6,
    TRUE,
    '[
      {"codigo": "3552205", "nome": "Sorocaba"},
      {"codigo": "3557006", "nome": "Votorantim"},
      {"codigo": "3523909", "nome": "Itu"},
      {"codigo": "3545209", "nome": "Salto"},
      {"codigo": "3550605", "nome": "São Roque"},
      {"codigo": "3507001", "nome": "Boituva"},
      {"codigo": "3553708", "nome": "Tatuí"},
      {"codigo": "3537800", "nome": "Piedade"}
    ]'::jsonb
  ),
  (
    'Ribeirão Preto e região',
    'Capital do agronegócio paulista e macrorregião nordeste',
    7,
    TRUE,
    '[
      {"codigo": "3543402", "nome": "Ribeirão Preto"},
      {"codigo": "3551702", "nome": "Sertãozinho"},
      {"codigo": "3513108", "nome": "Cravinhos"},
      {"codigo": "3525102", "nome": "Jardinópolis"},
      {"codigo": "3505906", "nome": "Batatais"},
      {"codigo": "3507506", "nome": "Brodowski"},
      {"codigo": "3524303", "nome": "Jaboticabal"},
      {"codigo": "3516903", "nome": "Franca"}
    ]'::jsonb
  ),
  (
    'Baixada Santista e litoral',
    'Região Metropolitana da Baixada Santista e praias paulistas',
    8,
    TRUE,
    '[
      {"codigo": "3548500", "nome": "Santos"},
      {"codigo": "3551009", "nome": "São Vicente"},
      {"codigo": "3541000", "nome": "Praia Grande"},
      {"codigo": "3518701", "nome": "Guarujá"},
      {"codigo": "3513504", "nome": "Cubatão"},
      {"codigo": "3506359", "nome": "Bertioga"},
      {"codigo": "3522158", "nome": "Itanhaém"},
      {"codigo": "3531100", "nome": "Mongaguá"},
      {"codigo": "3537602", "nome": "Peruíbe"}
    ]'::jsonb
  )
ON CONFLICT (nome) DO UPDATE SET
  descricao = EXCLUDED.descricao,
  ordem = EXCLUDED.ordem,
  ativa = EXCLUDED.ativa,
  cidades = EXCLUDED.cidades,
  atualizado_em = NOW();

-- 6. Recriar a função RPC ÚNICA public.fn_submit_lead_investidor com os novos campos (sem duplicar overloads)
DROP FUNCTION IF EXISTS public.fn_submit_lead_investidor(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, JSONB, TEXT[]);

CREATE OR REPLACE FUNCTION public.fn_submit_lead_investidor(
  p_telefone TEXT,
  p_ticket TEXT,
  p_objetivo TEXT,
  p_cidades_interesse TEXT,
  p_prazo_decisao TEXT,
  p_rota TEXT DEFAULT 'investidor',
  p_nome TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_perfil TEXT DEFAULT NULL,
  p_faixa_valor TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_diferenciais JSONB DEFAULT '{}'::jsonb,
  p_tipos_imovel TEXT[] DEFAULT '{}'::text[],
  -- Novos parâmetros da expansão da busca do comprador/investidor:
  p_finalidade TEXT DEFAULT 'renda_aluguel',
  p_preco_minimo NUMERIC DEFAULT NULL,
  p_preco_maximo NUMERIC DEFAULT NULL,
  p_preco_teto_absoluto NUMERIC DEFAULT NULL,
  p_min_area_m2 NUMERIC DEFAULT NULL,
  p_min_quartos INTEGER DEFAULT NULL,
  p_min_vagas INTEGER DEFAULT NULL,
  p_min_area_terreno_m2 NUMERIC DEFAULT NULL,
  p_forma_pagamento TEXT DEFAULT NULL,
  p_usa_fgts BOOLEAN DEFAULT FALSE,
  p_aceita_reforma BOOLEAN DEFAULT TRUE,
  p_prazo_mudanca TEXT DEFAULT NULL,
  p_yield_minimo_mensal NUMERIC DEFAULT NULL,
  p_cidades_codigos_ibge TEXT[] DEFAULT '{}'::text[],
  p_atalhos_regiao TEXT[] DEFAULT '{}'::text[],
  p_bairros_preferidos TEXT DEFAULT NULL,
  p_raio_km INTEGER DEFAULT NULL,
  p_ponto_referencia TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  protocolo TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.leads_investidor;
  v_final_user_id UUID;
  v_finalidade_normalizada TEXT;
BEGIN
  -- Se o usuário autenticado chamou, vincula automaticamente
  v_final_user_id := COALESCE(auth.uid(), p_user_id);

  v_finalidade_normalizada := COALESCE(NULLIF(TRIM(p_finalidade), ''), 'renda_aluguel');

  INSERT INTO public.leads_investidor (
    telefone,
    ticket,
    objetivo,
    cidades_interesse,
    prazo_decisao,
    rota,
    nome,
    email,
    perfil,
    faixa_valor,
    user_id,
    diferenciais,
    tipos_imovel,
    finalidade,
    preco_minimo,
    preco_maximo,
    preco_teto_absoluto,
    min_area_m2,
    min_quartos,
    min_vagas,
    min_area_terreno_m2,
    forma_pagamento,
    usa_fgts,
    aceita_reforma,
    prazo_mudanca,
    yield_minimo_mensal,
    cidades_codigos_ibge,
    atalhos_regiao,
    bairros_preferidos,
    raio_km,
    ponto_referencia
  )
  VALUES (
    TRIM(p_telefone),
    p_ticket,
    COALESCE(p_objetivo, v_finalidade_normalizada),
    TRIM(p_cidades_interesse),
    p_prazo_decisao,
    COALESCE(p_rota, 'investidor'),
    NULLIF(TRIM(p_nome), ''),
    NULLIF(LOWER(TRIM(p_email)), ''),
    NULLIF(TRIM(p_perfil), ''),
    NULLIF(TRIM(p_faixa_valor), ''),
    v_final_user_id,
    COALESCE(p_diferenciais, '{}'::jsonb),
    COALESCE(p_tipos_imovel, '{}'::text[]),
    v_finalidade_normalizada,
    p_preco_minimo,
    p_preco_maximo,
    p_preco_teto_absoluto,
    p_min_area_m2,
    p_min_quartos,
    p_min_vagas,
    p_min_area_terreno_m2,
    NULLIF(TRIM(p_forma_pagamento), ''),
    COALESCE(p_usa_fgts, FALSE),
    COALESCE(p_aceita_reforma, TRUE),
    NULLIF(TRIM(p_prazo_mudanca), ''),
    p_yield_minimo_mensal,
    COALESCE(p_cidades_codigos_ibge, '{}'::text[]),
    COALESCE(p_atalhos_regiao, '{}'::text[]),
    NULLIF(TRIM(p_bairros_preferidos), ''),
    p_raio_km,
    NULLIF(TRIM(p_ponto_referencia), '')
  )
  RETURNING * INTO v_lead;

  RETURN QUERY SELECT v_lead.id, v_lead.protocolo;
END;
$$;

-- Permissão de execução para visitantes anônimos e usuários logados
GRANT EXECUTE ON FUNCTION public.fn_submit_lead_investidor(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, JSONB, TEXT[],
  TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, INTEGER, INTEGER, NUMERIC, TEXT, BOOLEAN, BOOLEAN, TEXT, NUMERIC, TEXT[], TEXT[], TEXT, INTEGER, TEXT
) TO anon, authenticated;

-- 7. Atualizar a função de compatibilidade detalhada (public.fn_calcular_compatibilidade_detalhada)
-- Garantindo suporte a faixas numéricas de preço mín/máx/teto e códigos IBGE mantendo os 5 critérios e seus pesos intactos
CREATE OR REPLACE FUNCTION public.fn_calcular_compatibilidade_detalhada(
  p_lead_venda_id UUID,
  p_lead_investidor_id UUID
)
RETURNS TABLE (
  percentual INTEGER,
  criterios JSONB,
  criterios_atendidos JSONB,
  criterios_nao_atendidos JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_venda public.leads_venda;
  v_investidor public.leads_investidor;

  -- Pesos fixos auditáveis somando 100
  v_peso_preco CONSTANT INTEGER := 30;
  v_peso_cidade CONSTANT INTEGER := 25;
  v_peso_objetivo CONSTANT INTEGER := 20;
  v_peso_prazo CONSTANT INTEGER := 15;
  v_peso_docs CONSTANT INTEGER := 10;

  v_status_preco BOOLEAN := FALSE;
  v_motivo_preco TEXT := '';

  v_status_cidade BOOLEAN := FALSE;
  v_motivo_cidade TEXT := '';

  v_status_objetivo BOOLEAN := FALSE;
  v_motivo_objetivo TEXT := '';

  v_status_prazo BOOLEAN := FALSE;
  v_motivo_prazo TEXT := '';

  v_status_docs BOOLEAN := FALSE;
  v_motivo_docs TEXT := '';

  -- Total e estruturas JSON
  v_total_percentual INTEGER := 0;
  v_criterio_preco JSONB;
  v_criterio_cidade JSONB;
  v_criterio_objetivo JSONB;
  v_criterio_prazo JSONB;
  v_criterio_docs JSONB;

  v_arr_todos JSONB := '[]'::jsonb;
  v_arr_atendidos JSONB := '[]'::jsonb;
  v_arr_nao_atendidos JSONB := '[]'::jsonb;

  -- Variáveis de trabalho dos critérios
  -- Critério 1: Preço
  v_valor_imovel NUMERIC;
  v_ticket_norm TEXT;
  v_min_ticket NUMERIC := NULL;
  v_max_ticket NUMERIC := NULL;

  -- Critério 2: Cidade
  v_cidade_imovel_norm TEXT;
  v_cidades_raw TEXT;
  v_cidades_array TEXT[];
  v_cidade_item TEXT;
  v_cidade_match BOOLEAN := FALSE;
  v_circuito_aguas TEXT[] := ARRAY[
    'aguas de lindoia', 'lindoia', 'monte siao', 'serra negra',
    'aguas de sao pedro', 'piracicaba', 'amparo', 'pedreira',
    'jaguariuna', 'holambra', 'socorro', 'itapira'
  ];

  -- Critério 3: Objetivo vs Tipo
  v_objetivo_norm TEXT;
  v_tipo_imovel_norm TEXT;

  -- Critério 4: Prazo
  v_prazo_prop_norm TEXT;
  v_prazo_inv_norm TEXT;
  v_urgencia_prop INTEGER := 0;
  v_urgencia_inv INTEGER := 0;

  -- Critério 5: Documentos
  v_tem_matricula BOOLEAN := FALSE;
  v_tem_iptu BOOLEAN := FALSE;
  v_tem_certidao BOOLEAN := FALSE;
BEGIN
  -- 1. Carrega os leads
  SELECT * INTO v_venda FROM public.leads_venda WHERE id = p_lead_venda_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead de venda % não encontrado.', p_lead_venda_id;
  END IF;

  SELECT * INTO v_investidor FROM public.leads_investidor WHERE id = p_lead_investidor_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead de investidor % não encontrado.', p_lead_investidor_id;
  END IF;

  -- ============================================================================
  -- CRITÉRIO 1: Faixa de Preço (Peso 30)
  -- ============================================================================
  v_valor_imovel := public.fn_compat_extrair_valor_numerico(v_venda.valor_estimado);
  v_ticket_norm := public.fn_compat_normalizar_texto(v_investidor.ticket);

  -- Se o comprador/investidor informou faixa numérica explícita (preco_minimo/preco_maximo/teto)
  IF v_investidor.preco_minimo IS NOT NULL OR v_investidor.preco_maximo IS NOT NULL OR v_investidor.preco_teto_absoluto IS NOT NULL THEN
    v_min_ticket := COALESCE(v_investidor.preco_minimo, 0);
    v_max_ticket := COALESCE(v_investidor.preco_teto_absoluto, v_investidor.preco_maximo, 999999999999);
  ELSIF v_ticket_norm IS NOT NULL AND v_ticket_norm <> '' THEN
    IF v_ticket_norm ILIKE '%ate_300%' OR v_ticket_norm ILIKE '%ate 300%' OR v_ticket_norm ILIKE '%300 mil%' THEN
      v_min_ticket := 0;
      v_max_ticket := 300000;
    ELSIF v_ticket_norm ILIKE '%300_600%' OR v_ticket_norm ILIKE '%300 a 600%' THEN
      v_min_ticket := 300000.01;
      v_max_ticket := 600000;
    ELSIF v_ticket_norm ILIKE '%acima_600%' OR v_ticket_norm ILIKE '%acima de 600%' OR v_ticket_norm ILIKE '%acima 600%' THEN
      v_min_ticket := 600000.01;
      v_max_ticket := 999999999999;
    END IF;
  END IF;

  IF v_min_ticket IS NULL AND v_max_ticket IS NULL THEN
    v_status_preco := FALSE;
    v_motivo_preco := 'Comprador/Investidor não especificou faixa de preço';
  ELSIF v_valor_imovel IS NULL THEN
    v_status_preco := FALSE;
    v_motivo_preco := 'Imóvel não possui valor estimado informado para validação de faixa';
  ELSE
    IF v_valor_imovel >= v_min_ticket AND (v_max_ticket IS NULL OR v_valor_imovel <= v_max_ticket) THEN
      v_status_preco := TRUE;
      v_motivo_preco := FORMAT('Valor do imóvel (R$ %s) enquadrado na faixa de compra (mín: %s, máx: %s)', v_valor_imovel, COALESCE(v_min_ticket::TEXT, '0'), COALESCE(v_max_ticket::TEXT, 'livre'));
    ELSE
      v_status_preco := FALSE;
      v_motivo_preco := FORMAT('Faixa de preço do imóvel (R$ %s) fora do limite do comprador (mín: %s, máx: %s)', COALESCE(v_valor_imovel::TEXT, 'não informado'), COALESCE(v_min_ticket::TEXT, '0'), COALESCE(v_max_ticket::TEXT, 'livre'));
    END IF;
  END IF;

  -- ============================================================================
  -- CRITÉRIO 2: Cidade (Peso 25)
  -- ============================================================================
  v_cidade_imovel_norm := public.fn_compat_normalizar_texto(v_venda.cidade);
  v_cidades_raw := v_investidor.cidades_interesse;

  IF v_cidade_imovel_norm IS NULL OR v_cidade_imovel_norm = '' THEN
    v_status_cidade := FALSE;
    v_motivo_cidade := 'Cidade do imóvel não informada no cadastro';
  ELSIF (v_cidades_raw IS NULL OR TRIM(v_cidades_raw) = '') AND (v_investidor.cidades_codigos_ibge IS NULL OR array_length(v_investidor.cidades_codigos_ibge, 1) = 0) THEN
    v_status_cidade := FALSE;
    v_motivo_cidade := 'Comprador/Investidor não especificou cidades de interesse';
  ELSE
    -- 1. Verifica no array de cidades em texto
    IF v_cidades_raw IS NOT NULL AND TRIM(v_cidades_raw) <> '' THEN
      IF TRIM(v_cidades_raw) ~ '^\[' THEN
        BEGIN
          SELECT ARRAY_AGG(elems.val)
          INTO v_cidades_array
          FROM jsonb_array_elements_text(v_cidades_raw::jsonb) AS elems(val);
        EXCEPTION WHEN OTHERS THEN
          v_cidades_array := string_to_array(v_cidades_raw, ',');
        END;
      ELSE
        v_cidades_array := string_to_array(v_cidades_raw, ',');
      END IF;

      FOREACH v_cidade_item IN ARRAY v_cidades_array LOOP
        DECLARE
          v_item_norm TEXT;
        BEGIN
          v_item_norm := public.fn_compat_normalizar_texto(v_cidade_item);
          IF v_item_norm IS NOT NULL THEN
            IF v_cidade_imovel_norm = v_item_norm 
               OR v_cidade_imovel_norm ILIKE '%' || v_item_norm || '%'
               OR v_item_norm ILIKE '%' || v_cidade_imovel_norm || '%' THEN
              v_cidade_match := TRUE;
              EXIT;
            END IF;

            IF v_item_norm ILIKE '%circuito das aguas%' THEN
              DECLARE
                v_circuito_cid TEXT;
              BEGIN
                FOREACH v_circuito_cid IN ARRAY v_circuito_aguas LOOP
                  IF v_cidade_imovel_norm ILIKE '%' || v_circuito_cid || '%' THEN
                    v_cidade_match := TRUE;
                    EXIT;
                  END IF;
                END LOOP;
              END;
              IF v_cidade_match THEN
                EXIT;
              END IF;
            END IF;
          END IF;
        END;
      END LOOP;
    END IF;

    -- 2. Verifica cruzamento com códigos IBGE salvos
    IF NOT v_cidade_match AND v_investidor.cidades_codigos_ibge IS NOT NULL AND array_length(v_investidor.cidades_codigos_ibge, 1) > 0 THEN
      IF EXISTS (
        SELECT 1 FROM public.municipios_sp m
        WHERE m.codigo_ibge = ANY(v_investidor.cidades_codigos_ibge)
          AND (
            v_cidade_imovel_norm = m.nome_normalizado
            OR v_cidade_imovel_norm ILIKE '%' || m.nome_normalizado || '%'
            OR m.nome_normalizado ILIKE '%' || v_cidade_imovel_norm || '%'
          )
      ) THEN
        v_cidade_match := TRUE;
      END IF;
    END IF;

    IF v_cidade_match THEN
      v_status_cidade := TRUE;
      v_motivo_cidade := FORMAT('Cidade do imóvel (%s) consta nas regiões de interesse do comprador', COALESCE(v_venda.cidade, ''));
    ELSE
      v_status_cidade := FALSE;
      v_motivo_cidade := FORMAT('Cidade do imóvel (%s) não consta nas regiões de interesse do comprador', COALESCE(v_venda.cidade, ''));
    END IF;
  END IF;

  -- ============================================================================
  -- CRITÉRIO 3: Finalidade / Objetivo vs Tipo do Imóvel (Peso 20)
  -- ============================================================================
  v_objetivo_norm := public.fn_compat_normalizar_texto(COALESCE(v_investidor.finalidade, v_investidor.objetivo));
  v_tipo_imovel_norm := public.fn_compat_normalizar_texto(v_venda.tipo_imovel);

  IF v_tipo_imovel_norm IS NULL OR v_tipo_imovel_norm = '' THEN
    v_status_objetivo := FALSE;
    v_motivo_objetivo := 'Tipo de imóvel não informado no cadastro do proprietário';
  ELSIF v_objetivo_norm IS NULL OR v_objetivo_norm = '' THEN
    v_status_objetivo := FALSE;
    v_motivo_objetivo := 'Comprador/Investidor não definiu seu objetivo ou finalidade';
  ELSE
    -- Se investidor tem tipos_imovel explícitos informados
    IF v_investidor.tipos_imovel IS NOT NULL AND array_length(v_investidor.tipos_imovel, 1) > 0 THEN
      IF v_tipo_imovel_norm = ANY(v_investidor.tipos_imovel) 
         OR EXISTS (
            SELECT 1 FROM unnest(v_investidor.tipos_imovel) t
            WHERE v_tipo_imovel_norm ILIKE '%' || public.fn_compat_normalizar_texto(t) || '%'
         ) THEN
        v_status_objetivo := TRUE;
        v_motivo_objetivo := FORMAT('Tipo de imóvel (%s) aceito expressamente pelo comprador', v_venda.tipo_imovel);
      ELSE
        v_status_objetivo := FALSE;
        v_motivo_objetivo := FORMAT('Tipo de imóvel (%s) não consta na lista de tipos aceitos pelo comprador', COALESCE(v_venda.tipo_imovel, ''));
      END IF;
    ELSIF v_objetivo_norm ILIKE '%morar%' THEN
      -- Moradia: compatível com apartamento e casa
      IF v_tipo_imovel_norm ILIKE '%apartamento%' OR v_tipo_imovel_norm ILIKE '%casa%' THEN
        v_status_objetivo := TRUE;
        v_motivo_objetivo := FORMAT('Tipo de imóvel residencial (%s) compatível com moradia', v_venda.tipo_imovel);
      ELSE
        v_status_objetivo := FALSE;
        v_motivo_objetivo := FORMAT('Tipo de imóvel (%s) não é residencial pronto para morar', COALESCE(v_venda.tipo_imovel, ''));
      END IF;
    ELSIF v_objetivo_norm ILIKE '%renda%' OR v_objetivo_norm ILIKE '%aluguel%' THEN
      IF v_tipo_imovel_norm ILIKE '%apartamento%' OR v_tipo_imovel_norm ILIKE '%casa%' OR v_tipo_imovel_norm ILIKE '%comercial%' THEN
        v_status_objetivo := TRUE;
        v_motivo_objetivo := FORMAT('Tipo de imóvel (%s) compatível com renda de aluguel', v_venda.tipo_imovel);
      ELSE
        v_status_objetivo := FALSE;
        v_motivo_objetivo := FORMAT('Tipo de imóvel (%s) não é indicado para renda de aluguel', COALESCE(v_venda.tipo_imovel, ''));
      END IF;
    ELSIF v_objetivo_norm ILIKE '%revenda%' THEN
      v_status_objetivo := TRUE;
      v_motivo_objetivo := FORMAT('Objetivo de revenda é compatível com qualquer tipo de imóvel (%s)', v_venda.tipo_imovel);
    ELSE
      v_status_objetivo := TRUE;
      v_motivo_objetivo := FORMAT('Tipo de imóvel (%s) aceito', v_venda.tipo_imovel);
    END IF;
  END IF;

  -- ============================================================================
  -- CRITÉRIO 4: Prazo (Peso 15)
  -- ============================================================================
  v_prazo_prop_norm := public.fn_compat_normalizar_texto(v_venda.prazo_desejado);
  v_prazo_inv_norm := public.fn_compat_normalizar_texto(v_investidor.prazo_decisao);

  IF v_prazo_prop_norm IS NULL OR v_prazo_prop_norm = '' THEN
    v_status_prazo := FALSE;
    v_motivo_prazo := 'Proprietário ainda não definiu o prazo desejado para a venda';
  ELSIF v_prazo_inv_norm IS NULL OR v_prazo_inv_norm = '' THEN
    v_status_prazo := FALSE;
    v_motivo_prazo := 'Comprador não especificou seu prazo de decisão';
  ELSE
    IF v_prazo_prop_norm ILIKE '%60 dias%' OR v_prazo_prop_norm ILIKE '%sessenta dias%' THEN
      v_urgencia_prop := 3;
    ELSIF v_prazo_prop_norm ILIKE '%6 meses%' OR v_prazo_prop_norm ILIKE '%seis meses%' THEN
      v_urgencia_prop := 2;
    ELSIF v_prazo_prop_norm ILIKE '%sem pressa%' THEN
      v_urgencia_prop := 1;
    ELSE
      v_urgencia_prop := 2;
    END IF;

    IF v_prazo_inv_norm ILIKE '%30%' THEN
      v_urgencia_inv := 3;
    ELSIF v_prazo_inv_norm ILIKE '%60%' THEN
      v_urgencia_inv := 2;
    ELSIF v_prazo_inv_norm ILIKE '%flex%' OR v_prazo_inv_norm ILIKE '%sem pressa%' THEN
      v_urgencia_inv := 1;
    ELSE
      v_urgencia_inv := 2;
    END IF;

    IF v_urgencia_inv <= v_urgencia_prop THEN
      v_status_prazo := TRUE;
      v_motivo_prazo := FORMAT('Prazo do comprador (%s) atende à urgência da venda do proprietário (%s)', v_investidor.prazo_decisao, v_venda.prazo_desejado);
    ELSE
      v_status_prazo := FALSE;
      v_motivo_prazo := FORMAT('Prazo do comprador (%s) exige decisão mais rápida do que a disponibilidade do proprietário (%s)', v_investidor.prazo_decisao, v_venda.prazo_desejado);
    END IF;
  END IF;

  -- ============================================================================
  -- CRITÉRIO 5: Situação Documental (Peso 10)
  -- ============================================================================
  SELECT 
    BOOL_OR(rotulo = 'matricula' OR rotulo ILIKE '%matricula%'),
    BOOL_OR(rotulo = 'iptu' OR rotulo ILIKE '%iptu%'),
    BOOL_OR(rotulo = 'certidao' OR rotulo ILIKE '%certida%')
  INTO 
    v_tem_matricula,
    v_tem_iptu,
    v_tem_certidao
  FROM public.lead_arquivos
  WHERE lead_id = p_lead_venda_id
    AND tipo = 'documento';

  v_tem_matricula := COALESCE(v_tem_matricula, FALSE);
  v_tem_iptu := COALESCE(v_tem_iptu, FALSE);
  v_tem_certidao := COALESCE(v_tem_certidao, FALSE);

  IF v_tem_matricula THEN
    v_status_docs := TRUE;
    v_motivo_docs := FORMAT(
      'Documento essencial (Matrícula) enviado com sucesso%s',
      CASE 
        WHEN v_tem_iptu AND v_tem_certidao THEN ' (comprovante de IPTU e certidões complementares também anexados)'
        WHEN v_tem_iptu THEN ' (comprovante de IPTU anexado)'
        WHEN v_tem_certidao THEN ' (certidões complementares anexadas)'
        ELSE ''
      END
    );
  ELSE
    v_status_docs := FALSE;
    v_motivo_docs := FORMAT(
      'Matrícula do imóvel não enviada (documento obrigatório para regularidade)%s',
      CASE 
        WHEN v_tem_iptu THEN ' [IPTU anexado]'
        WHEN v_tem_certidao THEN ' [Certidão anexada]'
        ELSE ''
      END
    );
  END IF;

  -- ============================================================================
  -- TOTALIZAÇÃO: Soma dos 5 critérios (30 + 25 + 20 + 15 + 10 = 100)
  -- ============================================================================
  v_total_percentual := 
    (CASE WHEN v_status_preco THEN v_peso_preco ELSE 0 END) +
    (CASE WHEN v_status_cidade THEN v_peso_cidade ELSE 0 END) +
    (CASE WHEN v_status_objetivo THEN v_peso_objetivo ELSE 0 END) +
    (CASE WHEN v_status_prazo THEN v_peso_prazo ELSE 0 END) +
    (CASE WHEN v_status_docs THEN v_peso_docs ELSE 0 END);

  v_criterio_preco := jsonb_build_object(
    'criterio', 'faixa_preco',
    'nome', 'Faixa de preço',
    'peso', v_peso_preco,
    'atendido', v_status_preco,
    'pontos', CASE WHEN v_status_preco THEN v_peso_preco ELSE 0 END,
    'explicacao', v_motivo_preco
  );

  v_criterio_cidade := jsonb_build_object(
    'criterio', 'cidade',
    'nome', 'Cidade',
    'peso', v_peso_cidade,
    'atendido', v_status_cidade,
    'pontos', CASE WHEN v_status_cidade THEN v_peso_cidade ELSE 0 END,
    'explicacao', v_motivo_cidade
  );

  v_criterio_objetivo := jsonb_build_object(
    'criterio', 'objetivo_vs_tipo',
    'nome', 'Objetivo / Finalidade contra tipo do imóvel',
    'peso', v_peso_objetivo,
    'atendido', v_status_objetivo,
    'pontos', CASE WHEN v_status_objetivo THEN v_peso_objetivo ELSE 0 END,
    'explicacao', v_motivo_objetivo
  );

  v_criterio_prazo := jsonb_build_object(
    'criterio', 'prazo',
    'nome', 'Prazo',
    'peso', v_peso_prazo,
    'atendido', v_status_prazo,
    'pontos', CASE WHEN v_status_prazo THEN v_peso_prazo ELSE 0 END,
    'explicacao', v_motivo_prazo
  );

  v_criterio_docs := jsonb_build_object(
    'criterio', 'situacao_documental',
    'nome', 'Situação documental',
    'peso', v_peso_docs,
    'atendido', v_status_docs,
    'pontos', CASE WHEN v_status_docs THEN v_peso_docs ELSE 0 END,
    'explicacao', v_motivo_docs
  );

  v_arr_todos := jsonb_build_array(
    v_criterio_preco,
    v_criterio_cidade,
    v_criterio_objetivo,
    v_criterio_prazo,
    v_criterio_docs
  );

  IF v_status_preco THEN v_arr_atendidos := v_arr_atendidos || v_criterio_preco; ELSE v_arr_nao_atendidos := v_arr_nao_atendidos || v_criterio_preco; END IF;
  IF v_status_cidade THEN v_arr_atendidos := v_arr_atendidos || v_criterio_cidade; ELSE v_arr_nao_atendidos := v_arr_nao_atendidos || v_criterio_cidade; END IF;
  IF v_status_objetivo THEN v_arr_atendidos := v_arr_atendidos || v_criterio_objetivo; ELSE v_arr_nao_atendidos := v_arr_nao_atendidos || v_criterio_objetivo; END IF;
  IF v_status_prazo THEN v_arr_atendidos := v_arr_atendidos || v_criterio_prazo; ELSE v_arr_nao_atendidos := v_arr_nao_atendidos || v_criterio_prazo; END IF;
  IF v_status_docs THEN v_arr_atendidos := v_arr_atendidos || v_criterio_docs; ELSE v_arr_nao_atendidos := v_arr_nao_atendidos || v_criterio_docs; END IF;

  RETURN QUERY SELECT 
    v_total_percentual,
    v_arr_todos,
    v_arr_atendidos,
    v_arr_nao_atendidos;
END;
$$;
