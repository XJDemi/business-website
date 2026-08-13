require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  const grantSQL = `
    GRANT SELECT ON public.users TO service_role;
    GRANT INSERT ON public.users TO service_role;
    GRANT SELECT ON public.products TO service_role;
    GRANT SELECT ON public.categories TO service_role;
    GRANT SELECT ON public.visits TO service_role;
    GRANT SELECT ON public.inquiries TO service_role;
  `;
  
  console.log('Executing GRANT statements via Supabase SDK...');
  
  try {
    const { data, error } = await supabase.rpc('execute_sql', { sql: grantSQL });
    if (error) {
      console.log('RPC error:', error);
      throw error;
    }
    console.log('GRANT statements executed:', data);
  } catch (error) {
    console.error('Failed:', error);
    
    console.log('\nPlease run these GRANT statements manually in Supabase SQL Editor:');
    console.log(grantSQL);
  }
}

main().catch(console.error);
