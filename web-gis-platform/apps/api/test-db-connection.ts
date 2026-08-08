import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function testConnection() {
  const dbUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;

  console.log('Testing DATABASE_URL (Pooler)...');
  console.log('URL:', dbUrl ? dbUrl.replace(/:[^:@]+@/, ':****@') : 'Not defined');

  if (dbUrl) {
    const client = new Client({ connectionString: dbUrl });
    try {
      await client.connect();
      console.log('✅ Connected to DATABASE_URL successfully!');
      const res = await client.query('SELECT NOW()');
      console.log('Response:', res.rows[0]);
      await client.end();
    } catch (err: any) {
      console.error('❌ Connection to DATABASE_URL failed:');
      console.error(err);
    }
  }

  console.log('\nTesting DIRECT_URL (Direct/Session Pooler)...');
  console.log('URL:', directUrl ? directUrl.replace(/:[^:@]+@/, ':****@') : 'Not defined');

  if (directUrl) {
    const client = new Client({ connectionString: directUrl });
    try {
      await client.connect();
      console.log('✅ Connected to DIRECT_URL successfully!');
      const res = await client.query('SELECT NOW()');
      console.log('Response:', res.rows[0]);
      await client.end();
    } catch (err: any) {
      console.error('❌ Connection to DIRECT_URL failed:');
      console.error(err);
    }
  }
}

testConnection();
