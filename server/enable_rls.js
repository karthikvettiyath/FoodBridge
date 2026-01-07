const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const enableRLS = async () => {
    try {
        await client.connect();
        console.log("Connected to database...");

        const tables = ['users', 'donors', 'ngos', 'volunteers', 'donations', 'pickups'];

        for (const table of tables) {
            console.log(`Enabling RLS on '${table}'...`);

            // Enable RLS
            await client.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);

            // Create Permissive Policy
            // Note: In a production app with Supabase Client accessing DB directly from frontend, 
            // you'd want stricter policies. Since we proxy via our Backend which handles Auth/RBAC, 
            // we can permit "service" usage or just open it to ensuring our backend (using Anon Key) can still read/write.
            // However, Supabase Anon Key counts as 'anon' role.
            // We will create a policy to allow ALL for now to prevent breakage, 
            // relying on our API Middleware for actual security.

            // Drop existing policy if any (to avoid error)
            await client.query(`DROP POLICY IF EXISTS "Enable all access" ON ${table};`);

            // Create new policy
            await client.query(`
                CREATE POLICY "Enable all access" 
                ON ${table} 
                FOR ALL 
                USING (true) 
                WITH CHECK (true);
            `);
        }

        console.log("✅ RLS Enabled and Policies applied successfully!");

    } catch (e) {
        console.error("❌ Error enabling RLS:", e);
    } finally {
        await client.end();
    }
}

enableRLS();
