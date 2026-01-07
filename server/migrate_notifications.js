const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const runMigration = async () => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to database...');

        const sql = `
            create table if not exists notifications (
              notification_id uuid default uuid_generate_v4() primary key,
              user_id uuid references users(user_id) on delete cascade not null,
              message text not null,
              type text,
              is_read boolean default false,
              created_at timestamp with time zone default timezone('utc'::text, now()) not null
            );
        `;

        console.log('Creating notifications table...');
        await client.query(sql);
        console.log('Notifications table created successfully!');

    } catch (err) {
        console.error('Error running migration:', err);
    } finally {
        await client.end();
    }
};

runMigration();
