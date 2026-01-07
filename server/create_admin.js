const { Client } = require('pg');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const createAdmin = async () => {
    const adminEmail = "admin@foodbridge.com";
    const adminPass = "admin123";

    try {
        await client.connect();

        // Check if admin exists
        const res = await client.query("SELECT * FROM users WHERE email = $1", [adminEmail]);
        if (res.rows.length > 0) {
            console.log("Admin user already exists.");
            return;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPass, salt);

        // Insert Admin
        await client.query(`
            INSERT INTO users (name, email, password, role, phone)
            VALUES ('System Admin', $1, $2, 'ADMIN', '0000000000')
        `, [adminEmail, hashedPassword]);

        console.log(`Admin created successfully! \nEmail: ${adminEmail} \nPassword: ${adminPass}`);

    } catch (e) {
        console.error("Error creating admin:", e);
    } finally {
        await client.end();
    }
}
createAdmin();
