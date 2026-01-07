const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/authMiddleware');

// @route   GET api/ngo/volunteers
// @desc    Get all available volunteers
// @access  Private (NGO only)
router.get('/volunteers', auth, async (req, res) => {
    if (req.user.role !== 'NGO') {
        return res.status(403).json({ msg: 'Access denied: NGOs only' });
    }

    try {
        // In a real app, we'd filter by volunteers belonging to this NGO.
        // For this demo, we'll fetch ALL available volunteers to make testing easier.
        const { data: volunteers, error } = await supabase
            .from('volunteers')
            .select('*, users(name, phone, email)')
            .eq('availability', 'AVAILABLE');

        if (error) throw error;
        res.json(volunteers);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/ngo/assign
// @desc    Assign a volunteer to a donation (Create Pickup)
// @access  Private (NGO only)
router.post('/assign', auth, async (req, res) => {
    if (req.user.role !== 'NGO') {
        return res.status(403).json({ msg: 'Access denied: NGOs only' });
    }

    const { donation_id, volunteer_id } = req.body;

    try {
        // 1. Create Pickup Record
        const { data: pickup, error: pickupError } = await supabase
            .from('pickups')
            .insert([
                {
                    donation_id,
                    volunteer_id,
                    status: 'ASSIGNED',
                    pickup_time: new Date() // Scheduling for "now"
                }
            ])
            .select();

        if (pickupError) throw pickupError;

        // 2. Update Volunteer Status to BUSY
        const { error: volError } = await supabase
            .from('volunteers')
            .update({ availability: 'BUSY' })
            .eq('volunteer_id', volunteer_id);

        if (volError) throw volError;

        // 3. Update Donation Status to ACCEPTED (Already is, but good to ensure)
        // Actually, let's leave donation status as ACCEPTED until it is PICKED.

        res.json(pickup[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
