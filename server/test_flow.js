const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const timestamp = Date.now();

// Helper to log steps
const log = (msg) => console.log(`\n[STEP] ${msg}`);

const main = async () => {
    try {
        log("Starting Full System Test...");

        // 1. Register Donor
        log("Registering Donor...");
        const donorEmail = `donor_${timestamp}@test.com`;
        const resDonorReg = await axios.post(`${API_URL}/auth/register`, {
            name: "Test Donor",
            email: donorEmail,
            password: "password123",
            role: "DONOR",
            phone: "1234567890",
            address: "123 Donor St"
        });
        const donorToken = resDonorReg.data.token;
        console.log("Donor Registered: ", donorEmail);

        // 2. Post Donation (As Donor)
        log("Posting Donation...");
        const resDonation = await axios.post(`${API_URL}/donations`, {
            food_name: "Test Rice",
            food_type: "VEG",
            quantity: "5kg",
            prepared_time: new Date().toISOString(),
            expiry_time: new Date(Date.now() + 86400000).toISOString(),
            latitude: 12.9716, // Bangalore coords example
            longitude: 77.5946
        }, { headers: { Authorization: donorToken } });
        const donationId = resDonation.data.donation_id;
        console.log("Donation Posted ID:", donationId);


        // 3. Register NGO
        log("Registering NGO...");
        const ngoEmail = `ngo_${timestamp}@test.com`;
        const resNgoReg = await axios.post(`${API_URL}/auth/register`, {
            name: "Test NGO Owner",
            email: ngoEmail,
            password: "password123",
            role: "NGO",
            phone: "0987654321",
            organization_name: "Helping Hands",
            address: "456 NGO Rd"
        });
        const ngoToken = resNgoReg.data.token;
        console.log("NGO Registered: ", ngoEmail);

        // 4. Update NGO Location (Manually via Supabase or just rely on 'nearby' returning all if no loc set - my logic returns all if no ngo loc set, so it works)

        // 5. Fetch Nearby (As NGO)
        log("Fetching Nearby Donations...");
        const resNearby = await axios.get(`${API_URL}/ngo/nearby`, { headers: { Authorization: ngoToken } });
        const foundDonation = resNearby.data.find(d => d.donation_id === donationId);
        if (!foundDonation) throw new Error("Donation not found in nearby list");
        console.log("Donation found in nearby list.");

        // 6. Accept Donation (As NGO)
        log("Accepting Donation...");
        await axios.put(`${API_URL}/ngo/donations/${donationId}/accept`, {}, { headers: { Authorization: ngoToken } });
        console.log("Donation Accepted.");

        // 7. Register Volunteer
        log("Registering Volunteer...");
        const volEmail = `vol_${timestamp}@test.com`;
        const resVolReg = await axios.post(`${API_URL}/auth/register`, {
            name: "Test Volunteer",
            email: volEmail,
            password: "password123",
            role: "VOLUNTEER",
            phone: "5555555555"
        });
        const volToken = resVolReg.data.token;
        const volId = resVolReg.data.user.id; // Start by getting USER ID then we need volunteer_id
        console.log("Volunteer Registered: ", volEmail);

        // We need the volunteer's internal ID from the volunteer table, not user table.
        // But the assign API takes `volunteer_id`.
        // Let's cheat and fetch all volunteers as NGO to find this new one.
        const resVols = await axios.get(`${API_URL}/ngo-activity/volunteers`, { headers: { Authorization: ngoToken } });
        const myVol = resVols.data.find(v => v.users.email === volEmail);
        if (!myVol) throw new Error("Volunteer not found in list");
        const volunteerId = myVol.volunteer_id;

        // 8. Assign Volunteer (As NGO)
        log("Assigning Volunteer...");
        await axios.post(`${API_URL}/ngo-activity/assign`, {
            donation_id: donationId,
            volunteer_id: volunteerId
        }, { headers: { Authorization: ngoToken } });
        console.log("Volunteer Assigned.");

        // 9. Check Pickups (As Volunteer)
        log("Checking Assigned Pickups...");
        const resPickups = await axios.get(`${API_URL}/volunteer/my-pickups`, { headers: { Authorization: volToken } });
        const myPickup = resPickups.data.find(p => p.donation_id === donationId);
        if (!myPickup) throw new Error("Pickup not found for volunteer");
        const pickupId = myPickup.pickup_id;
        console.log("Pickup found.");

        // 10. Mark Picked (As Volunteer)
        log("Marking as Picked...");
        await axios.put(`${API_URL}/volunteer/pickups/${pickupId}/status`, { status: "PICKED" }, { headers: { Authorization: volToken } });
        console.log("Status updated to PICKED.");

        // 11. Mark Delivered (As Volunteer)
        log("Marking as Delivered...");
        await axios.put(`${API_URL}/volunteer/pickups/${pickupId}/status`, { status: "DELIVERED" }, { headers: { Authorization: volToken } });
        console.log("Status updated to DELIVERED.");

        log("TEST COMPLETED SUCCESSFULLY! ✅");

    } catch (err) {
        console.error("TEST FAILED ❌");
        if (err.response) {
            console.error("API Error Response:", err.response.data);
        } else {
            console.error(err.message);
        }
    }
};

main();
