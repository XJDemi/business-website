-- ========================================
-- XuanJi Technology - Supabase Table Setup
-- Run this in Supabase SQL Editor
-- ========================================

-- 1. Create news table (if not exists)
CREATE TABLE IF NOT EXISTS news (
  id SERIAL PRIMARY KEY,
  title JSONB DEFAULT '{}',
  summary JSONB DEFAULT '{}',
  content TEXT DEFAULT '',
  industry TEXT NOT NULL DEFAULT '',
  published BOOLEAN DEFAULT false,
  date TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on news
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Public read policy for news
CREATE POLICY news_public_read ON news
  FOR SELECT
  USING (true);


-- 2. Create case_studies table (if not exists)
CREATE TABLE IF NOT EXISTS case_studies (
  id SERIAL PRIMARY KEY,
  title JSONB DEFAULT '{}',
  summary JSONB DEFAULT '{}',
  client TEXT DEFAULT '',
  product TEXT DEFAULT '',
  industry TEXT NOT NULL DEFAULT '',
  published BOOLEAN DEFAULT false,
  image_url TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on case_studies
ALTER TABLE case_studies ENABLE ROW LEVEL SECURITY;

-- Public read policy for case_studies
CREATE POLICY case_studies_public_read ON case_studies
  FOR SELECT
  USING (true);


-- 3. Ensure RLS on existing tables (if not already done)
DO $$
BEGIN
  -- products
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'products_public_read') THEN
    CREATE POLICY products_public_read ON products FOR SELECT USING (true);
  END IF;

  -- categories
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'categories_public_read') THEN
    CREATE POLICY categories_public_read ON categories FOR SELECT USING (true);
  END IF;

  -- site_settings
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'site_settings' AND policyname = 'site_settings_public_read') THEN
    CREATE POLICY site_settings_public_read ON site_settings FOR SELECT USING (true);
  END IF;

  -- inquiries (allow anon insert)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inquiries' AND policyname = 'inquiries_public_insert') THEN
    CREATE POLICY inquiries_public_insert ON inquiries FOR INSERT WITH CHECK (true);
  END IF;

  -- visits (allow anon insert)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'visits' AND policyname = 'visits_public_insert') THEN
    CREATE POLICY visits_public_insert ON visits FOR INSERT WITH CHECK (true);
  END IF;

  -- users (allow anon read for login)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'users_public_select') THEN
    CREATE POLICY users_public_select ON users FOR SELECT USING (true);
  END IF;
END$$;


-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_news_industry ON news(industry);
CREATE INDEX IF NOT EXISTS idx_news_published ON news(published);
CREATE INDEX IF NOT EXISTS idx_case_studies_industry ON case_studies(industry);
CREATE INDEX IF NOT EXISTS idx_case_studies_published ON case_studies(published);


-- 5. Insert default news data (Biotech)
INSERT INTO news (title, summary, industry, published, date, sort_order) VALUES
(
  '{"en": "New Cell Freezer Line Launched", "zh": "新型细胞冷冻系列发布", "ru": "Запущена новая линия морозильных камер для клеток", "es": "Lanzamiento de nueva línea de congeladores celulares", "de": "Neue Zellengefrierserie gestartet", "fr": "Nouvelle ligne de congélateurs cellulaires lancée"}',
  '{"en": "Our latest programmable cell freezer range offers enhanced temperature control and sample safety for biotech research.", "zh": "我们最新的可编程细胞冷冻系列为生物技术研究提供了增强的温度控制和样品安全性。", "ru": "Наша новейшая линейка программируемых морозильных камер для клеток предлагает улучшенный контроль температуры и безопасность образцов для биотехнологических исследований.", "es": "Nuestra última gama de congeladores celulares programables ofrece un control de temperatura mejorado y seguridad de muestras para la investigación biotecnológica.", "de": "Unser neuestes Sortiment an programmierbaren Zellengefrieren bietet verbesserte Temperaturkontrolle und Probiensicherheit für die biotechnologische Forschung.", "fr": "Notre dernière gamme de congélateurs cellulaires programmables offre un contrôle de température amélioré et une sécurité des échantillons pour la recherche biotechnologique."}',
  'biotech', true, '2025-01-15', 0
),
(
  '{"en": "Cryobag Technology Innovation", "zh": "Cryobag技术创新", "ru": "Инновация технологии Cryobag", "es": "Innovación en tecnología Cryobag", "de": "Cryobag-Technologieinnovation", "fr": "Innovation technologique Cryobag"}',
  '{"en": "Advanced cryobag solutions for safe and efficient cell storage in clinical and research settings.", "zh": "先进的cryobag解决方案，用于在临床和研究环境中安全高效地储存细胞。", "ru": "Передовые решения для криомешков для безопасного и эффективного хранения клеток в клинических и исследовательских условиях.", "es": "Soluciones avanzadas de bolsas criogénicas para el almacenamiento seguro y eficiente de células en entornos clínicos y de investigación.", "de": "Fortschrittliche Cryobag-Lösungen für die sichere und effiziente Lagerung von Zellen in klinischen und Forschungseinrichtungen.", "fr": "Solutions avancées de sacs cryogéniques pour le stockage sûr et efficace des cellules dans les environnements cliniques et de recherche."}',
  'biotech', true, '2025-01-10', 1
)
ON CONFLICT DO NOTHING;

-- 6. Insert default case studies (Biotech)
INSERT INTO case_studies (title, summary, client, product, industry, published, sort_order) VALUES
(
  '{"en": "Stem Cell Laboratory Success Story", "zh": "干细胞实验室成功案例", "ru": "Успешная история стволовой клеточной лаборатории", "es": "Historia de éxito de laboratorio de células madre", "de": "Erfolgsgeschichte eines Stammzell-Labors", "fr": "Histoire de succès du laboratoire de cellules souches"}',
  '{"en": "How our cell freezing solutions helped a leading research institute achieve 98% cell viability.", "zh": "我们的细胞冷冻解决方案如何帮助领先的研究机构实现98%的细胞存活率。", "ru": "Как наши решения для замораживания клеток помогли ведущему исследовательскому институту достичь 98% жизнеспособности клеток.", "es": "Cómo nuestras soluciones de congelación de células ayudaron a un instituto de investigación líder a lograr una viabilidad celular del 98%.", "de": "Wie unsere Zellgefrierlösungen einem führenden Forschungsinstitut geholfen haben, eine Zelllebensfähigkeit von 98% zu erreichen.", "fr": "Comment nos solutions de congélation cellulaire ont aidé un institut de recherche de premier plan à atteindre une viabilité cellulaire de 98%."}',
  'Research Institute', 'Cell Freezer', 'biotech', true, 0
),
(
  '{"en": "Immune Cell Therapy Case Study", "zh": "免疫细胞治疗案例研究", "ru": "Исследование случая иммунотерапии клеток", "es": "Estudio de caso de terapia de células inmunes", "de": "Fallstudie zur Immunzelltherapie", "fr": "Étude de cas sur la thérapie par cellules immunitaires"}',
  '{"en": "Clinical-grade cell transportation solutions enabling safe delivery of immune cell therapies.", "zh": "临床级细胞运输解决方案，确保免疫细胞疗法的安全递送。", "ru": "Решения для транспортировки клеток клинического уровня, обеспечивающие безопасную доставку иммунотерапий клеток.", "es": "Soluciones de transporte de células de grado clínico que permiten la entrega segura de terapias de células inmunes.", "de": "Kliniktaugliche Zelltransportlösungen, die eine sichere Lieferung von Immunzelltherapien ermöglichen.", "fr": "Solutions de transport cellulaire de grade clinique permettant la livraison sûre des thérapies par cellules immunitaires."}',
  'Hospital Group', 'Cryobag', 'biotech', true, 1
)
ON CONFLICT DO NOTHING;
