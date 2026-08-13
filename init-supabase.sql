-- ============================================
-- 安全的数据库初始化脚本
-- 不会删除任何现有数据！
-- ============================================
-- CREATE TABLE IF NOT EXISTS: 仅在表不存在时创建，不影响已有数据
-- CREATE INDEX IF NOT EXISTS: 仅在索引不存在时创建
-- DROP POLICY: 仅删除旧的权限策略，不影响数据
-- ============================================

-- 创建表（仅在表不存在时创建）
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  industry TEXT NOT NULL,
  description TEXT,
  specifications TEXT,
  price_range TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  translations JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visits (
  id SERIAL PRIMARY KEY,
  session_id TEXT,
  page_url TEXT,
  page_title TEXT,
  referrer TEXT,
  country TEXT,
  ip TEXT,
  user_agent TEXT,
  device_type TEXT,
  duration INTEGER DEFAULT 0,
  is_new INTEGER DEFAULT 0,
  search_keyword TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inquiries (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  industry TEXT,
  product TEXT,
  message TEXT NOT NULL,
  source_page TEXT,
  session_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引（仅在索引不存在时创建）
CREATE INDEX IF NOT EXISTS idx_visits_session ON visits(session_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_session ON inquiries(session_id);
CREATE INDEX IF NOT EXISTS idx_products_industry ON products(industry);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_categories_industry ON categories(industry);

-- 启用行级安全（RLS）- 不会删除数据
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 删除旧的权限策略（仅删除策略，不影响数据）
DROP POLICY IF EXISTS "products_public_read" ON products;
DROP POLICY IF EXISTS "categories_public_read" ON categories;
DROP POLICY IF EXISTS "visits_public_insert" ON visits;
DROP POLICY IF EXISTS "visits_admin_read" ON visits;
DROP POLICY IF EXISTS "inquiries_public_insert" ON inquiries;
DROP POLICY IF EXISTS "inquiries_admin_read" ON inquiries;
DROP POLICY IF EXISTS "users_public_read" ON users;
DROP POLICY IF EXISTS "products_admin_insert" ON products;
DROP POLICY IF EXISTS "products_admin_update" ON products;
DROP POLICY IF EXISTS "products_admin_delete" ON products;
DROP POLICY IF EXISTS "categories_admin_insert" ON categories;
DROP POLICY IF EXISTS "categories_admin_update" ON categories;
DROP POLICY IF EXISTS "categories_admin_delete" ON categories;
DROP POLICY IF EXISTS "products_admin_write" ON products;
DROP POLICY IF EXISTS "categories_admin_write" ON categories;
DROP POLICY IF EXISTS "users_admin_access" ON users;
DROP POLICY IF EXISTS "users_admin_write" ON users;

-- 创建新的权限策略
-- ① 访客仅允许读取公开产品信息
CREATE POLICY "products_public_read" ON products FOR SELECT USING (true);
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);

-- ② 访客可提交访问记录和留言
CREATE POLICY "visits_public_insert" ON visits FOR INSERT WITH CHECK (true);
CREATE POLICY "inquiries_public_insert" ON inquiries FOR INSERT WITH CHECK (true);

-- ③ 登录后的后台管理员账号可查看访问记录和留言
CREATE POLICY "visits_admin_read" ON visits FOR SELECT USING (true);
CREATE POLICY "inquiries_admin_read" ON inquiries FOR SELECT USING (true);

-- ④ 用户表公开读取（用于登录验证）
CREATE POLICY "users_public_read" ON users FOR SELECT USING (true);

-- ⑤ 管理员可新增/编辑/删除产品和分类
CREATE POLICY "products_admin_insert" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "products_admin_update" ON products FOR UPDATE WITH CHECK (true);
CREATE POLICY "products_admin_delete" ON products FOR DELETE USING (true);
CREATE POLICY "categories_admin_insert" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "categories_admin_update" ON categories FOR UPDATE WITH CHECK (true);
CREATE POLICY "categories_admin_delete" ON categories FOR DELETE USING (true);

-- 授权角色权限
GRANT SELECT ON public.products TO anon, authenticated, service_role;
GRANT SELECT ON public.categories TO anon, authenticated, service_role;
GRANT INSERT ON public.visits TO anon, authenticated, service_role;
GRANT SELECT ON public.visits TO authenticated, service_role;
GRANT INSERT ON public.inquiries TO anon, authenticated, service_role;
GRANT SELECT ON public.inquiries TO authenticated, service_role;
GRANT SELECT ON public.users TO anon, authenticated, service_role;
GRANT INSERT ON public.users TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated, service_role;

-- 授权序列访问权限（用于插入数据）
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE products_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE categories_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE visits_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE inquiries_id_seq TO service_role;

-- 创建默认管理员用户（仅当不存在时）
-- 密码: admin123 (bcrypt hash)
INSERT INTO users (username, password)
SELECT 'admin', '$2a$10$NOQkw3ld3vEhaE4bjso3tOZVKe0J8mbn.xX2yT5DOUyQ9bfqbwhUC'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

-- 刷新PostgREST schema缓存
NOTIFY pgrst, 'reload schema';

-- ============================================
-- 脚本执行完成，所有现有数据保持不变
-- ============================================
