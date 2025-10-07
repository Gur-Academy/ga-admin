const pool = require('./config/db');
const supabase = require('./config/supabase');


async function testPostgreSQLConnection() {
  console.log('\nTesting PostgreSQL connection...');
  let client;
  try {
    client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL database');


    // Test query
    const result = await client.query('SELECT version()');
    console.log('📊 Database version:', result.rows[0].version);


    return true;
  } catch (error) {
    console.error('❌ Error connecting to PostgreSQL:', error.message);
    return false;
  } finally {
    if (client) client.release();
  }
}


async function testSupabaseConnection() {
  console.log('\nTesting Supabase connection...');
  try {
    // Test query to check a table exists (adjust table name as needed)
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .limit(1);


    if (error) throw error;


    console.log('✅ Successfully connected to Supabase');
    console.log('🔒 Auth service is accessible');
    if (data && data.length) {
      console.log('🧪 Sample row:', data[0]);
    }
    return true;
  } catch (error) {
    console.error('❌ Error connecting to Supabase:', error.message);
    return false;
  }
}


async function testAllConnections() {
  console.log('🚀 Starting connection tests...');


  const pgSuccess = await testPostgreSQLConnection();
  const supabaseSuccess = await testSupabaseConnection();


  console.log('\n📋 Test Summary:');
  console.log(`- PostgreSQL: ${pgSuccess ? '✅ Connected' : '❌ Failed'}` );
  console.log(`- Supabase: ${supabaseSuccess ? '✅ Connected' : '❌ Failed'}` 

);


  // Exit with appropriate status code
  process.exit(pgSuccess && supabaseSuccess ? 0 : 1);
}


if (require.main === module) {
  testAllConnections();
}
