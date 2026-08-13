require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  console.log('Checking for admin user...');
  const { data: existingUsers } = await supabase.from('users').select('*').eq('username', 'admin');
  
  console.log('Existing users:', existingUsers);
  
  if (existingUsers && existingUsers.length === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    
    console.log('Creating admin user...');
    
    const { data: inserted, error: insertError } = await supabase.from('users').insert([{
      username: 'admin',
      password: hashedPassword
    }]).select();
    
    if (insertError) {
      console.error('Error creating admin:', insertError);
      console.log('\nPlease run these SQL statements manually in Supabase SQL Editor:');
      console.log(`
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO service_role;
INSERT INTO users (username, password) VALUES ('admin', '${hashedPassword}');
      `);
    } else {
      console.log('Admin user created successfully:', inserted);
    }
  } else {
    console.log('Admin user already exists or could not check');
  }
}

main().catch(console.error);
