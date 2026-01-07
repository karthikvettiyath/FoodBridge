const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const addIndexes = async () => {
    try {
        await client.connect();
        console.log("Connected to database...");

        const indexes = [
            // Donations
            { table: 'donations', col: 'donor_id', name: 'idx_donations_donor_id' },
            { table: 'donations', col: 'ngo_id', name: 'idx_donations_ngo_id' },

            // Pickups
            { table: 'pickups', col: 'donation_id', name: 'idx_pickups_donation_id' },
            { table: 'pickups', col: 'volunteer_id', name: 'idx_pickups_volunteer_id' },

            // Volunteers
            { table: 'volunteers', col: 'user_id', name: 'idx_volunteers_user_id' },

            // Extras (Good practice based on schema pattern)
            { table: 'donors', col: 'user_id', name: 'idx_donors_user_id' },
            { table: 'ngos', col: 'user_id', name: 'idx_ngos_user_id' }
        ];

        for (const idx of indexes) {
            console.log(`Creating index '${idx.name}' on ${idx.table}(${idx.col})...`);
            await client.query(`
                CREATE INDEX IF NOT EXISTS ${idx.name} 
                ON ${idx.table} (${idx.col});
            `);
        }

        console.log("✅ All foreign key indexes created successfully!");

    } catch (e) {
        console.error("❌ Error adding indexes:", e);
    } finally {
        await client.end();
    }
}

addIndexes();
