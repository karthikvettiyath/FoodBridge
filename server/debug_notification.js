const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const inspectNotification = async () => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const notificationId = '9b575bde-220a-4e18-8bbb-16f4f92df2dc';
        console.log(`Inspecting notification: ${notificationId}`);

        // Get notification details
        const res = await client.query('SELECT * FROM notifications WHERE notification_id = $1', [notificationId]);

        if (res.rows.length === 0) {
            console.log('Notification NOT FOUND in database.');
        } else {
            console.log('Notification FOUND:');
            console.log(res.rows[0]);

            // Get user details for this notification
            const userRes = await client.query('SELECT user_id, name, email, role FROM users WHERE user_id = $1', [res.rows[0].user_id]);
            if (userRes.rows.length > 0) {
                console.log('Associated User:', userRes.rows[0]);
            } else {
                console.log('Associated User NOT FOUND.');
            }
        }

    } catch (err) {
        console.error('Error in inspection:', err);
    } finally {
        await client.end();
    }
};

inspectNotification();
