const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/authMiddleware');

// @route   POST api/donations
// @desc    Add a new donation
// @access  Private (Donor only)
router.post('/', auth, async (req, res) => {
    if (req.user.role !== 'DONOR') {
        return res.status(403).json({ msg: 'Access denied: Donors only' });
    }

    const { food_name, food_type, quantity, prepared_time, expiry_time, latitude, longitude } = req.body;

    try {
        // Get donor_id
        const { data: donor, error: userError } = await supabase
            .from('donors')
            .select('donor_id')
            .eq('user_id', req.user.id)
            .single();

        if (userError || !donor) return res.status(400).json({ msg: 'Donor profile not found' });

        // Insert Donation
        const { data, error } = await supabase
            .from('donations')
            .insert([
                {
                    donor_id: donor.donor_id,
                    food_name,
                    food_type, // VEG or NON_VEG
                    quantity,
                    prepared_time,
                    expiry_time,
                    latitude,
                    longitude,
                    status: 'PENDING'
                }
            ])
            .select();

        if (error) throw error;

        res.json(data[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/donations/my
// @desc    Get all donations by current donor
// @access  Private (Donor only)
router.get('/my', auth, async (req, res) => {
    if (req.user.role !== 'DONOR') {
        return res.status(403).json({ msg: 'Access denied: Donors only' });
    }

    try {
        // Get donor_id
        const { data: donor, error: userError } = await supabase
            .from('donors')
            .select('donor_id')
            .eq('user_id', req.user.id)
            .single();

        if (userError || !donor) return res.status(400).json({ msg: 'Donor profile not found' });

        const { data: donations, error } = await supabase
            .from('donations')
            .select('*')
            .eq('donor_id', donor.donor_id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(donations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/donations/:id/approve
// @desc    Approve an NGO's request
// @access  Private (Donor only)
router.put('/:id/approve', auth, async (req, res) => {
    if (req.user.role !== 'DONOR') {
        return res.status(403).json({ msg: 'Access denied: Donors only' });
    }

    try {
        // Verify ownership
        const { data: donor } = await supabase.from('donors').select('donor_id').eq('user_id', req.user.id).single();
        if (!donor) return res.status(400).json({ msg: 'Donor not found' });

        // Update Status to APPROVED (Ready for Volunteer)
        // We only approve if status is 'REQUESTED'
        const { data, error } = await supabase
            .from('donations')
            .update({ status: 'APPROVED' })
            .eq('donation_id', req.params.id)
            .eq('donor_id', donor.donor_id)
            .eq('status', 'REQUESTED')
            .select();

        if (error) throw error;

        if (data.length === 0) {
            return res.status(400).json({ msg: 'Donation not found or not in requested state' });
        }

        res.json(data[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
