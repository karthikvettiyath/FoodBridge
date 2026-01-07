
const axios = require('axios');
const fs = require('fs');
const API_URL = 'http://localhost:5000/api';

// Utils
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const log = (msg) => {
    console.log(`[TEST] ${msg}`);
    fs.appendFileSync('test_debug.log', `[TEST] ${msg}\n`);
};

// Clear log file
fs.writeFileSync('test_debug.log', '');

async function runTest() {
    try {
        log("Starting Integration Test...");

        // 1. Register/Login Users
        // We'll use unique emails to avoid conflicts or just login if exists (hard with this simple script, let's just make new ones)
        const timestamp = Date.now();
        const donorUser = { name: 'Donor Test', email: `donor_${timestamp}@test.com`, password: 'password123', role: 'DONOR', phone: '1234567890', address: '123 Donor St' };
        const ngoUser = { name: 'NGO Test', email: `ngo_${timestamp}@test.com`, password: 'password123', role: 'NGO', phone: '0987654321', organization_name: 'Test NGO', address: '456 NGO Rd' };
        const volUser = { name: 'Vol Test', email: `vol_${timestamp}@test.com`, password: 'password123', role: 'VOLUNTEER', phone: '1122334455' };

        // Helper to auth
        async function getAuth(user) {
            log(`Registering ${user.role}...`);
            await axios.post(`${API_URL}/auth/register`, user);
            const res = await axios.post(`${API_URL}/auth/login`, { email: user.email, password: user.password });
            return res.data.token;
        }

        const donorToken = await getAuth(donorUser);
        const ngoToken = await getAuth(ngoUser);
        const volToken = await getAuth(volUser);

        log("Users created and logged in.");

        // 2. Donor Posts Donation
        log("Date: Posting Donation...");
        const donationData = {
            food_name: "Test Biryani",
            food_type: "NON_VEG",
            quantity: 20,
            prepared_time: new Date().toISOString(),
            expiry_time: new Date(Date.now() + 86400000).toISOString(),
            latitude: 12.9716,
            longitude: 77.5946
        };
        const donationRes = await axios.post(`${API_URL}/donations`, donationData, { headers: { 'Authorization': donorToken } });
        const donationId = donationRes.data.donation_id;
        log(`Donation Created: ID ${donationId} [${donationRes.data.status}]`);

        // 3. NGO Requests Donation
        log("NGO: Requesting Donation...");
        const reqQty = 15;
        // Verify it appears in nearby (optional but good)
        // const nearby = await axios.get(`${API_URL}/ngo/nearby`, { headers: { 'Authorization': ngoToken } });
        // log(`NGO found ${nearby.data.length} nearby donations.`);

        await axios.put(`${API_URL}/ngo/donations/${donationId}/request`, { quantity: reqQty }, { headers: { 'Authorization': ngoToken } });
        log("NGO Request sent.");

        // 4. Donor Approves Request
        log("Donor: Approving Request...");
        await axios.put(`${API_URL}/donations/${donationId}/approve`, {}, { headers: { 'Authorization': donorToken } });
        log("Donation Approved.");

        // 5. Volunteer Sees Invitation and Accepts
        log("Volunteer: Checking Invitations...");
        const invites = await axios.get(`${API_URL}/volunteer/invitations`, { headers: { 'Authorization': volToken } });
        const targetInvite = invites.data.find(d => d.donation_id === donationId);

        if (!targetInvite) throw new Error("Volunteer validation failed: Donation not found in invitations.");
        log("Volunteer found invitation.");

        log("Volunteer: Accepting Job...");
        const pickupRes = await axios.post(`${API_URL}/volunteer/accept`, { donationId }, { headers: { 'Authorization': volToken } });
        const pickupId = pickupRes.data.pickup_id;
        log(`Job Accepted. Pickup ID: ${pickupId}`);

        // 6. Delivery Flow
        const steps = ['ACCEPTED_PASSAGE', 'OUT_FOR_DELIVERY', 'NEAR_LOCATION', 'DELIVERED'];
        for (const status of steps) {
            log(`Volunteer: Updating status to ${status}...`);
            await axios.put(`${API_URL}/volunteer/pickups/${pickupId}/status`, { status }, { headers: { 'Authorization': volToken } });
            await sleep(500); // simulate time
        }

        log("Delivery Cycle Complete.");
        log("TEST PASSED SUCCESSFULLY! ✅");

    } catch (err) {
        console.error("TEST FAILED ❌");
        fs.appendFileSync('test_debug.log', "TEST FAILED ❌\n");
        if (err.response) {
            console.error(`API Error: ${err.response.status} - ${JSON.stringify(err.response.data)}`);
            fs.appendFileSync('test_debug.log', `API Error: ${err.response.status} - ${JSON.stringify(err.response.data)}\n`);
        } else {
            console.error(err.message);
            fs.appendFileSync('test_debug.log', `${err.message}\n`);
        }
    }
}

runTest();
