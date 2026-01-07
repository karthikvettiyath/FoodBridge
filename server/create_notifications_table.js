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
        console.log("Creating notifications table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                notification_id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
                user_id uuid REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
                message text NOT NULL,
                is_read boolean DEFAULT false,
                type text,
                created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
            );
        `);
        console.log("Migration successful");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await client.end();
    }
}
migrate();
