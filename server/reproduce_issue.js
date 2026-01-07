const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const timestamp = Date.now();

const main = async () => {
    try {
        console.log("Starting Reproduction Test...");

        // 1. Register Donor
        const donorEmail = `donor_${timestamp}@test.com`;
        const resDonor = await axios.post(`${API_URL}/auth/register`, {
            name: "Test Donor",
            email: donorEmail,
            password: "password123",
            role: "DONOR",
            phone: "1234567890",
            address: "123 Donor St"
        });
        const donorToken = resDonor.data.token;
        console.log("Donor Registered");

        // 2. Post Donation
        const resDonation = await axios.post(`${API_URL}/donations`, {
            food_name: "Test Food",
            food_type: "VEG",
            quantity: "10",
            prepared_time: new Date().toISOString(),
            expiry_time: new Date(Date.now() + 86400000).toISOString(),
            latitude: 12.9716,
            longitude: 77.5946
        }, { headers: { Authorization: donorToken } });
        const donationId = resDonation.data.donation_id;
        console.log("Donation Posted:", donationId);

        // 3. Register NGO
        const ngoEmail = `ngo_${timestamp}@test.com`;
        const resNgo = await axios.post(`${API_URL}/auth/register`, {
            name: "Test NGO",
            email: ngoEmail,
            password: "password123",
            role: "NGO",
            phone: "0987654321",
            organization_name: "Test Org",
            address: "456 NGO Rd"
        });
        const ngoToken = resNgo.data.token;
        console.log("NGO Registered");

        // 4. Request Donation (This is where it crashed)
        console.log("Requesting Donation...");
        await axios.put(`${API_URL}/ngo/donations/${donationId}/request`, {
            quantity: 5
        }, { headers: { Authorization: ngoToken } });
        console.log("Request Successful!");

    } catch (err) {
        console.error("Test Failed:");
        if (err.response) {
            console.error(err.response.data);
            console.error(err.response.status);
        } else {
            console.error(err.message);
        }
    }
};

main();
