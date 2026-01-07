const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';
const timestamp = Date.now();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const main = async () => {
    try {
        console.log("Starting Notification Flow Test...");

        // 1. Register Users
        const donorEmail = `donor_${timestamp}@notif.com`;
        const resDonor = await axios.post(`${API_URL}/auth/register`, { name: "Donor", email: donorEmail, password: "pass", role: "DONOR", phone: "111", address: "Address" });
        const donorToken = resDonor.data.token;
        const donorId = resDonor.data.user.id;

        const ngoEmail = `ngo_${timestamp}@notif.com`;
        const resNgo = await axios.post(`${API_URL}/auth/register`, { name: "NGO", email: ngoEmail, password: "pass", role: "NGO", phone: "222", organization_name: "NGO Org", address: "NGO Address" });
        const ngoToken = resNgo.data.token;
        const ngoId = resNgo.data.user.id;

        const volEmail = `vol_${timestamp}@notif.com`;
        const resVol = await axios.post(`${API_URL}/auth/register`, { name: "Vol", email: volEmail, password: "pass", role: "VOLUNTEER", phone: "333" });
        const volToken = resVol.data.token;

        // 2. Post Donation
        const resDon = await axios.post(`${API_URL}/donations`, {
            food_name: "Notif Food", food_type: "VEG", quantity: "10", prepared_time: new Date().toISOString(), expiry_time: new Date(Date.now() + 86400000).toISOString(), latitude: 0, longitude: 0
        }, { headers: { Authorization: donorToken } });
        const donationId = resDon.data.donation_id;
        console.log("Donation Posted:", donationId);

        // 3. NGO Request
        await axios.put(`${API_URL}/ngo/donations/${donationId}/request`, { quantity: 5 }, { headers: { Authorization: ngoToken } });
        console.log("NGO Requested");

        // 4. Donor Approve
        await axios.put(`${API_URL}/donations/${donationId}/approve`, {}, { headers: { Authorization: donorToken } });
        console.log("Donor Approved");

        // 5. Volunteer Accept (Should trigger notification)
        await axios.post(`${API_URL}/volunteer/accept`, { donationId }, { headers: { Authorization: volToken } });
        console.log("Volunteer Accepted (Notification should be sent)");

        // 6. Verify Notification in DB
        // Check for Donor Notification
        const { data: notifs, error } = await supabase.from('notifications').select('*').eq('user_id', donorId);
        if (error) throw error;

        console.log(`Found ${notifs.length} notifications for Donor.`);
        if (notifs.length > 0) {
            console.log("Notification content:", notifs[0].message);
        } else {
            console.error("FAIL: No notification found for donor.");
        }

        // Check for NGO Notification
        const { data: notifsNgo, error: errorNgo } = await supabase.from('notifications').select('*').eq('user_id', ngoId);
        if (errorNgo) throw errorNgo;
        console.log(`Found ${notifsNgo.length} notifications for NGO.`);

    } catch (err) {
        console.error("Test Failed:", err.message);
        if (err.response) console.error(err.response.data);
    }
};

main();
