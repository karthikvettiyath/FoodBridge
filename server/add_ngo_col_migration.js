const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const migrate = async () => {
    try {
        await client.connect();
        console.log("Adding ngo_id to donations table...");
        await client.query(`
            ALTER TABLE donations 
            ADD COLUMN IF NOT EXISTS ngo_id uuid REFERENCES ngos(ngo_id) ON DELETE SET NULL;
        `);
        console.log("Migration successful");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await client.end();
    }
}
migrate();
