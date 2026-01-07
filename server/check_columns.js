const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const check = async () => {
    try {
        await client.connect();
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'donations';
        `);
        console.log("Donations Columns:", res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
check();
