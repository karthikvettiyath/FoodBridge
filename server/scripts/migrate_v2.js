
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        await client.connect();
        console.log("Connected to Database.");

        // 1. Alter 'donations' table to add 'requested_quantity' and 'request_status'
        console.log("Altering donations table...");
        await client.query(`
            ALTER TABLE donations 
            ADD COLUMN IF NOT EXISTS requested_quantity INTEGER,
            ADD COLUMN IF NOT EXISTS request_status TEXT DEFAULT 'NONE',
            ADD COLUMN IF NOT EXISTS ngo_id INTEGER;
        `);

        // 2. Change 'status' column in 'donations' to TEXT to allow flexible statuses
        // This drops the enum constraint effectively
        console.log("Converting donations.status to TEXT...");
        await client.query(`
            ALTER TABLE donations 
            ALTER COLUMN status TYPE TEXT;
        `);

        // 3. Change 'status' column in 'pickups' to TEXT
        console.log("Converting pickups.status to TEXT...");
        await client.query(`
            ALTER TABLE pickups 
            ALTER COLUMN status TYPE TEXT;
        `);

        // 4. Update 'ngo_id' FK constraint if it logic was missing or just ensure
        // We assume ngo_id maps to ngos(ngo_id). Likely already there if previous plan was followed.
        // But if not, we can add it. 
        // Let's check if we can add FK if not exists. It's complex in SQL.
        // We'll skip adding constraint for now to avoid errors if it exists.

        console.log("Migration completed successfully!");

    } catch (err) {
        console.error("Migration Failed:", err);
    } finally {
        await client.end();
    }
}

migrate();
