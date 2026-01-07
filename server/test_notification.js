const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const testNotification = async () => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // Get a user
        const res = await client.query('SELECT user_id, name, email FROM users LIMIT 1');
        if (res.rows.length === 0) {
            console.log('No users found to test notification.');
            return;
        }

        const user = res.rows[0];
        console.log(`Found user: ${user.name} (${user.email})`);

        // Insert notification
        const insertRes = await client.query(`
            INSERT INTO notifications (user_id, message, type, is_read)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [user.user_id, 'Test notification from Antigravity', 'TEST', false]);

        console.log('Notification inserted:', insertRes.rows[0]);

    } catch (err) {
        console.error('Error testing notification:', err);
    } finally {
        await client.end();
    }
};

testNotification();
