-- ============================================================
-- 修复 site_settings 表（解决后台保存 Contact 信息报错问题）
-- 使用方法：登录 Supabase 控制台 → SQL Editor → 粘贴执行
-- ============================================================

-- 1. 补齐所有缺失的列（IF NOT EXISTS 保证可重复执行）
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS contact_name TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS company_email TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS contact_phone TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS whatsapp_link TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS wechat_link TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS company_address TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS youtube_link TEXT DEFAULT '';
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

-- 2. 插入默认行（id=1），已存在则跳过
INSERT INTO site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 3. 授予 anon 角色读写权限（前台读取 + 后台保存）
GRANT SELECT, INSERT, UPDATE ON site_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON site_settings TO authenticated;

-- 4. 启用 RLS 并创建策略
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_settings_public_read ON site_settings;
CREATE POLICY site_settings_public_read ON site_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS site_settings_public_write ON site_settings;
CREATE POLICY site_settings_public_write ON site_settings
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS site_settings_public_insert ON site_settings;
CREATE POLICY site_settings_public_insert ON site_settings
  FOR INSERT WITH CHECK (true);

-- 5. 修正自增序列
SELECT setval(pg_get_serial_sequence('site_settings', 'id'),
  COALESCE((SELECT MAX(id) FROM site_settings), 1));

-- 完成！执行后刷新后台页面即可正常保存 Contact 信息。
