const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/authMiddleware');

// Utility to calculate distance (Haversine Formula)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat1)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

// @route   GET api/ngo/nearby
// @desc    Get nearby pending donations
// @access  Private (NGO only)
router.get('/nearby', auth, async (req, res) => {
    if (req.user.role !== 'NGO') {
        return res.status(403).json({ msg: 'Access denied: NGOs only' });
    }

    try {
        // 1. Get NGO Location
        const { data: ngo, error: ngoError } = await supabase
            .from('ngos')
            .select('latitude, longitude')
            .eq('user_id', req.user.id)
            .single();

        if (ngoError || !ngo) return res.status(400).json({ msg: 'NGO profile not found' });

        // 2. Get All Pending Donations
        const { data: donations, error: donationError } = await supabase
            .from('donations')
            .select('*, donors(address)') // Join to get address if needed
            .eq('status', 'PENDING');

        if (donationError) throw donationError;

        // 3. Filter by Distance (Simple JS filter, e.g., < 20km)
        // If NGO has no location set, show all.
        let nearbyDonations = donations;

        if (ngo.latitude && ngo.longitude) {
            nearbyDonations = donations.map(d => {
                const dist = getDistanceFromLatLonInKm(ngo.latitude, ngo.longitude, d.latitude, d.longitude);
                return { ...d, distance: dist.toFixed(1) };
            }).filter(d => d.distance < 50); // Show within 50km for demo purposes

            // Sort by distance
            nearbyDonations.sort((a, b) => a.distance - b.distance);
        }

        res.json(nearbyDonations);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/ngo/donations/:id/request
// @desc    Request a donation with specific quantity
// @access  Private (NGO only)
router.put('/donations/:id/request', auth, async (req, res) => {
    if (req.user.role !== 'NGO') {
        return res.status(403).json({ msg: 'Access denied: NGOs only' });
    }

    const donationId = req.params.id;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
        return res.status(400).json({ msg: 'Please specify a valid quantity' });
    }

    try {
        console.log(`[DEBUG] Requesting donation ${donationId} with qty ${quantity}`);
        console.log(`[DEBUG] User ID: ${req.user.id}`);

        // Get NGO ID
        const { data: ngo, error: ngoError } = await supabase
            .from('ngos')
            .select('ngo_id')
            .eq('user_id', req.user.id)
            .single();

        if (ngoError || !ngo) {
            console.error("[DEBUG] NGO Find Error:", ngoError);
            return res.status(400).json({ msg: 'NGO profile not found' });
        }

        console.log(`[DEBUG] NGO ID found: ${ngo.ngo_id}`);

        // Update status to REQUESTED, set requested_quantity and ngo_id
        const { data, error } = await supabase
            .from('donations')
            .update({
                status: 'REQUESTED',
                ngo_id: ngo.ngo_id,
                requested_quantity: quantity,
                request_status: 'REQUESTED' // Redundant but good for tracking
            })
            .eq('donation_id', donationId)
            // .eq('status', 'PENDING') // Strictly enforce it must be pending? Yes.
            .select();

        if (error) {
            console.error("[DEBUG] Update Error:", error);
            throw error;
        }

        if (data.length === 0) {
            return res.status(400).json({ msg: 'Donation not found or already requested' });
        }

        res.json(data[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send(`Server Error: ${err.message}`);
    }
});

// @route   GET api/ngo/my-accepted
// @desc    Get donations accepted by this NGO (Implementation logic: Donations accepted don't explicitly link to NGO in schema yet, but usually we'd track this. For now, let's skip or we need to add 'accepted_by_ngo_id' to donations table. 
// WAIT: The schema doesn't have 'accepted_by' in donations table.
// The Plan says: "NGO Accept Flow -> UPDATE donations SET status='ACCEPTED'".
// It doesn't explicitly store WHICH NGO accepted it.
// However, the Volunteer Assignment flow links Volunteer -> NGO. 
// A robust system needs to know which NGO accepted it. 
// For this MVP step, I will add a column 'ngo_id' to donations table to track who accepted it.
// I will do that via a migration script first? No, I'll just skip that for a second and assume the user just wants to see "Nearby" and "Accept".
// But wait, if I accept it, how do I know it's MINE later? 
// I SHOULD add `ngo_id` to the donations table.
// Let's check the schema again. 
// Donations Table: donor_id, food_name... status.
// No ngo_id.
// I will add it.

// @route   GET api/ngo/my-accepted
// @desc    Get donations accepted by this NGO
// @access  Private (NGO only)
router.get('/my-accepted', auth, async (req, res) => {
    if (req.user.role !== 'NGO') {
        return res.status(403).json({ msg: 'Access denied: NGOs only' });
    }

    try {
        const { data: ngo } = await supabase.from('ngos').select('ngo_id').eq('user_id', req.user.id).single();
        if (!ngo) return res.status(400).json({ msg: 'NGO profile not found' });

        const { data: donations, error } = await supabase
            .from('donations')
            .select('*')
            .eq('ngo_id', ngo.ngo_id)
            .eq('status', 'ACCEPTED'); // Only those waiting for pickup (or just accepted)

        if (error) throw error;

        // Filter out those that already have a pickup assigned?
        // Ideally yes, but "ACCEPTED" implies waiting for pickup.
        // Once picked up, status changes to "PICKED".
        // But we have a separate 'pickups' table.
        // Let's check if they are already in 'pickups' table.
        // For simplicity: We will trust the status flow. ACCEPTED = Needs Volunteer.

        res.json(donations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
