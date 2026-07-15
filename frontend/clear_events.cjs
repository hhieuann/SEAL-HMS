const { Client } = require('pg');

const client = new Client({
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'seal_hms',
});

async function clearData() {
  try {
    await client.connect();
    console.log('Connected to database seal_hms');

    // We will truncate the main tables. 
    // CASCADE will automatically truncate any tables that have foreign keys pointing to these tables 
    // (e.g., round, team, team_member, score, submission, etc.)
    // We EXCLUDE account, student, lecturer, staff, chapter to keep users intact.
    
    const tablesToClear = [
      'event',
      'audit_log',
      'announcement',
      'mentor_message'
    ];

    console.log('Clearing events and related data (rounds, teams, scores, etc.)...');
    
    for (const table of tablesToClear) {
      const res = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1
        );
      `, [table]);
      
      if (res.rows[0].exists) {
        console.log(`Truncating ${table} CASCADE...`);
        await client.query(`TRUNCATE TABLE ${table} CASCADE;`);
      }
    }

    console.log('\n✅ Successfully cleared all events, teams, and tournament data!');
    console.log('✅ Accounts (Admin, Staff, Student, Lecturer, Guest Judge) have been PRESERVED.');
  } catch (err) {
    console.error('Error during data clearing:', err);
  } finally {
    await client.end();
  }
}

clearData();
