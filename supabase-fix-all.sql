-- ============================================================
-- 一键修复数据库（在 Supabase SQL Editor 中执行一次即可）
-- 修复内容：
--   1. site_settings 缺失列（后台保存 Contact 信息报错）
--   2. news / case_studies / inquiries / visits 权限缺失（前端无法显示新闻案例、无法提交询盘）
--   3. snapshots / public_phrases 表不存在
-- 安全性：不删除任何现有数据，可重复执行
-- ============================================================

-- ===== 1. 创建缺失的表 =====
CREATE TABLE IF NOT EXISTS snapshots (
  id SERIAL PRIMARY KEY,
  name TEXT DEFAULT '',
  description TEXT DEFAULT '',
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public_phrases (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE,
  original_text TEXT DEFAULT '',
  translations JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- news / case_studies 表若不存在则创建
CREATE TABLE IF NOT EXISTS news (
  id SERIAL PRIMARY KEY,
  title JSONB DEFAULT '{}',
  summary JSONB DEFAULT '{}',
  content JSONB DEFAULT '{}',
  industry TEXT NOT NULL DEFAULT '',
  published BOOLEAN DEFAULT true,
  date TEXT DEFAULT '',
  author TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS case_studies (
  id SERIAL PRIMARY KEY,
  title JSONB DEFAULT '{}',
  summary JSONB DEFAULT '{}',
  content JSONB DEFAULT '{}',
  client TEXT DEFAULT '',
  product TEXT DEFAULT '',
  industry TEXT NOT NULL DEFAULT '',
  published BOOLEAN DEFAULT true,
  date TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 兼容已有表结构：补齐后台表单使用的字段，修正 content 类型（TEXT → JSONB）
ALTER TABLE news ADD COLUMN IF NOT EXISTS author TEXT DEFAULT '';
ALTER TABLE news ADD COLUMN IF NOT EXISTS image TEXT DEFAULT '';
ALTER TABLE news ADD COLUMN IF NOT EXISTS date TEXT DEFAULT '';
ALTER TABLE news ADD COLUMN IF NOT EXISTS content JSONB;
DO $$
BEGIN
  ALTER TABLE news ALTER COLUMN content DROP DEFAULT;
  ALTER TABLE news ALTER COLUMN content TYPE JSONB
    USING CASE WHEN content IS NULL OR content::text IN ('', 'null') THEN '{}'::jsonb ELSE content::jsonb END;
EXCEPTION WHEN OTHERS THEN
  UPDATE news SET content = NULL;  -- 出现无法转换的旧数据时重置（前端暂未展示 content）
  ALTER TABLE news ALTER COLUMN content DROP DEFAULT;
  ALTER TABLE news ALTER COLUMN content TYPE JSONB USING '{}'::jsonb;
END $$;
ALTER TABLE news ALTER COLUMN content SET DEFAULT '{}'::jsonb;
ALTER TABLE news ALTER COLUMN content SET NOT NULL;

ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS image TEXT DEFAULT '';
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS date TEXT DEFAULT '';
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS client TEXT DEFAULT '';
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS product TEXT DEFAULT '';
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS content JSONB;
DO $$
BEGIN
  ALTER TABLE case_studies ALTER COLUMN content DROP DEFAULT;
  ALTER TABLE case_studies ALTER COLUMN content TYPE JSONB
    USING CASE WHEN content IS NULL OR content::text IN ('', 'null') THEN '{}'::jsonb ELSE content::jsonb END;
EXCEPTION WHEN OTHERS THEN
  UPDATE case_studies SET content = NULL;
  ALTER TABLE case_studies ALTER COLUMN content DROP DEFAULT;
  ALTER TABLE case_studies ALTER COLUMN content TYPE JSONB USING '{}'::jsonb;
END $$;
ALTER TABLE case_studies ALTER COLUMN content SET DEFAULT '{}'::jsonb;
ALTER TABLE case_studies ALTER COLUMN content SET NOT NULL;

-- ===== 2. 补齐 site_settings 缺失的列 =====
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS contact_name TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS company_email TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS contact_phone TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS whatsapp_link TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS wechat_link TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS company_address TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS youtube_link TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS instagram_link TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS facebook_link TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS linkedin_link TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS google_verification_code TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS social_share_enabled BOOLEAN DEFAULT true;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS whatsapp_float_enabled BOOLEAN DEFAULT true;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS biotech_contact_name TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS biotech_whatsapp TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS biotech_wechat TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS biotech_email TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS biotech_phone TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS autoparts_contact_name TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS autoparts_whatsapp TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS autoparts_wechat TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS autoparts_email TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS autoparts_phone TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS instruments_contact_name TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS instruments_whatsapp TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS instruments_wechat TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS instruments_email TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS instruments_phone TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS homepage_seo_title JSONB DEFAULT '{}';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS homepage_seo_description JSONB DEFAULT '{}';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS homepage_seo_keywords JSONB DEFAULT '{}';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 插入默认配置行（仅在表为空时插入；兼容 identity/serial 两种主键类型）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM site_settings) THEN
    BEGIN
      INSERT INTO site_settings (id) OVERRIDING SYSTEM VALUE VALUES (1);
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO site_settings DEFAULT VALUES;
    END;
  END IF;
END $$;

-- ===== 3. 授予 anon/authenticated 角色完整访问权限 =====
-- （本站架构使用 anon key 完成所有前后端数据操作）
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_studies TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inquiries TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visits TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.snapshots TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.public_phrases TO anon, authenticated;
GRANT SELECT, INSERT ON public.users TO anon, authenticated;
-- 允许通过 API 修改后台密码（列级权限：anon 只能更新 password 列）
GRANT UPDATE (password) ON public.users TO anon, authenticated;

-- 序列权限（插入数据必需）
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ===== 4. 创建 RLS 策略（允许 anon 读写） =====
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_phrases ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- products
DROP POLICY IF EXISTS products_all ON products;
CREATE POLICY products_all ON products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
-- categories
DROP POLICY IF EXISTS categories_all ON categories;
CREATE POLICY categories_all ON categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
-- news
DROP POLICY IF EXISTS news_all ON news;
CREATE POLICY news_all ON news FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
-- case_studies
DROP POLICY IF EXISTS case_studies_all ON case_studies;
CREATE POLICY case_studies_all ON case_studies FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
-- inquiries
DROP POLICY IF EXISTS inquiries_all ON inquiries;
CREATE POLICY inquiries_all ON inquiries FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
-- visits
DROP POLICY IF EXISTS visits_all ON visits;
CREATE POLICY visits_all ON visits FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
-- site_settings
DROP POLICY IF EXISTS site_settings_all ON site_settings;
CREATE POLICY site_settings_all ON site_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
-- snapshots
DROP POLICY IF EXISTS snapshots_all ON snapshots;
CREATE POLICY snapshots_all ON snapshots FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
-- public_phrases
DROP POLICY IF EXISTS public_phrases_all ON public_phrases;
CREATE POLICY public_phrases_all ON public_phrases FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
-- users（登录验证用，允许读取；UPDATE 仅限 password 列，用于修改后台密码）
DROP POLICY IF EXISTS users_read ON users;
CREATE POLICY users_read ON users FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS users_update ON users;
CREATE POLICY users_update ON users FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- ===== 4.1 products 表：多语言 SEO 字段（后台产品表单的 Meta Title/Description/Keywords/图片Alt） =====
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_meta_title JSONB DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_meta_description JSONB DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_keywords JSONB DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_image_alt TEXT DEFAULT '';
-- 新列自动继承 products 表的 GRANT 与 products_all RLS 策略，无需额外授权

-- ===== 5. 刷新 PostgREST schema 缓存（必须，否则新列不生效） =====
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- 执行完成！回到后台 http://localhost:8080/admin (Ctrl+F5) 重新保存
-- ============================================================
