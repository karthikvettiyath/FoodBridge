
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        await client.connect();
        console.log("Connected to DB");

        // Drop check constraints if they exist
        // Note: The specific name 'donations_status_check' was given in the error.

        console.log("Dropping donations_status_check...");
        try {
            await client.query(`ALTER TABLE donations DROP CONSTRAINT IF EXISTS donations_status_check;`);
            console.log("Dropped donations_status_check");
        } catch (e) {
            console.log("Error dropping donations constraint (might not exist):", e.message);
        }

        console.log("Dropping pickups_status_check...");
        try {
            await client.query(`ALTER TABLE pickups DROP CONSTRAINT IF EXISTS pickups_status_check;`);
            console.log("Dropped pickups_status_check");
        } catch (e) {
            console.log("Error dropping pickups constraint (might not exist):", e.message);
        }

        // Also check if there are any other constraints or triggers?
        console.log("Done.");

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

run();
